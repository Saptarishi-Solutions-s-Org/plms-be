"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissionsHandler = void 0;
const db_1 = require("../../lib/db");
const formatlabel_1 = require("../../lib/formatlabel");
const getPermissionsHandler = async (req) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
        return req.error(401, "Unauthorized");
    }
    const [roles, permissions] = await Promise.all([
        db_1.pool.query(`SELECT orr.id, r.name
       FROM crm_organizationroles orr
       JOIN crm_roles r ON r.id = orr.role_id
       WHERE orr.organization_id=$1
       ORDER BY r.name ASC`, [orgId]),
        db_1.pool.query(`SELECT r.name as role, m.name as module, p.name as permission, ormp.access
       FROM crm_organizationrolemodulepermissions ormp
       JOIN crm_rolemodulepermissions rmp ON rmp.id = ormp.rmp_id
       JOIN crm_modulepermissions mp ON mp.id = rmp.module_permission_id
       JOIN crm_modules m ON m.id = mp.module_id
       JOIN crm_permissions p ON p.id = mp.permission_id
       JOIN crm_organizationroles orr ON orr.id = ormp.organizationrole_id
       JOIN crm_roles r ON r.id = orr.role_id
       WHERE ormp.organization_id=$1
       ORDER BY r.name ASC, m.name ASC, p.name ASC`, [orgId]),
    ]);
    const formattedRoles = roles.rows.map((role) => ({
        ...role,
        name: (0, formatlabel_1.formatLabel)(role.name),
    }));
    const formattedPermissions = permissions.rows.map((permission) => ({
        ...permission,
        role: (0, formatlabel_1.formatLabel)(permission.role),
        module: (0, formatlabel_1.formatLabel)(permission.module),
        permission: permission.permission.toLowerCase(),
    }));
    return {
        roles: formattedRoles,
        permissions: formattedPermissions,
    };
};
exports.getPermissionsHandler = getPermissionsHandler;
