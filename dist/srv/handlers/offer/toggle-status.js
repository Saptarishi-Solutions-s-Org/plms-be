"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleOfferStatusHandler = void 0;
const db_1 = require("../../lib/db");
const socket_1 = require("../../realtime/socket");
const events_1 = require("../../realtime/events");
const toggleOfferStatusHandler = async (req) => {
    try {
        const { id } = req.data;
        const orgId = req.user?.orgId;
        const result = await db_1.pool.query(`
      SELECT status
      FROM crm_offer
      WHERE id = $1
      `, [id]);
        if (!result.rows.length) {
            return req.reject(404, "Offer not found");
        }
        const currentStatus = result.rows[0].status;
        const newStatus = currentStatus === "Active"
            ? "Inactive"
            : "Active";
        await db_1.pool.query(`
      UPDATE crm_offer
      SET status = $1
      WHERE id = $2
      `, [newStatus, id]);
        (0, socket_1.emitToOrg)(orgId, events_1.OFFER_LIST_CHANGED, {
            reason: "offer-status-changed",
            offerId: id,
            status: newStatus.toLowerCase(),
        });
        (0, socket_1.emitToOrg)(orgId, events_1.OFFER_DETAIL_CHANGED, {
            reason: "offer-status-changed",
            offerId: id,
            status: newStatus.toLowerCase(),
        });
        return {
            status: newStatus.toLowerCase(),
        };
    }
    catch (error) {
        return req.reject(500, "Failed to toggle offer status");
    }
};
exports.toggleOfferStatusHandler = toggleOfferStatusHandler;
