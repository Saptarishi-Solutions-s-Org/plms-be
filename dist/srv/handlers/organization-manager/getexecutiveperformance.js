"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executivePerformanceHandler = void 0;
const db_1 = require("../../lib/db");
const executivePerformanceHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId) {
            return req.error(400, "Organization ID missing");
        }
        const res = await db_1.pool.query(`
      SELECT 
        assigned_to AS executive_id,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'Qualified') AS qualified
      FROM crm_leads
      WHERE organization_id = $1
      GROUP BY assigned_to
      `, [orgId]);
        return res.rows.map((row) => ({
            executiveId: Number(row.executive_id),
            total: Number(row.total),
            qualified: Number(row.qualified),
        }));
    }
    catch (error) {
        return req.error(500, "Failed to fetch executive performance");
    }
};
exports.executivePerformanceHandler = executivePerformanceHandler;
