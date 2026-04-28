import { verifyToken } from "../lib/jwt";

const ROLE_PERMISSIONS: Record<string, Record<string, string[]>> = {

  system_admin: {
    organization:  ["view", "create", "update", "delete"],
    user:          ["view", "create", "update", "delete"],
    roles:         [],
    lead:          [],
    lead_activity: [],
    offer:         [],
    reports:       [],
  },

  admin: {
    organization:  ["view", "update"],
    user:          ["view", "create", "update", "delete"],
    roles:         ["view", "create", "update", "delete"],
    offer:         ["view", "create", "update", "delete"],
    lead:          ["view"],
    lead_activity: [],
    reports:       [],
  },

  manager: {
    lead:          ["view", "create", "update", "delete", "import", "export"],
    lead_activity: ["view", "create"],
    offer:         ["view"],
    organization:  ["view"],
    user:          ["view"],
    roles:         [],
    reports:       ["view", "export"],
  },

  executive: {
    lead:          ["view", "create", "update"],
    lead_activity: ["view", "create"],
    offer:         ["view"],
    organization:  [],
    user:          [],
    roles:         [],
    reports:       [],
  },
};

/**
 * withAuth — authentication + RBAC middleware for SAP CAP handlers.
 *
 * Usage in bindings:
 *   withAuth(handler)                                   → auth only
 *   withAuth(handler, "lead",          ["view"])        → getLeadsWithStats
 *   withAuth(handler, "lead",          ["create"])      → createLead
 *   withAuth(handler, "lead",          ["update"])      → updateLead
 *   withAuth(handler, "lead",          ["delete"])      → deleteLead
 *   withAuth(handler, "lead",          ["import"])      → importLeads
 *   withAuth(handler, "lead",          ["export"])      → exportLeads
 *   withAuth(handler, "lead_activity", ["create"])      → addLeadActivity
 *   withAuth(handler, "lead_activity", ["view"])        → getLeadActivity
 *   withAuth(handler, "offer",         ["view"])        → getOffers
 *   withAuth(handler, "offer",         ["create"])      → createOffer
 *   withAuth(handler, "offer",         ["update"])      → updateOffer
 *   withAuth(handler, "offer",         ["delete"])      → deleteOffer
 *   withAuth(handler, "user",          ["view"])        → getUsers
 *   withAuth(handler, "user",          ["create"])      → createUser
 *   withAuth(handler, "user",          ["update"])      → updateUser
 *   withAuth(handler, "user",          ["delete"])      → deleteUser
 *   withAuth(handler, "roles",         ["view"])        → getRoles
 *   withAuth(handler, "roles",         ["update"])      → updateRolePermissions
 *   withAuth(handler, "reports",       ["view"])        → getReports
 *   withAuth(handler, "reports",       ["export"])      → exportReport
 *   withAuth(handler, "organization",  ["view"])        → getOrganization
 *   withAuth(handler, "organization",  ["create"])      → createOrganization
 */
export const withAuth = (
  handler: any,
  module?: string,
  actions: string[] = [],
) => {
  return async (req: any) => {
    try {

      // ── 1. Extract Authorization header ──────────────────────────────
      const authHeader =
        req.headers?.authorization ||
        req.req?.headers?.authorization ||
        req._?.req?.headers?.authorization;

      if (!authHeader) {
        return req.error(401, "Unauthorized: missing Authorization header");
      }

      // ── 2. Verify JWT ─────────────────────────────────────────────────
      const token = authHeader.split(" ")[1];

      if (!token) {
        return req.error(401, "Unauthorized: malformed Authorization header");
      }

      const decoded: any = verifyToken(token);

      if (!decoded) {
        return req.error(401, "Unauthorized: invalid or expired token");
      }

      // ── 3. Attach user to request ─────────────────────────────────────
      // decoded.permissions shape: { lead: ["view","create"], offer: ["view"] }
      // Built by loginHandler from OrganizationRoleModulePermissions table.
      req.user = {
        id:          decoded.userId,
        orgId:       decoded.orgId,
        role:        decoded.role?.toLowerCase() ?? "executive",
        permissions: decoded.permissions ?? {},
      };

      const { role } = req.user;

      // ── 4. Auth-only mode ─────────────────────────────────────────────
      if (!module || actions.length === 0) {
        return handler(req);
      }

      const normalizedModule  = module.toLowerCase();
      const normalizedActions = actions.map((a) => a.toLowerCase());

      // ── 5. Role baseline (Layer 2 — hardcoded map above) ─────────────
      const roleModulePerms: string[] =
        ROLE_PERMISSIONS[role]?.[normalizedModule] ?? [];

      // ── 6. Per-org overrides (Layer 3 — from DB via JWT) ─────────────
      // Admin configures these in the permission matrix screen.
      // Stored in JWT by loginHandler, merged on top of the baseline.
      const userModulePerms: string[] =
        req.user.permissions?.[normalizedModule] ?? [];

      // ── 7. Merge both layers ──────────────────────────────────────────
      const finalPerms = new Set<string>([
        ...roleModulePerms.map((p) => p.toLowerCase()),
        ...userModulePerms.map((p: string) => p.toLowerCase()),
      ]);

      // ── 8. Wildcard shortcut ──────────────────────────────────────────
      if (finalPerms.has("*")) {
        return handler(req);
      }

      // ── 9. Check every required action ───────────────────────────────
      const missingActions = normalizedActions.filter(
        (action) => !finalPerms.has(action),
      );

      if (missingActions.length > 0) {
        console.warn(
          `[RBAC] DENIED | user=${req.user.id} | role=${role} | ` +
          `module=${normalizedModule} | ` +
          `required=${normalizedActions.join(",")} | ` +
          `missing=${missingActions.join(",")} | ` +
          `orgId=${req.user.orgId}`,
        );
        return req.error(403, "Forbidden: insufficient permissions");
      }

      return handler(req);

    } catch (err) {
      console.error("[withAuth] Unexpected error:", err);
      return req.error(401, "Unauthorized");
    }
  };
};