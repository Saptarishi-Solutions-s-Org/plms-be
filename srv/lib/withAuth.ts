// srv/lib/withAuth.ts
import { pool } from "./db";
import { verifyToken } from "./jwt";

// ─── Types ─────────────────────────────────────────────────────────────────

type ModulePermissions = Record<string, string[]>;

type WithAuthRequirements = {
  roles?: string[];
  [module: string]: string[] | undefined;
};

const permCache = new Map<
  string,
  { data: ModulePermissions; expiresAt: number }
>();
const CACHE_TTL_MS = 60_000; // 1 minute

async function getRolePermissionsFromDB(
  orgId: string,
  roleNames: string[],
): Promise<ModulePermissions> {
  const cacheKey = `${orgId}:${roleNames.sort().join(",")}`;
  const cached = permCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const res = await pool.query(
    `SELECT
       m.name  AS module,
       p.name  AS permission,
       COALESCE(ormpo.access, rmp.access) AS access
     FROM crm_roles r
     JOIN crm_rolemodulepermissions rmp  ON rmp.role_id          = r.id
     JOIN crm_modulepermissions      mp   ON mp.id                = rmp.module_permission_id
     JOIN crm_modules                m    ON m.id                 = mp.module_id
     JOIN crm_permissions            p    ON p.id                 = mp.permission_id
     JOIN crm_organizationroles      orr  ON orr.role_id          = r.id
                                        AND orr.organization_id   = $1
     LEFT JOIN crm_organizationrolemodulepermissions ormpo
                                          ON ormpo.rmp_id         = rmp.id
                                         AND ormpo.organization_id = $1
     WHERE LOWER(r.name) = ANY($2::text[])
       AND COALESCE(ormpo.access, rmp.access) = true`,
    [orgId, roleNames.map((r) => r.toLowerCase())],
  );

  const data: ModulePermissions = {};
  for (const row of res.rows) {
    const mod = row.module.toLowerCase();
    const perm = row.permission.toLowerCase();
    if (!data[mod]) data[mod] = [];
    if (!data[mod].includes(perm)) data[mod].push(perm);
  }

  permCache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

// ─── withAuth ───

export const withAuth = (handler: any, requirements?: WithAuthRequirements) => {
  return async (req: any) => {
    try {
      const authHeader =
        req.headers?.authorization ||
        req.req?.headers?.authorization ||
        req._?.req?.headers?.authorization;

      if (!authHeader) {
        return req.error(401, "Unauthorized: missing Authorization header");
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        return req.error(401, "Unauthorized: malformed Authorization header");
      }

      const decoded: any = verifyToken(token);
      if (!decoded) {
        return req.error(401, "Unauthorized: invalid or expired token");
      }

      const jwtRoles: string[] = Array.isArray(decoded.roles)
        ? decoded.roles.map((r: string) => r.toLowerCase())
        : [decoded.role?.toLowerCase() ?? "executive"];

      req.user = {
        id: decoded.userId,
        orgId: decoded.orgId,
        roles: jwtRoles,
        permissions: decoded.permissions ?? {}, 
      };

      if (!requirements || Object.keys(requirements).length === 0) {
        return handler(req);
      }

      const { roles: requiredRoles, ...moduleRequirements } = requirements;

      if (requiredRoles && requiredRoles.length > 0) {
        const normalizedRequired = requiredRoles.map((r) => r.toLowerCase());
        const hasRole = jwtRoles.some((r) => normalizedRequired.includes(r));

        if (!hasRole) {
          console.warn(
            `[RBAC] DENIED (role) | user=${req.user.id} | ` +
              `userRoles=${jwtRoles.join(",")} | ` +
              `requiredRoles=${normalizedRequired.join(",")} | ` +
              `orgId=${req.user.orgId}`,
          );
          return req.error(403, "Forbidden: insufficient role");
        }
      }

      if (Object.keys(moduleRequirements).length === 0) {
        return handler(req);
      }

      const dbPerms = await getRolePermissionsFromDB(req.user.orgId, jwtRoles);

      for (const [moduleName, requiredActions] of Object.entries(
        moduleRequirements,
      )) {
        if (!requiredActions || requiredActions.length === 0) continue;

        const normalizedModule = moduleName.toLowerCase();
        const normalizedActions = requiredActions.map((a) => a.toLowerCase());

        const rolePerms: string[] = (dbPerms[normalizedModule] ?? []).map((p) =>
          p.toLowerCase(),
        );

        const userPerms: string[] = (
          req.user.permissions?.[normalizedModule] ?? []
        ).map((p: string) => p.toLowerCase());

        const finalPerms = new Set<string>([...rolePerms, ...userPerms]);

        if (finalPerms.has("*")) continue;

        const hasAll = normalizedActions.every((action) =>
          finalPerms.has(action),
        );

        if (!hasAll) {
          const missingActions = normalizedActions.filter(
            (a) => !finalPerms.has(a),
          );
          console.warn(
            `[RBAC] DENIED | user=${req.user.id} | roles=${req.user.roles.join(",")} | ` +
              `module=${normalizedModule} | required=${normalizedActions.join(",")} | ` +
              `missing=${missingActions.join(",")} | orgId=${req.user.orgId}`,
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
 