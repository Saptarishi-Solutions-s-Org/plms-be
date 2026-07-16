"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createManagerOfferHandler = void 0;
const db_1 = require("../../lib/db");
const crypto_1 = require("crypto");
const generateOfferCode_1 = require("../../lib/generateOfferCode");
const socket_1 = require("../../realtime/socket");
const events_1 = require("../../realtime/events");
const createManagerOfferHandler = async (req) => {
    const client = await db_1.pool.connect();
    try {
        const data = req.data ?? {};
        const orgId = req.user?.orgId;
        const managerId = req.user?.id;
        if (!orgId || !managerId) {
            return req.reject(401, "Unauthorized");
        }
        const { title, description = null, discount_type, valid_from, valid_to, discount_amount = null, discount_percentage = null, max_discount_amount = null, combo_description = null, buy_quantity = null, get_quantity = null, min_purchase_amount = null, discount_value = null, flag_discount_amount = null, } = data;
        const id = (0, crypto_1.randomUUID)();
        await client.query("BEGIN");
        await client.query(`
      INSERT INTO crm_offer (
        id,
        organization_id,
        is_global,
        title,
        code,
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
        status,
        createdat,
        createdby
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,
        $11,$12,$13,
        $14,$15,$16,
        $17,$18,$19,
        $20,$21
      )
      `, [
            id,
            orgId,
            false,
            title?.trim(),
            (0, generateOfferCode_1.generateOfferCode)(),
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
            "Active",
            new Date(),
            managerId,
        ]);
        await client.query(`
      INSERT INTO crm_managerofferassignment (
        "ID",
        "offer_ID",
        "user_ID"
      )
      VALUES ($1, $2, $3)
      `, [(0, crypto_1.randomUUID)(), id, managerId]);
        await client.query("COMMIT");
        (0, socket_1.emitToOrg)(orgId, events_1.OFFER_LIST_CHANGED, {
            reason: "offer-created",
            offerId: id,
        });
        return {
            id,
            message: "Offer created successfully",
        };
    }
    catch (error) {
        await client.query("ROLLBACK");
        if (typeof error?.code === "number") {
            return req.reject(error.code, error.message);
        }
        return req.reject(500, error?.message || "Failed to create offer");
    }
    finally {
        client.release();
    }
};
exports.createManagerOfferHandler = createManagerOfferHandler;
