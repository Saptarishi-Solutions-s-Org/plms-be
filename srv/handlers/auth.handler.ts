import bcrypt from "bcrypt";
import { generateToken } from "../lib/jwt";
import { pool } from "../lib/db";

export const loginHandler = async (req: any) => {
  try {
    const { email, password } = req.data;

    if (!email || !password) {
      req.reject(400, { message: "Email and password required" });
      return;
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
        AND u.is_active = true
        AND o.is_active = true
      `,
      [email],
    );

    const user = userRes.rows[0];

    if (!user) {
      req.reject(401, { message: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password || "");

    if (!valid) {
      req.reject(401, { message: "Invalid credentials" });
      return;
    }

    const permRes = await pool.query(
      `
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
      `,
      [user.orgId, user.orgRoleId],
    );

    const permissionMap: Record<string, string[]> = {};

    for (const r of permRes.rows) {
      if (!permissionMap[r.module]) permissionMap[r.module] = [];
      permissionMap[r.module].push(r.permission);
    }

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
    req.reject(500, { message: "Internal Server Error" });
  }
};
