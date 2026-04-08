import { pool } from "../../lib/db";

export const getAdminUsersHandler = async (req: any) => {
  try {
    const { organizationId } = req.data;

    if (!organizationId) {
      return req.error(400, "Organization is required");
    }

    const res = await pool.query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.gender,
        u.dob,
        u.is_active,
        s.name AS state,
        c.name AS country,
        u.state_id,
        u.country_id
       FROM crm_user u
       JOIN crm_organizationroles orr ON orr.id = u.role_id
       JOIN crm_roles r ON r.id = orr.role_id
       LEFT JOIN crm_state s ON s.id = u.state_id
       LEFT JOIN crm_country c ON c.id = u.country_id
       WHERE u.organization_id = $1
       AND LOWER(r.name) LIKE '%admin%'
       ORDER BY u.createdat DESC`,
      [organizationId],
    );

    return res.rows;
  } catch (err) {
    console.error(err);
    return req.error(500, "Failed to fetch users");
  }
};
