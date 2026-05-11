import { pool } from "../../lib/db";

export const getManagersHandler = async (req: any) => {
  const client = await pool.connect();

  try {
    const orgId = req.user?.orgId;

    if (!orgId) {
      return req.reject(401, "Unauthorized");
    }

    const result = await client.query(
      `SELECT 
         u.id,
         u.name,
         u.email,
         u.phone
       FROM crm_user u
       JOIN crm_organizationroles orr ON orr.id = u.role_id
       JOIN crm_roles r               ON r.id   = orr.role_id
       WHERE u.organization_id = $1
         AND LOWER(r.name) LIKE '%manager%'
         AND u.is_active = true
       ORDER BY u.name ASC`,
      [orgId]
    );

    return result.rows;

  } catch (error: any) {
    
    return req.reject(500, "Failed to fetch managers");
  } finally {
    client.release();
  }
};