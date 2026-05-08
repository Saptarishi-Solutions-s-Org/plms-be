import { pool } from "../../lib/db";

export const getsummarycards = async (req: any) => {
  try {
    const orgId = req.user?.orgId; 

    if (!orgId) {
      return req.error(400, "orgId is required");
    }

    
    console.log("getOfferSummary called with orgId:", orgId);

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
    console.log("Query result:", rows[0]); 

    const row = rows[0];

    return {
      totalCount:    parseInt(row.totalCount,    10),
      activeCount:   parseInt(row.activeCount,   10),
      inactiveCount: 0, 
      expiredCount:  parseInt(row.expiredCount,  10),
      globalCount:   parseInt(row.globalCount,   10),
    };

  } catch (err: any) {
    
    console.error(" GET OFFER SUMMARY ERROR:", err.message);
    console.error("Stack:", err.stack);
    return req.error(500, "Failed to fetch offer summary");
  }
};