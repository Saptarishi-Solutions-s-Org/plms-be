import { verifyAccessToken } from "../lib/jwt";

export const withAuth = (
  handler: any,
  module?: string,
  actions: string[] = [],
) => {
  return async (req: any) => {
    try {
      const token = req.req?.cookies?.accessToken;

      if (!token) {
        console.error("NO ACCESS TOKEN");

        return req.error(401, "Unauthorized");
      }

      const decoded: any = verifyAccessToken(token);

      console.log("DECODED USER:", decoded);

      req.user = {
        id: decoded.sub,

        name: decoded.name,

        orgId: decoded.orgId,

        orgCode: decoded.orgCode,

        orgName: decoded.orgName,

        roleId: decoded.roleId,

        role: decoded.role,

        permissions: decoded.permissions,

        isSuper: decoded.isSuper,
      };

      if (module && actions.length) {
        const modulePerms = decoded.permissions?.[module.toLowerCase()] || [];

        const hasAccess = actions.every((a: string) =>
          modulePerms.includes(a.toLowerCase()),
        );

        if (!hasAccess) {
          return req.error(403, "Forbidden");
        }
      }

      return handler(req);
    } catch (err) {
      console.error("AUTH ERROR:", err);

      return req.error(401, "Unauthorized");
    }
  };
};
