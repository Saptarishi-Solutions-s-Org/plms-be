import { pool } from "../../lib/db";
import { formatLabel } from "../../lib/formatlabel";

export const getPermissionsHandler = async (req: any) => {
  const orgId = req.user?.orgId;

  if (!orgId) {
    return req.error(401, "Unauthorized");
  }

  const [roles, permissions] = await Promise.all([
    pool.query(
      `SELECT orr.id, r.name
       FROM crm_organizationroles orr
       JOIN crm_roles r ON r.id = orr.role_id
       WHERE orr.organization_id=$1
       ORDER BY r.name ASC`,
      [orgId],
    ),
    pool.query(
      `SELECT ormp.id as "orgRoleModulePermissionId", r.name as role, m.name as module, p.name as permission, ormp.access
       FROM crm_organizationrolemodulepermissions ormp
       JOIN crm_rolemodulepermissions rmp ON rmp.id = ormp.rmp_id
       JOIN crm_modulepermissions mp ON mp.id = rmp.module_permission_id
       JOIN crm_modules m ON m.id = mp.module_id
       JOIN crm_permissions p ON p.id = mp.permission_id
       JOIN crm_organizationroles orr ON orr.id = ormp.organizationrole_id
       JOIN crm_roles r ON r.id = orr.role_id
       JOIN crm_organizationmodules om ON om.module_id = m.id AND om.organization_id = ormp.organization_id
       WHERE ormp.organization_id=$1
       ORDER BY r.name ASC, m.name ASC, p.name ASC`,
      [orgId],
    ),
  ]);

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
    roles: formattedRoles,
    permissions: formattedPermissions,
  };
};
