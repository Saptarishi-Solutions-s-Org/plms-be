import { JwtPayload } from "jsonwebtoken";

export interface AccessTokenPayload extends JwtPayload {
  sub: string;

  orgId?: string;
  orgCode?: string;
  orgName?: string;

  role?: string;

  permissions?: Record<string, string[]>;
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string;

  orgId?: string;
}
