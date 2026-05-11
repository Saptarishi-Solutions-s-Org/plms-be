import { pool } from "../../lib/db";
import { emitToSystemAdmins } from "../../realtime/socket";
import { ORGANIZATION_DETAIL_CHANGED } from "../../realtime/events";

export const updateUserHandler = async (req: any) => {
  try {
    const { id, name, phone, is_active, state, country } = req.data;

    const existing = await pool.query(
      `SELECT id, organization_id FROM crm_user WHERE id=$1`,
      [id],
    );

    if (!existing.rows.length) {
      return req.error(404, "User not found");
    }

    if (req.data.email) {
      return req.error(400, "Email cannot be updated");
    }

    await pool.query(
      `UPDATE crm_user
       SET name=$1,
           phone=$2,
           is_active=$3,
           state_id=$4,
           country_id=$5,
           modifiedat=NOW(),
           modifiedby=$6
       WHERE id=$7`,
      [name, phone, is_active, state, country, req.user.id, id],
    );

    emitToSystemAdmins(ORGANIZATION_DETAIL_CHANGED, {
      reason: "organization-admin-updated",
      orgId: existing.rows[0].organization_id,
      userId: id,
      isActive: is_active,
    });

    return {
      message: "User updated successfully",
    };
  } catch (err) {
    console.error(err);
    return req.error(500, "Failed to update user");
  }
};
