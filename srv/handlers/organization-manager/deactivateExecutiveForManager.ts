import { pool } from "../../lib/db";

export const deactivateExecutiveForManagerHandler = async (req: any) => {
  const client = await pool.connect();

  try {
    const orgId = req.user?.orgId;
    const managerId = req.user?.userId || req.user?.id;
    const { executiveId, targetExecutiveId } = req.data;

    if (!orgId || !managerId) {
      return req.error(401, "Unauthorized");
    }

    if (!executiveId || !targetExecutiveId) {
      return req.error(400, "Missing executiveId or targetExecutiveId");
    }

    if (executiveId === targetExecutiveId) {
      return req.error(400, "Cannot assign leads to the same executive");
    }

    await client.query("BEGIN");

    // Verify that both executives exist, belong to the same organization, and report to the same manager
    const executiveRes = await client.query(
      `SELECT u.id, u.name, r.role_id
       FROM crm_user u
       JOIN crm_organizationroles r ON u.role_id = r.id
       JOIN crm_roles rl ON rl.id = r.role_id
       WHERE u.id = $1
       AND u.organization_id = $2
       AND u.reporting_manager_id = $3
       AND LOWER(rl.name) = 'executive'`,
      [executiveId, orgId, managerId]
    );

    if (!executiveRes.rows.length) {
      await client.query("ROLLBACK");
      return req.error(404, "Executive not found or not under your management");
    }

    const targetExecutiveRes = await client.query(
      `SELECT u.id, u.name
       FROM crm_user u
       JOIN crm_organizationroles r ON u.role_id = r.id
       JOIN crm_roles rl ON rl.id = r.role_id
       WHERE u.id = $1
       AND u.organization_id = $2
       AND u.reporting_manager_id = $3
       AND LOWER(rl.name) = 'executive'
       AND u.is_active = true`,
      [targetExecutiveId, orgId, managerId]
    );

    if (!targetExecutiveRes.rows.length) {
      await client.query("ROLLBACK");
      return req.error(404, "Target executive not found or is inactive");
    }

    // Get all leads assigned to the executive being deactivated
    const leadsRes = await client.query(
      `SELECT id FROM crm_leads
       WHERE assigned_to_id = $1
       AND organization_id = $2`,
      [executiveId, orgId]
    );

    const leadCount = leadsRes.rows.length;

    // Reassign all leads to the target executive
    if (leadCount > 0) {
      await client.query(
        `UPDATE crm_leads
         SET assigned_to_id = $1, modifiedat = NOW()
         WHERE assigned_to_id = $2
         AND organization_id = $3`,
        [targetExecutiveId, executiveId, orgId]
      );
    }

    // Reassign all segments to the target executive
    const segmentRes = await client.query(
      `UPDATE crm_segment
       SET createdby = $1,
           modifiedby = $1,
           modifiedat = NOW()
       WHERE createdby = $2
       AND organization_id = $3`,
      [targetExecutiveId, executiveId, orgId]
    );
    const segmentCount = segmentRes.rowCount || 0;

    // Deactivate the executive
    await client.query(
      `UPDATE crm_user
       SET is_active = false,
           session_version = session_version + 1,
           modifiedat = NOW()
       WHERE id = $1`,
      [executiveId]
    );

    await client.query("COMMIT");

    const { emitToOrg } = require("../../realtime/socket");
    const { USER_LIST_CHANGED, USER_DETAIL_CHANGED, LEAD_LIST_CHANGED, SEGMENT_LIST_CHANGED } = require("../../realtime/events");

    emitToOrg(orgId, USER_LIST_CHANGED, {
      reason: "executive-deactivated",
      userId: executiveId,
    });
    emitToOrg(orgId, USER_DETAIL_CHANGED, {
      reason: "executive-deactivated",
      userId: executiveId,
    });
    emitToOrg(orgId, LEAD_LIST_CHANGED, {
      reason: "executive-deactivated",
    });
    emitToOrg(orgId, SEGMENT_LIST_CHANGED, {
      reason: "executive-deactivated",
    });

    return {
      message: `Executive deactivated successfully. ${leadCount} leads and ${segmentCount} segments reassigned to ${targetExecutiveRes.rows[0].name}`,
      executiveName: executiveRes.rows[0].name,
      targetExecutiveName: targetExecutiveRes.rows[0].name,
      leadsReassigned: leadCount,
      segmentsReassigned: segmentCount,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Deactivate executive for manager error:", err);
    return req.error(500, "Failed to deactivate executive");
  } finally {
    client.release();
  }
};
