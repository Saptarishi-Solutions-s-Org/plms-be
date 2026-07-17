"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSegmentsHandler = void 0;
const db_1 = require("../../lib/db");
const queryHelper_1 = require("./queryHelper");
const getSegmentsHandler = async (req) => {
    const { page = 1, limit = 10, search = "", type = "", is_active } = req.data;
    const orgId = req.user.orgId;
    const userId = req.user.id;
    const userRole = req.user.role?.toLowerCase() || req.user.roles?.[0]?.toLowerCase() || "";
    try {
        const params = [orgId];
        let queryFilters = "s.organization_id = $1";
        // 1. Role Visibility Scoping
        if (userRole === "executive") {
            params.push(userId);
            queryFilters += ` AND s.createdby = $${params.length}`;
        }
        else if (userRole === "manager") {
            params.push(userId);
            queryFilters += ` AND (s.createdby = $${params.length} OR s.createdby IN (SELECT id FROM crm_user WHERE reporting_manager_id = $${params.length}))`;
        }
        // 2. Search Keyword
        if (search && search.trim() !== "") {
            params.push(`%${search.trim()}%`);
            queryFilters += ` AND (s.name ILIKE $${params.length} OR s.description ILIKE $${params.length})`;
        }
        // 3. Segment Type Filter
        if (type && type.trim() !== "") {
            const types = type.split(",").map((t) => t.trim());
            params.push(types);
            queryFilters += ` AND s.type = ANY($${params.length})`;
        }
        // 4. Active Status Filter
        if (is_active !== undefined && is_active !== null && String(is_active).trim() !== "") {
            const statuses = String(is_active).split(",").map((s) => s.trim().toLowerCase());
            const wantsActive = statuses.includes("active") || statuses.includes("true");
            const wantsInactive = statuses.includes("inactive") || statuses.includes("false");
            if (wantsActive && !wantsInactive) {
                queryFilters += ` AND s.is_active = true`;
            }
            else if (!wantsActive && wantsInactive) {
                queryFilters += ` AND s.is_active = false`;
            }
        }
        // 5. Query total count for pagination
        const countQuery = `
      SELECT COUNT(*) as total 
      FROM crm_segment s
      WHERE ${queryFilters}
    `;
        const countRes = await db_1.pool.query(countQuery, params);
        const total = parseInt(countRes.rows[0].total) || 0;
        // 6. Query paginated segments list
        const offset = (page - 1) * limit;
        params.push(limit, offset);
        const listQuery = `
      SELECT s.id, s.code, s.name, s.description, s.type, s.is_active, s.color, s.notes, s.modifiedat, s.createdby, 
             u.name as createdbyname, r.name as createdbyrole
      FROM crm_segment s
      JOIN crm_user u ON u.id = s.createdby
      LEFT JOIN crm_organizationroles orr ON orr.id = u.role_id
      LEFT JOIN crm_roles r ON r.id = orr.role_id
      WHERE ${queryFilters}
      ORDER BY s.modifiedat DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
        const listRes = await db_1.pool.query(listQuery, params);
        const segments = [];
        // 7. Process each segment (retrieve dynamically scoped lead counts & assigned offer titles)
        for (const segment of listRes.rows) {
            let leadCount = 0;
            const countParams = [];
            const segmentOwnerUser = {
                id: segment.createdby,
                orgId: orgId,
                role: segment.createdbyrole?.toLowerCase(),
                roles: [segment.createdbyrole?.toLowerCase()]
            };
            const scopingSql = (0, queryHelper_1.buildScopingSql)(segmentOwnerUser, countParams);
            if (segment.type === "Static") {
                // Calculate static leads count (scoped to user's lead access)
                const staticCountQuery = `
          SELECT COUNT(*) as count 
          FROM crm_segmentleads sl
          JOIN crm_leads l ON l.id = sl.lead_id
          WHERE sl.segment_id = $${countParams.length + 1} AND ${scopingSql}
        `;
                countParams.unshift(segment.id); // Put segmentId at index 0 ($1)
                const staticCountRes = await db_1.pool.query(staticCountQuery, countParams);
                leadCount = parseInt(staticCountRes.rows[0].count) || 0;
            }
            else {
                // Calculate dynamic leads count by resolving and executing filters SQL
                const filtersRes = await db_1.pool.query(`SELECT sf.filter_type_id, sf.operator, sf.value, sf.group_id, sf.logical_op, ft.name
           FROM crm_segmentfilters sf
           JOIN crm_segmentfiltertypes ft ON ft.id = sf.filter_type_id
           WHERE sf.segment_id = $1`, [segment.id]);
                const resolvedFilters = filtersRes.rows.map((row) => ({
                    filter_type_id: row.filter_type_id,
                    name: row.name,
                    operator: row.operator,
                    value: row.value,
                    group_id: row.group_id,
                    logical_op: row.logical_op
                }));
                const conditionSql = (0, queryHelper_1.buildFiltersQuery)(resolvedFilters, countParams);
                const dynamicCountQuery = `
          SELECT COUNT(*) as count
          FROM crm_leads l
          LEFT JOIN crm_user ae ON ae.id = l.assigned_to_id
          LEFT JOIN crm_state s ON s.id = l.state_id
          LEFT JOIN crm_country c ON c.id = l.country_id
          WHERE ${scopingSql} AND (${conditionSql})
        `;
                const dynamicCountRes = await db_1.pool.query(dynamicCountQuery, countParams);
                leadCount = parseInt(dynamicCountRes.rows[0].count) || 0;
            }
            // Fetch offers assigned to this segment
            const offersRes = await db_1.pool.query(`SELECT o.title 
         FROM crm_segmentoffers so
         JOIN crm_offer o ON o.id = so.offer_id
         WHERE so.segment_id = $1`, [segment.id]);
            const offerTitles = offersRes.rows.map((o) => o.title).join(", ");
            segments.push({
                id: segment.id,
                code: segment.code,
                name: segment.name,
                description: segment.description || "",
                type: segment.type,
                is_active: segment.is_active,
                color: segment.color || "#8b5cf6",
                notes: segment.notes || "",
                lead_count: leadCount,
                offer_titles: offerTitles || "None",
                modifiedAt: segment.modifiedat,
                createdBy: segment.createdby,
                createdByName: segment.createdbyname || "System"
            });
        }
        const totalPages = Math.ceil(total / limit);
        return {
            segments,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        };
    }
    catch (err) {
        console.error("[getSegmentsHandler] Error:", err);
        return req.error(500, "Internal Server Error while listing segments");
    }
};
exports.getSegmentsHandler = getSegmentsHandler;
