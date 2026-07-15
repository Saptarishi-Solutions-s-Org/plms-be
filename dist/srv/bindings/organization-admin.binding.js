"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindOrganizationAdmin = void 0;
const cds_1 = __importDefault(require("@sap/cds"));
const getAllUsers_1 = require("../handlers/organization-admin/getAllUsers");
const getPermissions_1 = require("../handlers/organization-admin/getPermissions");
const withAuth_1 = require("../lib/withAuth");
const createOrgUser_1 = require("../handlers/organization-admin/createOrgUser");
const getAllManagers_1 = require("../handlers/organization-admin/getAllManagers");
const getAllExecutives_1 = require("../handlers/organization-admin/getAllExecutives");
const deactivateExecutive_1 = require("../handlers/organization-admin/deactivateExecutive");
const deactivateManager_1 = require("../handlers/organization-admin/deactivateManager");
const getExecutivesForManager_1 = require("../handlers/organization-admin/getExecutivesForManager");
const getManagersForReassign_1 = require("../handlers/organization-admin/getManagersForReassign");
const activateUser_1 = require("../handlers/organization-admin/activateUser");
const useredit_1 = require("../handlers/organization-admin/useredit");
const bindOrganizationAdmin = () => {
    const service = cds_1.default.services["OrganizationAdminService"];
    if (!service) {
        console.error("OrganizationAdminService not found");
        return;
    }
    service.on("getAllUsers", (0, withAuth_1.withAuth)(getAllUsers_1.getAllUsersHandler));
    service.on("createOrgUser", (0, withAuth_1.withAuth)(createOrgUser_1.createOrgUserHandler));
    service.on("updateOrgUser", (0, withAuth_1.withAuth)(useredit_1.updateOrgUserHandler));
    service.on("getPermissions", (0, withAuth_1.withAuth)(getPermissions_1.getPermissionsHandler));
    service.on("getAllManagers", (0, withAuth_1.withAuth)(getAllManagers_1.getManagersHandler));
    service.on("getAllExecutives", (0, withAuth_1.withAuth)(getAllExecutives_1.getExecutivesHandler));
    service.on("getExecutivesForManager", (0, withAuth_1.withAuth)(getExecutivesForManager_1.getExecutivesForManagerHandler));
    service.on("getManagersForReassign", (0, withAuth_1.withAuth)(getManagersForReassign_1.getManagersForReassignHandler));
    service.on("deactivateExecutive", (0, withAuth_1.withAuth)(deactivateExecutive_1.deactivateExecutiveHandler));
    service.on("deactivateManager", (0, withAuth_1.withAuth)(deactivateManager_1.deactivateManagerHandler));
    service.on("activateUser", (0, withAuth_1.withAuth)(activateUser_1.activateUserHandler));
};
exports.bindOrganizationAdmin = bindOrganizationAdmin;
