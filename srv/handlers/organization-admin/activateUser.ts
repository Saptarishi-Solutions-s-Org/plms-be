import { pool } from "../../lib/db";
import { emitToOrg } from "../../realtime/socket";
import { USER_DETAIL_CHANGED, USER_LIST_CHANGED } from "../../realtime/events";
// Generic activate handler that can activate a user by id (manager or executive)
export const activateUserHandler = async (req: any) => {
  const client = await pool.connect();
  try {
    const orgId = req.user?.orgId;
    const { userId } = req.data;
    if (!orgId) return req.error(401, "Unauthorized");
    if (!userId) return req.error(400, "Missing userId");

    const res = await client.query(
      `SELECT u.id, u.name
       FROM crm_user u
       WHERE u.id = $1
       AND u.organization_id = $2`,
      [userId, orgId]
    );

    if (!res.rows.length) return req.error(404, "User not found");

    await client.query(`UPDATE crm_user SET is_active = true, modifiedat = NOW() WHERE id = $1`, [userId]);

    emitToOrg(orgId, USER_LIST_CHANGED, {
      reason: "user-activated",
      userId,
    });
    emitToOrg(orgId, USER_DETAIL_CHANGED, {
      reason: "user-activated",
      userId,
    });

    return { message: `User ${res.rows[0].name} activated successfully` };
  } catch (err) {
    console.error("Activate user error:", err);
    return req.error(500, "Failed to activate user");
  } finally {
    client.release();
  }
};
