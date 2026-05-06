import bcrypt from "bcrypt";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt";

import { setAuthCookies, clearAuthCookies } from "../lib/cookies";

import { pool } from "../lib/db";

export const loginHandler = async (req: any) => {
  try {
    const { email, password } = req.data;

    if (!email || !password) {
      req.reject(400, {
        message: "Email and password required",
      });

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
      JOIN crm_organization o 
        ON o.id = u.organization_id
      JOIN crm_organizationroles orr 
        ON orr.id = u.role_id
      JOIN crm_roles r 
        ON r.id = orr.role_id
      WHERE u.email = $1
        AND u.is_active = true
        AND o.is_active = true
      `,
      [email],
    );

    const user = userRes.rows[0];

    if (!user) {
      req.reject(401, {
        message: "Invalid credentials",
      });

      return;
    }

    const valid = await bcrypt.compare(password, user.password || "");

    if (!valid) {
      req.reject(401, {
        message: "Invalid credentials",
      });

      return;
    }

    const permRes = await pool.query(
      `
      SELECT 
        mp.name as module,
        p.name as permission
      FROM crm_organizationrolemodulepermissions ormp
      JOIN crm_rolemodulepermissions rmp 
        ON rmp.id = ormp.rmp_id
      JOIN crm_modulepermissions mp2 
        ON mp2.id = rmp.module_permission_id
      JOIN crm_modules mp 
        ON mp.id = mp2.module_id
      JOIN crm_permissions p 
        ON p.id = mp2.permission_id
      WHERE ormp.organization_id = $1
        AND ormp.organizationrole_id = $2
        AND ormp.access = true
      `,
      [user.orgId, user.orgRoleId],
    );

    const permissionMap: Record<string, string[]> = {};

    for (const r of permRes.rows) {
      if (!permissionMap[r.module]) {
        permissionMap[r.module] = [];
      }

      permissionMap[r.module].push(r.permission);
    }

    const payload = {
      sub: user.id,

      name: user.name,

      orgId: user.orgId,

      orgCode: user.orgCode,

      orgName: user.orgName,

      roleId: user.orgRoleId,

      role: user.role,

      permissions: permissionMap,

      isSuper: user.isSuper,
    };

    const accessToken = generateAccessToken(payload);

    const refreshToken = generateRefreshToken(payload);

    setAuthCookies(req.res, accessToken, refreshToken, user.orgCode);

    return {
      success: true,

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
  } catch (err) {
    console.error(err);

    req.reject(500, {
      message: "Internal Server Error",
    });
  }
};

export const refreshHandler = async (req: any) => {
  try {
    const refreshToken = req.req?.cookies?.refreshToken;

    if (!refreshToken) {
      return req.error(401, "No refresh token");
    }

    const decoded: any = verifyRefreshToken(refreshToken);

    const accessToken = generateAccessToken({
      sub: decoded.sub,

      orgId: decoded.orgId,

      orgCode: decoded.orgCode,

      orgName: decoded.orgName,

      roleId: decoded.roleId,

      role: decoded.role,

      permissions: decoded.permissions,

      isSuper: decoded.isSuper,
    });

    req.res.cookie("accessToken", accessToken, {
      httpOnly: true,

      secure: process.env.NODE_ENV === "production",

      sameSite: "lax",

      maxAge: 15 * 60 * 1000,
    });

    return {
      success: true,
    };
  } catch {
    return req.error(401, "Invalid refresh token");
  }
};

export const logoutHandler = async (req: any) => {
  clearAuthCookies(req.res);

  return {
    success: true,
  };
};

export const meHandler = async (req: any) => {
  return {
    user: {
      ...req.user,

      permissions: JSON.stringify(req.user.permissions || {}),
    },
  };
};
