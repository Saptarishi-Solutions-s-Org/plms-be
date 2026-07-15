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
const bindOrganizationReports = () => {
    const service = cds_1.default.services["ReportDashboardService"];
    if (!service)
        return;
    service.on("getReportStats", (0, withAuth_1.withAuth)(stat_cards_1.ReportDashboardHandler));
    service.on("getLeadSourceAnalytics", (0, withAuth_1.withAuth)(reports_leadsource_sourceconversionrate_1.leadSourceAnalyticsHandler));
    service.on("exportExecutives", (0, withAuth_1.withAuth)(exportExecutives_1.exportExecutivesHandler));
};
exports.bindOrganizationReports = bindOrganizationReports;
