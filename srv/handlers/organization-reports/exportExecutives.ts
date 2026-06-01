import { pool } from "../../lib/db";

export const exportExecutivesHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;

    if (!orgId) {
      return req.error(401, "Unauthorized");
    }

    const res = await pool.query(
      `
      SELECT
        u.name AS "name",
        u.email AS "email",
        u.phone AS "phone",

        CASE 
          WHEN u.is_active THEN 'Active' 
          ELSE 'Inactive' 
        END AS "status",

        COUNT(DISTINCT l.id)::int AS "assignedLeads",

        COUNT(DISTINCT l.id) FILTER (
          WHERE l.status = 'Qualified'
        )::int AS "qualifiedLeads",

        CASE
          WHEN COUNT(DISTINCT l.id) > 0 THEN
            ROUND(
              (
                COUNT(DISTINCT l.id) FILTER (
                  WHERE l.status = 'Qualified'
                )::numeric
                / COUNT(DISTINCT l.id)::numeric
              ) * 100,
              1
            )::float
          ELSE 0
        END AS "conversionRate",

        COUNT(DISTINCT ea."offer_ID")::int AS "assignedOffers"

      FROM crm_user u

      JOIN crm_organizationroles org_role
        ON org_role.id = u.role_id

      JOIN crm_roles role
        ON role.id = org_role.role_id

      LEFT JOIN crm_leads l
        ON l.assigned_to_id = u.id
       AND l.organization_id = u.organization_id

      LEFT JOIN crm_executiveofferassignment ea
        ON ea."executive_ID" = u.id

      WHERE u.organization_id = $1
        AND LOWER(role.name) LIKE '%executive%'

      GROUP BY 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.is_active

      ORDER BY u.name ASC
      `,
      [orgId]
    );

    return res.rows;
  } catch (error: any) {
    console.error("Error exporting executives:", error?.message ?? error);
    return req.error(500, "Failed to export executives");
  }
};