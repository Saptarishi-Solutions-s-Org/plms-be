"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadSourceAnalyticsHandler = void 0;
const db_1 = require("../../../lib/db");
const leadSourceAnalyticsHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        const userId = req.user?.id;
        const roles = (req.user?.roles ?? []).map((role) => role.toLowerCase());
        const isExecutive = roles.includes("executive") && !roles.includes("manager");
        if (!orgId || !userId) {
            return req.error(400, "User or Organization ID missing");
        }
        const res = await db_1.pool.query(`
      SELECT
        l.source AS source,
        COUNT(*) AS leads,
        COUNT(*) FILTER (
          WHERE status = 'Qualified'
        ) AS converted
      FROM crm_leads l
      LEFT JOIN crm_user u ON u.id = l.assigned_to_id
      WHERE l.organization_id = $1
        AND (
          ($3::boolean = TRUE AND l.assigned_to_id = $2)
          OR
          ($3::boolean = FALSE AND (
            l.assigned_to_id = $2
            OR u.reporting_manager_id = $2
            OR (l.assigned_to_id IS NULL AND l.createdby = $2)
          ))
        )
      GROUP BY l.source
      ORDER BY leads DESC, source ASC
      `, [orgId, userId, isExecutive]);
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
