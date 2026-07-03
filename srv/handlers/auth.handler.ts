import bcrypt from "bcrypt";
import { generateAccessToken } from "../lib/jwt";
import { pool } from "../lib/db";
import {
  clearUserHintCookie,
  clearRefreshTokenCookie,
  getRefreshTokenCookie,
  getRequestMetadata,
  setRefreshTokenCookie,
  setUserHintCookie,
} from "../lib/cookies";
import {
  createRefreshTokenSession,
  findRefreshToken,
  isRefreshTokenUsable,
  revokeOtherRefreshTokens,
  revokeRefreshToken,
  rotateRefreshToken,
} from "../lib/refreshToken";
import { validatePasswordPolicy } from "../lib/passwordPolicy";

type PermissionMap = Record<string, string[]>;

type AuthUserRow = {
  id: string;
  name: string;
  password?: string;
  orgId: string;
  orgCode: string;
  orgName: string;
  isActive: boolean;
  orgIsActive: boolean;
  isSuper: boolean;
  orgRoleId: string;
  role: string;
  sessionVersion: number;
  mustChangePassword: boolean;
};

async function getAuthUserByEmail(email: string) {
  const userRes = await pool.query<AuthUserRow>(
    `
    SELECT
      u.id,
      u.name,
      u.password,
      u.organization_id as "orgId",
      o.code as "orgCode",
      o.name as "orgName",
      u.is_active as "isActive",
      o.is_active as "orgIsActive",
      o.is_super_organization as "isSuper",
      u.role_id as "orgRoleId",
      r.name as "role",
      COALESCE(u.session_version, 1) as "sessionVersion",
      COALESCE(u.must_change_password, false) as "mustChangePassword"
    FROM crm_user u
    JOIN crm_organization o ON o.id = u.organization_id
    JOIN crm_organizationroles orr ON orr.id = u.role_id
    JOIN crm_roles r ON r.id = orr.role_id
    WHERE u.email = $1
    `,
    [email],
  );

  return userRes.rows[0] || null;
}

async function getAuthUserById(userId: string) {
  const userRes = await pool.query<AuthUserRow>(
    `
    SELECT
      u.id,
      u.name,
      u.organization_id as "orgId",
      o.code as "orgCode",
      o.name as "orgName",
      u.is_active as "isActive",
      o.is_active as "orgIsActive",
      o.is_super_organization as "isSuper",
      u.role_id as "orgRoleId",
      r.name as "role",
      COALESCE(u.session_version, 1) as "sessionVersion",
      COALESCE(u.must_change_password, false) as "mustChangePassword"
    FROM crm_user u
    JOIN crm_organization o ON o.id = u.organization_id
    JOIN crm_organizationroles orr ON orr.id = u.role_id
    JOIN crm_roles r ON r.id = orr.role_id
    WHERE u.id = $1
      AND u.is_active = true
      AND o.is_active = true
    `,
    [userId],
  );

  return userRes.rows[0] || null;
}

async function getPermissionMap(user: AuthUserRow): Promise<PermissionMap> {
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

  const permissionMap: PermissionMap = {};

  for (const row of permRes.rows) {
    const moduleName = String(row.module || "").toLowerCase();
    const permission = String(row.permission || "").toLowerCase();
    if (!moduleName || !permission) continue;

    if (!permissionMap[moduleName]) permissionMap[moduleName] = [];
    permissionMap[moduleName].push(permission);
  }

  return permissionMap;
}

async function buildAuthResponse(user: AuthUserRow) {
  const permissions = await getPermissionMap(user);
  const accessToken = generateAccessToken({
    userId: user.id,
    orgId: user.orgId,
    roleId: user.orgRoleId,
    role: user.role,
    sessionVersion: user.sessionVersion,
    permissions,
    mustChangePassword: user.mustChangePassword,
    isSuper: user.isSuper,
  });

  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      orgId: user.orgId,
      orgCode: user.orgCode,
      orgName: user.orgName,
      roleId: user.orgRoleId,
      role: user.role,
      permissions,
      mustChangePassword: user.mustChangePassword,
    },
  };
}

async function replaceRefreshSession(req: any, userId: string) {
  const { userAgent, ipAddress } = getRequestMetadata(req);
  const refreshToken = getRefreshTokenCookie(req);
  const currentRefreshRecord = refreshToken
    ? await findRefreshToken(refreshToken)
    : null;

  const replacement =
    currentRefreshRecord &&
    currentRefreshRecord.user_id === userId &&
    isRefreshTokenUsable(currentRefreshRecord)
      ? await rotateRefreshToken({
          currentTokenId: currentRefreshRecord.id,
          userId,
          userAgent,
          ipAddress,
        })
      : await createRefreshTokenSession({
          userId,
          userAgent,
          ipAddress,
        });

  await revokeOtherRefreshTokens(userId, replacement.id);
  setRefreshTokenCookie(req, replacement.token);
}

