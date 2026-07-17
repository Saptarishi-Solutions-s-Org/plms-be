"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkAssignOffersToExecutivesHandler = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../../lib/db");
const socket_1 = require("../../realtime/socket");
const events_1 = require("../../realtime/events");
const toStringArray = (value) => {
    if (Array.isArray(value)) {
        return value
            .filter((item) => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean);
    }
    if (typeof value === "string" && value.trim()) {
        return [value.trim()];
    }
    return [];
};
const pairKey = (offerId, executiveId) => `${offerId}:${executiveId}`;
const bulkAssignOffersToExecutivesHandler = async (req) => {
    const orgId = req.user?.orgId;
    const managerId = req.user?.id;
    const offerIds = Array.from(new Set(toStringArray(req.data?.offerIds)));
    const executiveIds = Array.from(new Set(toStringArray(req.data?.executiveIds)));
    try {
        if (!orgId || !managerId) {
            return req.reject(401, "Unauthorized");
        }
        if (!offerIds.length || !executiveIds.length) {
            return req.reject(400, "offerIds and executiveIds are required");
        }
        const accessibleOffers = await db_1.pool.query(`
      SELECT o.id, LOWER(COALESCE(o.status, '')) AS status
      FROM crm_offer o
      LEFT JOIN crm_managerofferassignment moa
        ON moa.offer_id = o.id
       AND moa.user_id = $2
      WHERE o.id::text = ANY($1::text[])
        AND (o.organization_id = $3 OR o.is_global = true)
        AND (o.is_global = true OR moa.user_id IS NOT NULL)
      `, [offerIds, managerId, orgId]);
        const accessibleOfferMap = new Map(accessibleOffers.rows.map((row) => [row.id, row.status]));
        const inaccessibleOfferIds = offerIds.filter((offerId) => !accessibleOfferMap.has(offerId));
        if (inaccessibleOfferIds.length) {
            return req.reject(403, {
                code: "OFFERS_NOT_ACCESSIBLE",
                message: "One or more offers are not accessible for this manager",
                offerIds: inaccessibleOfferIds,
            });
        }
        const inactiveOfferIds = offerIds.filter((offerId) => accessibleOfferMap.get(offerId) === "inactive");
        if (inactiveOfferIds.length) {
            return req.reject(409, {
                code: "OFFER_INACTIVE",
                message: "One or more offers are inactive, cannot assign these offers",
                offerIds: inactiveOfferIds,
            });
        }
        const executiveCheck = await db_1.pool.query(`
      SELECT u.id
      FROM crm_user u
      JOIN crm_organizationroles orr ON orr.id = u.role_id
      JOIN crm_roles r ON r.id = orr.role_id
      WHERE u.id::text = ANY($1::text[])
        AND u.organization_id = $2
        AND u.reporting_manager_id = $3
        AND u.is_active = true
        AND LOWER(r.name) LIKE '%executive%'
      `, [executiveIds, orgId, managerId]);
        const accessibleExecutiveIds = new Set(executiveCheck.rows.map((row) => row.id));
        const invalidExecutiveIds = executiveIds.filter((executiveId) => !accessibleExecutiveIds.has(executiveId));
        if (invalidExecutiveIds.length) {
            return req.reject(404, {
                code: "EXECUTIVES_NOT_FOUND",
                message: "One or more executives were not found for this manager",
                executiveIds: invalidExecutiveIds,
            });
        }
        const allPairs = offerIds.flatMap((offerId) => executiveIds.map((executiveId) => ({
            offerId,
            executiveId,
            key: pairKey(offerId, executiveId),
        })));
        const existingAssignments = await db_1.pool.query(`
      SELECT offer_id AS "offerId", executive_id AS "executiveId"
      FROM crm_executiveofferassignment
      WHERE offer_id::text = ANY($1::text[])
        AND executive_id::text = ANY($2::text[])
      `, [offerIds, executiveIds]);
        const existingPairKeys = new Set(existingAssignments.rows.map((row) => pairKey(row.offerId, row.executiveId)));
        const assignmentsToCreate = allPairs
            .filter((pair) => !existingPairKeys.has(pair.key))
            .map((pair) => ({
            ...pair,
            assignmentId: (0, crypto_1.randomUUID)(),
        }));
        const skipped = allPairs
            .filter((pair) => existingPairKeys.has(pair.key))
            .map((pair) => ({
            offerId: pair.offerId,
            executiveId: pair.executiveId,
            reason: "already_assigned",
        }));
        if (assignmentsToCreate.length) {
            const parameters = [];
            const valuesSql = assignmentsToCreate
                .map((item, index) => {
                const offset = index * 5;
                parameters.push(item.assignmentId, item.offerId, managerId, item.executiveId, managerId);
                return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, NOW(), $${offset + 5})`;
            })
                .join(", ");
            await db_1.pool.query(`
        INSERT INTO crm_executiveofferassignment (
          id,
          offer_id,
          assigned_by_id,
          executive_id,
          createdat,
          createdby
        )
        VALUES ${valuesSql}
        `, parameters);
        }
        for (const item of assignmentsToCreate) {
            (0, socket_1.emitToUser)(item.executiveId, events_1.OFFER_LIST_CHANGED, {
                reason: "offer-assigned-to-executive-bulk",
                offerId: item.offerId,
                assignmentId: item.assignmentId,
            });
            (0, socket_1.emitToUser)(managerId, events_1.OFFER_DETAIL_CHANGED, {
                reason: "offer-assigned-to-executive-bulk",
                offerId: item.offerId,
                executiveId: item.executiveId,
                assignmentId: item.assignmentId,
            });
        }
        const assigned = assignmentsToCreate.map((item) => ({
            offerId: item.offerId,
            executiveId: item.executiveId,
            assignmentId: item.assignmentId,
        }));
        return {
            message: assigned.length || skipped.length
                ? "Bulk offer assignment processed successfully"
                : "No new bulk offer assignments were created",
            assigned,
            skipped,
        };
    }
    catch (error) {
        return req.reject(500, error?.message || "Failed to assign offers to executives");
    }
};
exports.bulkAssignOffersToExecutivesHandler = bulkAssignOffersToExecutivesHandler;
