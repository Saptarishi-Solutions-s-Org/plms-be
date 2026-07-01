"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSessionState = validateSessionState;
const db_1 = require("./db");
function permissionsEqual(tokenPermissions, currentPermissions) {
    const tokenModules = Object.keys(tokenPermissions).sort();
    const currentModules = Object.keys(currentPermissions).sort();
    if (tokenModules.length !== currentModules.length)
        return false;
    for (let index = 0; index < tokenModules.length; index += 1) {
        const moduleName = tokenModules[index];
        if (moduleName !== currentModules[index])
            return false;
        const tokenActions = [...(tokenPermissions[moduleName] || [])].sort();
        const currentActions = [...(currentPermissions[moduleName] || [])].sort();
        if (tokenActions.length !== currentActions.length)
            return false;
        for (let valueIndex = 0; valueIndex < tokenActions.length; valueIndex += 1) {
            if (tokenActions[valueIndex] !== currentActions[valueIndex])
                return false;
        }
    }
    return true;
}
async function getCurrentPermissions(orgId, roleId) {
    const permRes = await db_1.pool.query(`
    SELECT
      mp.name as module,
      p.name as permission
    FROM crm_organizationrolemodulepermissions ormp
    JOIN crm_rolemodulepermissions rmp ON rmp.id = ormp.rmp_id
    JOIN crm_modulepermissions mp2 ON mp2.id = rmp.module_permission_id
    JOIN crm_modules mp ON mp.id = mp2.module_id
    JOIN crm_permissions p ON p.id = mp2.permission_id
    WHERE ormp.organization_id = $1
      AND ormp.organizationrole_id = $2
      AND ormp.access = true
    `, [orgId, roleId]);
    const permissions = {};
    for (const row of permRes.rows) {
        const moduleName = String(row.module || "").toLowerCase();
        const permission = String(row.permission || "").toLowerCase();
        if (!moduleName || !permission)
            continue;
        if (!permissions[moduleName])
            permissions[moduleName] = [];
        permissions[moduleName].push(permission);
    }
    return permissions;
}
async function validateSessionState({ decoded, permissions, }) {
    const sessionRes = await db_1.pool.query(`SELECT
       u.session_version,
       u.role_id,
       u.is_active,
       o.is_active AS org_is_active
     FROM crm_user u
     JOIN crm_organization o ON o.id = u.organization_id
     WHERE u.id = $1
     LIMIT 1`, [decoded.userId]);
    const sessionUser = sessionRes.rows[0];
    if (!sessionUser || !sessionUser.is_active || !sessionUser.org_is_active) {
        return false;
    }
    const currentSessionVersion = Number(sessionUser.session_version || 1);
    const tokenSessionVersion = Number(decoded.sessionVersion || 0);
    if (tokenSessionVersion !== currentSessionVersion) {
        return false;
    }
    if (decoded.roleId &&
        sessionUser.role_id &&
        decoded.roleId !== sessionUser.role_id) {
        return false;
    }
    if (decoded.roleId) {
        const currentPermissions = await getCurrentPermissions(decoded.orgId, decoded.roleId);
        if (!permissionsEqual(permissions, currentPermissions)) {
            return false;
        }
    }
    return true;
}
