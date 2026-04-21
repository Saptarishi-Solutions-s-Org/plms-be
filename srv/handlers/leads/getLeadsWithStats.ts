import { pool } from "../../lib/db";

export const getLeadsWithStatsHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;

    if (!orgId) {
      return req.error(401, "Unauthorized");
    }

    const leadsRes = await pool.query(
      `SELECT
         l.id,
         l.code,
         l.name,
         l.gender,
         l.email,
         l.phone,
         l.status,
         l.priority,
         l.source,
         l.address,
         l.postal_code,

         s.name AS state,
         c.name AS country,

         l.assigned_to_id,   
         u.name AS assigned_to_name,

         l.createdat

       FROM crm_leads l
       LEFT JOIN crm_state s ON l.state_id = s.id
       LEFT JOIN crm_country c ON l.country_id = c.id
       LEFT JOIN crm_user u ON l.assigned_to_id = u.id

       WHERE l.organization_id = $1
       ORDER BY l.createdat DESC`,
      [orgId]
    );

    const statsRes = await pool.query(
      `SELECT
        COUNT(*) AS total,

        COUNT(*) FILTER (WHERE status = 'New') AS new,
        COUNT(*) FILTER (WHERE status = 'Contacted') AS contacted,
        COUNT(*) FILTER (WHERE status = 'Qualified') AS qualified

       FROM crm_leads
       WHERE organization_id = $1`,
      [orgId]
    );

    return {
      leads: leadsRes.rows,
      stats: {
        total: Number(statsRes.rows[0].total) || 0,
        new: Number(statsRes.rows[0].new) || 0,
        contacted: Number(statsRes.rows[0].contacted) || 0,
        qualified: Number(statsRes.rows[0].qualified) || 0,
      },
    };

  } catch (error: any) {
    console.error("Error fetching leads + stats:", error?.message ?? error);
    return req.error(500, "Failed to fetch leads data");
  }
};