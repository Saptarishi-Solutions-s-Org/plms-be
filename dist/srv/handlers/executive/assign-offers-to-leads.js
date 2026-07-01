"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignOfferToLeadHandler = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../../lib/db");
const socket_1 = require("../../realtime/socket");
const events_1 = require("../../realtime/events");
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
        const offerCheck = await db_1.pool.query(`
      SELECT "offer_ID"
      FROM crm_executiveofferassignment
      WHERE "offer_ID" = $1
        AND "executive_ID" = $2
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
      SELECT "ID"
      FROM crm_leadofferassignment
      WHERE "lead_ID" = $1
        AND "offer_ID" = $2
      LIMIT 1
      `, [leadId, offerId]);
        if (duplicateCheck.rows.length) {
            return req.reject(409, {
                code: "OFFER_ALREADY_ASSIGNED_TO_LEAD",
                message: "This offer is already assigned to this lead",
            });
        }
        const assignmentId = (0, crypto_1.randomUUID)();
        await db_1.pool.query(`
      INSERT INTO crm_leadofferassignment (
        "ID",
        "lead_ID",
        "offer_ID",
        "assigned_by_ID",
        "createdAt",
        "createdBy"
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
