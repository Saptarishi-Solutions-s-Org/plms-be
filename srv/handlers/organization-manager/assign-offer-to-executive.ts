import { randomUUID } from "crypto";
import { pool } from "../../lib/db";
import { emitToUser } from "../../realtime/socket";
import {
  OFFER_DETAIL_CHANGED,
  OFFER_LIST_CHANGED,
} from "../../realtime/events";

export const assignOfferToExecutiveHandler = async (req: any) => {
  const { offerId, executiveId } = req.data ?? {};
  const orgId = req.user?.orgId;
  const managerId = req.user?.id;

  try {
    if (!orgId || !managerId) {
      return req.reject(401, "Unauthorized");
    }

    if (!offerId || !executiveId) {
      return req.reject(400, "offerId and executiveId are required");
    }

    const offerCheck = await pool.query(
      `
      SELECT o.id
      FROM crm_offer o
      LEFT JOIN crm_managerofferassignment moa
        ON moa."offer_ID" = o.id
       AND moa."user_ID" = $2
      WHERE o.id = $1
        AND (o.organization_id = $3 OR o.is_global = true)
        AND (o.is_global = true OR moa."user_ID" IS NOT NULL)
      LIMIT 1
      `,
      [offerId, managerId, orgId],
    );

    if (!offerCheck.rows.length) {
      return req.reject(403, "Offer is not accessible for this manager");
    }

    const statusCheck = await pool.query(
      `
      SELECT o.status
      FROM crm_offer o
      WHERE o.id = $1
      LIMIT 1
      `,
      [offerId],
    );

    const offerStatus = String(statusCheck.rows[0]?.status || "").toLowerCase();
    if (offerStatus === "inactive") {
      return req.reject(409, {
        code: "OFFER_INACTIVE",
        message: "Offer is Inactive, Cannot Assign this Offer",
      });
    }

    const executiveCheck = await pool.query(
      `
      SELECT u.id
      FROM crm_user u
      JOIN crm_organizationroles orr ON orr.id = u.role_id
      JOIN crm_roles r ON r.id = orr.role_id
      WHERE u.id = $1
        AND u.organization_id = $2
        AND u.reporting_manager_id = $3
        AND u.is_active = true
        AND LOWER(r.name) LIKE '%executive%'
      LIMIT 1
      `,
      [executiveId, orgId, managerId],
    );

    if (!executiveCheck.rows.length) {
      return req.reject(404, "Executive not found for this manager");
    }

    const duplicateCheck = await pool.query(
      `
      SELECT "ID"
      FROM crm_executiveofferassignment
      WHERE "offer_ID" = $1
        AND "executive_ID" = $2
      LIMIT 1
      `,
      [offerId, executiveId],
    );

    if (duplicateCheck.rows.length) {
      return req.reject(409, {
        code: "OFFER_ALREADY_ASSIGNED_TO_EXECUTIVE",
        message: "This offer is already assigned to this executive",
      });
    }

    const assignmentId = randomUUID();

    await pool.query(
      `
      INSERT INTO crm_executiveofferassignment (
        "ID",
        "offer_ID",
        "assigned_by_ID",
        "executive_ID",
        "createdAt",
        "createdBy"
      )
      VALUES ($1, $2, $3, $4, NOW(), $5)
      `,
      [assignmentId, offerId, managerId, executiveId, managerId],
    );

    emitToUser(executiveId, OFFER_LIST_CHANGED, {
      reason: "offer-assigned-to-executive",
      offerId,
      assignmentId,
    });

    emitToUser(managerId, OFFER_DETAIL_CHANGED, {
      reason: "offer-assigned-to-executive",
      offerId,
      executiveId,
      assignmentId,
    });

    return {
      assignmentId,
      message: "Offer assigned to executive successfully",
    };
  } catch (error: any) {
    return req.reject(
      500,
      error?.message || "Failed to assign offer to executive",
    );
  }
};
