import { pool } from "../../lib/db";

export const getReportOffersHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;

    if (!orgId) {
      return req.error(400, "Organization ID missing");
    }

    const activeOffersRes = await pool.query(
      `SELECT COUNT(*) AS count
       FROM crm_offer
       WHERE (organization_id = $1 OR is_global = true)
         AND LOWER(status) = 'active'`,
      [orgId]
    );

    const activeOffers = Number(activeOffersRes.rows[0]?.count) || 0;

    return {
      stats: {
        activeOffers,
      },
    };
  } catch (error: any) {
    console.error("Error fetching report offers:", error?.message ?? error);
    return req.error(500, "Failed to fetch report offers");
  }
};
