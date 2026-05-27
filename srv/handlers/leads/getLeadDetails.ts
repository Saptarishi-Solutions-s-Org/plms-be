import { pool } from "../../lib/db";

export const getLeadDetailHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const { id } = req.data;

    if (!orgId) return req.error(401, "Unauthorized");
    if (!id)    return req.error(400, "Lead ID is required");

    const leadRes = await pool.query(
      `SELECT
         l.id                             AS "uuid",
         l.code                           AS "leadCode",
         l.name                           AS "name",
         l.gender                         AS "gender",
         l.email                          AS "email",
         l.phone                          AS "phone",
         l.status                         AS "status",
         l.priority                       AS "priority",
         l.source                         AS "leadSource",
         l.address                        AS "city",
         l.postal_code                    AS "postalCode",
         l.state_id                       AS "state",
         l.country_id                     AS "country",
         s.name                           AS "stateName",
         c.name                           AS "countryName",
         l.import_type                    AS "importType",
         l.createdat                      AS "createdAt",

         l.assigned_to_id                 AS "assignedTo",
         COALESCE(au.name, '')            AS "assignedToName",

         l.createdby                      AS "createdById",
         COALESCE(cu.name, 'System')      AS "createdByName",
         COALESCE(cr.name, '')            AS "createdByRole"

       FROM crm_leads l
       LEFT JOIN crm_state           s   ON s.id   = l.state_id
       LEFT JOIN crm_country         c   ON c.id   = l.country_id
       LEFT JOIN crm_user            au  ON au.id  = l.assigned_to_id
       LEFT JOIN crm_user            cu  ON cu.id::text = l.createdby
       LEFT JOIN crm_organizationroles orr ON orr.id = cu.role_id
       LEFT JOIN crm_roles           cr  ON cr.id  = orr.role_id

       WHERE l.id = $1
         AND l.organization_id = $2`,
      [id, orgId],
    );

    if (leadRes.rows.length === 0) return req.error(404, "Lead not found");

    const lead = leadRes.rows[0];

    const activitiesRes = await pool.query(
      `SELECT
         la.id                              AS "id",
         la.type                            AS "type",
         la.notes                           AS "notes",
         la.free_text                       AS "freeText",
         la.call_status                     AS "callStatus",
         la.next_follow_up_date             AS "nextFollowUpDate",
         la.createdat                       AS "createdAt",
         COALESCE(u.name, 'System Bot')     AS "createdByName",
         COALESCE(r.name, '')               AS "createdByRole"
       FROM crm_leadactivity la
       LEFT JOIN crm_user            u   ON u.id::text = la.createdby
       LEFT JOIN crm_organizationroles orr ON orr.id = u.role_id
       LEFT JOIN crm_roles           r   ON r.id  = orr.role_id
       WHERE la.lead_id = $1
       ORDER BY la.createdat DESC`,
      [id],
    );

    return {
      lead,
      activities: activitiesRes.rows,
    };
  } catch (error: any) {
    console.error("getLeadDetail error:", error?.message ?? error);
    return req.error(500, "Failed to fetch lead detail");
  }
};
