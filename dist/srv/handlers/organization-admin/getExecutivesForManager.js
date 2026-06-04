"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExecutivesForManagerHandler = void 0;
const db_1 = require("../../lib/db");
const getExecutivesForManagerHandler = async (req) => {
    const client = await db_1.pool.connect();
    try {
        const orgId = req.user?.orgId;
        const { managerId } = req.data;
        if (!orgId) {
            return req.error(401, "Unauthorized");
        }
        if (!managerId) {
            return req.error(400, "Missing managerId");
        }
        // Verify manager exists
        const managerRes = await client.query(`SELECT u.id FROM crm_user u
       JOIN crm_organizationroles r ON u.role_id = r.id
       JOIN crm_roles rl ON rl.id = r.role_id
       WHERE u.id = $1
       AND u.organization_id = $2
       AND LOWER(rl.name) = 'manager'`, [managerId, orgId]);
        if (!managerRes.rows.length) {
            return req.error(404, "Manager not found");
        }
        // Get all active executives under this manager
        const result = await client.query(`SELECT u.id, u.name, u.email, u.phone
       FROM crm_user u
       JOIN crm_organizationroles r ON u.role_id = r.id
       JOIN crm_roles rl ON rl.id = r.role_id
       WHERE u.reporting_manager_id = $1
       AND u.organization_id = $2
       AND LOWER(rl.name) = 'executive'
       AND u.is_active = true
       ORDER BY u.name ASC`, [managerId, orgId]);
        return result.rows;
    }
    catch (err) {
        console.error("Get executives for manager error:", err);
        return req.error(500, "Failed to fetch executives");
    }
    finally {
        client.release();
    }
};
exports.getExecutivesForManagerHandler = getExecutivesForManagerHandler;
