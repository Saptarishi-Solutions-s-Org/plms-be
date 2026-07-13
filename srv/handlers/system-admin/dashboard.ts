import { pool } from "../../lib/db";
import { formatLabel, sortRoleMatrix } from "../../lib/formatLabel";

export const systemAdminDashboardHandler = async (req: any) => {
  try {
    const systemOrgRes = await pool.query(`
      SELECT id FROM crm_organization
      WHERE is_super_organization = true
      LIMIT 1
    `);

    const systemOrgId = systemOrgRes.rows[0]?.id;

    if (!systemOrgId) {
      return req.error(404, "System organization not found");
    }

    const [
      orgCountRes,
      userCountRes,
      usersPerOrgRes,
      rolesRes,
      permissionsRes,
    ] = await Promise.all([
      pool.query(
        `
        SELECT COUNT(*) 
        FROM crm_organization 
        WHERE id != $1
      `,
        [systemOrgId],
      ),

      pool.query(
        `
        SELECT COUNT(*) 
        FROM crm_user 
        WHERE organization_id != $1
      `,
        [systemOrgId],
      ),

      pool.query(
        `
        SELECT 
          o.id as "orgId",
          o.name,
          COUNT(u.id)::int as count
        FROM crm_organization o
        LEFT JOIN crm_user u ON u.organization_id = o.id
        WHERE o.id != $1
        GROUP BY o.id
        ORDER BY o.name ASC
      `,
        [systemOrgId],
      ),

      pool.query(
        `
        SELECT 
          orr.id as "orgRoleId",
          r.name
        FROM crm_organizationroles orr
        JOIN crm_roles r ON r.id = orr.role_id
        WHERE orr.organization_id = $1
        ORDER BY r.name ASC
      `,
        [systemOrgId],
      ),

      pool.query(
        `
        SELECT 
          orr.id as "orgRoleId",
          r.name as role,
          m.name as module,
          p.name as permission
        FROM crm_organizationrolemodulepermissions ormp
        JOIN crm_rolemodulepermissions rmp ON rmp.id = ormp.rmp_id
        JOIN crm_modulepermissions mp ON mp.id = rmp.module_permission_id
        JOIN crm_modules m ON m.id = mp.module_id
        JOIN crm_permissions p ON p.id = mp.permission_id
        JOIN crm_organizationroles orr ON orr.id = ormp.organizationrole_id
        JOIN crm_roles r ON r.id = orr.role_id
        WHERE ormp.organization_id = $1
          AND ormp.access = true
        ORDER BY r.name ASC, m.name ASC, p.name ASC
      `,
        [systemOrgId],
      ),
    ]);

    const roleMap: Record<string, any> = {};

    for (const row of permissionsRes.rows) {
      const formattedRole = formatLabel(row.role);
      const formattedModule = formatLabel(row.module);
      const permissionKey = row.permission.toLowerCase();

      if (!roleMap[row.orgRoleId]) {
        roleMap[row.orgRoleId] = {
          role: formattedRole,
          orgRoleId: row.orgRoleId,
          modules: {},
        };
      }

      if (!roleMap[row.orgRoleId].modules[formattedModule]) {
        roleMap[row.orgRoleId].modules[formattedModule] = {};
      }

      roleMap[row.orgRoleId].modules[formattedModule][permissionKey] = true;
    }

    const formattedRoles = rolesRes.rows.map((role) => ({
      ...role,
      name: formatLabel(role.name),
    }));

    return {
      totalOrganizations: Number(orgCountRes.rows[0].count),
      totalUsers: Number(userCountRes.rows[0].count),
      usersPerOrg: usersPerOrgRes.rows,
      roles: formattedRoles,
      roleMatrix: sortRoleMatrix(roleMap),
    };
  } catch (err: any) {
    console.error(err);
    return req.error(500, "Internal Server Error");
  }
};
