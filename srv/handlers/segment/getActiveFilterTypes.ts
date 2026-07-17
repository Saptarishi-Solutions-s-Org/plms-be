import { pool } from "../../lib/db";

export const getActiveFilterTypesHandler = async (req: any) => {
  const orgId = req.user.orgId;

  try {
    const query = `
      SELECT ft.id, ft.name, ft.label, ft.category, ft.operator_type
      FROM crm_organizationsegmentfiltertypes oft
      JOIN crm_segmentfiltertypes ft ON ft.id = oft.filter_type_id
      WHERE oft.organization_id = $1 AND oft."default" = true
      ORDER BY ft.category ASC, ft.label ASC;
    `;

    const { rows } = await pool.query(query, [orgId]);
    return rows;
  } catch (err: any) {
    console.error("[getActiveFilterTypesHandler] Error:", err);
    return req.error(500, "Internal Server Error while fetching active filter types");
  }
};
