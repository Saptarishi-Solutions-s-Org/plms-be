"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizationByCodeHandler = void 0;
const db_1 = require("../../lib/db");
const getOrganizationByCodeHandler = async (req) => {
    const { code } = req.data;
    const org = await db_1.pool.query(`SELECT * FROM crm_organization WHERE code = $1`, [code]);
    if (!org.rows.length)
        return req.error(404, "Not found");
    const orgId = org.rows[0].id;
    const [users, modules, roles, permissions] = await Promise.all([
        db_1.pool.query(`SELECT id,name,email FROM crm_user WHERE organization_id=$1`, [
            orgId,
        ]),
        db_1.pool.query(`SELECT m.name FROM crm_organizationmodules om
       JOIN crm_modules m ON m.id = om.module_id
       WHERE om.organization_id=$1`, [orgId]),
        db_1.pool.query(`SELECT orr.id, r.name
       FROM crm_organizationroles orr
       JOIN crm_roles r ON r.id = orr.role_id
       WHERE orr.organization_id=$1`, [orgId]),
        db_1.pool.query(`SELECT r.name as role, m.name as module, p.name as permission, ormp.access
       FROM crm_organizationrolemodulepermissions ormp
       JOIN crm_rolemodulepermissions rmp ON rmp.id = ormp.rmp_id
       JOIN crm_modulepermissions mp ON mp.id = rmp.module_permission_id
       JOIN crm_modules m ON m.id = mp.module_id
       JOIN crm_permissions p ON p.id = mp.permission_id
       JOIN crm_organizationroles orr ON orr.id = ormp.organizationrole_id
       JOIN crm_roles r ON r.id = orr.role_id
       WHERE ormp.organization_id=$1`, [orgId]),
    ]);
    return {
        organization: org.rows[0],
        users: users.rows,
        modules: modules.rows,
        roles: roles.rows,
        permissions: permissions.rows,
    };
};
exports.getOrganizationByCodeHandler = getOrganizationByCodeHandler;
