import jwt, { SignOptions } from "jsonwebtoken";

import { ENV } from "../config/env";

import { AccessTokenPayload, RefreshTokenPayload } from "../types/jwt.types";

const ACCESS_OPTIONS: SignOptions = {
  expiresIn: ENV.JWT_EXPIRES_IN,
  algorithm: "HS256",
};

const REFRESH_OPTIONS: SignOptions = {
  expiresIn: ENV.JWT_REFRESH_EXPIRES_IN,
  algorithm: "HS256",
};

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ENV.JWT_SECRET, ACCESS_OPTIONS);
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, ENV.JWT_REFRESH_SECRET, REFRESH_OPTIONS);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ENV.JWT_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, ENV.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}
