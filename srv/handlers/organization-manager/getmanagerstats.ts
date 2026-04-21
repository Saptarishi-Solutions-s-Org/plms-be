import { pool } from "../../lib/db";

export const managerDashboardHandler = async (req: any) => {
  try {
    const orgId =
      req.user?.orgId || "08c3652d-3c38-4471-ada4-acda20005a7a";

    console.log("Fetching dashboard for org ID:", orgId);

    // 1. Total Leads
    const totalLeadsRes = await pool.query(
      `SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1`,
      [orgId]
    );

    // 2. Converted Leads
    const convertedLeadsRes = await pool.query(
      `SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       AND status = 'Qualified'`,
      [orgId]
    );

    // 3. This Week Leads
    const thisWeekLeadsRes = await pool.query(
      `SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       AND createdat >= NOW() - INTERVAL '7 days'`,
      [orgId]
    );

    // 4. Active Offers
    const activeOffersRes = await pool.query(
      `SELECT COUNT(*) AS count
       FROM crm_offer
       WHERE organization_id = $1
       AND valid_from <= CURRENT_DATE
       AND valid_to >= CURRENT_DATE`,
      [orgId]
    );

    return {
      totalLeads: Number(totalLeadsRes.rows[0]?.count) || 0,
      convertedLeads: Number(convertedLeadsRes.rows[0]?.count) || 0,
      thisWeekLeads: Number(thisWeekLeadsRes.rows[0]?.count) || 0,
      activeOffers: Number(activeOffersRes.rows[0]?.count) || 0,
    };

  } catch (error) {
    console.error("Dashboard error:", error);
    return req.error(500, "Failed to fetch dashboard");
  }
};