"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOfferHandler = void 0;
const db_1 = require("../../lib/db");
const crypto_1 = require("crypto");
const createOfferHandler = async (req) => {
    const client = await db_1.pool.connect();
    try {
        const data = req.data ?? {};
        const orgId = req.user?.orgId;
        if (!orgId) {
            return req.reject(401, "Unauthorized");
        }
        const { is_global, title, code, description = null, discount_type, valid_from, valid_to, discount_amount = null, discount_percentage = null, max_discount_amount = null, combo_description = null, buy_quantity = null, get_quantity = null, min_purchase_amount = null, discount_value = null, flag_discount_amount = null, } = data;
        const managerIds = Array.isArray(data.manager_ids)
            ? data.manager_ids
            : data.manager_ids
                ? [data.manager_ids]
                : [];
        const id = (0, crypto_1.randomUUID)();
        await client.query("BEGIN");
        await client.query(`INSERT INTO crm_offer (
        id, organization_id, is_global, title, code, description,
        discount_type, discount_amount, discount_percentage, max_discount_amount,
        combo_description, buy_quantity, get_quantity,
        min_purchase_amount, discount_value, flag_discount_amount,
        valid_from, valid_to, status
      ) VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,
        $11,$12,$13,
        $14,$15,$16,
        $17,$18,$19
      )`, [
            id,
            is_global ? null : orgId,
            is_global,
            title?.trim(),
            code?.trim()?.toUpperCase(),
            description?.trim() || null,
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
        ]);
        if (!is_global && managerIds.length > 0) {
            const validCheck = await client.query(`SELECT u.id 
         FROM crm_user u
         JOIN crm_organizationroles or_ ON or_.id = u.role_id
         JOIN crm_roles r ON r.id = or_.role_id
         WHERE u.id = ANY($1)
           AND u.organization_id = $2
           AND u.is_active = true
           AND LOWER(r.name) = 'manager'`, [managerIds, orgId]);
            const values = managerIds
                .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
                .join(", ");
            const params = managerIds.flatMap((managerId) => [id, managerId]);
            await client.query(`INSERT INTO crm_offerassignment (offer_id, user_id)
         VALUES ${values}`, params);
        }
        await client.query("COMMIT");
        return { id, message: "Offer created successfully" };
    }
    catch (error) {
        await client.query("ROLLBACK");
        return req.reject(500, "Failed to create offer");
    }
    finally {
        client.release();
    }
};
exports.createOfferHandler = createOfferHandler;
