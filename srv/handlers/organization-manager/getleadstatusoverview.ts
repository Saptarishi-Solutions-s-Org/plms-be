import { pool } from "../../lib/db";

type LeadStatus = "New" | "Contacted" | "Qualified" | "Lost";

export const leadStatusOverviewHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    console.log("Fetching lead status overview for org ID:", orgId);

    if (!orgId) {
      return req.error(400, "Organization ID missing");
    }

    const res = await pool.query(
      `SELECT status, COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       GROUP BY status`,
      [orgId]
    );

    const overview: Record<LeadStatus, number> = {
      New: 0,
      Contacted: 0,
      Qualified: 0,
      Lost: 0,
    };

    res.rows.forEach((row) => {
      if (row.status in overview) {
        overview[row.status as LeadStatus] = Number(row.count);
      }
    });

    return overview;

  } catch (error) {
    console.error("Lead Status Overview Error:", error);
    return req.error(500, "Failed to fetch lead status overview");
  }
};