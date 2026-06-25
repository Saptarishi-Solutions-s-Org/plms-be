import dotenv from "dotenv";
dotenv.config();

import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { ENV } from "../config/env";

const SECRET = ENV.JWT_SECRET;
const ACCESS_EXPIRES_IN = ENV.JWT_EXPIRES_IN;

if (!SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export type AccessTokenPayload = JwtPayload & {
  type: "access";
  userId: string;
  orgId: string;
  roleId: string;
  role: string;
  permissions: Record<string, string[]>;
  mustChangePassword?: boolean;
  isSuper?: boolean;
};

export function generateAccessToken(payload: Omit<AccessTokenPayload, "type">) {
  return jwt.sign({ ...payload, type: "access" }, SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, SECRET) as AccessTokenPayload;

  if (decoded.type !== "access") {
    throw new Error("Invalid token type");
  }

  return decoded;
}

export const generateToken = generateAccessToken;
export const verifyToken = verifyAccessToken;
