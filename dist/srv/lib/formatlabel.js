"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatLabel = formatLabel;
exports.sortRoleMatrix = sortRoleMatrix;
function formatLabel(value) {
    return value
        .split("_")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}
function sortRoleMatrix(roleMap) {
    return Object.values(roleMap)
        .map((role) => ({
        ...role,
        modules: Object.fromEntries(Object.entries(role.modules).sort(([a], [b]) => a.localeCompare(b))),
    }))
        .sort((a, b) => a.role.localeCompare(b.role));
}
