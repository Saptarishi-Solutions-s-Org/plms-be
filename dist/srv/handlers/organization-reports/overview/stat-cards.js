"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportDashboardHandler = void 0;
const db_1 = require("../../../lib/db");
const ReportDashboardHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        const userId = req.user?.id;
        const roles = (req.user?.roles ?? []).map((role) => role.toLowerCase());
        if (!orgId || !userId) {
            return req.error(400, "User or Organization ID missing");
        }
        let visibilityClause;
        const params = [orgId];
        if (roles.includes("admin")) {
            visibilityClause = "l.assigned_to_id IS NOT NULL";
        }
        else if (roles.includes("manager")) {
            params.push(userId);
            visibilityClause = `
        (l.assigned_to_id = $2 OR assignee.reporting_manager_id = $2)
      `;
        }
        else if (roles.includes("executive")) {
            params.push(userId);
            visibilityClause = "l.assigned_to_id = $2";
        }
        else {
            return req.error(403, "Forbidden: unsupported reports role");
        }
        const statsRes = await db_1.pool.query(`
        SELECT
          COUNT(DISTINCT l.id)::int AS "leadsAssigned",
          COUNT(DISTINCT l.id) FILTER (
            WHERE LOWER(l.status) = 'qualified'
          )::int AS "convertedLeads",
          COALESCE(
            ROUND(
              COUNT(DISTINCT l.id) FILTER (
                WHERE LOWER(l.status) = 'qualified'
              )::numeric * 100
              / NULLIF(COUNT(DISTINCT l.id), 0),
              1
            ),
            0
          )::float AS "conversionRate",
          (
            SELECT COUNT(*)::int
            FROM crm_user organization_user
            WHERE organization_user.organization_id = $1
          ) AS "totalUsers",
          (
            SELECT COUNT(*)::int
            FROM crm_user organization_user
            WHERE organization_user.organization_id = $1
              AND organization_user.is_active = true
          ) AS "activeUsers"
        FROM crm_leads l
        LEFT JOIN crm_user assignee
          ON assignee.id = l.assigned_to_id
         AND assignee.organization_id = l.organization_id
        WHERE l.organization_id = $1
          AND ${visibilityClause}
      `, params);
        const leadsAssigned = Number(statsRes.rows[0]?.leadsAssigned ?? 0);
        const convertedLeads = Number(statsRes.rows[0]?.convertedLeads ?? 0);
        const conversionRate = Number(statsRes.rows[0]?.conversionRate ?? 0);
        const totalUsers = Number(statsRes.rows[0]?.totalUsers ?? 0);
        const activeUsers = Number(statsRes.rows[0]?.activeUsers ?? 0);
        return {
            leadsAssigned,
            convertedLeads,
            conversionRate,
            totalUsers,
            activeUsers,
        };
    }
    catch (error) {
        console.error("Error fetching report stats:", error?.message ?? error);
        return req.error(500, "Failed to fetch report stats");
    }
};
exports.ReportDashboardHandler = ReportDashboardHandler;
