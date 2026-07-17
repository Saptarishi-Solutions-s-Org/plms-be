"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReportExecutivesForManagerHandler = void 0;
const db_1 = require("../../lib/db");
const pagination_1 = require("../../lib/pagination");
const normalizeFilter = (value) => typeof value === "string" ? value.trim() : "";
const getReportExecutivesForManagerHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        const rawRequest = req?._?.req ?? req?.req;
        const url = rawRequest?.originalUrl ?? rawRequest?.url ?? "";
        const queryIndex = url.indexOf("?");
        const urlParams = queryIndex >= 0
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
        const managerRes = await db_1.pool.query(`
        SELECT manager.id
        FROM crm_user manager
        JOIN crm_organizationroles org_role ON org_role.id = manager.role_id
        JOIN crm_roles role ON role.id = org_role.role_id
        WHERE manager.id = $1
          AND manager.organization_id = $2
          AND LOWER(role.name) = 'manager'
        LIMIT 1
      `, [managerId, orgId]);
        if (!managerRes.rows.length) {
            return req.error(404, "Manager not found");
        }
        const { page, limit, offset } = (0, pagination_1.parsePaginationParams)(paramsSource);
        const rawSearch = normalizeFilter(paramsSource.search);
        const search = rawSearch ? `%${rawSearch.toLowerCase()}%` : null;
        const whereClauses = [
            "executive.reporting_manager_id = $1",
            "executive.organization_id = $2",
            "executive.is_active = true",
            "LOWER(role.name) = 'executive'",
        ];
        const params = [managerId, orgId];
        if (search) {
            params.push(search);
            whereClauses.push(`(LOWER(executive.name) LIKE $${params.length} OR LOWER(executive.email) LIKE $${params.length} OR LOWER(executive.phone) LIKE $${params.length})`);
        }
        const whereClause = whereClauses.join(" AND ");
        const [executivesRes, countRes] = await Promise.all([
            db_1.pool.query(`
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
        `, [...params, limit, offset]),
            db_1.pool.query(`
          SELECT COUNT(*) AS total
          FROM crm_user executive
          JOIN crm_organizationroles org_role ON org_role.id = executive.role_id
          JOIN crm_roles role ON role.id = org_role.role_id
          WHERE ${whereClause}
        `, params),
        ]);
        const total = Number(countRes.rows[0]?.total ?? 0);
        return {
            executives: executivesRes.rows,
            pagination: (0, pagination_1.createPaginationMeta)({ page, limit, total }),
        };
    }
    catch (error) {
        console.error("Error fetching report executives for manager:", error?.message ?? error);
        return req.error(500, "Failed to fetch report executives for manager");
    }
};
exports.getReportExecutivesForManagerHandler = getReportExecutivesForManagerHandler;
