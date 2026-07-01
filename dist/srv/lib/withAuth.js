"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAuth = void 0;
const jwt_1 = require("./jwt");
const db_1 = require("./db");
const sessionValidation_1 = require("./sessionValidation");
function normalizeList(values) {
    return Array.isArray(values)
        ? values.map((value) => String(value).toLowerCase())
        : [];
}
function normalizePermissions(rawPermissions) {
    if (typeof rawPermissions !== "object" ||
        rawPermissions === null ||
        Array.isArray(rawPermissions)) {
        return {};
    }
    const permissions = {};
    for (const [moduleName, actions] of Object.entries(rawPermissions)) {
        if (!Array.isArray(actions))
            continue;
        permissions[moduleName.toLowerCase()] = actions.map((action) => String(action).toLowerCase());
    }
    return permissions;
}
const withAuth = (handler, requirements) => {
    return async (req) => {
        try {
            const authHeader = req.headers?.authorization ||
                req.req?.headers?.authorization ||
                req._?.req?.headers?.authorization;
            if (!authHeader) {
                return req.error(401, "Unauthorized: missing Authorization header");
            }
            const [scheme, token] = String(authHeader).split(" ");
            if (scheme?.toLowerCase() !== "bearer" || !token) {
                return req.error(401, "Unauthorized: malformed Authorization header");
            }
            const decoded = (0, jwt_1.verifyToken)(token);
            if (!decoded || decoded.type !== "access") {
                return req.error(401, "Unauthorized: invalid or expired token");
            }
            const jwtRoles = Array.isArray(decoded.roles)
                ? normalizeList(decoded.roles)
                : decoded.role
                    ? [String(decoded.role).toLowerCase()]
                    : [];
            const jwtPermissions = normalizePermissions(decoded.permissions);
            req.user = {
                id: decoded.userId,
                userId: decoded.userId,
                orgId: decoded.orgId,
                roleId: decoded.roleId,
                role: decoded.role,
                roles: jwtRoles,
                permissions: jwtPermissions,
                mustChangePassword: decoded.mustChangePassword === true,
                isSuper: decoded.isSuper,
            };
            const sessionValid = await (0, sessionValidation_1.validateSessionState)({
                decoded,
                permissions: jwtPermissions,
            });
            if (!sessionValid) {
                return req.error(401, "Unauthorized: session expired");
            }
            const allowForcedPasswordChange = requirements?.allowForcedPasswordChange === true;
            if (req.user.mustChangePassword &&
                !allowForcedPasswordChange) {
                return req.error(403, "Password change required");
            }
            if (!req.user.mustChangePassword) {
                const forcedPasswordRes = await db_1.pool.query(`SELECT must_change_password FROM crm_user WHERE id = $1 LIMIT 1`, [req.user.id]);
                const mustChangePassword = forcedPasswordRes.rows[0]?.must_change_password === true;
                req.user.mustChangePassword = mustChangePassword;
                if (mustChangePassword && !allowForcedPasswordChange) {
                    return req.error(403, "Password change required");
                }
            }
            if (!requirements || Object.keys(requirements).length === 0) {
                return handler(req);
            }
            const { roles: requiredRoles, modules: moduleRequirements } = requirements;
            if (requiredRoles && requiredRoles.length > 0) {
                const normalizedRequired = normalizeList(requiredRoles);
                const hasRole = jwtRoles.some((role) => normalizedRequired.includes(role));
                if (!hasRole) {
                    console.warn(`[RBAC] DENIED (role) | user=${req.user.id} | ` +
                        `userRoles=${jwtRoles.join(",")} | ` +
                        `requiredRoles=${normalizedRequired.join(",")} | ` +
                        `orgId=${req.user.orgId}`);
                    return req.error(403, "Forbidden: insufficient role");
                }
            }
            if (!moduleRequirements || Object.keys(moduleRequirements).length === 0) {
                return handler(req);
            }
            for (const [moduleName, requiredActions] of Object.entries(moduleRequirements)) {
                if (!Array.isArray(requiredActions) || requiredActions.length === 0) {
                    console.warn(`[RBAC] Invalid config for module: ${moduleName}`);
                    return req.error(500, "Invalid authorization configuration");
                }
                const normalizedModule = moduleName.toLowerCase();
                const normalizedActions = normalizeList(requiredActions);
                const modulePerms = jwtPermissions[normalizedModule] ?? [];
                const finalPerms = new Set(modulePerms);
                if (finalPerms.has("*"))
                    continue;
                const hasAll = normalizedActions.every((action) => finalPerms.has(action));
                if (!hasAll) {
                    const missingActions = normalizedActions.filter((action) => !finalPerms.has(action));
                    console.warn(`[RBAC] DENIED | user=${req.user.id} | roles=${jwtRoles.join(",")} | ` +
                        `module=${normalizedModule} | required=${normalizedActions.join(",")} | ` +
                        `missing=${missingActions.join(",")} | orgId=${req.user.orgId}`);
                    return req.error(403, "Forbidden: insufficient permissions");
                }
            }
            return handler(req);
        }
        catch (err) {
            console.error("[withAuth] Unexpected error:", err);
            return req.error(401, "Unauthorized");
        }
    };
};
exports.withAuth = withAuth;
