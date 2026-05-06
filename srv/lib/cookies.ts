import { Response } from "express";

const isProduction = process.env.NODE_ENV === "production";

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  orgCode: string,
) {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,

    secure: isProduction,

    sameSite: "lax",

    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,

    secure: isProduction,

    sameSite: "strict",

    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.cookie("orgCode", orgCode, {
    httpOnly: false,

    secure: isProduction,

    sameSite: "lax",

    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("accessToken");

  res.clearCookie("refreshToken");

  res.clearCookie("orgCode");
}
