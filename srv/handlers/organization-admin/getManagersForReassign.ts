import { pool } from "../../lib/db";

export const getManagersForReassignHandler = async (req: any) => {
  const client = await pool.connect();

  try {
    const orgId = req.user?.orgId;
    const { excludeManagerId } = req.data;

    if (!orgId) {
      return req.error(401, "Unauthorized");
    }

    let query = `SELECT u.id, u.name, u.email, u.phone
                 FROM crm_user u
                 JOIN crm_organizationroles r ON u.role_id = r.id
                 JOIN crm_roles rl ON rl.id = r.role_id
                 WHERE u.organization_id = $1
                 AND LOWER(rl.name) = 'manager'
                 AND u.is_active = true`;

    const params: any[] = [orgId];

    if (excludeManagerId) {
      query += ` AND u.id != $2`;
      params.push(excludeManagerId);
    }

    query += ` ORDER BY u.name ASC`;

    const result = await client.query(query, params);

    return result.rows;
  } catch (err) {
    console.error("Get managers for reassign error:", err);
    return req.error(500, "Failed to fetch managers");
  } finally {
    client.release();
  }
};
