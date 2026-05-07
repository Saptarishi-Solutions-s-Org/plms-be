import { pool } from "../../lib/db";

export const executiveRecentLeadsHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const userId = req.user?.id;

    if (!orgId || !userId) {
      return req.error(400, "User or Organization ID missing");
    }

    const res = await pool.query(
      `SELECT 
          l.id,
          l.name,
          l.status,
          u.name AS assigned_to
       FROM crm_leads l
       LEFT JOIN crm_user u
         ON l.assigned_to_id = u.id
       WHERE l.organization_id = $1
       ORDER BY l.createdat DESC`,
      [orgId]
    );

    return res.rows.map((lead) => ({
      leadId: lead.id,
      leadName: lead.name,
      createdat: lead.createdat,
      status: lead.status,
    }));

  } catch (error) {
    return req.error(500, "Failed to fetch executive recent leads");
  }
};