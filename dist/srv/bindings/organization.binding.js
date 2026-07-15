"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindOrganization = void 0;
const cds_1 = __importDefault(require("@sap/cds"));
const withAuth_1 = require("../lib/withAuth");
const create_1 = require("../handlers/organization/create");
const getAll_1 = require("../handlers/organization/getAll");
const getOne_1 = require("../handlers/organization/getOne");
const update_1 = require("../handlers/organization/update");
const createUser_1 = require("../handlers/organization/createUser");
const updateUser_1 = require("../handlers/organization/updateUser");
const getAdminUsers_1 = require("../handlers/organization/getAdminUsers");
const bindOrganization = () => {
    const service = cds_1.default.services["OrganizationService"];
    if (!service)
        return;
    service.on("createOrganization", (0, withAuth_1.withAuth)(create_1.createOrganizationHandler));
    service.on("getOrganizations", (0, withAuth_1.withAuth)(getAll_1.getOrganizationsHandler));
    service.on("getOrganizationByCode", (0, withAuth_1.withAuth)(getOne_1.getOrganizationByCodeHandler));
    service.on("updateOrganization", (0, withAuth_1.withAuth)(update_1.updateOrganizationHandler));
    service.on("createUser", (0, withAuth_1.withAuth)(createUser_1.createUserHandler));
    service.on("updateUser", (0, withAuth_1.withAuth)(updateUser_1.updateUserHandler));
    service.on("getAdminUsers", (0, withAuth_1.withAuth)(getAdminUsers_1.getAdminUsersHandler));
    console.log("OrganizationService bound with Users");
};
exports.bindOrganization = bindOrganization;
