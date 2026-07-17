"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReportManagerPerformanceHandler = void 0;
const db_1 = require("../../lib/db");
const pagination_1 = require("../../lib/pagination");
const normalizeFilter = (value) => typeof value === "string" ? value.trim() : "";
const getReportManagerPerformanceHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId) {
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
        const status = normalizeFilter(paramsSource.status).toLowerCase();
        const startDate = normalizeFilter(paramsSource.startDate) || null;
        const endDate = normalizeFilter(paramsSource.endDate) || null;
        const search = rawSearch ? `%${rawSearch.toLowerCase()}%` : null;
        const managerWhere = [
            "manager.organization_id = $1",
            "LOWER(role.name) LIKE '%manager%'",
        ];
        const filterParams = [orgId];
        if (status === "active") {
            managerWhere.push("manager.is_active = true");
        }
        else if (status === "inactive") {
            managerWhere.push("manager.is_active = false");
        }
        if (search) {
            filterParams.push(search);
            managerWhere.push(`(LOWER(manager.name) LIKE $${filterParams.length} OR LOWER(manager.email) LIKE $${filterParams.length} OR LOWER(manager.phone) LIKE $${filterParams.length})`);
        }
        const params = [...filterParams, startDate, endDate];
        const startDateParam = filterParams.length + 1;
        const endDateParam = filterParams.length + 2;
        const whereClause = managerWhere.join(" AND ");
        const performanceQuery = `
      SELECT
        manager.id,
        manager.name,
        manager.name AS "managerName",
        manager.email,
        manager.phone,
        CASE WHEN manager.is_active THEN 'Active' ELSE 'Inactive' END AS status,
        COUNT(DISTINCT lead.id)::int AS "assignedLeads",
        COUNT(DISTINCT lead.id)::int AS total,
        COUNT(DISTINCT lead.id) FILTER (
          WHERE LOWER(lead.status) = 'qualified'
        )::int AS "convertedLeads",
        COUNT(DISTINCT lead.id) FILTER (
          WHERE LOWER(lead.status) = 'qualified'
        )::int AS qualified,
        CASE
          WHEN COUNT(DISTINCT lead.id) > 0 THEN
            ROUND(
              COUNT(DISTINCT lead.id) FILTER (
                WHERE LOWER(lead.status) = 'qualified'
              )::numeric * 100 / COUNT(DISTINCT lead.id),
              1
            )::float
          ELSE 0
        END AS "conversionRate",
        COUNT(DISTINCT assignment."offer_ID")::int AS "assignedOffers"
      FROM crm_user manager
      JOIN crm_organizationroles org_role ON org_role.id = manager.role_id
      JOIN crm_roles role ON role.id = org_role.role_id
      LEFT JOIN crm_leads lead
        ON lead.organization_id = $1
        AND (
          lead.assigned_to_id = manager.id
          OR EXISTS (
            SELECT 1
            FROM crm_user executive
            WHERE executive.id = lead.assigned_to_id
              AND executive.organization_id = manager.organization_id
              AND executive.reporting_manager_id = manager.id
          )
        )
        AND ($${startDateParam}::date IS NULL OR lead.createdat::date >= $${startDateParam}::date)
        AND ($${endDateParam}::date IS NULL OR lead.createdat::date <= $${endDateParam}::date)
      LEFT JOIN crm_managerofferassignment assignment
        ON assignment."user_ID" = manager.id
      WHERE ${whereClause}
      GROUP BY manager.id, manager.name, manager.email, manager.phone, manager.is_active
      ORDER BY manager.name ASC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;
        const countQuery = `
      SELECT COUNT(*) AS total
      FROM crm_user manager
      JOIN crm_organizationroles org_role ON org_role.id = manager.role_id
      JOIN crm_roles role ON role.id = org_role.role_id
      WHERE ${whereClause}
    `;
        const [performanceRes, countRes] = await Promise.all([
            db_1.pool.query(performanceQuery, [...params, limit, offset]),
            db_1.pool.query(countQuery, filterParams),
        ]);
        const total = Number(countRes.rows[0]?.total ?? 0);
        return {
            managers: performanceRes.rows,
            pagination: (0, pagination_1.createPaginationMeta)({ page, limit, total }),
        };
    }
    catch (error) {
        console.error("Error fetching report manager performance:", error?.message ?? error);
        return req.error(500, "Failed to fetch report manager performance");
    }
};
exports.getReportManagerPerformanceHandler = getReportManagerPerformanceHandler;
