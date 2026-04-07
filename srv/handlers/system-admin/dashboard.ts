import { pool } from "../../lib/db";

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
        ORDER BY count DESC
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
      `,
        [systemOrgId],
      ),
    ]);

    const roleMap: Record<string, any> = {};

    for (const row of permissionsRes.rows) {
      if (!roleMap[row.orgRoleId]) {
        roleMap[row.orgRoleId] = {
          role: row.role,
          orgRoleId: row.orgRoleId,
          modules: {},
        };
      }

      if (!roleMap[row.orgRoleId].modules[row.module]) {
        roleMap[row.orgRoleId].modules[row.module] = {};
      }

      roleMap[row.orgRoleId].modules[row.module][row.permission] = true;
    }

    return {
      totalOrganizations: Number(orgCountRes.rows[0].count),
      totalUsers: Number(userCountRes.rows[0].count),
      usersPerOrg: usersPerOrgRes.rows,
      roles: rolesRes.rows,
      roleMatrix: Object.values(roleMap),
    };
  } catch (err: any) {
    console.error(err);
    return req.error(500, "Internal Server Error");
  }
};
