"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkAssignLeadsHandler = exports.updateLeadHandler = void 0;
const db_1 = require("../../lib/db");
const crypto_1 = require("crypto");
const socket_1 = require("../../realtime/socket");
const events_1 = require("../../realtime/events");
const updateLeadHandler = async (req) => {
    const client = await db_1.pool.connect();
    try {
        await client.query("BEGIN");
        const orgId = req.user?.orgId;
        const modifiedBy = req.user?.id;
        if (!orgId) {
            return req.error(401, "Unauthorized");
        }
        const { id, name, gender, email, phone, city, state, country, postalCode, leadSource, status, assignedTo, priority, notes, } = req.data;
        if (!id) {
            return req.error(400, "Lead ID is required");
        }
        const existsRes = await client.query(`SELECT id FROM crm_leads WHERE id = $1 AND organization_id = $2`, [id, orgId]);
        if (existsRes.rows.length === 0) {
            return req.error(404, "Lead not found");
        }
        const duplicate = await client.query(`SELECT id FROM crm_leads
       WHERE organization_id = $1
         AND id <> $2
         AND (LOWER(email) = LOWER($3) OR phone = $4)
       LIMIT 1`, [orgId, id, email, phone]);
        if (duplicate.rowCount) {
            await client.query("ROLLBACK");
            return req.error(409, "A lead with this email or phone already exists");
        }
        await client.query(`UPDATE crm_leads SET
         name           = $1,
         gender         = $2,
         email          = $3,
         phone          = $4,
         address        = $5,
         postal_code    = $6,
         state_id       = $7,
         country_id     = $8,
         source         = $9,
         status         = $10,
         priority       = $11,
         assigned_to_id = $12,
         modifiedat     = NOW(),
         modifiedby     = $13
       WHERE id = $14 AND organization_id = $15`, [
            name, gender, email, phone,
            city, postalCode,
            state || null, country || null,
            leadSource, status, priority,
            assignedTo || null,
            modifiedBy,
            id, orgId,
        ]);
        if (notes?.trim()) {
            await client.query(`INSERT INTO crm_leadactivity
           (id, lead_id, notes, createdat, createdby, modifiedat, modifiedby)
         VALUES ($1,$2,$3,NOW(),$4,NOW(),$4)`, [(0, crypto_1.randomUUID)(), id, notes.trim(), modifiedBy]);
        }
        await client.query("COMMIT");
        (0, socket_1.emitToOrg)(orgId, events_1.LEAD_LIST_CHANGED, {
            reason: "lead-updated",
            leadId: id,
        });
        (0, socket_1.emitToOrg)(orgId, events_1.LEAD_DETAIL_CHANGED, {
            reason: "lead-updated",
            leadId: id,
        });
        return { message: "Lead updated successfully" };
    }
    catch (error) {
        await client.query("ROLLBACK");
        console.error("Error updating lead:", error?.message ?? error);
        return req.error(500, "Failed to update lead");
    }
    finally {
        client.release();
    }
};
exports.updateLeadHandler = updateLeadHandler;
const bulkAssignLeadsHandler = async (req) => {
    const client = await db_1.pool.connect();
    try {
        const orgId = req.user?.orgId;
        const managerId = req.user?.id;
        const { leadIds, assignedTo } = req.data ?? {};
        if (!orgId || !managerId) {
            return req.error(401, "Unauthorized");
        }
        if (!Array.isArray(leadIds) || leadIds.length === 0) {
            return req.error(400, "leadIds must contain at least one lead");
        }
        if (!assignedTo) {
            return req.error(400, "assignedTo is required");
        }
        const uniqueLeadIds = [...new Set(leadIds.filter(Boolean))];
        if (uniqueLeadIds.length === 0) {
            return req.error(400, "leadIds must contain at least one valid lead");
        }
        await client.query("BEGIN");
        const executiveRes = await client.query(`SELECT u.id, u.name
       FROM crm_user u
       JOIN crm_organizationroles orr ON orr.id = u.role_id
       JOIN crm_roles             r   ON r.id   = orr.role_id
       WHERE u.id = $1
         AND u.organization_id = $2
         AND u.reporting_manager_id = $3
         AND LOWER(r.name) LIKE '%executive%'
         AND u.is_active = true
       LIMIT 1`, [assignedTo, orgId, managerId]);
        if (!executiveRes.rows.length) {
            await client.query("ROLLBACK");
            return req.error(404, "Executive not found or not under your management");
        }
        const leadsRes = await client.query(`SELECT l.id
       FROM crm_leads l
       LEFT JOIN crm_user u ON u.id = l.assigned_to_id
       WHERE l.organization_id = $1
         AND l.id = ANY($2::text[])
         AND (
           l.assigned_to_id = $3
           OR u.reporting_manager_id = $3
           OR (l.assigned_to_id IS NULL AND l.createdby = $3)
         )`, [orgId, uniqueLeadIds, managerId]);
        if (leadsRes.rowCount !== uniqueLeadIds.length) {
            await client.query("ROLLBACK");
            return req.error(404, "One or more leads were not found or cannot be assigned");
        }
        const updatedRes = await client.query(`UPDATE crm_leads
       SET assigned_to_id = $1,
           modifiedat = NOW(),
           modifiedby = $2
       WHERE organization_id = $3
         AND id = ANY($4::text[])`, [assignedTo, managerId, orgId, uniqueLeadIds]);
        await client.query("COMMIT");
        (0, socket_1.emitToOrg)(orgId, events_1.LEAD_LIST_CHANGED, {
            reason: "leads-bulk-assigned",
            leadIds: uniqueLeadIds,
            assignedTo,
        });
        for (const leadId of uniqueLeadIds) {
            (0, socket_1.emitToOrg)(orgId, events_1.LEAD_DETAIL_CHANGED, {
                reason: "lead-assigned",
                leadId,
                assignedTo,
            });
        }
        return {
            message: `${updatedRes.rowCount} lead(s) assigned successfully`,
            assignedCount: updatedRes.rowCount,
        };
    }
    catch (error) {
        await client.query("ROLLBACK");
        console.error("Error bulk assigning leads:", error?.message ?? error);
        return req.error(500, "Failed to assign leads");
    }
    finally {
        client.release();
    }
};
exports.bulkAssignLeadsHandler = bulkAssignLeadsHandler;
