import { pool } from "../../lib/db";
import { buildScopingSql, buildFiltersQuery, FilterRow } from "./queryHelper";

const escapeCsvValue = (val: any): string => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

export const exportSegmentHandler = async (req: any) => {
  const { code } = req.data;
  const orgId = req.user.orgId;
  const userId = req.user.id;
  const userRole = req.user.role?.toLowerCase() || req.user.roles?.[0]?.toLowerCase() || "";

  try {
    // 1. Fetch Segment metadata to verify ownership
    const segRes = await pool.query(
      `SELECT id, name, type, createdby FROM crm_segment WHERE code = $1 AND organization_id = $2`,
      [code, orgId]
    );

    if (segRes.rowCount === 0) {
      return req.error(404, "Segment not found");
    }

    const segment = segRes.rows[0];

    // 2. Visibility & Scoping Security Check
    if (userRole === "executive") {
      if (segment.createdby !== userId) {
        return req.error(403, "Forbidden: Executives can only export their own segments");
      }
    } else if (userRole === "manager") {
      if (segment.createdby !== userId) {
        // Verify if creator reports to this manager
        const reportRes = await pool.query(
          `SELECT reporting_manager_id FROM crm_user WHERE id = $1`,
          [segment.createdby]
        );
        if (reportRes.rowCount === 0 || reportRes.rows[0].reporting_manager_id !== userId) {
          return req.error(403, "Forbidden: Managers can only export segments created by themselves or reporting team members");
        }
      }
    }

    // 3. Gather Leads
    const params: any[] = [];
    const scopingSql = buildScopingSql(req.user, params);
    let conditionSql = "1=1";

    if (segment.type === "Static") {
      const leadsRes = await pool.query(
        `SELECT lead_id FROM crm_segmentleads WHERE segment_id = $1`,
        [segment.id]
      );
      const static_lead_ids = leadsRes.rows.map((row: any) => row.lead_id);
      
      if (static_lead_ids.length === 0) {
        return { csvContent: '"Lead Code","Name","Email","Phone","Gender","Date of Birth","City","Status","Priority","Source","Created At"\n' };
      }
      params.push(static_lead_ids);
      conditionSql = `l.id = ANY($${params.length})`;
    } else {
      // Dynamic Segment: resolve filters and build expression
      const filtersRes = await pool.query(
        `SELECT sf.filter_type_id, sf.operator, sf.value, sf.group_id, sf.logical_op, ft.name
         FROM crm_segmentfilters sf
         JOIN crm_segmentfiltertypes ft ON ft.id = sf.filter_type_id
         WHERE sf.segment_id = $1`,
        [segment.id]
      );
      const resolvedFilters = filtersRes.rows.map((row: any) => ({
        filter_type_id: row.filter_type_id,
        name: row.name,
        operator: row.operator,
        value: row.value,
        group_id: row.group_id,
        logical_op: row.logical_op
      }));
      conditionSql = buildFiltersQuery(resolvedFilters, params);
    }

    const leadsQuery = `
      SELECT 
        l.code, l.name, l.email, l.phone, l.gender, l.dob, l.city, l.status, l.priority, l.source, l.createdat
      FROM crm_leads l
      LEFT JOIN crm_user ae ON ae.id = l.assigned_to_id
      LEFT JOIN crm_state s ON s.id = l.state_id
      LEFT JOIN crm_country c ON c.id = l.country_id
      WHERE ${scopingSql} AND (${conditionSql})
      ORDER BY l.name ASC
    `;

    const leadsRes = await pool.query(leadsQuery, params);
    
    // 4. Generate CSV String
    const headers = [
      "Lead Code", "Name", "Email", "Phone", "Gender", 
      "Date of Birth", "City", "Status", "Priority", "Source", "Created At"
    ];
    let csvRows = [headers.map(h => `"${h}"`).join(",")];

    for (const lead of leadsRes.rows) {
      const row = [
        escapeCsvValue(lead.code),
        escapeCsvValue(lead.name),
        escapeCsvValue(lead.email),
        escapeCsvValue(lead.phone),
        escapeCsvValue(lead.gender),
        escapeCsvValue(lead.dob ? new Date(lead.dob).toISOString().split("T")[0] : ""),
        escapeCsvValue(lead.city),
        escapeCsvValue(lead.status),
        escapeCsvValue(lead.priority),
        escapeCsvValue(lead.source),
        escapeCsvValue(lead.createdat ? new Date(lead.createdat).toISOString() : "")
      ];
      csvRows.push(row.join(","));
    }

    const csvContent = csvRows.join("\n") + "\n";

    // 5. Log export event in Audit History
    await pool.query(
      `INSERT INTO crm_segmentaudithistory (id, organization_id, segment_id, action_type, user_id, timestamp, details, createdat, createdby, modifiedat, modifiedby)
       VALUES (gen_random_uuid(), $1, $2, 'Export', $3, NOW(), $4, NOW(), $3, NOW(), $3)`,
      [orgId, segment.id, userId, `Exported ${leadsRes.rows.length} leads matching Segment "${segment.name}".`]
    );

    return { csvContent };

  } catch (err: any) {
    console.error("[exportSegmentHandler] Error:", err);
    return req.error(500, "Internal Server Error during segment leads export");
  }
};
