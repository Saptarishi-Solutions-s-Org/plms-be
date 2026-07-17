"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidReportDate = exports.normalizeReportFilter = exports.REPORT_STATUSES = void 0;
exports.REPORT_STATUSES = {
    active: "active",
    inactive: "inactive",
    qualified: "qualified",
};
const normalizeReportFilter = (value) => typeof value === "string" ? value.trim() : "";
exports.normalizeReportFilter = normalizeReportFilter;
const isValidReportDate = (value) => {
    if (value === null)
        return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
        return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day);
};
exports.isValidReportDate = isValidReportDate;
