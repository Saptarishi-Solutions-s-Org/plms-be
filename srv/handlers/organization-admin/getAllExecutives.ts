import { pool } from "../../lib/db";
export const getExecutivesHandler = async (req: any) => {
    const client = await pool.connect();
    try {
        const orgId = req.user?.orgId;
        if (!orgId) {
            return req.error(401, "Unauthorized");
        }
        const result = await client.query(
            ` SELECT u.id, u.name
              FROM crm_user u
              JOIN crm_organizationroles r ON u.role_id = r.id
              JOIN crm_roles rl ON rl.id = r.role_id
              WHERE u.organization_id = $1
              AND LOWER(rl.name) = 'executive'
              AND u.is_active = true`,
            [orgId]
        );
        return result.rows;
    }

    catch (err) {
        return req.error(500, "Failed to fetch executives");
    } finally {
        client.release();
    }
}