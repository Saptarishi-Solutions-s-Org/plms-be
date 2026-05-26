import { pool } from "../../lib/db";

export const getExecutiveOverviewHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const managerId = req.user?.id;

    if (!orgId) {
      return req.error(400, "Organization ID missing");
    }

    if (!managerId) {
      return req.error(400, "Manager ID missing");
    }

    const executivesQuery = `
      WITH executive_base AS (
        SELECT
          u.id,
          u.name,
          u.email,
          u.phone,
          u.is_active
        FROM crm_user u
        JOIN crm_organizationroles orr
          ON orr.id = u.role_id
        JOIN crm_roles r
          ON r.id = orr.role_id
        WHERE u.organization_id = $1
          AND u.reporting_manager_id = $2
          AND LOWER(r.name) LIKE '%executive%'
      ),
      lead_counts AS (
        SELECT
          assigned_to_id AS executive_id,
          COUNT(*) AS lead_count
        FROM crm_leads
        WHERE organization_id = $1
          AND assigned_to_id IS NOT NULL
        GROUP BY assigned_to_id
      ),
      offer_counts AS (
        SELECT
          "executive_ID" AS executive_id,
          COUNT(DISTINCT "offer_ID") AS offer_count
        FROM crm_executiveofferassignment
        GROUP BY "executive_ID"
      )
      SELECT
        eb.id,
        eb.name,
        eb.email,
        eb.phone,
        eb.is_active,
        COALESCE(lc.lead_count, 0) AS lead_count,
        COALESCE(oc.offer_count, 0) AS offer_count
      FROM executive_base eb
      LEFT JOIN lead_counts lc
        ON lc.executive_id = eb.id
      LEFT JOIN offer_counts oc
        ON oc.executive_id = eb.id
      ORDER BY eb.name ASC
    `;

    const executivesResult = await pool.query(executivesQuery, [
      orgId,
      managerId,
    ]);

    const statsQuery = `
      WITH executive_base AS (
        SELECT
          u.id,
          u.is_active
        FROM crm_user u
        JOIN crm_organizationroles orr
          ON orr.id = u.role_id
        JOIN crm_roles r
          ON r.id = orr.role_id
        WHERE u.organization_id = $1
          AND u.reporting_manager_id = $2
          AND LOWER(r.name) LIKE '%executive%'
      )
      SELECT
        COUNT(*) AS total_count,
        COUNT(*) FILTER (WHERE is_active = true) AS active_count,
        COUNT(*) FILTER (WHERE is_active = false) AS inactive_count
      FROM executive_base
    `;

    const statsResult = await pool.query(statsQuery, [orgId, managerId]);
    const stats = statsResult.rows[0] || {};

    return {
      stats: {
        totalExecutives: Number(stats.total_count) || 0,
        activeExecutives: Number(stats.active_count) || 0,
        inactiveExecutives: Number(stats.inactive_count) || 0,
      },
      executives: executivesResult.rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        status: row.is_active ? "Active" : "Inactive",
        leadCount: Number(row.lead_count) || 0,
        offerCount: Number(row.offer_count) || 0,
      })),
    };
  } catch (error: any) {
    return req.error(
      500,
      error?.message || "Failed to fetch executive overview",
    );
  }
};