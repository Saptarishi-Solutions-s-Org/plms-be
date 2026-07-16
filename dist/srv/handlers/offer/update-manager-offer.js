"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateManagerOfferHandler = void 0;
const db_1 = require("../../lib/db");
const socket_1 = require("../../realtime/socket");
const events_1 = require("../../realtime/events");
const updateManagerOfferHandler = async (req) => {
    const client = await db_1.pool.connect();
    try {
        const data = req.data ?? {};
        const orgId = req.user?.orgId;
        const managerId = req.user?.id;
        if (!orgId || !managerId) {
            return req.reject(401, "Unauthorized");
        }
        const { id } = data;
        if (!id) {
            return req.reject(400, "Offer id is required");
        }
        const { title, description = null, discount_type, valid_from, valid_to, discount_amount = null, discount_percentage = null, max_discount_amount = null, combo_description = null, buy_quantity = null, get_quantity = null, min_purchase_amount = null, discount_value = null, flag_discount_amount = null, } = data;
        await client.query("BEGIN");
        const existing = await client.query(`
      SELECT id
      FROM crm_offer
      WHERE id = $1
        AND organization_id = $2
        AND createdby = $3
        AND is_global = false
      `, [id, orgId, managerId]);
        if (!existing.rows.length) {
            await client.query("ROLLBACK");
            return req.reject(404, "Offer not found");
        }
        await client.query(`
      UPDATE crm_offer
      SET
        title = $1,
        description = $2,
        discount_type = $3,
        discount_amount = $4,
        discount_percentage = $5,
        max_discount_amount = $6,
        combo_description = $7,
        buy_quantity = $8,
        get_quantity = $9,
        min_purchase_amount = $10,
        discount_value = $11,
        flag_discount_amount = $12,
        valid_from = $13,
        valid_to = $14
      WHERE id = $15
      `, [
            title?.trim(),
            description,
            discount_type,
            discount_amount,
            discount_percentage,
            max_discount_amount,
            combo_description,
            buy_quantity,
            get_quantity,
            min_purchase_amount,
            discount_value,
            flag_discount_amount,
            valid_from,
            valid_to,
            id,
        ]);
        await client.query("COMMIT");
        (0, socket_1.emitToOrg)(orgId, events_1.OFFER_LIST_CHANGED, {
            reason: "offer-updated",
            offerId: id,
        });
        (0, socket_1.emitToOrg)(orgId, events_1.OFFER_DETAIL_CHANGED, {
            reason: "offer-updated",
            offerId: id,
        });
        return {
            id,
            message: "Offer updated successfully",
        };
    }
    catch (error) {
        await client.query("ROLLBACK");
        if (typeof error?.code === "number") {
            return req.reject(error.code, error.message);
        }
        return req.reject(500, error?.message || "Failed to update offer");
    }
    finally {
        client.release();
    }
};
exports.updateManagerOfferHandler = updateManagerOfferHandler;
