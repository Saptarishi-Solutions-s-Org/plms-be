"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindSystemAdmin = void 0;
const cds_1 = __importDefault(require("@sap/cds"));
const dashboard_1 = require("../handlers/system-admin/dashboard");
const updateAdminPermissions_1 = require("../handlers/system-admin/updateAdminPermissions");
const withAuth_1 = require("../lib/withAuth");
const bindSystemAdmin = () => {
    const service = cds_1.default.services["SystemAdminService"];
    if (!service) {
        console.error("SystemAdminService not found");
        return;
    }
    service.on("getDashboard", (0, withAuth_1.withAuth)(dashboard_1.systemAdminDashboardHandler, {
        roles: ["SYSTEM ADMIN"],
    }));
    service.on("updateOrganizationAdminPermissions", (0, withAuth_1.withAuth)(updateAdminPermissions_1.updateAdminPermissionsHandler, {
        roles: ["SYSTEM ADMIN"],
    }));
    console.log("SystemAdminService secured & bound");
};
exports.bindSystemAdmin = bindSystemAdmin;
