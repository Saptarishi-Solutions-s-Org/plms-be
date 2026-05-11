"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindManagerDashboard = void 0;
const cds_1 = __importDefault(require("@sap/cds"));
const withAuth_1 = require("../lib/withAuth");
const getmanagerstats_1 = require("../handlers/organization-manager/getmanagerstats");
const getleadstatusoverview_1 = require("../handlers/organization-manager/getleadstatusoverview");
const bindManagerDashboard = () => {
    const service = cds_1.default.services["ManagerDashboardService"];
    if (!service)
        return;
    service.on("getManagerDashboard", (0, withAuth_1.withAuth)(getmanagerstats_1.managerDashboardHandler, {
        roles: ["manager"],
        modules: { lead: ["view"] },
    }));
    service.on("getLeadStatusOverview", (0, withAuth_1.withAuth)(getleadstatusoverview_1.leadStatusOverviewHandler, {
        roles: ["manager"],
        modules: { lead: ["view"] },
    }));
};
exports.bindManagerDashboard = bindManagerDashboard;
