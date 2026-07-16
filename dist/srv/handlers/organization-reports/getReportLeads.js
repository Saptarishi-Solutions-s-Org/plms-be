"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReportLeadsHandler = void 0;
const db_1 = require("../../lib/db");
const pagination_1 = require("../../lib/pagination");
const normalizeFilter = (value) => {
    if (typeof value !== "string")
        return "";
    return value.trim();
};
const getReportLeadsHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        const userId = req.user?.id;
        const isAdmin = (req.user?.roles ?? []).some((role) => role.toLowerCase() === "admin");
        if (!orgId || !userId) {
            return req.error(400, "User or Organization ID missing");
        }
        const paramsSource = { ...(req.data ?? {}), ...(req.query ?? {}) };
        const { page, limit, offset } = (0, pagination_1.parsePaginationParams)(paramsSource);
        const rawSearch = normalizeFilter(paramsSource.search);
        const rawStatus = normalizeFilter(paramsSource.status);
        const rawPriority = normalizeFilter(paramsSource.priority);
        const rawLeadSource = normalizeFilter(paramsSource.leadSource);
        const rawAssignedTo = normalizeFilter(paramsSource.assignedTo);
        const rawStartDate = normalizeFilter(paramsSource.startDate);
        const rawEndDate = normalizeFilter(paramsSource.endDate);
        const search = rawSearch ? `%${rawSearch.toLowerCase()}%` : null;
        const status = rawStatus || null;
        const priority = rawPriority || null;
        const leadSource = rawLeadSource || null;
        const assignedTo = rawAssignedTo || null;
        const startDate = rawStartDate || null;
        const endDate = rawEndDate || null;
        const whereClauses = ["l.organization_id = $1"];
        const params = [orgId];
        // Visibility rules
        if (!isAdmin) {
            whereClauses.push(`(l.assigned_to_id = $${params.length + 1} OR u.reporting_manager_id = $${params.length + 1} OR (l.assigned_to_id IS NULL AND l.createdby = $${params.length + 1}))`);
            params.push(userId);
        }
        // Search filter
        if (search) {
            params.push(search);
            whereClauses.push(`(LOWER(l.code) LIKE $${params.length} OR LOWER(l.name) LIKE $${params.length} OR LOWER(l.email) LIKE $${params.length} OR LOWER(l.phone) LIKE $${params.length})`);
        }
        // Status filter
        if (status) {
            params.push(status);
            whereClauses.push(`LOWER(l.status) LIKE LOWER($${params.length})`);
        }
        // Priority filter
        if (priority) {
            params.push(priority);
            whereClauses.push(`LOWER(l.priority) LIKE LOWER($${params.length})`);
        }
        // Lead source filter
        if (leadSource) {
            params.push(leadSource);
            whereClauses.push(`LOWER(l.source) LIKE LOWER($${params.length})`);
        }
        // Assigned to filter
        if (assignedTo) {
            params.push(assignedTo);
            whereClauses.push(`l.assigned_to_id = $${params.length}`);
        }
        // Date range filter
        if (startDate) {
            params.push(startDate);
            whereClauses.push(`DATE(l.createdat) >= $${params.length}`);
        }
        if (endDate) {
            params.push(endDate);
            whereClauses.push(`DATE(l.createdat) <= $${params.length}`);
        }
        const whereClause = whereClauses.join(" AND ");
        const leadsQuery = `
      SELECT
        l.id,
        l.code,
        l.name,
        l.email,
        l.phone,
        l.status,
        l.priority,
        l.source,
        l.address,
        l.postal_code,
        l.state_id,
        l.country_id,
        s.name AS state_name,
        c.name AS country_name,
        l.assigned_to_id,
        u.name AS assigned_to_name,
        l.createdby,
        cu.name AS created_by_name,
        l.createdat,
        l.modifiedat AS updatedat,
        COALESCE(la.notes, '') AS notes
      FROM crm_leads l
      LEFT JOIN crm_user u ON u.id = l.assigned_to_id
      LEFT JOIN crm_user cu ON cu.id = l.createdby
      LEFT JOIN crm_state s ON s.id = l.state_id
      LEFT JOIN crm_country c ON c.id = l.country_id
      LEFT JOIN LATERAL (
        SELECT notes
        FROM crm_leadactivity
        WHERE lead_id = l.id
        ORDER BY createdat DESC
        LIMIT 1
      ) la ON true
      WHERE ${whereClause}
      ORDER BY l.createdat DESC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;
        const countQuery = `
      SELECT COUNT(*) AS total
      FROM crm_leads l
      LEFT JOIN crm_user u ON u.id = l.assigned_to_id
      LEFT JOIN crm_user cu ON cu.id = l.createdby
      LEFT JOIN crm_state s ON s.id = l.state_id
      LEFT JOIN crm_country c ON c.id = l.country_id
      WHERE ${whereClause}
    `;
        const leadsRes = await db_1.pool.query(leadsQuery, [...params, limit, offset]);
        const countRes = await db_1.pool.query(countQuery, params);
        const total = Number(countRes.rows[0]?.total ?? 0);
        return {
            leads: leadsRes.rows.map((row) => ({
                id: row.id,
                code: row.code,
                name: row.name,
                email: row.email,
                phone: row.phone,
                status: row.status,
                priority: row.priority,
                leadSource: row.source,
                city: row.address,
                postalCode: row.postal_code,
                state: row.state_id,
                stateName: row.state_name,
                country: row.country_id,
                countryName: row.country_name,
                assignedTo: row.assigned_to_id,
                assignedToName: row.assigned_to_name,
                createdById: row.createdby,
                createdByName: row.created_by_name,
                createdAt: row.createdat,
                updatedAt: row.updatedat,
                notes: row.notes,
            })),
            pagination: (0, pagination_1.createPaginationMeta)({
                page,
                limit,
                total,
            }),
        };
    }
    catch (error) {
        console.error("Error fetching report leads:", error?.message ?? error);
        return req.error(500, "Failed to fetch report leads");
    }
};
exports.getReportLeadsHandler = getReportLeadsHandler;
