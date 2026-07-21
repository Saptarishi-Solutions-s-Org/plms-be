"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivateExecutiveHandler = void 0;
const db_1 = require("../../lib/db");
const socket_1 = require("../../realtime/socket");
const events_1 = require("../../realtime/events");
const deactivateExecutiveHandler = async (req) => {
    const client = await db_1.pool.connect();
    try {
        const orgId = req.user?.orgId;
        const { executiveId, targetExecutiveId } = req.data;
        if (!orgId) {
            return req.error(401, "Unauthorized");
        }
        if (!executiveId || !targetExecutiveId) {
            return req.error(400, "Missing executiveId or targetExecutiveId");
        }
        if (executiveId === targetExecutiveId) {
            return req.error(400, "Cannot assign leads to the same executive");
        }
        await client.query("BEGIN");
        // Verify that both executives exist and belong to the same organization
        const executiveRes = await client.query(`SELECT u.id, u.name, r.role_id
       FROM crm_user u
       JOIN crm_organizationroles r ON u.role_id = r.id
       JOIN crm_roles rl ON rl.id = r.role_id
       WHERE u.id = $1
       AND u.organization_id = $2
       AND LOWER(rl.name) = 'executive'`, [executiveId, orgId]);
        if (!executiveRes.rows.length) {
            await client.query("ROLLBACK");
            return req.error(404, "Executive not found");
        }
        const targetExecutiveRes = await client.query(`SELECT u.id, u.name
       FROM crm_user u
       JOIN crm_organizationroles r ON u.role_id = r.id
       JOIN crm_roles rl ON rl.id = r.role_id
       WHERE u.id = $1
       AND u.organization_id = $2
       AND LOWER(rl.name) = 'executive'
       AND u.is_active = true`, [targetExecutiveId, orgId]);
        if (!targetExecutiveRes.rows.length) {
            await client.query("ROLLBACK");
            return req.error(404, "Target executive not found or is inactive");
        }
        // Get all leads assigned to the executive being deactivated
        const leadsRes = await client.query(`SELECT id FROM crm_leads
       WHERE assigned_to_id = $1
       AND organization_id = $2`, [executiveId, orgId]);
        const leadCount = leadsRes.rows.length;
        // Reassign all leads to the target executive
        if (leadCount > 0) {
            await client.query(`UPDATE crm_leads
         SET assigned_to_id = $1, modifiedat = NOW()
         WHERE assigned_to_id = $2
         AND organization_id = $3`, [targetExecutiveId, executiveId, orgId]);
        }
        // Deactivate the executive
        await client.query(`UPDATE crm_user
       SET is_active = false,
           session_version = session_version + 1,
           modifiedat = NOW()
       WHERE id = $1`, [executiveId]);
        await client.query("COMMIT");
        (0, socket_1.emitToOrg)(orgId, events_1.USER_LIST_CHANGED, {
            reason: "executive-deactivated",
            userId: executiveId,
        });
        (0, socket_1.emitToOrg)(orgId, events_1.USER_DETAIL_CHANGED, {
            reason: "executive-deactivated",
            userId: executiveId,
        });
        (0, socket_1.emitToOrg)(orgId, events_1.LEAD_LIST_CHANGED, {
            reason: "executive-deactivated",
        });
        return {
            message: `Executive deactivated successfully. ${leadCount} leads reassigned to ${targetExecutiveRes.rows[0].name}`,
            executiveName: executiveRes.rows[0].name,
            targetExecutiveName: targetExecutiveRes.rows[0].name,
            leadsReassigned: leadCount,
        };
    }
    catch (err) {
        await client.query("ROLLBACK");
        console.error("Deactivate executive error:", err);
        return req.error(500, "Failed to deactivate executive");
    }
    finally {
        client.release();
    }
};
exports.deactivateExecutiveHandler = deactivateExecutiveHandler;
