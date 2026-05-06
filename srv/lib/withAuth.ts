import { verifyToken } from "./jwt";
import {
  ModulePermissions,
  WithAuthRequirements,
  WithAuthTokenPayload,
} from "../types/withAuth.types";

export const withAuth = (handler: any, requirements?: WithAuthRequirements) => {
  return async (req: any) => {
    try {

      const authHeader =
        req.headers?.authorization       ||
        req.req?.headers?.authorization  ||
        req._?.req?.headers?.authorization;

      if (!authHeader) {
        return req.error(401, "Unauthorized: missing Authorization header");
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        return req.error(401, "Unauthorized: malformed Authorization header");
      }

      const decoded = verifyToken(token) as WithAuthTokenPayload;
      if (!decoded) {
        return req.error(401, "Unauthorized: invalid or expired token");
      }

      // ── Normalize roles ──────────────────────────────────────────────
      const jwtRoles: string[] = Array.isArray(decoded.roles)
        ? decoded.roles.map((r) => r.toLowerCase())
        : [decoded.role?.toLowerCase() ?? "executive"];

      // ── Normalize permissions once — keys + values both lowercased ───
      const rawPermissions =
        typeof decoded.permissions === "object" &&
        decoded.permissions !== null &&
        !Array.isArray(decoded.permissions)
          ? decoded.permissions
          : {};

      const jwtPermissions: ModulePermissions = {};
      for (const key in rawPermissions) {
        jwtPermissions[key.toLowerCase()] =
          rawPermissions[key].map((p: string) => p.toLowerCase());
      }

      req.user = {
        id:          decoded.userId,
        orgId:       decoded.orgId,
        roles:       jwtRoles,
        permissions: jwtPermissions,
      };

      if (!requirements || Object.keys(requirements).length === 0) {
        return handler(req);
      }

      const { roles: requiredRoles, modules: moduleRequirements } = requirements;

      if (requiredRoles && requiredRoles.length > 0) {
        const normalizedRequired = requiredRoles.map((r) => r.toLowerCase());
        const hasRole = jwtRoles.some((r) => normalizedRequired.includes(r));

        if (!hasRole) {
          console.warn(
            `[RBAC] DENIED (role) | user=${req.user.id} | ` +
            `userRoles=${jwtRoles.join(",")} | ` +
            `requiredRoles=${normalizedRequired.join(",")} | ` +
            `orgId=${req.user.orgId}`
          );
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

        const normalizedModule  = moduleName.toLowerCase();
        const normalizedActions = requiredActions.map((a) => a.toLowerCase());

        const modulePerms = jwtPermissions[normalizedModule] ?? [];
        const finalPerms  = new Set<string>(modulePerms);

        if (finalPerms.has("*")) continue;

        const hasAll = normalizedActions.every((action) => finalPerms.has(action));

        if (!hasAll) {
          const missingActions = normalizedActions.filter((a) => !finalPerms.has(a));
          console.warn(
            `[RBAC] DENIED | user=${req.user.id} | roles=${jwtRoles.join(",")} | ` +
            `module=${normalizedModule} | required=${normalizedActions.join(",")} | ` +
            `missing=${missingActions.join(",")} | orgId=${req.user.orgId}`
          );
          return req.error(403, "Forbidden: insufficient permissions");
        }
      }

      return handler(req);

    } catch (err) {
      console.error("[withAuth] Unexpected error:", err);
      return req.error(401, "Unauthorized");
    }
  };
};