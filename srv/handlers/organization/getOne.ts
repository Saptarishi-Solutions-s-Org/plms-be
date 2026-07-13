import { pool } from "../../lib/db";
import { formatLabel, } from "../../lib/formatLabel";

export const getOrganizationByCodeHandler = async (req: any) => {
  const { code } = req.data;

  const org = await pool.query(
    `SELECT * FROM crm_organization WHERE code = $1`,
    [code],
  );

  if (!org.rows.length) return req.error(404, "Not found");

  const orgId = org.rows[0].id;

  const [users, modules, roles, permissions] = await Promise.all([
    pool.query(`SELECT id,name,email FROM crm_user WHERE organization_id=$1`, [
      orgId,
    ]),
    pool.query(
      `SELECT m.name FROM crm_organizationmodules om
       JOIN crm_modules m ON m.id = om.module_id
       WHERE om.organization_id=$1
       ORDER BY m.name ASC`,
      [orgId],
    ),
    pool.query(
      `SELECT orr.id, r.name
       FROM crm_organizationroles orr
       JOIN crm_roles r ON r.id = orr.role_id
       WHERE orr.organization_id=$1
       ORDER BY r.name ASC`,
      [orgId],
    ),
    pool.query(
      `SELECT r.name as role, m.name as module, p.name as permission, ormp.access
       FROM crm_organizationrolemodulepermissions ormp
       JOIN crm_rolemodulepermissions rmp ON rmp.id = ormp.rmp_id
       JOIN crm_modulepermissions mp ON mp.id = rmp.module_permission_id
       JOIN crm_modules m ON m.id = mp.module_id
       JOIN crm_permissions p ON p.id = mp.permission_id
       JOIN crm_organizationroles orr ON orr.id = ormp.organizationrole_id
       JOIN crm_roles r ON r.id = orr.role_id
       WHERE ormp.organization_id=$1
       ORDER BY r.name ASC, m.name ASC, p.name ASC`,
      [orgId],
    ),
  ]);

  const formattedModules = modules.rows.map((module) => ({
    ...module,
    name: formatLabel(module.name),
  }));

  const formattedRoles = roles.rows.map((role) => ({
    ...role,
    name: formatLabel(role.name),
  }));

  const formattedPermissions = permissions.rows.map((permission) => ({
    ...permission,
    role: formatLabel(permission.role),
    module: formatLabel(permission.module),
    permission: permission.permission.toLowerCase(),
  }));

  return {
    organization: org.rows[0],
    users: users.rows,
    modules: formattedModules,
    roles: formattedRoles,
    permissions: formattedPermissions,
  };
};
