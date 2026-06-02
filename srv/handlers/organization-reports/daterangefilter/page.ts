import { pool } from "../../../lib/db";

export const getReportDateRangeHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;

    if (!orgId) {
      return req.error(400, "Organization ID missing");
    }

    const { from, to } = req.data ?? {};

    let dateFilter = "";
    const values: any[] = [orgId];

    if (from && to) {
      values.push(from, to);
      dateFilter = `
        AND createdat::date BETWEEN $2::date AND $3::date
      `;
    }

    const res = await pool.query(
      `
      SELECT
        COUNT(*)::int AS total_leads,
        COUNT(*) FILTER (WHERE assigned_to_id IS NOT NULL)::int AS leads_assigned,
        COUNT(*) FILTER (WHERE status = 'Qualified')::int AS converted_leads
      FROM crm_leads
      WHERE organization_id = $1
      ${dateFilter}
      `,
      values
    );

    return {
      total_leads: Number(res.rows[0].total_leads),
      leads_assigned: Number(res.rows[0].leads_assigned),
      converted_leads: Number(res.rows[0].converted_leads),
    };
  } catch (error) {
    console.error(error);
    return req.error(500, "Failed to fetch report stats");
  }
};