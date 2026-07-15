import { pool } from "../../lib/db";
import { createPaginationMeta, parsePaginationParams } from "../../lib/pagination";

const normalizeFilter = (value: unknown) => {
  if (typeof value !== "string") return "";
  return value.trim();
};

export const getAllUsersHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const { page, limit, offset } = parsePaginationParams(req.data);
    const { status, role } = req.data ?? {};

    if (!orgId) {
      return req.error(401, "Unauthorized");
    }

    const statusFilter = normalizeFilter(status);
    const roleFilter = normalizeFilter(role);

    let activeCondition = "1=1";
    if (statusFilter) {
      const statuses = statusFilter.split(',').map(s => s.trim().toLowerCase());
      const wantsActive = statuses.includes('active');
      const wantsInactive = statuses.includes('inactive');
      
      if (wantsActive && !wantsInactive) {
        activeCondition = "u.is_active = true";
      } else if (!wantsActive && wantsInactive) {
        activeCondition = "u.is_active = false";
      }
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
         AND ${activeCondition}
         AND (
           $2::text IS NULL
           OR LOWER(rl.name) = ANY(regexp_split_to_array(LOWER(REPLACE($2, ' ', '')), ','))
         )
       ORDER BY rl.name, u.name
       LIMIT $3 OFFSET $4`,
      [orgId, roleFilter || null, limit, offset]
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
         AND rl.name IN ('Manager', 'Executive')
         AND ${activeCondition}
         AND (
           $2::text IS NULL
           OR LOWER(rl.name) = ANY(regexp_split_to_array(LOWER(REPLACE($2, ' ', '')), ','))
         )`,
      [orgId, roleFilter || null]
    );

    const stats = countRes.rows[0];
    const totalUsers = parseInt(stats.total_users || "0", 10);
    const pagination = createPaginationMeta({ total: totalUsers, page, limit });

    return {
      users: usersRes.rows,
      stats: {
        total_users: parseInt(stats.total_users || "0", 10),
        active_users: parseInt(stats.active_users || "0", 10),
        inactive_users: parseInt(stats.inactive_users || "0", 10),
      },
      pagination
    };

  } catch (err) {
    console.error(err);
    return req.error(500, "Failed to fetch users");
  }
};
