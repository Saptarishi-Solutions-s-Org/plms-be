import { verifyToken } from "../lib/jwt";
import { AppUser } from "../types/appuser";

export const withAuth = (
  handler: any,
  allowedRoles: string[] = [],
  requiredPermissions: string[] = [],
) => {
  return async (req: any) => {
    try {
      const authHeader =
        req.headers?.authorization || req._?.req?.headers?.authorization;

      if (!authHeader) {
        throw new Error("No auth header");
      }

      const token = authHeader.split(" ")[1];

      const decoded = verifyToken(token) as AppUser;

      if (!decoded || typeof decoded === "string") {
        throw new Error("Invalid token");
      }

      // ✅ ROLE CHECK
      if (
        allowedRoles.length &&
        !allowedRoles
          .map((r) => r.toUpperCase())
          .includes(decoded.role?.toUpperCase())
      ) {
        throw new Error("Forbidden");
      }

      // ✅ PERMISSION CHECK
      if (requiredPermissions.length) {
        const hasAccess = requiredPermissions.every((perm) => {
          const [module, action] = perm.split(".");
          return decoded.permissions?.[module]?.includes(action);
        });

        if (!hasAccess) {
          throw new Error("Permission Denied");
        }
      }

      req.user = decoded;

      return await handler(req); // ✅ IMPORTANT
    } catch (err) {
      console.error("AUTH ERROR:", err);
      return { error: "Unauthorized" }; // ✅ NEVER use req.error here
    }
  };
};
