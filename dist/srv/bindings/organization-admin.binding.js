"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindOrganizationAdmin = void 0;
const cds_1 = __importDefault(require("@sap/cds"));
const getAllUsers_1 = require("../handlers/organization-admin/getAllUsers");
const withAuth_1 = require("../lib/withAuth");
const createOrgUser_1 = require("../handlers/organization-admin/createOrgUser");
const getAllManagers_1 = require("../handlers/organization-admin/getAllManagers");
const bindOrganizationAdmin = () => {
    const service = cds_1.default.services["OrganizationAdminService"];
    if (!service) {
        console.error("OrganizationAdminService not found");
        return;
    }
    service.on("getAllUsers", (0, withAuth_1.withAuth)(getAllUsers_1.getAllUsersHandler, {
        modules: { user: ["view"] },
    }));
    service.on("createOrgUser", (0, withAuth_1.withAuth)(createOrgUser_1.createOrgUserHandler, {
        modules: { user: ["create"] },
        roles: ["ADMIN"],
    }));
    service.on("getAllManagers", (0, withAuth_1.withAuth)(getAllManagers_1.getManagersHandler, {
        modules: { user: ["view"] },
    }));
};
exports.bindOrganizationAdmin = bindOrganizationAdmin;
