"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizationByCodeHandler = void 0;
const db_1 = require("../../lib/db");
const formatlabel_1 = require("../../lib/formatlabel");
const getOrganizationByCodeHandler = async (req) => {
    const { code } = req.data;
    const org = await db_1.pool.query(`SELECT * FROM crm_organization WHERE code = $1`, [code]);
    if (!org.rows.length)
        return req.error(404, "Not found");
    const orgId = org.rows[0].id;
    const [users, modules, roles, permissions, allModules, allRoles, segmentFilters] = await Promise.all([
        db_1.pool.query(`SELECT id,name,email FROM crm_user WHERE organization_id=$1`, [
            orgId,
        ]),
        db_1.pool.query(`SELECT m.id, m.name FROM crm_organizationmodules om
       JOIN crm_modules m ON m.id = om.module_id
       WHERE om.organization_id=$1
       ORDER BY m.name ASC`, [orgId]),
        db_1.pool.query(`SELECT orr.id, r.id as "roleId", r.name
       FROM crm_organizationroles orr
       JOIN crm_roles r ON r.id = orr.role_id
       WHERE orr.organization_id=$1
       ORDER BY r.name ASC`, [orgId]),
        db_1.pool.query(`SELECT
         o.id                          AS "organizationId",
         orr.id                        AS "orgRoleId",
         r.id                          AS "roleId",
         r.name                        AS role,
         ormp.id                       AS "orgRoleModulePermissionId",
         rmp.id                        AS "rmpId",
         mp.id                         AS "modulePermissionId",
         m.id                          AS "moduleId",
         m.name                        AS module,
         p.id                          AS "permissionId",
         p.name                        AS permission,
         ormp.access
       FROM crm_organization o
       JOIN crm_organizationroles orr
         ON orr.organization_id = o.id
       JOIN crm_roles r
         ON r.id = orr.role_id
       JOIN crm_organizationrolemodulepermissions ormp
         ON ormp.organization_id = o.id
         AND ormp.organizationrole_id = orr.id
       JOIN crm_rolemodulepermissions rmp
         ON rmp.id = ormp.rmp_id
       JOIN crm_modulepermissions mp
         ON mp.id = rmp.module_permission_id
       JOIN crm_modules m
         ON m.id = mp.module_id
       JOIN crm_permissions p
         ON p.id = mp.permission_id
       JOIN crm_organizationmodules om
         ON om.module_id = m.id AND om.organization_id = o.id
       WHERE o.id = $1
       ORDER BY r.name, m.name, p.name`, [orgId]),
        db_1.pool.query(`SELECT id, name FROM crm_modules ORDER BY name ASC`),
        db_1.pool.query(`SELECT id, name FROM crm_roles 
       WHERE LOWER(REGEXP_REPLACE(TRIM(name), '\\s+', ' ', 'g')) != 'system admin'
       ORDER BY name ASC`),
        db_1.pool.query(`SELECT oft.id, oft."default" AS is_enabled, ft.name, ft.label, ft.category, ft.operator_type 
       FROM crm_organizationsegmentfiltertypes oft
       JOIN crm_segmentfiltertypes ft ON ft.id = oft.filter_type_id
       WHERE oft.organization_id = $1
       ORDER BY ft.category ASC, ft.label ASC`, [orgId])
    ]);
    const formattedModules = modules.rows.map((module) => ({
        ...module,
        name: (0, formatlabel_1.formatLabel)(module.name),
    }));
    const formattedRoles = roles.rows.map((role) => ({
        ...role,
        name: (0, formatlabel_1.formatLabel)(role.name),
    }));
    const formattedAllModules = allModules.rows.map((m) => ({
        id: m.id,
        name: (0, formatlabel_1.formatLabel)(m.name),
    }));
    const formattedAllRoles = allRoles.rows.map((r) => ({
        id: r.id,
        name: (0, formatlabel_1.formatLabel)(r.name),
    }));
    const formattedPermissions = permissions.rows.map((permission) => ({
        ...permission,
        role: (0, formatlabel_1.formatLabel)(permission.role),
        module: (0, formatlabel_1.formatLabel)(permission.module),
        permission: permission.permission.toLowerCase(),
    }));
    const formattedSegmentFilters = segmentFilters.rows.map((f) => ({
        id: f.id,
        name: f.name,
        label: f.label,
        category: (0, formatlabel_1.formatLabel)(f.category),
        operator_type: f.operator_type,
        is_enabled: f.is_enabled === true
    }));
    return {
        organization: org.rows[0],
        users: users.rows,
        modules: formattedModules,
        roles: formattedRoles,
        allModules: formattedAllModules,
        allRoles: formattedAllRoles,
        permissions: formattedPermissions.map((row) => ({
            organizationId: row.organizationId,
            orgRoleId: row.orgRoleId,
            roleId: row.roleId,
            role: row.role,
            moduleId: row.moduleId,
            module: row.module,
            permissionId: row.permissionId,
            permission: row.permission,
            rmpId: row.rmpId,
            orgRoleModulePermissionId: row.orgRoleModulePermissionId,
            access: row.access === true,
        })),
        segmentFilters: formattedSegmentFilters
    };
};
exports.getOrganizationByCodeHandler = getOrganizationByCodeHandler;
