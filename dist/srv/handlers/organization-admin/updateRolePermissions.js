"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRolePermissionsHandler = void 0;
const db_1 = require("../../lib/db");
const refreshToken_1 = require("../../lib/refreshToken");
const socket_1 = require("../../realtime/socket");
const events_1 = require("../../realtime/events");
const updateRolePermissionsHandler = async (req) => {
    const orgId = req.user?.orgId;
    const userId = req.user?.id || null;
    if (!orgId) {
        return req.error(401, "Unauthorized");
    }
    const { orgRoleId, permissions } = req.data;
    if (!orgRoleId) {
        return req.error(400, "orgRoleId is required");
    }
    if (!Array.isArray(permissions) || permissions.length === 0) {
        return req.error(400, "permissions must be a non-empty array");
    }
    const client = await db_1.pool.connect();
    try {
        await client.query("BEGIN");
        // Enforce that the admin cannot modify the 'Admin' role or 'System Admin' role permissions.
        // They can only modify 'Manager' and 'Executive' (or any role whose name is not 'Admin' or 'System Admin').
        const roleRes = await client.query(`
      SELECT orr.id, r.name
      FROM crm_organizationroles orr
      JOIN crm_roles r ON r.id = orr.role_id
      WHERE orr.organization_id = $1
        AND orr.id = $2
        AND LOWER(TRIM(r.name)) NOT IN ('admin', 'system admin', 'system  admin')
      LIMIT 1
      `, [orgId, orgRoleId]);
        if (!roleRes.rows.length) {
            await client.query("ROLLBACK");
            return req.error(403, "Forbidden: cannot modify this role's permissions");
        }
        const roleName = roleRes.rows[0].name;
        let updatedCount = 0;
        for (const permission of permissions) {
            if (!permission.orgRoleModulePermissionId ||
                typeof permission.access !== "boolean") {
                await client.query("ROLLBACK");
                return req.error(400, "Each permission requires orgRoleModulePermissionId and access");
            }
            // Perform update, making sure it belongs to the given org and orgRoleId
            const updateRes = await client.query(`
        UPDATE crm_organizationrolemodulepermissions
        SET access = $1,
            modifiedat = NOW(),
            modifiedby = $2
        WHERE id = $3
          AND organization_id = $4
          AND organizationrole_id = $5
          AND access IS DISTINCT FROM $1
        RETURNING id
        `, [
                permission.access,
                userId,
                permission.orgRoleModulePermissionId,
                orgId,
                orgRoleId,
            ]);
            if (!updateRes.rows.length) {
                // Double check if the row exists to provide correct error
                const permissionRes = await client.query(`
          SELECT id
          FROM crm_organizationrolemodulepermissions
          WHERE id = $1
            AND organization_id = $2
            AND organizationrole_id = $3
          `, [permission.orgRoleModulePermissionId, orgId, orgRoleId]);
                if (!permissionRes.rows.length) {
                    await client.query("ROLLBACK");
                    return req.error(400, "Invalid permission row for the given role");
                }
            }
            updatedCount += updateRes.rowCount ?? 0;
        }
        let affectedUsers = [];
        let revokedRefreshTokens = 0;
        if (updatedCount > 0) {
            // Increment session_version for all active users assigned to this organization role
            const sessionRes = await client.query(`
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
        RETURNING u.id, u.session_version as "sessionVersion"
        `, [userId, orgId, orgRoleId]);
            affectedUsers = sessionRes.rows.map((row) => ({
                id: row.id,
                sessionVersion: Number(row.sessionVersion),
            }));
            revokedRefreshTokens = await (0, refreshToken_1.revokeRefreshTokensForUsers)(affectedUsers.map((u) => u.id), client);
        }
        await client.query("COMMIT");
        // Realtime events
        if (updatedCount > 0) {
            (0, socket_1.emitToOrg)(orgId, events_1.USER_LIST_CHANGED, {
                reason: "permissions-updated",
                orgId,
                orgRoleId,
            });
            (0, socket_1.emitToOrg)(orgId, events_1.USER_DETAIL_CHANGED, {
                reason: "permissions-updated",
                orgId,
                orgRoleId,
            });
            for (const affectedUser of affectedUsers) {
                (0, socket_1.emitToOrg)(orgId, events_1.USER_LIST_CHANGED, {
                    reason: "permissions-updated",
                    userId: affectedUser.id,
                });
                (0, socket_1.emitToOrg)(orgId, events_1.USER_DETAIL_CHANGED, {
                    reason: "permissions-updated",
                    userId: affectedUser.id,
                });
                (0, socket_1.emitToUser)(affectedUser.id, events_1.SESSION_EXPIRED, {
                    reason: "permissions-updated",
                    orgId,
                    orgRoleId,
                    sessionVersion: affectedUser.sessionVersion,
                });
            }
        }
        return {
            message: `${roleName} permissions updated successfully`,
            updatedCount,
            affectedSessionUsers: affectedUsers.length,
            revokedRefreshTokens,
        };
    }
    catch (err) {
        await client.query("ROLLBACK");
        console.error("updateRolePermissions error:", err);
        return req.error(500, "Failed to update role permissions");
    }
    finally {
        client.release();
    }
};
exports.updateRolePermissionsHandler = updateRolePermissionsHandler;
