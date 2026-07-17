import { pool } from "../../../lib/db";

export const ReportDashboardHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const userId = req.user?.id;
    const roles = (req.user?.roles ?? []).map((role: string) =>
      String(role).toLowerCase(),
    );

    if (!orgId || !userId) {
      return req.error(400, "User or Organization ID missing");
    }

    let visibilityClause: string;
    const params: string[] = [orgId];

    if (roles.includes("admin")) {
      visibilityClause = "TRUE";
    } else if (roles.includes("manager")) {
      params.push(userId);
      visibilityClause = `
        (
          l.assigned_to_id = $2
          OR assignee.reporting_manager_id = $2
          OR (l.assigned_to_id IS NULL AND l.createdby = $2)
        )
      `;
    } else if (roles.includes("executive")) {
      params.push(userId);
      visibilityClause = "l.assigned_to_id = $2";
    } else {
      return req.error(403, "Forbidden: unsupported reports role");
    }

    const statsRes = await pool.query(
      `
        SELECT
          COUNT(DISTINCT l.id)::int AS "totalLeads",
          COUNT(DISTINCT l.id) FILTER (
            WHERE l.assigned_to_id IS NOT NULL
          )::int AS "leadsAssigned",
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
            FROM crm_offer organization_offer
            WHERE organization_offer.organization_id = $1
              AND LOWER(organization_offer.status) = 'active'
          ) AS "activeOffers",
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
      `,
      params,
    );

    const stats = statsRes.rows[0] ?? {};

    return {
      totalLeads: Number(stats.totalLeads ?? 0),
      leadsAssigned: Number(stats.leadsAssigned ?? 0),
      convertedLeads: Number(stats.convertedLeads ?? 0),
      conversionRate: Number(stats.conversionRate ?? 0),
      activeOffers: Number(stats.activeOffers ?? 0),
      totalUsers: Number(stats.totalUsers ?? 0),
      activeUsers: Number(stats.activeUsers ?? 0),
    };
  } catch (error: any) {
    console.error("Error fetching report stats:", error?.message ?? error);
    return req.error(500, "Failed to fetch report stats");
  }
};
