import { verifyToken } from "../lib/jwt";

export const withAuth = (
  handler: any,
  module?: string,
  actions: string[] = [],
) => {
  return async (req: any) => {
    try {
      const authHeader =
        req.headers?.authorization ||
        req._?.req?.headers?.authorization ||
        req.req?.headers?.authorization;

      if (!authHeader) {
        return req.error(401, "Unauthorized");
      }

      const token = authHeader.split(" ")[1];

      const decoded: any = verifyToken(token);

      if (!decoded) return req.error(401, "Invalid token");

      req.user = decoded;

      if (module && actions.length) {
        const modulePerms = decoded.permissions?.[module.toLowerCase()] || [];

        const hasAccess = actions.every((a) =>
          modulePerms.includes(a.toLowerCase()),
        );

        if (!hasAccess) return req.error(403, "Forbidden");
      }

      return handler(req);
    } catch (err) {
      console.error("AUTH ERROR:", err);
      return req.error(401, "Unauthorized");
    }
  };
};
