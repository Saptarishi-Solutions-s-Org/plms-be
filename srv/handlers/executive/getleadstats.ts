import { pool } from "../../lib/db";
import { LeadStatus } from "../../types/org-manager";

export const executiveLeadStatsHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const userId = req.user?.id;

    if (!orgId || !userId) {
      return req.error(400, "User or Organization ID missing");
    }

    const res = await pool.query(
      `SELECT status, COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       AND assigned_to_id = $2
       GROUP BY status`,
      [orgId, userId]
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
    return req.error(500, "Failed to fetch executive lead status");
  }
};