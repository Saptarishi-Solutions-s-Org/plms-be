import { pool } from "../../lib/db";
import { createPaginationMeta, parsePaginationParams } from "../../lib/pagination";

const normalizeFilter = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const getReportManagersHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;

    if (!orgId) {
      return req.error(401, "Unauthorized");
    }

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
    const { page, limit, offset } = parsePaginationParams(paramsSource);
    const rawSearch = normalizeFilter(paramsSource.search);
    const search = rawSearch ? `%${rawSearch.toLowerCase()}%` : null;

    const whereClauses = [
      "manager.organization_id = $1",
      "manager.is_active = true",
      "LOWER(role.name) = 'manager'",
    ];
    const params: any[] = [orgId];

    if (search) {
      params.push(search);
      whereClauses.push(
        `(LOWER(manager.name) LIKE $${params.length} OR LOWER(manager.email) LIKE $${params.length} OR LOWER(manager.phone) LIKE $${params.length})`,
      );
    }

    const whereClause = whereClauses.join(" AND ");
    const [managersRes, countRes] = await Promise.all([
      pool.query(
        `
          SELECT
            manager.id,
            manager.name,
            manager.email,
            manager.phone
          FROM crm_user manager
          JOIN crm_organizationroles org_role ON org_role.id = manager.role_id
          JOIN crm_roles role ON role.id = org_role.role_id
          WHERE ${whereClause}
          ORDER BY manager.name ASC
          LIMIT $${params.length + 1}
          OFFSET $${params.length + 2}
        `,
        [...params, limit, offset],
      ),
      pool.query(
        `
          SELECT COUNT(*) AS total
          FROM crm_user manager
          JOIN crm_organizationroles org_role ON org_role.id = manager.role_id
          JOIN crm_roles role ON role.id = org_role.role_id
          WHERE ${whereClause}
        `,
        params,
      ),
    ]);

    const total = Number(countRes.rows[0]?.total ?? 0);

    return {
      managers: managersRes.rows,
      pagination: createPaginationMeta({ page, limit, total }),
    };
  } catch (error: any) {
    console.error("Error fetching report managers:", error?.message ?? error);
    return req.error(500, "Failed to fetch report managers");
  }
};
