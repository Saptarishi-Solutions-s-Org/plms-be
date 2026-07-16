"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editOfferHandler = void 0;
const db_1 = require("../../lib/db");
const crypto_1 = require("crypto");
const socket_1 = require("../../realtime/socket");
const events_1 = require("../../realtime/events");
const editOfferHandler = async (req) => {
    const client = await db_1.pool.connect();
    try {
        const data = req.data ?? {};
        const orgId = req.user?.orgId;
        if (!orgId) {
            return req.reject(401, "Unauthorized");
        }
        const { id } = data;
        if (!id) {
            return req.reject(400, "Offer id is required");
        }
        const { is_global, title, description = null, discount_type, valid_from, valid_to, discount_amount = null, discount_percentage = null, max_discount_amount = null, combo_description = null, buy_quantity = null, get_quantity = null, min_purchase_amount = null, discount_value = null, flag_discount_amount = null, } = data;
        const managerIds = Array.isArray(data.manager_ids)
            ? data.manager_ids
            : data.manager_ids
                ? [data.manager_ids]
                : [];
        await client.query("BEGIN");
        const existing = await client.query(`
      SELECT id
      FROM crm_offer
      WHERE id = $1
        AND organization_id = $2
      `, [id, orgId]);
        if (!existing.rows.length) {
            await client.query("ROLLBACK");
            return req.reject(404, "Offer not found");
        }
        await client.query(`
      UPDATE crm_offer
      SET
        is_global = $1,
        title = $2,
        description = $3,
        discount_type = $4,
        discount_amount = $5,
        discount_percentage = $6,
        max_discount_amount = $7,
        combo_description = $8,
        buy_quantity = $9,
        get_quantity = $10,
        min_purchase_amount = $11,
        discount_value = $12,
        flag_discount_amount = $13,
        valid_from = $14,
        valid_to = $15
      WHERE id = $16
      `, [
            is_global,
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
        await client.query(`
      DELETE FROM crm_managerofferassignment
      WHERE "offer_ID" = $1
      `, [id]);
        if (!is_global && managerIds.length > 0) {
            const validCheck = await client.query(`
        SELECT u.id
        FROM crm_user u
        JOIN crm_organizationroles or_ ON or_.id = u.role_id
        JOIN crm_roles r ON r.id = or_.role_id
        WHERE u.id = ANY($1)
          AND u.organization_id = $2
          AND u.is_active = true
          AND LOWER(r.name) = 'manager'
        `, [managerIds, orgId]);
            const validManagerIds = validCheck.rows.map((row) => row.id);
            if (validManagerIds.length === 0) {
                throw new Error("No valid managers found");
            }
            const assignmentValues = validManagerIds
                .map((_, i) => {
                const base = i * 3;
                return `($${base + 1}, $${base + 2}, $${base + 3})`;
            })
                .join(", ");
            const assignmentParams = validManagerIds.flatMap((managerId) => [
                (0, crypto_1.randomUUID)(),
                id,
                managerId,
            ]);
            await client.query(`
        INSERT INTO crm_managerofferassignment (
          "ID",
          "offer_ID",
          "user_ID"
        )
        VALUES ${assignmentValues}
        `, assignmentParams);
        }
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
        return req.reject(500, error?.message || "Failed to update offer");
    }
    finally {
        client.release();
    }
};
exports.editOfferHandler = editOfferHandler;
