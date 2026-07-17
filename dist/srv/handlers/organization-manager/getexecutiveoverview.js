"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExecutiveOverviewHandler = void 0;
const db_1 = require("../../lib/db");
const pagination_1 = require("../../lib/pagination");
const normalizeFilter = (value) => {
    if (typeof value !== "string")
        return "";
    return value.trim();
};
const getExecutiveOverviewHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        const currentManagerId = req.user?.id;
        const isManager = req.user?.roles?.includes("manager");
        const paramsSource = { ...(req.data ?? {}), ...(req.query ?? {}) };
        const { page, limit, offset } = (0, pagination_1.parsePaginationParams)(paramsSource);
        const rawManagerId = normalizeFilter(paramsSource.managerId);
        const rawSearch = normalizeFilter(paramsSource.search);
        const rawStatus = normalizeFilter(paramsSource.status);
        const managerId = rawManagerId || currentManagerId;
        const search = rawSearch ? `%${rawSearch.toLowerCase()}%` : null;
        const statusFilter = rawStatus ? rawStatus.toLowerCase() : "";
        if (!orgId) {
            return req.error(400, "Organization ID missing");
        }
        if (!managerId) {
            return req.error(400, "Manager ID missing");
        }
        const statusClauses = ["u.organization_id = $1", "u.reporting_manager_id = $2", "LOWER(r.name) LIKE '%executive%'"];
        const params = [orgId, managerId];
        if (search) {
            params.push(search);
            statusClauses.push(`(LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length} OR LOWER(u.phone) LIKE $${params.length})`);
        }
        if (statusFilter) {
            const statuses = statusFilter.split(",").map((s) => s.trim().toLowerCase());
            const wantsActive = statuses.includes("active");
            const wantsInactive = statuses.includes("inactive");
            if (wantsActive && !wantsInactive) {
                statusClauses.push("u.is_active = true");
            }
            else if (!wantsActive && wantsInactive) {
                statusClauses.push("u.is_active = false");
            }
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
        WHERE ${statusClauses.join(" AND ")}
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
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;
        const executivesResult = await db_1.pool.query(executivesQuery, [
            ...params,
            limit,
            offset,
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
        WHERE ${statusClauses.join(" AND ")}
      )
      SELECT
        COUNT(*) AS total_count,
        COUNT(*) FILTER (WHERE is_active = true) AS active_count,
        COUNT(*) FILTER (WHERE is_active = false) AS inactive_count
      FROM executive_base
    `;
        const statsResult = await db_1.pool.query(statsQuery, params);
        const stats = statsResult.rows[0] || {};
        const totalExecutives = Number(stats.total_count) || 0;
        return {
            stats: {
                totalExecutives,
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
            pagination: (0, pagination_1.createPaginationMeta)({
                page,
                limit,
                total: totalExecutives,
            }),
        };
    }
    catch (error) {
        return req.error(500, error?.message || "Failed to fetch executive overview");
    }
};
exports.getExecutiveOverviewHandler = getExecutiveOverviewHandler;
