"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignOffersToLeadsHandler = exports.assignOfferToLeadHandler = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../../lib/db");
const socket_1 = require("../../realtime/socket");
const events_1 = require("../../realtime/events");
const queryHelper_1 = require("../segment/queryHelper");
const getLeadsWithOfferViaSegment = async (client, leadIds, offerId, orgId) => {
    const leadsWithOffer = new Set();
    const segmentsRes = await client.query(`SELECT s.id, s.type, s.name 
     FROM crm_segment s
     JOIN crm_segmentoffers so ON so.segment_id = s.id
     WHERE so.offer_id = $1 AND s.organization_id = $2 AND s.is_active = true`, [offerId, orgId]);
    if (segmentsRes.rows.length === 0) {
        return leadsWithOffer;
    }
    for (const seg of segmentsRes.rows) {
        if (seg.type === "Static") {
            const checkRes = await client.query(`SELECT lead_id FROM crm_segmentleads WHERE segment_id = $1 AND lead_id = ANY($2::text[])`, [seg.id, leadIds]);
            for (const row of checkRes.rows) {
                leadsWithOffer.add(row.lead_id);
            }
        }
        else {
            // Dynamic segment
            const filtersRes = await client.query(`SELECT sf.filter_type_id, sf.operator, sf.value, sf.group_id, sf.logical_op, ft.name
         FROM crm_segmentfilters sf
         JOIN crm_segmentfiltertypes ft ON ft.id = sf.filter_type_id
         WHERE sf.segment_id = $1`, [seg.id]);
            const resolvedFilters = filtersRes.rows.map((row) => ({
                filter_type_id: row.filter_type_id,
                name: row.name,
                operator: row.operator,
                value: row.value,
                group_id: row.group_id,
                logical_op: row.logical_op
            }));
            const params = [leadIds];
            const conditionSql = (0, queryHelper_1.buildFiltersQuery)(resolvedFilters, params);
            const checkQuery = `
        SELECT l.id 
        FROM crm_leads l
        LEFT JOIN crm_user ae ON ae.id = l.assigned_to_id
        LEFT JOIN crm_state s ON s.id = l.state_id
        LEFT JOIN crm_country c ON c.id = l.country_id
        WHERE l.id = ANY($1::text[]) AND (${conditionSql})
      `;
            try {
                const checkRes = await client.query(checkQuery, params);
                for (const row of checkRes.rows) {
                    leadsWithOffer.add(row.id);
                }
            }
            catch (err) {
                console.error(`Error checking dynamic segment ${seg.name} for leads:`, err);
            }
        }
    }
    return leadsWithOffer;
};
const ensureOfferCanBeAssigned = async (req, offerId, executiveId) => {
    const offerCheck = await db_1.pool.query(`
    SELECT offer_id
    FROM crm_executiveofferassignment
    WHERE offer_id = $1
      AND executive_id = $2
    LIMIT 1
    `, [offerId, executiveId]);
    if (!offerCheck.rows.length) {
        return req.reject(403, "Offer is not accessible for this executive");
    }
    const statusCheck = await db_1.pool.query(`SELECT status FROM crm_offer WHERE id = $1 LIMIT 1`, [offerId]);
    const offerStatus = String(statusCheck.rows[0]?.status || "").toLowerCase();
    if (offerStatus === "inactive" || offerStatus === "expired") {
        return req.reject(409, {
            code: "OFFER_INACTIVE",
            message: "Offer is either Inactive or Expired, Cannot Assign this Offer",
        });
    }
};
const assignOfferToLeadHandler = async (req) => {
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
        const leadCheck = await db_1.pool.query(`
      SELECT id
      FROM crm_leads
      WHERE id = $1
        AND organization_id = $2
        AND assigned_to_id = $3
      LIMIT 1
      `, [leadId, orgId, executiveId]);
        if (!leadCheck.rows.length) {
            return req.reject(404, "Lead not found or not assigned to this executive");
        }
        const duplicateCheck = await db_1.pool.query(`
      SELECT id
      FROM crm_leadofferassignment
      WHERE lead_id = $1
        AND offer_id = $2
      LIMIT 1
      `, [leadId, offerId]);
        if (duplicateCheck.rows.length) {
            return req.reject(409, {
                code: "OFFER_ALREADY_ASSIGNED_TO_LEAD",
                message: "This offer is already assigned to this lead",
            });
        }
        const segmentAssignedLeads = await getLeadsWithOfferViaSegment(db_1.pool, [leadId], offerId, orgId);
        if (segmentAssignedLeads.has(leadId)) {
            return req.reject(409, {
                code: "OFFER_ALREADY_ASSIGNED_VIA_SEGMENT",
                message: "This offer is already assigned to this lead through a segment",
            });
        }
        const assignmentId = (0, crypto_1.randomUUID)();
        await db_1.pool.query(`
      INSERT INTO crm_leadofferassignment (
        id,
        lead_id,
        offer_id,
        assigned_by_id,
        createdat,
        createdby
      )
      VALUES ($1, $2, $3, $4, NOW(), $5)
      `, [assignmentId, leadId, offerId, executiveId, executiveId]);
        (0, socket_1.emitToUser)(executiveId, events_1.LEAD_DETAIL_CHANGED, {
            reason: "offer-assigned-to-lead",
            leadId,
            offerId,
            assignmentId,
        });
        (0, socket_1.emitToUser)(executiveId, events_1.OFFER_DETAIL_CHANGED, {
            reason: "offer-assigned-to-lead",
            leadId,
            offerId,
            assignmentId,
        });
        return {
            assignmentId,
            message: "Offer assigned to lead successfully",
        };
    }
    catch (error) {
        return req.reject(500, error?.message || "Failed to assign offer to lead");
    }
};
exports.assignOfferToLeadHandler = assignOfferToLeadHandler;
const assignOffersToLeadsHandler = async (req) => {
    const { offerId, leadIds, preview } = req.data ?? {};
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
        const validLeads = await db_1.pool.query(`
      SELECT id
      FROM crm_leads
      WHERE id = ANY($1::text[])
        AND organization_id = $2
        AND assigned_to_id = $3
      `, [uniqueLeadIds, orgId, executiveId]);
        const validLeadIds = validLeads.rows.map((lead) => lead.id);
        if (!validLeadIds.length) {
            return req.reject(404, "No leads found or assigned to this executive");
        }
        const duplicateResult = await db_1.pool.query(`
      SELECT lead_id
      FROM crm_leadofferassignment
      WHERE lead_id = ANY($1::text[])
        AND offer_id = $2
      `, [validLeadIds, offerId]);
        const duplicateLeadIds = new Set(duplicateResult.rows.map((assignment) => assignment.lead_id));
        const segmentAssignedLeads = await getLeadsWithOfferViaSegment(db_1.pool, validLeadIds, offerId, orgId);
        for (const leadId of segmentAssignedLeads) {
            duplicateLeadIds.add(leadId);
        }
        const leadIdsToAssign = validLeadIds.filter((id) => !duplicateLeadIds.has(id));
        if (preview) {
            return {
                assignmentIds: [],
                assignedCount: leadIdsToAssign.length,
                skippedCount: uniqueLeadIds.length - leadIdsToAssign.length,
                message: "Preview successful",
            };
        }
        if (!leadIdsToAssign.length) {
            return {
                assignmentIds: [],
                assignedCount: 0,
                skippedCount: uniqueLeadIds.length,
                message: "All selected leads already have this offer assigned",
            };
        }
        const assignments = leadIdsToAssign.map((leadId) => ({
            assignmentId: (0, crypto_1.randomUUID)(),
            leadId,
        }));
        const valuesSql = assignments
            .map((_, index) => {
            const baseIndex = index * 3;
            return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${assignments.length * 3 + 1}, NOW(), $${assignments.length * 3 + 2})`;
        })
            .join(", ");
        const insertParams = assignments.flatMap(({ assignmentId, leadId }) => [
            assignmentId,
            leadId,
            offerId,
        ]);
        await db_1.pool.query(`
      INSERT INTO crm_leadofferassignment (
        id,
        lead_id,
        offer_id,
        assigned_by_id,
        createdat,
        createdby
      )
      VALUES ${valuesSql}
      `, [...insertParams, executiveId, executiveId]);
        for (const { assignmentId, leadId } of assignments) {
            (0, socket_1.emitToUser)(executiveId, events_1.LEAD_DETAIL_CHANGED, {
                reason: "offer-assigned-to-lead",
                leadId,
                offerId,
                assignmentId,
            });
        }
        (0, socket_1.emitToUser)(executiveId, events_1.OFFER_DETAIL_CHANGED, {
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
    }
    catch (error) {
        return req.reject(500, error?.message || "Failed to assign offer to leads");
    }
};
exports.assignOffersToLeadsHandler = assignOffersToLeadsHandler;
