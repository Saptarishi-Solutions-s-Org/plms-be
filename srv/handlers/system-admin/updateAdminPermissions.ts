import { pool } from "../../lib/db";
import { canUpdateRoles } from "../../lib/rolePermissions";
import { revokeRefreshTokensForUsers } from "../../lib/refreshToken";
import { emitToOrg, emitToSystemAdmins, emitToUser } from "../../realtime/socket";
import {
  ORGANIZATION_DETAIL_CHANGED,
  SESSION_EXPIRED,
  SYSTEM_ADMIN_DASHBOARD_CHANGED,
  USER_DETAIL_CHANGED,
  USER_LIST_CHANGED,
} from "../../realtime/events";

type PermissionUpdate = {
  orgRoleModulePermissionId?: string;
  access?: boolean;
};

export const updateAdminPermissionsHandler = async (req: any) => {
  if (!canUpdateRoles(req.user?.permissions)) {
    return req.error(403, "Forbidden: insufficient permissions");
  }

  const { organizationId, orgRoleId, permissions } = req.data;

  if (!organizationId || !orgRoleId) {
    return req.error(400, "organizationId and orgRoleId are required");
  }

  if (!Array.isArray(permissions) || permissions.length === 0) {
    return req.error(400, "permissions must be a non-empty array");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const adminRoleRes = await client.query(
      `
      SELECT orr.id
      FROM crm_organizationroles orr
      JOIN crm_roles r ON r.id = orr.role_id
      JOIN crm_organization o ON o.id = orr.organization_id
      WHERE o.id = $1
        AND orr.id = $2
        AND o.is_super_organization = false
        AND LOWER(r.name) = 'admin'
      LIMIT 1
    `,
      [organizationId, orgRoleId],
    );

    if (!adminRoleRes.rows.length) {
      await client.query("ROLLBACK");
      return req.error(404, "Organization admin role not found");
    }

    let updatedCount = 0;
    const userId = req.user?.id || null;

    for (const permission of permissions as PermissionUpdate[]) {
      if (
        !permission.orgRoleModulePermissionId ||
        typeof permission.access !== "boolean"
      ) {
        await client.query("ROLLBACK");
        return req.error(
          400,
          "Each permission requires orgRoleModulePermissionId and access",
        );
      }

      const updateRes = await client.query(
        `
        UPDATE crm_organizationrolemodulepermissions
        SET access = $1,
            modifiedat = NOW(),
            modifiedby = $2
        WHERE id = $3
          AND organization_id = $4
          AND organizationrole_id = $5
          AND access IS DISTINCT FROM $1
        RETURNING id
      `,
        [
          permission.access,
          userId,
          permission.orgRoleModulePermissionId,
          organizationId,
          orgRoleId,
        ],
      );

      if (!updateRes.rows.length) {
        const permissionRes = await client.query(
          `
          SELECT id
          FROM crm_organizationrolemodulepermissions
          WHERE id = $1
            AND organization_id = $2
            AND organizationrole_id = $3
        `,
          [
            permission.orgRoleModulePermissionId,
            organizationId,
            orgRoleId,
          ],
        );

        if (!permissionRes.rows.length) {
          await client.query("ROLLBACK");
          return req.error(400, "Invalid permission row for organization admin");
        }
      }

      updatedCount += updateRes.rowCount ?? 0;
    }

    let affectedUsers: { id: string; sessionVersion: number }[] = [];
    let revokedRefreshTokens = 0;

    if (updatedCount > 0) {
      const sessionRes = await client.query(
        `
        UPDATE crm_user u
        SET session_version = COALESCE(u.session_version, 1) + 1,
            modifiedat = NOW(),
            modifiedby = $1
        FROM crm_organizationroles orr
        JOIN crm_roles r ON r.id = orr.role_id
        WHERE u.organization_id = $2
          AND u.role_id = orr.id
          AND orr.organization_id = $2
          AND orr.id = $3
          AND LOWER(r.name) = 'admin'
        RETURNING u.id, u.session_version as "sessionVersion"
      `,
        [userId, organizationId, orgRoleId],
      );

      affectedUsers = sessionRes.rows.map((row) => ({
        id: row.id,
        sessionVersion: Number(row.sessionVersion),
      }));
      revokedRefreshTokens = await revokeRefreshTokensForUsers(
        affectedUsers.map((affectedUser) => affectedUser.id),
        client,
      );
    }

    await client.query("COMMIT");

    emitToSystemAdmins(SYSTEM_ADMIN_DASHBOARD_CHANGED, {
      reason: "organization-admin-permissions-updated",
      orgId: organizationId,
      orgRoleId,
    });
    emitToSystemAdmins(ORGANIZATION_DETAIL_CHANGED, {
      reason: "organization-admin-permissions-updated",
      orgId: organizationId,
      orgRoleId,
    });
    emitToOrg(organizationId, USER_LIST_CHANGED, {
      reason: "organization-admin-permissions-updated",
      orgId: organizationId,
      orgRoleId,
    });
    emitToOrg(organizationId, USER_DETAIL_CHANGED, {
      reason: "organization-admin-permissions-updated",
      orgId: organizationId,
      orgRoleId,
    });

    for (const affectedUser of affectedUsers) {
      emitToOrg(organizationId, USER_LIST_CHANGED, {
        reason: "organization-admin-permissions-updated",
        userId: affectedUser.id,
      });
      emitToOrg(organizationId, USER_DETAIL_CHANGED, {
        reason: "organization-admin-permissions-updated",
        userId: affectedUser.id,
      });
      emitToUser(affectedUser.id, SESSION_EXPIRED, {
        reason: "permissions-updated",
        orgId: organizationId,
        orgRoleId,
        sessionVersion: affectedUser.sessionVersion,
      });
    }

    return {
      message: "Organization admin permissions updated successfully",
      updatedCount,
      affectedSessionUsers: affectedUsers.length,
      affectedUsers,
      revokedRefreshTokens,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return req.error(500, "Failed to update organization admin permissions");
  } finally {
    client.release();
  }
};
