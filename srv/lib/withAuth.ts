import { verifyToken } from "../lib/jwt";
import { AppUser } from "../types/appuser";

export const withAuth = (handler: any, allowedRoles: string[] = []) => {
  return async (req: any) => {
    try {
      const authHeader = req.headers?.authorization;

      if (!authHeader) {
        return req.error(401, "Unauthorized");
      }

      const token = authHeader.split(" ")[1];

      const decoded = verifyToken(token) as AppUser;

      if (!decoded || typeof decoded === "string") {
        return req.error(401, "Invalid token");
      }

      if (
        allowedRoles.length &&
        !allowedRoles
          .map((r) => r.toUpperCase())
          .includes(decoded.role?.toUpperCase())
      ) {
        return req.error(403, "Forbidden");
      }

      req.user = decoded;

      return handler(req);
    } catch {
      return req.error(401, "Unauthorized");
    }
  };
};
