import { pool } from "../../lib/db";
import { buildScopingSql, buildFiltersQuery, FilterRow } from "./queryHelper";

export const previewSegmentHandler = async (req: any) => {
  const { segment_id, type, filters = [], static_lead_ids = [] } = req.data;

  try {
    const params: any[] = [];
    
    // Resolve owner's perspective scoping details
    let targetUser = req.user;
    if (segment_id) {
      const segRes = await pool.query(
        `SELECT s.createdby, r.name as role_name
         FROM crm_segment s
         JOIN crm_user u ON u.id = s.createdby
         JOIN crm_organizationroles orr ON orr.id = u.role_id
         JOIN crm_roles r ON r.id = orr.role_id
         WHERE s.id = $1`,
        [segment_id]
      );
      if (segRes.rows.length > 0) {
        const creator = segRes.rows[0];
        targetUser = {
          id: creator.createdby,
          orgId: req.user.orgId,
          role: creator.role_name?.toLowerCase(),
          roles: [creator.role_name?.toLowerCase()]
        };
      }
    }

    const scopingSql = buildScopingSql(targetUser, params);
    let conditionSql = "1=1";

    if (type === "Static") {
      if (!static_lead_ids || static_lead_ids.length === 0) {
        return {
          total_count: 0,
          male_count: 0,
          female_count: 0,
          avg_age: 0.0,
          leads: []
        };
      }
      params.push(static_lead_ids);
      conditionSql = `l.id = ANY($${params.length})`;
    } else {
      // Dynamic Segment: resolve filter type IDs to names
      const filterTypeIds = filters.map((f: any) => f.filter_type_id).filter(Boolean);
      let resolvedFilters: FilterRow[] = [];
      
      if (filterTypeIds.length > 0) {
        const ftRes = await pool.query(
          `SELECT id, name FROM crm_segmentfiltertypes WHERE id = ANY($1)`,
          [filterTypeIds]
        );
        const nameMap = new Map<string, string>();
        for (const row of ftRes.rows) {
          nameMap.set(row.id, row.name);
        }
        resolvedFilters = filters.map((f: any) => ({
          ...f,
          name: nameMap.get(f.filter_type_id) || ""
        }));
      }
      conditionSql = buildFiltersQuery(resolvedFilters, params);
    }

    // 1. Fetch matching stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(CASE WHEN l.gender = 'Male' THEN 1 ELSE 0 END), 0) as male_count,
        COALESCE(SUM(CASE WHEN l.gender = 'Female' THEN 1 ELSE 0 END), 0) as female_count,
        COALESCE(ROUND(AVG(date_part('year', age(current_date, l.dob)))::numeric, 2), 0.0) as avg_age
      FROM crm_leads l
      LEFT JOIN crm_user ae ON ae.id = l.assigned_to_id
      LEFT JOIN crm_state s ON s.id = l.state_id
      LEFT JOIN crm_country c ON c.id = l.country_id
      WHERE ${scopingSql} AND (${conditionSql})
    `;

    const statsRes = await pool.query(statsQuery, params);
    const stats = statsRes.rows[0];

    // 2. Fetch first 20 leads
    const leadsQuery = `
      SELECT 
        l.id, 
        l.name, 
        l.gender, 
        l.dob, 
        l.status, 
        l.address as city,
        ae.name as assigned_to_name
      FROM crm_leads l
      LEFT JOIN crm_user ae ON ae.id = l.assigned_to_id
      LEFT JOIN crm_state s ON s.id = l.state_id
      LEFT JOIN crm_country c ON c.id = l.country_id
      WHERE ${scopingSql} AND (${conditionSql})
      ORDER BY l.name ASC
      LIMIT 20
    `;

    const leadsRes = await pool.query(leadsQuery, params);
    const leads = leadsRes.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      gender: row.gender,
      dob: row.dob,
      status: row.status,
      city: row.city,
      assignedToName: row.assigned_to_name || "Unassigned"
    }));

    return {
      total_count: parseInt(stats.total_count) || 0,
      male_count: parseInt(stats.male_count) || 0,
      female_count: parseInt(stats.female_count) || 0,
      avg_age: parseFloat(stats.avg_age) || 0.0,
      leads
    };
  } catch (err: any) {
    console.error("[previewSegmentHandler] Error:", err);
    return req.error(500, "Internal Server Error during segment preview calculation");
  }
};
