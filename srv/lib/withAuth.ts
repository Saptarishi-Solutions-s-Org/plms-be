import { verifyToken } from "./jwt";

export function withAuth(required?: string) {
  return (req: any) => {
    const auth = req.headers.authorization;
    if (!auth) throw new Error("Unauthorized");

    const token = auth.split(" ")[1];
    const user: any = verifyToken(token);

    if (required) {
      const [module, permission] = required.split(".");
      const m = module.toLowerCase();
      const p = permission.toLowerCase();

      if (!user.permissions[m]?.includes(p)) {
        throw new Error("Forbidden");
      }
    }

    req.user = user;
  };
}
