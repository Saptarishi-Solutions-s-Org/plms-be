import { pool } from "../../lib/db";

export const getExecutiveUsersHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;

    if (!orgId) {
      return req.error(401, "Unauthorized");
    }

    const res = await pool.query(
      `SELECT
         u.id,
         u.name
       FROM crm_user u
       JOIN crm_organizationroles orr ON orr.id = u.role_id
       JOIN crm_roles             r   ON r.id   = orr.role_id
       WHERE u.organization_id = $1
         AND LOWER(r.name) LIKE '%executive%'
         AND u.is_active = true
       ORDER BY u.name ASC`,
      [orgId]
    );

    return res.rows;
  } catch (error: any) {
    console.error("Error fetching executive users:", error?.message ?? error);
    return req.error(500, "Failed to fetch executive users");
  }
};