import { pool } from "../../lib/db";

export const getLeadDetailHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const { leadCode } = req.data;

    if (!orgId) return req.error(401, "Unauthorized");
    if (!leadCode) return req.error(400, "Lead code is required");

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
       JOIN crm_leads                 l   ON l.id = la.lead_id
       WHERE l.code = $1
         AND l.organization_id = $2
       ORDER BY la.createdat DESC`,
      [leadCode, orgId],
    );

    return {
      activities: activitiesRes.rows,
    };
  } catch (error: any) {
    console.error("getLeadDetail error:", error?.message ?? error);
    return req.error(500, "Failed to fetch lead detail");
  }
};
