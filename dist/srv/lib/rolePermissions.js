"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canUpdateRoles = void 0;
const canUpdateRoles = (permissions = {}) => {
    const rolePermissions = [
        ...(permissions.permission ?? []),
        ...(permissions.permissions ?? []),
    ].map((permission) => String(permission).toLowerCase());
    return rolePermissions.some((permission) => ["*", "update", "edit", "updation"].includes(permission));
};
exports.canUpdateRoles = canUpdateRoles;
