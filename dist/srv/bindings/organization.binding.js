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
    service.on("createOrganization", (0, withAuth_1.withAuth)(create_1.createOrganizationHandler, {
        modules: { organization: ["create"] },
    }));
    service.on("getOrganizations", (0, withAuth_1.withAuth)(getAll_1.getOrganizationsHandler, {
        modules: { organization: ["view"] },
    }));
    service.on("getOrganizationByCode", (0, withAuth_1.withAuth)(getOne_1.getOrganizationByCodeHandler, {
        modules: { organization: ["view"] },
    }));
    service.on("updateOrganization", (0, withAuth_1.withAuth)(update_1.updateOrganizationHandler, {
        modules: { organization: ["update"] },
    }));
    service.on("createUser", (0, withAuth_1.withAuth)(createUser_1.createUserHandler, {
        modules: { user: ["create"] },
    }));
    service.on("updateUser", (0, withAuth_1.withAuth)(updateUser_1.updateUserHandler, {
        modules: { user: ["update"] },
    }));
    service.on("getAdminUsers", (0, withAuth_1.withAuth)(getAdminUsers_1.getAdminUsersHandler, {
        modules: { user: ["view"] },
    }));
    console.log("OrganizationService bound with Users");
};
exports.bindOrganization = bindOrganization;
