import { pool } from "../../lib/db";

export const getsummarycards = async (req: any) => {
  try {
    const orgId = req.user?.orgId;

    if (!orgId) {
      return req.error(400, "orgId is required");
    }

    const query = `
      SELECT
        COUNT(*)                                         AS "totalCount",
        COUNT(*) FILTER (WHERE valid_to >= CURRENT_DATE) AS "activeCount",
        COUNT(*) FILTER (WHERE valid_to < CURRENT_DATE)  AS "expiredCount",
        COUNT(*) FILTER (WHERE is_global = true)         AS "globalCount"
      FROM crm_offer
      WHERE is_global = true OR organization_id = $1
    `;

    const { rows } = await pool.query(query, [orgId]);

    const row = rows[0];

    return {
      totalCount: parseInt(row.totalCount),
      activeCount: parseInt(row.activeCount),
      inactiveCount:parseInt(row.inactive),
      globalCount: parseInt(row.globalCount),
    };

  } catch (err: any) {
    return req.error(500, "Failed to fetch offer summary");
  }
};