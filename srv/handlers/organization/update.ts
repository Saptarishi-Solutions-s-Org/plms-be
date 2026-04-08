import { pool } from "../../lib/db";

export const updateOrganizationHandler = async (req: any) => {
  const client = await pool.connect();

  try {
    const { id, name, is_active } = req.data;
    const userId = req.user?.id || null;

    await client.query(
      `UPDATE crm_organization
       SET name = $1,
           is_active = $2,
           modifiedat = NOW(),
           modifiedby = $3
       WHERE id = $4`,
      [name, is_active, userId, id],
    );

    return {
      message: "Organization updated successfully",
    };
  } catch (err) {
    console.error(err);
    return req.error(500, "Failed to update organization");
  } finally {
    client.release();
  }
};
