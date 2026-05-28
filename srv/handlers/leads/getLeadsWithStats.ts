import { pool } from "../../lib/db";

export const getLeadsWithStatsHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;

    if (!orgId) {
      return req.error(401, "Unauthorized");
    }

    const leadsRes = await pool.query(
      `SELECT
         l.id                      AS "uuid",
         l.code                    AS "leadCode",
         l.name                    AS "name",
         l.gender                  AS "gender",
         l.email                   AS "email",
         l.phone                   AS "phone",
         l.status                  AS "status",
         l.priority                AS "priority",
         l.source                  AS "leadSource",
         l.address                 AS "city",
         l.postal_code             AS "postalCode",
         l.state_id                AS "state",
         l.country_id              AS "country",
         s.name                    AS "stateName",
         c.name                    AS "countryName",
         l.assigned_to_id          AS "assignedTo",
         COALESCE(u.name, '')      AS "assignedToName",
         l.createdby               AS "createdById",
         COALESCE(cu.name, 'System') AS "createdByName",
         COALESCE(la.notes, '')    AS "notes"
       FROM crm_leads l
       LEFT JOIN crm_state   s ON s.id = l.state_id
       LEFT JOIN crm_country c ON c.id = l.country_id
       LEFT JOIN crm_user    u ON u.id = l.assigned_to_id
       LEFT JOIN crm_user    cu ON cu.id::text = l.createdby
       LEFT JOIN LATERAL (
         SELECT notes FROM crm_leadactivity
         WHERE lead_id = l.id
         ORDER BY createdat DESC LIMIT 1
       ) la ON true

       WHERE l.organization_id = $1
       ORDER BY l.createdat DESC`,
      [orgId],
    );

    const statsRes = await pool.query(
      `SELECT
         COUNT(*)                                     AS total,
         COUNT(*) FILTER (WHERE status = 'New')       AS new,
         COUNT(*) FILTER (WHERE status = 'Contacted') AS contacted,
         COUNT(*) FILTER (WHERE status = 'Qualified') AS qualified
       FROM crm_leads
       WHERE organization_id = $1`,
      [orgId],
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
