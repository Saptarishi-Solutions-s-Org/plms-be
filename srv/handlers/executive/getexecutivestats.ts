import { pool } from "../../lib/db";

export const getexecutivestats = async (req: any) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.orgId;

    if (!userId) return req.error(401, "User not identified");

    // 1. My Leads
    const MyLeadsRes = await pool.query(
      `SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_ID = $1 
       AND assigned_to_ID = $2`,
      [orgId, userId]
    );

    // 2. Converted Leads
    const convertedLeadsRes = await pool.query(
      `SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_ID = $1
       AND assigned_to_ID = $2
       AND status = 'Qualified'`,
      [orgId, userId]
    );

    // 3. This Week Leads
    const thisWeekLeadsRes = await pool.query(
      `SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_ID = $1
       AND assigned_to_ID = $2
       AND createdAt >= NOW() - INTERVAL '7 days'`,
      [orgId, userId]
    );

    return {
      totalLeads: Number(MyLeadsRes.rows[0]?.count) || 0,
      convertedLeads: Number(convertedLeadsRes.rows[0]?.count) || 0,
      thisWeekLeads: Number(thisWeekLeadsRes.rows[0]?.count) || 0,
    };

  } catch (error) {
    console.error("Executive Stats Error:", error);
    return req.error(500, "Failed to fetch dashboard");
  }
};