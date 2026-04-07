import { JwtPayload } from "jsonwebtoken";

export type AppUser = JwtPayload & {
  userId: string;
  orgId: string;
  roleId: string;
  role: string;
  permissions: Record<string, string[]>;
  isSuper?: boolean;
};