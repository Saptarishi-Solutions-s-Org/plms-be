"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManagersHandler = void 0;
const db_1 = require("../../lib/db");
const getManagersHandler = async (req) => {
    const client = await db_1.pool.connect();
    try {
        const orgId = req.user?.orgId;
        if (!orgId) {
            return req.error(401, "Unauthorized");
        }
        const result = await client.query(`SELECT u.id, u.name
       FROM crm_user u
       JOIN crm_organizationroles r ON u.role_id = r.id
       JOIN crm_roles rl ON rl.id = r.role_id
       WHERE u.organization_id = $1
       AND LOWER(rl.name) = 'manager'
       AND u.is_active = true`, [orgId]);
        return result.rows;
    }
    catch (err) {
        return req.error(500, "Failed to fetch managers");
    }
    finally {
        client.release();
    }
};
exports.getManagersHandler = getManagersHandler;
