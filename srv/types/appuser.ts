import { JwtPayload } from "jsonwebtoken";

export type AppUser = JwtPayload & {
  type: "access";
  userId: string;
  orgId: string;
  roleId: string;
  role: string;
  permissions: Record<string, string[]>;
  isSuper?: boolean;
};
