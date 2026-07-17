"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindOrganizationReports = void 0;
const cds_1 = __importDefault(require("@sap/cds"));
const withAuth_1 = require("../lib/withAuth");
const stat_cards_1 = require("../handlers/organization-reports/overview/stat-cards");
const reports_leadsource_sourceconversionrate_1 = require("../handlers/organization-reports/overview/reports-leadsource-sourceconversionrate");
const exportExecutives_1 = require("../handlers/organization-reports/exportExecutives");
const getReportLeads_1 = require("../handlers/organization-reports/getReportLeads");
const getReportExecutives_1 = require("../handlers/organization-reports/getReportExecutives");
const getReportExecutivePerformance_1 = require("../handlers/organization-reports/getReportExecutivePerformance");
const getReportManagerPerformance_1 = require("../handlers/organization-reports/getReportManagerPerformance");
const getReportManagers_1 = require("../handlers/organization-reports/getReportManagers");
const getReportExecutivesForManager_1 = require("../handlers/organization-reports/getReportExecutivesForManager");
const bindOrganizationReports = () => {
    const service = cds_1.default.services["ReportDashboardService"];
    if (!service)
        return;
    service.on("getReportStats", (0, withAuth_1.withAuth)(stat_cards_1.ReportDashboardHandler, {
        roles: ["admin", "manager", "executive"],
        modules: { reports: ["view"] },
    }));
    service.on("getLeadSourceAnalytics", (0, withAuth_1.withAuth)(reports_leadsource_sourceconversionrate_1.leadSourceAnalyticsHandler, {
        roles: ["admin", "manager", "executive"],
        modules: { reports: ["view"] },
    }));
    service.on("getReportExecutives", (0, withAuth_1.withAuth)(getReportExecutives_1.getReportExecutivesHandler, {
        roles: ["manager"],
        modules: { reports: ["view"] },
    }));
    service.on("getReportExecutivePerformance", (0, withAuth_1.withAuth)(getReportExecutivePerformance_1.getReportExecutivePerformanceHandler, {
        roles: ["manager"],
        modules: { reports: ["view"] },
    }));
    service.on("getReportManagerPerformance", (0, withAuth_1.withAuth)(getReportManagerPerformance_1.getReportManagerPerformanceHandler, {
        roles: ["admin"],
        modules: { reports: ["view"] },
    }));
    service.on("getReportManagers", (0, withAuth_1.withAuth)(getReportManagers_1.getReportManagersHandler, {
        roles: ["admin"],
        modules: { reports: ["view"] },
    }));
    service.on("getReportExecutivesForManager", (0, withAuth_1.withAuth)(getReportExecutivesForManager_1.getReportExecutivesForManagerHandler, {
        roles: ["admin"],
        modules: { reports: ["view"] },
    }));
    service.on("getReportLeads", (0, withAuth_1.withAuth)(getReportLeads_1.getReportLeadsHandler, {
        roles: ["admin", "manager"],
        modules: { reports: ["view"] },
    }));
    service.on("exportExecutives", (0, withAuth_1.withAuth)(exportExecutives_1.exportExecutivesHandler, {
        roles: ["manager"],
        modules: { reports: ["export"] },
    }));
};
exports.bindOrganizationReports = bindOrganizationReports;
