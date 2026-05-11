"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindExecutiveDashboard = void 0;
const cds_1 = __importDefault(require("@sap/cds"));
const withAuth_1 = require("../lib/withAuth");
const getexecutivestats_1 = require("../handlers/executive/getexecutivestats");
const getexecutiverecentleads_1 = require("../handlers/executive/getexecutiverecentleads");
const getleadstats_1 = require("../handlers/executive/getleadstats");
const bindExecutiveDashboard = () => {
    const service = cds_1.default.services["OrganizationExecutiveService"];
    if (!service)
        return;
    service.on("getExecutiveStats", (0, withAuth_1.withAuth)(getexecutivestats_1.getexecutivestats, {
        roles: ["Executive"],
        modules: { lead: ["view"] },
    }));
    service.on("getExecutiveRecentLeads", (0, withAuth_1.withAuth)(getexecutiverecentleads_1.executiveRecentLeadsHandler, {
        roles: ["Executive"],
        modules: { lead: ["view"] },
    }));
    service.on("getExecutiveLeadStats", (0, withAuth_1.withAuth)(getleadstats_1.executiveLeadStatsHandler, {
        roles: ["Executive"],
        modules: { lead: ["view"] },
    }));
};
exports.bindExecutiveDashboard = bindExecutiveDashboard;
