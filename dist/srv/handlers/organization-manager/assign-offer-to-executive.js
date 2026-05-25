"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignOfferToExecutiveHandler = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../../lib/db");
const assignOfferToExecutiveHandler = async (req) => {
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
        const offerCheck = await db_1.pool.query(`
      SELECT o.id
      FROM crm_offer o
      LEFT JOIN crm_managerofferassignment moa
        ON moa."offer_ID" = o.id
       AND moa."user_ID" = $2
      WHERE o.id = $1
        AND (o.organization_id = $3 OR o.is_global = true)
        AND (o.is_global = true OR moa."user_ID" IS NOT NULL)
      LIMIT 1
      `, [offerId, managerId, orgId]);
        if (!offerCheck.rows.length) {
            return req.reject(403, "Offer is not accessible for this manager");
        }
        const statusCheck = await db_1.pool.query(`
      SELECT o.status
      FROM crm_offer o
      WHERE o.id = $1
      LIMIT 1
      `, [offerId]);
        const offerStatus = String(statusCheck.rows[0]?.status || "").toLowerCase();
        if (offerStatus === "inactive") {
            return req.reject(409, {
                code: "OFFER_INACTIVE",
                message: "Offer is Inactive, Cannot Assign this Offer",
            });
        }
        const executiveCheck = await db_1.pool.query(`
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
      `, [executiveId, orgId, managerId]);
        if (!executiveCheck.rows.length) {
            return req.reject(404, "Executive not found for this manager");
        }
        const duplicateCheck = await db_1.pool.query(`
      SELECT "ID"
      FROM crm_executiveofferassignment
      WHERE "offer_ID" = $1
        AND "executive_ID" = $2
      LIMIT 1
      `, [offerId, executiveId]);
        if (duplicateCheck.rows.length) {
            return req.reject(409, {
                code: "OFFER_ALREADY_ASSIGNED_TO_EXECUTIVE",
                message: "This offer is already assigned to this executive",
            });
        }
        const assignmentId = (0, crypto_1.randomUUID)();
        await db_1.pool.query(`
      INSERT INTO crm_executiveofferassignment (
        "ID",
        "offer_ID",
        "assigned_by_ID",
        "executive_ID",
        "createdAt",
        "createdBy"
      )
      VALUES ($1, $2, $3, $4, NOW(), $5)
      `, [assignmentId, offerId, managerId, executiveId, managerId]);
        return {
            assignmentId,
            message: "Offer assigned to executive successfully",
        };
    }
    catch (error) {
        return req.reject(500, error?.message || "Failed to assign offer to executive");
    }
};
exports.assignOfferToExecutiveHandler = assignOfferToExecutiveHandler;
