"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDurationMs = parseDurationMs;
const DURATION_PATTERN = /^(\d+)\s*([smhd])$/i;
const UNIT_TO_MS = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
};
function parseDurationMs(value, fallback) {
    const raw = value || fallback;
    const match = DURATION_PATTERN.exec(raw.trim());
    if (!match) {
        return parseDurationMs(fallback, "7d");
    }
    return Number(match[1]) * UNIT_TO_MS[match[2].toLowerCase()];
}
