"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindLead = void 0;
const cds_1 = __importDefault(require("@sap/cds"));
const withAuth_1 = require("../lib/withAuth");
const getLeadsWithStats_1 = require("../handlers/leads/getLeadsWithStats");
const getAllOrganizationLeads_1 = require("../handlers/leads/getAllOrganizationLeads");
const getExecutiveUsers_1 = require("../handlers/leads/getExecutiveUsers");
const createLead_1 = require("../handlers/leads/createLead");
const updateLead_1 = require("../handlers/leads/updateLead");
const importLeads_1 = require("../handlers/leads/importLeads");
const getLeadDetails_1 = require("../handlers/leads/getLeadDetails");
const addLeadActivity_1 = require("../handlers/leads/addLeadActivity");
const updateLeadActivity_1 = require("../handlers/leads/updateLeadActivity");
const bindLead = () => {
    const service = cds_1.default.services["LeadService"];
    if (!service)
        return;
    service.on("getLeadsWithStats", (0, withAuth_1.withAuth)(getLeadsWithStats_1.getLeadsWithStatsHandler, {
        roles: ["admin", "manager", "executive"],
        modules: { lead: ["view"] },
    }));
    service.on("getAllOrganizationLeads", (0, withAuth_1.withAuth)(getAllOrganizationLeads_1.getAllOrganizationLeadsHandler, {
        roles: ["admin"],
        modules: { lead: ["view"] },
    }));
    service.on("getExecutiveUsers", (0, withAuth_1.withAuth)(getExecutiveUsers_1.getExecutiveUsersHandler, {
        roles: ["manager"],
        modules: { lead: ["view"] },
    }));
    service.on("createLead", (0, withAuth_1.withAuth)(createLead_1.createLeadHandler, {
        roles: ["admin", "manager", "executive"],
        modules: { lead: ["create"] },
    }));
    service.on("updateLead", (0, withAuth_1.withAuth)(updateLead_1.updateLeadHandler, {
        roles: ["manager", "executive"],
        modules: { lead: ["update"] },
    }));
    service.on("bulkAssignLeads", (0, withAuth_1.withAuth)(updateLead_1.bulkAssignLeadsHandler, {
        roles: ["manager"],
        modules: { lead: ["update"] },
    }));
    service.on("importLeads", (0, withAuth_1.withAuth)(importLeads_1.importLeadsHandler, {
        roles: ["manager", "executive"],
        modules: { lead: ["import"] },
    }));
    service.on("getLeadDetail", (0, withAuth_1.withAuth)(getLeadDetails_1.getLeadDetailHandler, {
        roles: ["admin", "manager", "executive"],
        modules: { lead: ["view"] },
    }));
    service.on("addLeadActivity", (0, withAuth_1.withAuth)(addLeadActivity_1.addLeadActivityHandler, {
        roles: ["admin", "manager", "executive"],
        modules: { "lead_activity": ["create"] },
    }));
    service.on("updateLeadActivity", (0, withAuth_1.withAuth)(updateLeadActivity_1.updateLeadActivityHandler, {
        roles: ["admin", "manager", "executive"],
        modules: { "lead_activity": ["update"] },
    }));
};
exports.bindLead = bindLead;
