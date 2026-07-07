import { randomUUID } from "crypto";
import { pool } from "../../lib/db";
import { emitToUser } from "../../realtime/socket";
import {
  LEAD_DETAIL_CHANGED,
  OFFER_DETAIL_CHANGED,
} from "../../realtime/events";

const ensureOfferCanBeAssigned = async (
  req: any,
  offerId: string,
  executiveId: string,
) => {
  const offerCheck = await pool.query(
    `
    SELECT "offer_ID"
    FROM crm_executiveofferassignment
    WHERE "offer_ID" = $1
      AND "executive_ID" = $2
    LIMIT 1
    `,
    [offerId, executiveId],
  );

  if (!offerCheck.rows.length) {
    return req.reject(403, "Offer is not accessible for this executive");
  }

  const statusCheck = await pool.query(
    `SELECT status FROM crm_offer WHERE id = $1 LIMIT 1`,
    [offerId],
  );

  const offerStatus = String(statusCheck.rows[0]?.status || "").toLowerCase();
  if (offerStatus === "inactive" || offerStatus === "expired") {
    return req.reject(409, {
      code: "OFFER_INACTIVE",
      message: "Offer is either Inactive or Expired, Cannot Assign this Offer",
    });
  }
};

export const assignOfferToLeadHandler = async (req: any) => {
  const { offerId, leadId } = req.data ?? {};
  const executiveId = req.user?.id;
  const orgId = req.user?.orgId;

  try {
    if (!orgId || !executiveId) {
      return req.reject(401, "Unauthorized");
    }

    if (!offerId || !leadId) {
      return req.reject(400, "offerId and leadId are required");
    }

    await ensureOfferCanBeAssigned(req, offerId, executiveId);

    const leadCheck = await pool.query(
      `
      SELECT id
      FROM crm_leads
      WHERE id = $1
        AND organization_id = $2
        AND assigned_to_id = $3
      LIMIT 1
      `,
      [leadId, orgId, executiveId],
    );

    if (!leadCheck.rows.length) {
      return req.reject(
        404,
        "Lead not found or not assigned to this executive",
      );
    }

    const duplicateCheck = await pool.query(
      `
      SELECT "ID"
      FROM crm_leadofferassignment
      WHERE "lead_ID" = $1
        AND "offer_ID" = $2
      LIMIT 1
      `,
      [leadId, offerId],
    );

    if (duplicateCheck.rows.length) {
      return req.reject(409, {
        code: "OFFER_ALREADY_ASSIGNED_TO_LEAD",
        message: "This offer is already assigned to this lead",
      });
    }

    const assignmentId = randomUUID();

    await pool.query(
      `
      INSERT INTO crm_leadofferassignment (
        "ID",
        "lead_ID",
        "offer_ID",
        "assigned_by_ID",
        "createdAt",
        "createdBy"
      )
      VALUES ($1, $2, $3, $4, NOW(), $5)
      `,
      [assignmentId, leadId, offerId, executiveId, executiveId],
    );

    emitToUser(executiveId, LEAD_DETAIL_CHANGED, {
      reason: "offer-assigned-to-lead",
      leadId,
      offerId,
      assignmentId,
    });

    emitToUser(executiveId, OFFER_DETAIL_CHANGED, {
      reason: "offer-assigned-to-lead",
      leadId,
      offerId,
      assignmentId,
    });

    return {
      assignmentId,
      message: "Offer assigned to lead successfully",
    };
  } catch (error: any) {
    return req.reject(
      500,
      error?.message || "Failed to assign offer to lead",
    );
  }
};

export const assignOffersToLeadsHandler = async (req: any) => {
  const { offerId, leadIds } = req.data ?? {};
  const executiveId = req.user?.id;
  const orgId = req.user?.orgId;

  try {
    if (!orgId || !executiveId) {
      return req.reject(401, "Unauthorized");
    }

    if (!offerId || !Array.isArray(leadIds) || !leadIds.length) {
      return req.reject(400, "offerId and leadIds are required");
    }

    const uniqueLeadIds = [...new Set(leadIds.filter(Boolean))];
    if (!uniqueLeadIds.length) {
      return req.reject(400, "At least one leadId is required");
    }

    await ensureOfferCanBeAssigned(req, offerId, executiveId);

    const validLeads = await pool.query(
      `
      SELECT id
      FROM crm_leads
      WHERE id = ANY($1::text[])
        AND organization_id = $2
        AND assigned_to_id = $3
      `,
      [uniqueLeadIds, orgId, executiveId],
    );
    const validLeadIds = validLeads.rows.map((lead) => lead.id);

    if (!validLeadIds.length) {
      return req.reject(
        404,
        "No leads found or assigned to this executive",
      );
    }

    const duplicateResult = await pool.query(
      `
      SELECT "lead_ID"
      FROM crm_leadofferassignment
      WHERE "lead_ID" = ANY($1::text[])
        AND "offer_ID" = $2
      `,
      [validLeadIds, offerId],
    );
    const duplicateLeadIds = new Set(
      duplicateResult.rows.map((assignment) => assignment.lead_ID),
    );
    const leadIdsToAssign = validLeadIds.filter(
      (id) => !duplicateLeadIds.has(id),
    );

    if (!leadIdsToAssign.length) {
      return {
        assignmentIds: [],
        assignedCount: 0,
        skippedCount: uniqueLeadIds.length,
        message: "All selected leads already have this offer assigned",
      };
    }

    const assignments = leadIdsToAssign.map((leadId) => ({
      assignmentId: randomUUID(),
      leadId,
    }));

    const valuesSql = assignments
      .map((_, index) => {
        const baseIndex = index * 3;
        return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${
          assignments.length * 3 + 1
        }, NOW(), $${assignments.length * 3 + 2})`;
      })
      .join(", ");
    const insertParams = assignments.flatMap(({ assignmentId, leadId }) => [
      assignmentId,
      leadId,
      offerId,
    ]);

    await pool.query(
      `
      INSERT INTO crm_leadofferassignment (
        "ID",
        "lead_ID",
        "offer_ID",
        "assigned_by_ID",
        "createdAt",
        "createdBy"
      )
      VALUES ${valuesSql}
      `,
      [...insertParams, executiveId, executiveId],
    );

    for (const { assignmentId, leadId } of assignments) {
      emitToUser(executiveId, LEAD_DETAIL_CHANGED, {
        reason: "offer-assigned-to-lead",
        leadId,
        offerId,
        assignmentId,
      });
    }

    emitToUser(executiveId, OFFER_DETAIL_CHANGED, {
      reason: "offers-assigned-to-leads",
      leadIds: assignments.map((assignment) => assignment.leadId),
      offerId,
      assignmentIds: assignments.map((assignment) => assignment.assignmentId),
    });

    return {
      assignmentIds: assignments.map((assignment) => assignment.assignmentId),
      assignedCount: assignments.length,
      skippedCount: uniqueLeadIds.length - assignments.length,
      message: "Offer assigned to leads successfully",
    };
  } catch (error: any) {
    return req.reject(
      500,
      error?.message || "Failed to assign offer to leads",
    );
  }
};
