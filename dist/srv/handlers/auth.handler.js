"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutHandler = exports.refreshHandler = exports.loginHandler = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jwt_1 = require("../lib/jwt");
const db_1 = require("../lib/db");
const cookies_1 = require("../lib/cookies");
const refreshToken_1 = require("../lib/refreshToken");
async function getAuthUserByEmail(email) {
    const userRes = await db_1.pool.query(`
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
      r.name as "role"
    FROM crm_user u
    JOIN crm_organization o ON o.id = u.organization_id
    JOIN crm_organizationroles orr ON orr.id = u.role_id
    JOIN crm_roles r ON r.id = orr.role_id
    WHERE u.email = $1
    `, [email]);
    return userRes.rows[0] || null;
}
async function getAuthUserById(userId) {
    const userRes = await db_1.pool.query(`
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
      r.name as "role"
    FROM crm_user u
    JOIN crm_organization o ON o.id = u.organization_id
    JOIN crm_organizationroles orr ON orr.id = u.role_id
    JOIN crm_roles r ON r.id = orr.role_id
    WHERE u.id = $1
      AND u.is_active = true
      AND o.is_active = true
    `, [userId]);
    return userRes.rows[0] || null;
}
async function getPermissionMap(user) {
    const permRes = await db_1.pool.query(`
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
    `, [user.orgId, user.orgRoleId]);
    const permissionMap = {};
    for (const row of permRes.rows) {
        const moduleName = String(row.module || "").toLowerCase();
        const permission = String(row.permission || "").toLowerCase();
        if (!moduleName || !permission)
            continue;
        if (!permissionMap[moduleName])
            permissionMap[moduleName] = [];
        permissionMap[moduleName].push(permission);
    }
    return permissionMap;
}
async function buildAuthResponse(user) {
    const permissions = await getPermissionMap(user);
    const accessToken = (0, jwt_1.generateAccessToken)({
        userId: user.id,
        orgId: user.orgId,
        roleId: user.orgRoleId,
        role: user.role,
        permissions,
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
        },
    };
}
const loginHandler = async (req) => {
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
        const valid = await bcrypt_1.default.compare(password, user.password || "");
        if (!valid) {
            return req.error(401, "Password is incorrect");
        }
        const { userAgent, ipAddress } = (0, cookies_1.getRequestMetadata)(req);
        const refreshSession = await (0, refreshToken_1.createRefreshTokenSession)({
            userId: user.id,
            userAgent,
            ipAddress,
        });
        (0, cookies_1.setRefreshTokenCookie)(req, refreshSession.token);
        (0, cookies_1.setUserHintCookie)(req, user);
        return buildAuthResponse(user);
    }
    catch (err) {
        console.error("[auth.login]", err);
        req.reject(500, { message: "Server is down. Please try again later" });
    }
};
exports.loginHandler = loginHandler;
const refreshHandler = async (req) => {
    try {
        const refreshToken = (0, cookies_1.getRefreshTokenCookie)(req);
        if (!refreshToken) {
            return req.error(401, "Unauthorized: missing refresh token");
        }
        const tokenRecord = await (0, refreshToken_1.findRefreshToken)(refreshToken);
        if (!tokenRecord || !(0, refreshToken_1.isRefreshTokenUsable)(tokenRecord)) {
            (0, cookies_1.clearRefreshTokenCookie)(req);
            (0, cookies_1.clearUserHintCookie)(req);
            return req.error(401, "Unauthorized: invalid refresh token");
        }
        const user = await getAuthUserById(tokenRecord.user_id);
        if (!user) {
            await (0, refreshToken_1.revokeRefreshToken)(tokenRecord.id);
            (0, cookies_1.clearRefreshTokenCookie)(req);
            (0, cookies_1.clearUserHintCookie)(req);
            return req.error(401, "Unauthorized: user inactive");
        }
        const { userAgent, ipAddress } = (0, cookies_1.getRequestMetadata)(req);
        const replacement = await (0, refreshToken_1.rotateRefreshToken)({
            currentTokenId: tokenRecord.id,
            userId: user.id,
            userAgent,
            ipAddress,
        });
        (0, cookies_1.setRefreshTokenCookie)(req, replacement.token);
        (0, cookies_1.setUserHintCookie)(req, user);
        return buildAuthResponse(user);
    }
    catch (err) {
        console.error("[auth.refresh]", err);
        return req.error(401, "Unauthorized");
    }
};
exports.refreshHandler = refreshHandler;
const logoutHandler = async (req) => {
    try {
        const refreshToken = (0, cookies_1.getRefreshTokenCookie)(req);
        if (refreshToken) {
            const tokenRecord = await (0, refreshToken_1.findRefreshToken)(refreshToken);
            if (tokenRecord) {
                await (0, refreshToken_1.revokeRefreshToken)(tokenRecord.id);
            }
        }
        (0, cookies_1.clearRefreshTokenCookie)(req);
        (0, cookies_1.clearUserHintCookie)(req);
        return { message: "Logged out successfully" };
    }
    catch (err) {
        console.error("[auth.logout]", err);
        (0, cookies_1.clearRefreshTokenCookie)(req);
        (0, cookies_1.clearUserHintCookie)(req);
        return { message: "Logged out successfully" };
    }
};
exports.logoutHandler = logoutHandler;
