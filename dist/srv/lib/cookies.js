"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRefreshTokenCookie = getRefreshTokenCookie;
exports.setRefreshTokenCookie = setRefreshTokenCookie;
exports.clearRefreshTokenCookie = clearRefreshTokenCookie;
exports.setUserHintCookie = setUserHintCookie;
exports.clearUserHintCookie = clearUserHintCookie;
exports.getRequestMetadata = getRequestMetadata;
const env_1 = require("../config/env");
const duration_1 = require("./duration");
const COOKIE_NAME = env_1.ENV.REFRESH_COOKIE_NAME;
const USER_HINT_COOKIE_NAME = "plms_user_hint";
function getResponse(req) {
    return req.res || req.req?.res || req._?.res || req._?.req?.res;
}
function getRequest(req) {
    return req.req || req._?.req || req;
}
function cookieOptions() {
    const sameSite = env_1.ENV.REFRESH_COOKIE_SAMESITE ||
        (process.env.NODE_ENV === "production" ? "none" : "lax");
    const secure = env_1.ENV.REFRESH_COOKIE_SECURE !== ""
        ? env_1.ENV.REFRESH_COOKIE_SECURE === "true"
        : process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure,
        sameSite,
        path: "/",
        domain: env_1.ENV.REFRESH_COOKIE_DOMAIN || undefined,
        maxAge: (0, duration_1.parseDurationMs)(env_1.ENV.JWT_REFRESH_EXPIRES_IN, "7d"),
    };
}
function userHintCookieOptions() {
    const { httpOnly, ...options } = cookieOptions();
    return {
        ...options,
        httpOnly: false,
    };
}
function getRefreshTokenCookie(req) {
    const request = getRequest(req);
    const cookieHeader = req.headers?.cookie ||
        request?.headers?.cookie ||
        req._?.req?.headers?.cookie;
    if (!cookieHeader || typeof cookieHeader !== "string")
        return undefined;
    const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
    const found = cookies.find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));
    if (!found)
        return undefined;
    return decodeURIComponent(found.slice(COOKIE_NAME.length + 1));
}
function setRefreshTokenCookie(req, token) {
    const res = getResponse(req);
    if (!res)
        return;
    res.cookie(COOKIE_NAME, token, cookieOptions());
}
function clearRefreshTokenCookie(req) {
    const res = getResponse(req);
    if (!res)
        return;
    res.clearCookie(COOKIE_NAME, {
        ...cookieOptions(),
        maxAge: undefined,
    });
}
function setUserHintCookie(req, user) {
    const res = getResponse(req);
    if (!res)
        return;
    res.cookie(USER_HINT_COOKIE_NAME, JSON.stringify({
        orgCode: user.orgCode,
        role: user.role,
    }), userHintCookieOptions());
}
function clearUserHintCookie(req) {
    const res = getResponse(req);
    if (!res)
        return;
    res.clearCookie(USER_HINT_COOKIE_NAME, {
        ...userHintCookieOptions(),
        maxAge: undefined,
    });
}
function getRequestMetadata(req) {
    const request = getRequest(req);
    const forwardedFor = request?.headers?.["x-forwarded-for"];
    const ip = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)
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
