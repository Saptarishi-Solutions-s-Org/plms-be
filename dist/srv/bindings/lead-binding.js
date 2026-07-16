"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindLead = void 0;
const cds_1 = __importDefault(require("@sap/cds"));
const withAuth_1 = require("../lib/withAuth");
const getLeadsWithStats_1 = require("../handlers/leads/getLeadsWithStats");
const getExecutiveUsers_1 = require("../handlers/leads/getExecutiveUsers");
const createLead_1 = require("../handlers/leads/createLead");
const updateLead_1 = require("../handlers/leads/updateLead");
const exportLeads_1 = require("../handlers/leads/exportLeads");
const importLeads_1 = require("../handlers/leads/importLeads");
const getLeadDetails_1 = require("../handlers/leads/getLeadDetails");
const addLeadActivity_1 = require("../handlers/leads/addLeadActivity");
const bindLead = () => {
    const service = cds_1.default.services["LeadService"];
    if (!service)
        return;
    service.on("getLeadsWithStats", (0, withAuth_1.withAuth)(getLeadsWithStats_1.getLeadsWithStatsHandler, {
        roles: ["admin", "manager", "executive"],
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
    service.on("exportLeads", (0, withAuth_1.withAuth)(exportLeads_1.exportLeadsHandler, {
        roles: ["manager", "executive"],
        modules: { lead: ["export"] },
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
        roles: ["manager", "executive"],
        modules: { lead: ["update"] },
    }));
};
exports.bindLead = bindLead;
