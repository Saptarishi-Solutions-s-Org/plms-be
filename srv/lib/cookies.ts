import { ENV } from "../config/env";
import { parseDurationMs } from "./duration";

const COOKIE_NAME = ENV.REFRESH_COOKIE_NAME;
const USER_HINT_COOKIE_NAME = "plms_user_hint";

function getResponse(req: any) {
  return req.res || req.req?.res || req._?.res || req._?.req?.res;
}

function getRequest(req: any) {
  return req.req || req._?.req || req;
}

function cookieOptions() {
  const sameSite =
    ENV.REFRESH_COOKIE_SAMESITE ||
    (process.env.NODE_ENV === "production" ? "none" : "lax");
  const secure =
    ENV.REFRESH_COOKIE_SECURE !== ""
      ? ENV.REFRESH_COOKIE_SECURE === "true"
      : process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    domain: ENV.REFRESH_COOKIE_DOMAIN || undefined,
    maxAge: parseDurationMs(ENV.JWT_REFRESH_EXPIRES_IN, "7d"),
  };
}

function userHintCookieOptions() {
  const { httpOnly, ...options } = cookieOptions();
  return {
    ...options,
    httpOnly: false,
  };
}

export function getRefreshTokenCookie(req: any): string | undefined {
  const request = getRequest(req);
  const cookieHeader =
    req.headers?.cookie ||
    request?.headers?.cookie ||
    req._?.req?.headers?.cookie;

  if (!cookieHeader || typeof cookieHeader !== "string") return undefined;

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const found = cookies.find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));

  if (!found) return undefined;

  return decodeURIComponent(found.slice(COOKIE_NAME.length + 1));
}

export function setRefreshTokenCookie(req: any, token: string) {
  const res = getResponse(req);
  if (!res) return;

  res.cookie(COOKIE_NAME, token, cookieOptions());
}

export function clearRefreshTokenCookie(req: any) {
  const res = getResponse(req);
  if (!res) return;

  res.clearCookie(COOKIE_NAME, {
    ...cookieOptions(),
    maxAge: undefined,
  });
}

export function setUserHintCookie(
  req: any,
  user: { orgCode: string; role?: string },
) {
  const res = getResponse(req);
  if (!res) return;

  res.cookie(
    USER_HINT_COOKIE_NAME,
    JSON.stringify({
      orgCode: user.orgCode,
      role: user.role,
    }),
    userHintCookieOptions(),
  );
}

export function clearUserHintCookie(req: any) {
  const res = getResponse(req);
  if (!res) return;

  res.clearCookie(USER_HINT_COOKIE_NAME, {
    ...userHintCookieOptions(),
    maxAge: undefined,
  });
}

export function getRequestMetadata(req: any) {
  const request = getRequest(req);
  const forwardedFor = request?.headers?.["x-forwarded-for"];
  const ip =
    (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)
      ?.split(",")[0]
      ?.trim() ||
    request?.ip ||
    request?.socket?.remoteAddress ||
    null;

  return {
    userAgent: request?.headers?.["user-agent"] || null,
    ipAddress: ip,
  };
}