export const loginHandler = async (req: any) => {
  try {
    const { email, password } = req.data;

    if (!email || !password) {
      return req.error(400, "Email and password are required");
    }

    const user = await getAuthUserByEmail(email);

    if (!user) {
      return req.error(401, "Account not found");
    }

    if (!user.isActive || !user.orgIsActive) {
      return req.error(403, "Account is not active");
    }

    const valid = await bcrypt.compare(password, user.password || "");

    if (!valid) {
      return req.error(401, "Password is incorrect");
    }

    const { userAgent, ipAddress } = getRequestMetadata(req);
    const refreshSession = await createRefreshTokenSession({
      userId: user.id,
      userAgent,
      ipAddress,
    });

    setRefreshTokenCookie(req, refreshSession.token);
    setUserHintCookie(req, user);

    return buildAuthResponse(user);
  } catch (err: any) {
    console.error("[auth.login]", err);
    req.reject(500, { message: "Server is down. Please try again later" });
  }
};

export const refreshHandler = async (req: any) => {
  try {
    const refreshToken = getRefreshTokenCookie(req);

    if (!refreshToken) {
      return req.error(401, "Unauthorized: missing refresh token");
    }

    const tokenRecord = await findRefreshToken(refreshToken);

    if (!tokenRecord || !isRefreshTokenUsable(tokenRecord)) {
      clearRefreshTokenCookie(req);
      clearUserHintCookie(req);
      return req.error(401, "Unauthorized: invalid refresh token");
    }

    const user = await getAuthUserById(tokenRecord.user_id);

    if (!user) {
      await revokeRefreshToken(tokenRecord.id);
      clearRefreshTokenCookie(req);
      clearUserHintCookie(req);
      return req.error(401, "Unauthorized: user inactive");
    }

    const { userAgent, ipAddress } = getRequestMetadata(req);
    const replacement = await rotateRefreshToken({
      currentTokenId: tokenRecord.id,
      userId: user.id,
      userAgent,
      ipAddress,
    });

    setRefreshTokenCookie(req, replacement.token);
    setUserHintCookie(req, user);

    return buildAuthResponse(user);
  } catch (err: any) {
    console.error("[auth.refresh]", err);
    return req.error(401, "Unauthorized");
  }
};

export const setPasswordHandler = async (req: any) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return req.error(401, "Unauthorized");

    const { password, confirmPassword } = req.data;

    if (!password || !confirmPassword) {
      return req.error(400, "Password and confirm password are required");
    }

    if (password !== confirmPassword) {
      return req.error(400, "Passwords do not match");
    }

    const policy = validatePasswordPolicy(password);
    if (!policy.valid) {
      return req.error(400, policy.message);
    }

    const currentUser = await getAuthUserById(userId);
    if (!currentUser) {
      return req.error(401, "Unauthorized: user inactive");
    }

    if (!currentUser.mustChangePassword) {
      return req.error(400, "Password has already been set");
    }

    const newHash = await bcrypt.hash(password, 10);
    await pool.query(
      `
      UPDATE crm_user
      SET password = $1,
          must_change_password = false,
          modifiedat = NOW(),
          modifiedby = $2
      WHERE id = $2
      `,
      [newHash, userId],
    );

    const updatedUser = await getAuthUserById(userId);
    if (!updatedUser) {
      return req.error(401, "Unauthorized: user inactive");
    }

    await replaceRefreshSession(req, userId);
    setUserHintCookie(req, updatedUser);

    return buildAuthResponse(updatedUser);
  } catch (err: any) {
    console.error("[auth.setPassword]", err);
    return req.error(500, "Failed to set password");
  }
};

export const logoutHandler = async (req: any) => {
  try {
    const refreshToken = getRefreshTokenCookie(req);

    if (refreshToken) {
      const tokenRecord = await findRefreshToken(refreshToken);
      if (tokenRecord) {
        await revokeRefreshToken(tokenRecord.id);
      }
    }

    clearRefreshTokenCookie(req);
    clearUserHintCookie(req);

    return { message: "Logged out successfully" };
  } catch (err: any) {
    console.error("[auth.logout]", err);
    clearRefreshTokenCookie(req);
    clearUserHintCookie(req);
    return { message: "Logged out successfully" };
  }
};
