import dotenv from "dotenv";
dotenv.config();

import { SignOptions } from "jsonwebtoken";

function getEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} is not defined`);
  }

  return value;
}

export const ENV = {
  JWT_SECRET: getEnv("JWT_SECRET"),

  JWT_REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET"),

  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN ||
    "15m") as SignOptions["expiresIn"],

  JWT_REFRESH_EXPIRES_IN: (process.env.JWT_REFRESH_EXPIRES_IN ||
    "7d") as SignOptions["expiresIn"],

  NODE_ENV: process.env.NODE_ENV || "development",
};
