import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  REFRESH_COOKIE_NAME: process.env.REFRESH_COOKIE_NAME || "plms_refresh_token",
  REFRESH_COOKIE_DOMAIN: process.env.REFRESH_COOKIE_DOMAIN || "",
  REFRESH_COOKIE_SAMESITE: process.env.REFRESH_COOKIE_SAMESITE || "",
  REFRESH_COOKIE_SECURE: process.env.REFRESH_COOKIE_SECURE || "",
};

if (!ENV.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}
