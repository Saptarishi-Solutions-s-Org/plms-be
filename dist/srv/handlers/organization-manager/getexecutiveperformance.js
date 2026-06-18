"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executivePerformanceHandler = void 0;
const db_1 = require("../../lib/db");
const executivePerformanceHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        const userId = req.user?.id;
        if (!orgId || !userId) {
            return req.error(400, "Organization ID missing");
        }
        const res = await db_1.pool.query(`
  SELECT 
    u.name AS executive_name,
    COUNT(l.id) AS total,
    COUNT(*) FILTER (WHERE l.status = 'Qualified') AS qualified
  FROM crm_user u
  JOIN crm_organizationroles orr
    ON orr.id = u.role_id
  JOIN crm_roles r
    ON r.id = orr.role_id
  LEFT JOIN crm_leads l
    ON l.assigned_to_id = u.id
   AND l.organization_id = $1
  WHERE u.organization_id = $1
    AND u.reporting_manager_id = $2
    AND LOWER(r.name) LIKE '%executive%'
  GROUP BY u.id, u.name
  ORDER BY u.name ASC
  `, [orgId, userId]);
        return res.rows.map((row) => ({
            executiveName: row.executive_name,
            total: Number(row.total),
            qualified: Number(row.qualified),
        }));
    }
    catch (error) {
        console.error(error);
        return req.error(500, "Failed to fetch executive performance");
    }
};
exports.executivePerformanceHandler = executivePerformanceHandler;
