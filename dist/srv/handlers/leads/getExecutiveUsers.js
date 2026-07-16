"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExecutiveUsersHandler = void 0;
const db_1 = require("../../lib/db");
const pagination_1 = require("../../lib/pagination");
const normalizeFilter = (value) => {
    if (typeof value !== "string")
        return "";
    return value.trim();
};
const getExecutiveUsersHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        const currentManagerId = req.user?.id;
        const paramsSource = { ...(req.data ?? {}), ...(req.query ?? {}) };
        const { page, limit, offset } = (0, pagination_1.parsePaginationParams)(paramsSource);
        const rawManagerId = normalizeFilter(paramsSource.managerId);
        const rawSearch = normalizeFilter(paramsSource.search);
        const rawStatus = normalizeFilter(paramsSource.status);
        const managerId = rawManagerId || currentManagerId;
        const search = rawSearch ? `%${rawSearch.toLowerCase()}%` : null;
        const statusFilter = rawStatus ? rawStatus.toLowerCase() : "";
        if (!orgId || !managerId) {
            return req.error(401, "Unauthorized");
        }
        const whereClauses = [
            "u.organization_id = $1",
            "LOWER(r.name) LIKE '%executive%'",
            "u.reporting_manager_id = $2",
        ];
        const params = [orgId, managerId];
        if (statusFilter) {
            const statuses = statusFilter.split(",").map((s) => s.trim().toLowerCase());
            const wantsActive = statuses.includes("active");
            const wantsInactive = statuses.includes("inactive");
            if (wantsActive && !wantsInactive) {
                whereClauses.push("u.is_active = true");
            }
            else if (!wantsActive && wantsInactive) {
                whereClauses.push("u.is_active = false");
            }
        }
        else {
            whereClauses.push("u.is_active = true");
        }
        if (search) {
            params.push(search);
            whereClauses.push(`(LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length} OR LOWER(u.phone) LIKE $${params.length})`);
        }
        const usersQuery = `
      SELECT
        u.id,
        u.name
      FROM crm_user u
      JOIN crm_organizationroles orr ON orr.id = u.role_id
      JOIN crm_roles             r   ON r.id = orr.role_id
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY u.name ASC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;
        const usersRes = await db_1.pool.query(usersQuery, [...params, limit, offset]);
        const countQuery = `
      SELECT COUNT(*) AS total
      FROM crm_user u
      JOIN crm_organizationroles orr ON orr.id = u.role_id
      JOIN crm_roles             r   ON r.id = orr.role_id
      WHERE ${whereClauses.join(" AND ")}
    `;
        const countRes = await db_1.pool.query(countQuery, params);
        const total = Number(countRes.rows[0]?.total ?? 0);
        return {
            users: usersRes.rows,
            pagination: (0, pagination_1.createPaginationMeta)({
                page,
                limit,
                total,
            }),
        };
    }
    catch (error) {
        console.error("Error fetching executive users:", error?.message ?? error);
        return req.error(500, "Failed to fetch executive users");
    }
};
exports.getExecutiveUsersHandler = getExecutiveUsersHandler;
