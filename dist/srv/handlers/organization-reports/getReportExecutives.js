"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReportExecutivesHandler = void 0;
const db_1 = require("../../lib/db");
const pagination_1 = require("../../lib/pagination");
const normalizeFilter = (value) => {
    if (typeof value !== "string")
        return "";
    return value.trim();
};
const getReportExecutivesHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        const managerId = req.user?.id;
        if (!orgId || !managerId) {
            return req.error(401, "Unauthorized");
        }
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
        const { page, limit, offset } = (0, pagination_1.parsePaginationParams)(paramsSource);
        const rawSearch = normalizeFilter(paramsSource.search);
        const search = rawSearch ? `%${rawSearch.toLowerCase()}%` : null;
        const whereClauses = [
            "u.organization_id = $1",
            "u.reporting_manager_id = $2",
            "u.is_active = true",
            "LOWER(r.name) LIKE '%executive%'",
        ];
        const params = [orgId, managerId];
        if (search) {
            params.push(search);
            whereClauses.push(`(LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length} OR LOWER(u.phone) LIKE $${params.length})`);
        }
        const whereClause = whereClauses.join(" AND ");
        const [executivesRes, countRes] = await Promise.all([
            db_1.pool.query(`
          SELECT
            u.id,
            u.name,
            u.email,
            u.phone
          FROM crm_user u
          JOIN crm_organizationroles org_role ON org_role.id = u.role_id
          JOIN crm_roles r ON r.id = org_role.role_id
          WHERE ${whereClause}
          ORDER BY u.name ASC
          LIMIT $${params.length + 1}
          OFFSET $${params.length + 2}
        `, [...params, limit, offset]),
            db_1.pool.query(`
          SELECT COUNT(*) AS total
          FROM crm_user u
          JOIN crm_organizationroles org_role ON org_role.id = u.role_id
          JOIN crm_roles r ON r.id = org_role.role_id
          WHERE ${whereClause}
        `, params),
        ]);
        const total = Number(countRes.rows[0]?.total ?? 0);
        return {
            executives: executivesRes.rows,
            pagination: (0, pagination_1.createPaginationMeta)({
                page,
                limit,
                total,
            }),
        };
    }
    catch (error) {
        console.error("Error fetching report executives:", error?.message ?? error);
        return req.error(500, "Failed to fetch report executives");
    }
};
exports.getReportExecutivesHandler = getReportExecutivesHandler;
