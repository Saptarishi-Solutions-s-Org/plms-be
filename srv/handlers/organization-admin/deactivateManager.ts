import { pool } from "../../lib/db";
import { emitToOrg } from "../../realtime/socket";
import { USER_DETAIL_CHANGED, USER_LIST_CHANGED, LEAD_LIST_CHANGED, SEGMENT_LIST_CHANGED } from "../../realtime/events";

export const deactivateManagerHandler = async (req: any) => {
  const client = await pool.connect();

  try {
    const orgId = req.user?.orgId;
    const { managerId, targetManagerId } = req.data;

    if (!orgId) {
      return req.error(401, "Unauthorized");
    }

    if (!managerId || !targetManagerId) {
      return req.error(400, "Missing managerId or targetManagerId");
    }

    if (managerId === targetManagerId) {
      return req.error(400, "Cannot assign executives to the same manager");
    }

    await client.query("BEGIN");

    // Verify that both managers exist and belong to the same organization
    const managerRes = await client.query(
      `SELECT u.id, u.name, r.role_id
       FROM crm_user u
       JOIN crm_organizationroles r ON u.role_id = r.id
       JOIN crm_roles rl ON rl.id = r.role_id
       WHERE u.id = $1
       AND u.organization_id = $2
       AND LOWER(rl.name) = 'manager'`,
      [managerId, orgId]
    );

    if (!managerRes.rows.length) {
      await client.query("ROLLBACK");
      return req.error(404, "Manager not found");
    }

    const targetManagerRes = await client.query(
      `SELECT u.id, u.name
       FROM crm_user u
       JOIN crm_organizationroles r ON u.role_id = r.id
       JOIN crm_roles rl ON rl.id = r.role_id
       WHERE u.id = $1
       AND u.organization_id = $2
       AND LOWER(rl.name) = 'manager'
       AND u.is_active = true`,
      [targetManagerId, orgId]
    );

    if (!targetManagerRes.rows.length) {
      await client.query("ROLLBACK");
      return req.error(404, "Target manager not found or is inactive");
    }

    // Get all executives assigned to the manager being deactivated
    const executivesRes = await client.query(
      `SELECT u.id FROM crm_user u
       JOIN crm_organizationroles r ON u.role_id = r.id
       JOIN crm_roles rl ON rl.id = r.role_id
       WHERE u.reporting_manager_id = $1
       AND u.organization_id = $2
       AND LOWER(rl.name) = 'executive'`,
      [managerId, orgId]
    );

    const executiveCount = executivesRes.rows.length;

    // Reassign all executives to the target manager
    if (executiveCount > 0) {
      await client.query(
        `UPDATE crm_user
         SET reporting_manager_id = $1,
             session_version = session_version + 1,
             modifiedat = NOW()
         WHERE reporting_manager_id = $2
         AND organization_id = $3`,
        [targetManagerId, managerId, orgId]
      );
    }

    // Reassign all segments to the target manager
    const segmentRes = await client.query(
      `UPDATE crm_segment
       SET createdby = $1,
           modifiedby = $1,
           modifiedat = NOW()
       WHERE createdby = $2
       AND organization_id = $3`,
      [targetManagerId, managerId, orgId]
    );
    const segmentCount = segmentRes.rowCount || 0;

    // Deactivate the manager
    await client.query(
      `UPDATE crm_user
       SET is_active = false,
           session_version = session_version + 1,
           modifiedat = NOW()
       WHERE id = $1`,
      [managerId]
    );

    await client.query("COMMIT");

    emitToOrg(orgId, USER_LIST_CHANGED, {
      reason: "manager-deactivated",
      userId: managerId,
    });
    emitToOrg(orgId, USER_DETAIL_CHANGED, {
      reason: "manager-deactivated",
      userId: managerId,
    });
    emitToOrg(orgId, LEAD_LIST_CHANGED, {
      reason: "manager-deactivated",
    });
    emitToOrg(orgId, SEGMENT_LIST_CHANGED, {
      reason: "manager-deactivated",
    });
    return {
      message: `Manager deactivated successfully. ${executiveCount} executives and ${segmentCount} segments reassigned to ${targetManagerRes.rows[0].name}`,
      managerName: managerRes.rows[0].name,
      targetManagerName: targetManagerRes.rows[0].name,
      executivesReassigned: executiveCount,
      segmentsReassigned: segmentCount,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Deactivate manager error:", err);
    return req.error(500, "Failed to deactivate manager");
  } finally {
    client.release();
  }
};
