import { pool } from "../../lib/db";

export const getTotalLeads = async (orgId: string) => {
  const res = await pool.query(
    `SELECT COUNT(*) AS count
     FROM crm_leads
     WHERE organization_id = $1`,
    [orgId]
  );

  return Number(res.rows[0]?.count) || 0;
};

export const managerDashboardHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;

    if (!orgId) {
      return req.error(400, "Organization ID missing");
    }

    const totalLeads = await getTotalLeads(orgId);

    // Converted Leads
    const convertedLeadsRes = await pool.query(
      `SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       AND status = 'Qualified'`,
      [orgId]
    );

    // This Week Leads
    const thisWeekLeadsRes = await pool.query(
      `SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       AND createdat >= NOW() - INTERVAL '7 days'`,
      [orgId]
    );

    // Active Offers
    const activeOffersRes = await pool.query(
      `SELECT COUNT(*) AS count
       FROM crm_offer
       WHERE organization_id = $1
       AND valid_from <= CURRENT_DATE
       AND valid_to >= CURRENT_DATE`,
      [orgId]
    );

    return {
      totalLeads,
      convertedLeads:
        Number(convertedLeadsRes.rows[0]?.count) || 0,

      thisWeekLeads:
        Number(thisWeekLeadsRes.rows[0]?.count) || 0,

      activeOffers:
        Number(activeOffersRes.rows[0]?.count) || 0,
    };

  } catch (error) {
    return req.error(500, "Failed to fetch dashboard");
  }
};