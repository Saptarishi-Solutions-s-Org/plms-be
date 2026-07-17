"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadSourceAnalyticsHandler = void 0;
const db_1 = require("../../../lib/db");
const leadSourceAnalyticsHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        const userId = req.user?.id;
        const roles = (req.user?.roles ?? []).map((role) => String(role).toLowerCase());
        if (!orgId || !userId) {
            return req.error(400, "User or Organization ID missing");
        }
        let visibilityClause;
        const params = [orgId];
        if (roles.includes("admin")) {
            visibilityClause = "TRUE";
        }
        else if (roles.includes("manager")) {
            params.push(userId);
            visibilityClause = `
        (
          l.assigned_to_id = $2
          OR assignee.reporting_manager_id = $2
          OR (l.assigned_to_id IS NULL AND l.createdby = $2)
        )
      `;
        }
        else if (roles.includes("executive")) {
            params.push(userId);
            visibilityClause = "l.assigned_to_id = $2";
        }
        else {
            return req.error(403, "Forbidden: unsupported reports role");
        }
        const res = await db_1.pool.query(`
      SELECT
        l.source AS source,
        COUNT(*) AS leads,
        COUNT(*) FILTER (
          WHERE LOWER(l.status) = 'qualified'
      ) AS converted
      FROM crm_leads l
      LEFT JOIN crm_user assignee
        ON assignee.id = l.assigned_to_id
       AND assignee.organization_id = l.organization_id
      WHERE l.organization_id = $1
        AND ${visibilityClause}
      GROUP BY l.source
      ORDER BY leads DESC, source ASC
      `, params);
        return res.rows.map((row) => ({
            source: row.source,
            leads: Number(row.leads),
            converted: Number(row.converted),
            conversionRate: Number(row.leads) > 0
                ? Number(((Number(row.converted) /
                    Number(row.leads)) *
                    100).toFixed(1))
                : 0,
        }));
    }
    catch (error) {
        return req.error(500, "Failed to fetch lead source analytics");
    }
};
exports.leadSourceAnalyticsHandler = leadSourceAnalyticsHandler;
