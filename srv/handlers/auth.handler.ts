import bcrypt from "bcrypt";
import { generateToken } from "../lib/jwt";
import { pool } from "../lib/db";

export const loginHandler = async (req: any) => {
  try {
    const { email, password } = req.data;

    if (!email || !password) {
      return req.error(400, "Email and password required");
    }

    const userRes = await pool.query(
      `
      SELECT 
        u.id,
        u.name,
        u.password,
        u.organization_id as "orgId",
        o.code as "orgCode",
        o.name as "orgName",
        o.is_super_organization as "isSuper",
        u.role_id as "orgRoleId",
        r.name as "role"
      FROM crm_user u
      JOIN crm_organization o ON o.id = u.organization_id
      JOIN crm_organizationroles orr ON orr.id = u.role_id
      JOIN crm_roles r ON r.id = orr.role_id
      WHERE u.email = $1
      `,
      [email],
    );

    const user = userRes.rows[0];

    if (!user) return req.error(401, "Invalid credentials");

    const valid = await bcrypt.compare(password, user.password || "");

    if (!valid) return req.error(401, "Invalid credentials");

    const permRes = await pool.query(
      `
      SELECT 
        m.name as module,
        p.name as permission
      FROM crm_organizationrolemodulepermissions ormp
      JOIN crm_rolemodulepermissions rmp ON rmp.id = ormp.rmp_id
      JOIN crm_modulepermissions mp ON mp.id = rmp.module_permission_id
      JOIN crm_modules m ON m.id = mp.module_id
      JOIN crm_permissions p ON p.id = mp.permission_id
      WHERE ormp.organization_id = $1
        AND ormp.organizationrole_id = $2
        AND ormp.access = true
      `,
      [user.orgId, user.orgRoleId],
    );

    const permissionMap: Record<string, string[]> = {};

    permRes.rows.forEach(({ module, permission }) => {
      const mod = module.toUpperCase();
      const perm = permission.toUpperCase();

      if (!permissionMap[mod]) permissionMap[mod] = [];

      if (!permissionMap[mod].includes(perm)) {
        permissionMap[mod].push(perm);
      }
    });

    const token = generateToken({
      userId: user.id,
      orgId: user.orgId,
      roleId: user.orgRoleId,
      role: user.role,
      permissions: permissionMap,
      isSuper: user.isSuper,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        orgId: user.orgId,
        orgCode: user.orgCode,
        orgName: user.orgName,
        roleId: user.orgRoleId,
        role: user.role,
        permissions: permissionMap,
      },
    };
  } catch (err: any) {
    console.error("LOGIN ERROR:", err);
    return req.error(500, "Internal Server Error");
  }
};
