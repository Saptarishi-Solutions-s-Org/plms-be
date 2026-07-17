import { pool } from "../../lib/db";

export const getSegmentByCodeHandler = async (req: any) => {
  const { code } = req.data;
  const orgId = req.user.orgId;
  const userId = req.user.id;
  const userRole = req.user.role?.toLowerCase() || req.user.roles?.[0]?.toLowerCase() || "";

  try {
    // 1. Fetch Segment metadata
    const segRes = await pool.query(
      `SELECT id, code, name, description, type, is_active, color, notes, createdby 
       FROM crm_segment 
       WHERE code = $1 AND organization_id = $2`,
      [code, orgId]
    );

    if (segRes.rowCount === 0) {
      return req.error(404, "Segment not found");
    }

    const segment = segRes.rows[0];

    // 2. Visibility & Scoping Security Check
    if (userRole === "executive") {
      if (segment.createdby !== userId) {
        return req.error(403, "Forbidden: Executives can only view their own segments");
      }
    } else if (userRole === "manager") {
      if (segment.createdby !== userId) {
        // Check if segment creator reports to this manager
        const creatorRes = await pool.query(
          `SELECT reporting_manager_id FROM crm_user WHERE id = $1`,
          [segment.createdby]
        );
        if (creatorRes.rowCount === 0 || creatorRes.rows[0].reporting_manager_id !== userId) {
          return req.error(403, "Forbidden: Managers can only view segments created by themselves or reporting team members");
        }
      }
    }

    // 3. Fetch Filters (if Dynamic)
    const filtersRes = await pool.query(
      `SELECT sf.id, sf.filter_type_id, sf.operator, sf.value, sf.group_id, sf.logical_op, ft.name as filter_type_name
       FROM crm_segmentfilters sf
       JOIN crm_segmentfiltertypes ft ON ft.id = sf.filter_type_id
       WHERE sf.segment_id = $1 
       ORDER BY sf.group_id ASC, sf.id ASC`,
      [segment.id]
    );
    const filters = filtersRes.rows.map((row: any) => ({
      id: row.id,
      filter_type_id: row.filter_type_id,
      filter_type_name: row.filter_type_name,
      operator: row.operator,
      value: row.value,
      group_id: row.group_id || "",
      logical_op: row.logical_op || "AND"
    }));

    // 4. Fetch Static Leads (if Static)
    const leadsRes = await pool.query(
      `SELECT lead_id FROM crm_segmentleads WHERE segment_id = $1`,
      [segment.id]
    );
    const static_lead_ids = leadsRes.rows.map((row: any) => row.lead_id);

    // 5. Fetch Assigned Offers
    const offersRes = await pool.query(
      `SELECT o.id, o.title, o.code 
       FROM crm_segmentoffers so
       JOIN crm_offer o ON o.id = so.offer_id
       WHERE so.segment_id = $1
       ORDER BY o.title ASC`,
      [segment.id]
    );
    const assigned_offers = offersRes.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      code: row.code
    }));

    return {
      id: segment.id,
      code: segment.code,
      name: segment.name,
      description: segment.description || "",
      type: segment.type,
      is_active: segment.is_active,
      color: segment.color || "#8b5cf6",
      notes: segment.notes || "",
      filters,
      static_lead_ids,
      assigned_offers
    };

  } catch (err: any) {
    console.error("[getSegmentByCodeHandler] Error:", err);
    return req.error(500, "Internal Server Error while retrieving segment details");
  }
};
