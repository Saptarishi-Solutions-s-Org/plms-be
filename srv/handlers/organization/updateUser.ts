import { pool } from "../../lib/db";

export const updateUserHandler = async (req: any) => {
  try {
    const { id, name, phone, is_active, state, country } = req.data;

    const existing = await pool.query(`SELECT id FROM crm_user WHERE id=$1`, [
      id,
    ]);

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

    return {
      message: "User updated successfully",
    };
  } catch (err) {
    console.error(err);
    return req.error(500, "Failed to update user");
  }
};
