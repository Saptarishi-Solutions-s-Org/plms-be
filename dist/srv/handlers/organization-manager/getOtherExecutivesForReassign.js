"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOtherExecutivesForReassignHandler = void 0;
const db_1 = require("../../lib/db");
const getOtherExecutivesForReassignHandler = async (req) => {
    const client = await db_1.pool.connect();
    try {
        const orgId = req.user?.orgId;
        const managerId = req.user?.userId || req.user?.id;
        const { executiveId } = req.data;
        if (!orgId || !managerId) {
            return req.error(401, "Unauthorized");
        }
        if (!executiveId) {
            return req.error(400, "Missing executiveId");
        }
        // Get all other active executives under this manager
        const result = await client.query(`SELECT u.id, u.name, u.email, u.phone
       FROM crm_user u
       JOIN crm_organizationroles r ON u.role_id = r.id
       JOIN crm_roles rl ON rl.id = r.role_id
       WHERE u.reporting_manager_id = $1
       AND u.organization_id = $2
       AND LOWER(rl.name) = 'executive'
       AND u.is_active = true
       AND u.id != $3
       ORDER BY u.name ASC`, [managerId, orgId, executiveId]);
        return result.rows;
    }
    catch (err) {
        console.error("Get other executives for reassign error:", err);
        return req.error(500, "Failed to fetch executives");
    }
    finally {
        client.release();
    }
};
exports.getOtherExecutivesForReassignHandler = getOtherExecutivesForReassignHandler;
