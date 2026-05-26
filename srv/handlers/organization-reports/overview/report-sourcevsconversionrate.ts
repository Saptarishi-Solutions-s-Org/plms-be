import { pool } from "../../../lib/db";
import { sourceleads } from "../../../types/org-reports";

export const sourceConversionRateHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;

    if (!orgId) {
      return req.error(400, "Organization ID missing");
    }

    const res = await pool.query(
      `SELECT
         ${sourceleads} AS source,
         COUNT(*) AS leads,
         COUNT(*) FILTER (WHERE status = 'Qualified') AS converted
       FROM crm_leads
       WHERE organization_id = $1
       GROUP BY ${sourceleads}
       ORDER BY leads DESC, source ASC`,
      [orgId],
    );

    return res.rows.map((row) => ({
      source: row.source,
      leads: Number(row.leads),
      converted: Number(row.converted),
    }));
  } catch (error) {
    return req.error(500, "Failed to fetch source conversion rate");
  }
};
