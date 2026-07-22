import { pool } from "../../lib/db";
import { emitToSystemAdmins, emitToUser } from "../../realtime/socket";
import {
  ORGANIZATION_DETAIL_CHANGED,
  PROFILE_CHANGED,
} from "../../realtime/events";

export const updateUserHandler = async (req: any) => {
  try {
    const { id, name, phone, is_active, state, country, gender, dob } = req.data;

    const existing = await pool.query(
      `SELECT id, organization_id, is_active FROM crm_user WHERE id=$1`,
      [id],
    );

    if (!existing.rows.length) {
      return req.error(404, "User not found");
    }

    await pool.query(
      `UPDATE crm_user
       SET name=$1,
           phone=$2,
           is_active=$3,
           state_id=$4,
           country_id=$5,
           gender=$6,
           dob=$7,
           session_version = CASE
             WHEN is_active IS DISTINCT FROM $3 THEN session_version + 1
             ELSE session_version
           END,
           modifiedat=NOW(),
           modifiedby=$8
       WHERE id=$9`,
      [name, phone, is_active, state, country, gender, dob, req.user.id, id],
    );

    emitToSystemAdmins(ORGANIZATION_DETAIL_CHANGED, {
      reason: "organization-admin-updated",
      orgId: existing.rows[0].organization_id,
      userId: id,
      isActive: is_active,
    });

    emitToUser(id, PROFILE_CHANGED, {
      reason: "profile-updated",
      userId: id,
    });

    return {
      message: "User updated successfully",
    };
  } catch (err) {
    console.error(err);
    return req.error(500, "Failed to update user");
  }
};
