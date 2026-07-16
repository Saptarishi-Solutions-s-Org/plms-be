import { pool } from "../../lib/db";
import { createPaginationMeta, parsePaginationParams } from "../../lib/pagination";

const normalizeFilter = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

export const getLeadsWithStatsHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const userId = req.user?.id;
    const isAdmin = (req.user?.roles ?? []).some(
      (role: string) => role.toLowerCase() === "admin",
    );
    const { page, limit, offset } = parsePaginationParams(req.data);
    const { search, status, priority, leadSource, assignedTo } = req.data ?? {};

    if (!orgId || !userId) {
      return req.error(400, "User or Organization ID missing");
    }

    const searchTerm = normalizeFilter(search);
    const statusFilter = normalizeFilter(status);
    const priorityFilter = normalizeFilter(priority);
    const leadSourceFilter = normalizeFilter(leadSource);
    const assignedToFilter = normalizeFilter(assignedTo);

    const queryValues = [
      orgId,
      userId,
      isAdmin,
      searchTerm ? `%${searchTerm.toLowerCase()}%` : null,
      statusFilter || null,
      priorityFilter || null,
      leadSourceFilter || null,
      assignedToFilter || null,
    ];

    const visibilitySql = `(
           $3::boolean = TRUE
           OR
           l.assigned_to_id = $2
           OR u.reporting_manager_id = $2
           OR (l.assigned_to_id IS NULL AND l.createdby = $2)
         )`;

    const filtersSql = `
       WHERE l.organization_id = $1
         AND ${visibilitySql}
         AND (
           $4::text IS NULL
           OR LOWER(l.code) LIKE $4
           OR LOWER(l.name) LIKE $4
           OR LOWER(l.email) LIKE $4
           OR LOWER(l.phone) LIKE $4
           OR LOWER(l.source) LIKE $4
           OR LOWER(COALESCE(u.name, '')) LIKE $4
         )
         AND (
           $5::text IS NULL
           OR LOWER(l.status) = ANY(regexp_split_to_array(LOWER(REPLACE($5, ' ', '')), ','))
         )
         AND (
           $6::text IS NULL
           OR LOWER(l.priority) = ANY(regexp_split_to_array(LOWER(REPLACE($6, ' ', '')), ','))
         )
         AND (
           $7::text IS NULL
           OR LOWER(l.source) = ANY(regexp_split_to_array(LOWER(REPLACE($7, ' ', '')), ','))
         )
         AND (
           $8::text IS NULL
           OR l.assigned_to_id = $8
         )`;

    const leadsRes = await pool.query(
      `SELECT
         l.id                      AS "uuid",
         l.id                      AS "id",
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
         l.createdat               AS "createdAt",
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

       ${filtersSql}
       ORDER BY l.createdat DESC
       LIMIT $9 OFFSET $10`,
      [...queryValues, limit, offset],
    );

    const statsRes = await pool.query(
      `SELECT
         COUNT(*)                                     AS total,
         COUNT(*) FILTER (WHERE status = 'New')       AS new,
         COUNT(*) FILTER (WHERE status = 'Contacted') AS contacted,
         COUNT(*) FILTER (WHERE status = 'Qualified') AS qualified
       FROM crm_leads l
       LEFT JOIN crm_user u ON u.id = l.assigned_to_id
       ${filtersSql}`,
      queryValues,
    );

    return {
      leads: leadsRes.rows,
      stats: {
        total: Number(statsRes.rows[0].total) || 0,
        new: Number(statsRes.rows[0].new) || 0,
        contacted: Number(statsRes.rows[0].contacted) || 0,
        qualified: Number(statsRes.rows[0].qualified) || 0,
      },
      pagination: createPaginationMeta({
        page,
        limit,
        total: Number(statsRes.rows[0].total) || 0,
      }),
    };
  } catch (error: any) {
    console.error("Error fetching leads + stats:", error?.message ?? error);
    return req.error(500, "Failed to fetch leads data");
  }
};
