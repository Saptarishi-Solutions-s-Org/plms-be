import { pool } from "../../lib/db";
import { emitToSystemAdmins } from "../../realtime/socket";
import {
  ORGANIZATION_DETAIL_CHANGED,
  ORGANIZATION_LIST_CHANGED,
  SYSTEM_ADMIN_DASHBOARD_CHANGED,
} from "../../realtime/events";

export const updateOrganizationHandler = async (req: any) => {
  const client = await pool.connect();

  try {
    const {
      id,
      name,
      is_active,
      email,
      phone,
      address,
      state,
      country,
      trial,
      trailtype,
    } = req.data;
    const userId = req.user?.id || null;
    const trialType = trial ?? trailtype;

    await client.query("BEGIN");

    await client.query(
      `UPDATE crm_organization
       SET name = $1,
           is_active = $2,
           email = $3,
           phone = $4,
           address = $5,
           state_id = $6,
           country_id = $7,
           trial = $8,
           modifiedat = NOW(),
           modifiedby = $9
       WHERE id = $10`,
      [
        name,
        is_active,
        email,
        phone,
        address,
        state,
        country,
        trialType,
        userId,
        id,
      ],
    );

    if (is_active === false) {
      await client.query(
        `UPDATE crm_user
         SET is_active = false,
             session_version = session_version + 1,
             modifiedat = NOW(),
             modifiedby = $1
         WHERE organization_id = $2`,
        [userId, id],
      );
    }

    await client.query("COMMIT");

    emitToSystemAdmins(SYSTEM_ADMIN_DASHBOARD_CHANGED, {
      reason: "organization-updated",
      orgId: id,
      isActive: is_active,
    });
    emitToSystemAdmins(ORGANIZATION_LIST_CHANGED, {
      reason: "organization-updated",
      orgId: id,
      isActive: is_active,
    });
    emitToSystemAdmins(ORGANIZATION_DETAIL_CHANGED, {
      reason: "organization-updated",
      orgId: id,
      isActive: is_active,
    });

    return {
      message: "Organization updated successfully",
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return req.error(500, "Failed to update organization");
  } finally {
    client.release();
  }
};
