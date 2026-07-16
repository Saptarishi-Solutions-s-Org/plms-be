import { pool } from "../../lib/db";

const normalizeFilter = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

export const executivePerformanceHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const currentUserId = req.user?.id;
    const paramsSource = { ...(req.data ?? {}), ...(req.query ?? {}) };
    const rawManagerId = normalizeFilter(paramsSource.managerId);
    const rawSearch = normalizeFilter(paramsSource.search);
    const managerId = rawManagerId || currentUserId;
    const search = rawSearch ? `%${rawSearch.toLowerCase()}%` : null;

    if (!orgId || !managerId) {
      return req.error(400, "Organization ID missing");
    }

    const whereClauses = [
      "u.organization_id = $1",
      "u.reporting_manager_id = $2",
      "LOWER(r.name) LIKE '%executive%'",
    ];
    const params: any[] = [orgId, managerId];

    if (search) {
      params.push(search);
      whereClauses.push(
        `(LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length} OR LOWER(u.phone) LIKE $${params.length})`,
      );
    }

    const res = await pool.query(
      `
      SELECT 
        u.id,
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
      WHERE ${whereClauses.join(" AND ")}
      GROUP BY u.id, u.name
      ORDER BY u.name ASC
      `,
      params,
    );


      return res.rows.map((row) => ({
      id: row.id,
      executiveName: row.executive_name,
      total: Number(row.total),
      qualified: Number(row.qualified),
    }));

  } catch (error) {
    console.error(error);
    return req.error(500, "Failed to fetch executive performance");
  }
};
