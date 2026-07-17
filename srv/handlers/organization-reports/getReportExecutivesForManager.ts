import { pool } from "../../lib/db";
import { createPaginationMeta, parsePaginationParams } from "../../lib/pagination";

const normalizeFilter = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const getReportExecutivesForManagerHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const rawRequest = req?._?.req ?? req?.req;
    const url = rawRequest?.originalUrl ?? rawRequest?.url ?? "";
    const queryIndex = url.indexOf("?");
    const urlParams =
      queryIndex >= 0
        ? Object.fromEntries(new URLSearchParams(url.slice(queryIndex + 1)))
        : {};
    const paramsSource = {
      ...(req.data ?? {}),
      ...(rawRequest?.query ?? {}),
      ...urlParams,
    };
    const managerId = normalizeFilter(paramsSource.managerId);

    if (!orgId) {
      return req.error(401, "Unauthorized");
    }

    if (!managerId) {
      return req.error(400, "Missing managerId");
    }

    const managerRes = await pool.query(
      `
        SELECT manager.id
        FROM crm_user manager
        JOIN crm_organizationroles org_role ON org_role.id = manager.role_id
        JOIN crm_roles role ON role.id = org_role.role_id
        WHERE manager.id = $1
          AND manager.organization_id = $2
          AND LOWER(role.name) = 'manager'
        LIMIT 1
      `,
      [managerId, orgId],
    );

    if (!managerRes.rows.length) {
      return req.error(404, "Manager not found");
    }

    const { page, limit, offset } = parsePaginationParams(paramsSource);
    const rawSearch = normalizeFilter(paramsSource.search);
    const search = rawSearch ? `%${rawSearch.toLowerCase()}%` : null;
    const whereClauses = [
      "executive.reporting_manager_id = $1",
      "executive.organization_id = $2",
      "executive.is_active = true",
      "LOWER(role.name) = 'executive'",
    ];
    const params: any[] = [managerId, orgId];

    if (search) {
      params.push(search);
      whereClauses.push(
        `(LOWER(executive.name) LIKE $${params.length} OR LOWER(executive.email) LIKE $${params.length} OR LOWER(executive.phone) LIKE $${params.length})`,
      );
    }

    const whereClause = whereClauses.join(" AND ");
    const [executivesRes, countRes] = await Promise.all([
      pool.query(
        `
          SELECT
            executive.id,
            executive.name,
            executive.email,
            executive.phone
          FROM crm_user executive
          JOIN crm_organizationroles org_role ON org_role.id = executive.role_id
          JOIN crm_roles role ON role.id = org_role.role_id
          WHERE ${whereClause}
          ORDER BY executive.name ASC
          LIMIT $${params.length + 1}
          OFFSET $${params.length + 2}
        `,
        [...params, limit, offset],
      ),
      pool.query(
        `
          SELECT COUNT(*) AS total
          FROM crm_user executive
          JOIN crm_organizationroles org_role ON org_role.id = executive.role_id
          JOIN crm_roles role ON role.id = org_role.role_id
          WHERE ${whereClause}
        `,
        params,
      ),
    ]);

    const total = Number(countRes.rows[0]?.total ?? 0);

    return {
      executives: executivesRes.rows,
      pagination: createPaginationMeta({ page, limit, total }),
    };
  } catch (error: any) {
    console.error(
      "Error fetching report executives for manager:",
      error?.message ?? error,
    );
    return req.error(500, "Failed to fetch report executives for manager");
  }
};
