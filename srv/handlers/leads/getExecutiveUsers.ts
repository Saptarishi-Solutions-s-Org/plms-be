import { pool } from "../../lib/db";

export const getExecutiveUsersHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const managerId = req.user?.id || req.user?.userId;

    if (!orgId || !managerId) {
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
         AND u.reporting_manager_id = $2
         AND u.is_active = true
       ORDER BY u.name ASC`,
      [orgId, managerId]
    );

    return res.rows;
  } catch (error: any) {
    console.error("Error fetching executive users:", error?.message ?? error);
    return req.error(500, "Failed to fetch executive users");
  }
};