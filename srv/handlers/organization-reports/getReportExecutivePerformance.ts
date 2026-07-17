import { pool } from "../../lib/db";
import { createPaginationMeta, parsePaginationParams } from "../../lib/pagination";
import {
  isValidReportDate,
  REPORT_STATUSES,
} from "./reportUtils";

const normalizeFilter = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

export const getReportExecutivePerformanceHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const managerId = req.user?.id;

    if (!orgId || !managerId) {
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
    const status = normalizeFilter(paramsSource.status).toLowerCase();
    const startDate = normalizeFilter(paramsSource.startDate) || null;
    const endDate = normalizeFilter(paramsSource.endDate) || null;
    const search = rawSearch ? `%${rawSearch.toLowerCase()}%` : null;

    if (!isValidReportDate(startDate) || !isValidReportDate(endDate)) {
      return req.error(400, "Dates must use a valid YYYY-MM-DD format");
    }
    if (startDate && endDate && startDate > endDate) {
      return req.error(400, "startDate cannot be after endDate");
    }

    const executiveWhere = [
      "u.organization_id = $1",
      "u.reporting_manager_id = $2",
      "LOWER(role.name) = 'executive'",
    ];
    const params: any[] = [orgId, managerId];

    if (status === REPORT_STATUSES.active) {
      executiveWhere.push("u.is_active = true");
    } else if (status === REPORT_STATUSES.inactive) {
      executiveWhere.push("u.is_active = false");
    }

    if (search) {
      params.push(search);
      executiveWhere.push(
        `(LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length} OR LOWER(u.phone) LIKE $${params.length})`,
      );
    }

    params.push(startDate);
    const startDateParam = params.length;
    params.push(endDate);
    const endDateParam = params.length;

    const whereClause = executiveWhere.join(" AND ");
    const performanceQuery = `
      SELECT
        u.id,
        u.name,
        u.name AS "executiveName",
        u.email,
        u.phone,
        CASE WHEN u.is_active THEN 'Active' ELSE 'Inactive' END AS status,
        COUNT(DISTINCT l.id)::int AS "assignedLeads",
        COUNT(DISTINCT l.id)::int AS total,
        COUNT(DISTINCT l.id) FILTER (
          WHERE LOWER(l.status) = '${REPORT_STATUSES.qualified}'
        )::int AS "qualifiedLeads",
        COUNT(DISTINCT l.id) FILTER (
          WHERE LOWER(l.status) = '${REPORT_STATUSES.qualified}'
        )::int AS qualified,
        CASE
          WHEN COUNT(DISTINCT l.id) > 0 THEN
            ROUND(
              COUNT(DISTINCT l.id) FILTER (
                WHERE LOWER(l.status) = '${REPORT_STATUSES.qualified}'
              )::numeric * 100 / COUNT(DISTINCT l.id),
              1
            )::float
          ELSE 0
        END AS "conversionRate",
        COUNT(DISTINCT eoa."offer_ID")::int AS "assignedOffers"
      FROM crm_user u
      JOIN crm_organizationroles org_role ON org_role.id = u.role_id
      JOIN crm_roles role ON role.id = org_role.role_id
      LEFT JOIN crm_leads l
        ON l.assigned_to_id = u.id
        AND l.organization_id = $1
        AND ($${startDateParam}::date IS NULL OR l.createdat::date >= $${startDateParam}::date)
        AND ($${endDateParam}::date IS NULL OR l.createdat::date <= $${endDateParam}::date)
      LEFT JOIN crm_executiveofferassignment eoa
        ON eoa."executive_ID" = u.id
        AND eoa."assigned_by_ID" = $2
      WHERE ${whereClause}
      GROUP BY u.id, u.name, u.email, u.phone, u.is_active
      ORDER BY u.name ASC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM crm_user u
      JOIN crm_organizationroles org_role ON org_role.id = u.role_id
      JOIN crm_roles role ON role.id = org_role.role_id
      WHERE ${whereClause}
    `;

    const [performanceRes, countRes] = await Promise.all([
      pool.query(performanceQuery, [...params, limit, offset]),
      pool.query(countQuery, params.slice(0, params.length - 2)),
    ]);
    const total = Number(countRes.rows[0]?.total ?? 0);

    return {
      executives: performanceRes.rows,
      pagination: createPaginationMeta({
        page,
        limit,
        total,
      }),
    };
  } catch (error: any) {
    console.error(
      "Error fetching report executive performance:",
      error?.message ?? error,
    );
    return req.error(500, "Failed to fetch report executive performance");
  }
};
