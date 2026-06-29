import { pool } from "../../lib/db";

export const getAllUsersHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;

    if (!orgId) {
      return req.error(401, "Unauthorized");
    }

    const usersRes = await pool.query(
      `SELECT 
         u.id,
         u.name,
         u.email,
         u.phone,
         u.is_active,
         rl.name AS role_name,
         u.reporting_manager_id,
         manager.name AS reporting_manager_name
       FROM crm_user u
       JOIN crm_organization o 
         ON u.organization_id = o.id
       JOIN crm_organizationroles r 
         ON u.role_id = r.id
       JOIN crm_roles rl 
         ON r.role_id = rl.id
       LEFT JOIN crm_user manager
         ON manager.id = u.reporting_manager_id
        AND manager.organization_id = u.organization_id
       WHERE u.organization_id = $1 
         AND rl.name IN ('Manager', 'Executive')
       ORDER BY rl.name`,
      [orgId]
    );

    const countRes = await pool.query(
      `SELECT 
         COUNT(*) AS total_users,
         COUNT(*) FILTER (WHERE u.is_active = true) AS active_users,
         COUNT(*) FILTER (WHERE u.is_active = false) AS inactive_users
       FROM crm_user u
       JOIN crm_organizationroles r 
         ON u.role_id  = r.id
       JOIN crm_roles rl 
         ON r.role_id = rl.id
       WHERE u.organization_id = $1
         AND rl.name IN ('Manager', 'Executive')`,
      [orgId]
    );

    return {
      users: usersRes.rows,
      stats: countRes.rows[0],
    };

  } catch (err) {
    console.error(err);
    return req.error(500, "Failed to fetch users");
  }
};
