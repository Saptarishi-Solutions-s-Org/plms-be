"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindOrganizationReports = void 0;
const cds_1 = __importDefault(require("@sap/cds"));
const withAuth_1 = require("../lib/withAuth");
const stat_cards_1 = require("../handlers/organization-reports/overview/stat-cards");
const reports_lsd_1 = require("../handlers/organization-reports/overview/reports-lsd");
const report_scd_1 = require("../handlers/organization-reports/overview/report-scd");
const bindOrganizationReports = () => {
    const service = cds_1.default.services["ReportDashboardService"];
    if (!service)
        return;
    service.on("getReportStats", (0, withAuth_1.withAuth)(stat_cards_1.ReportDashboardHandler, {
        roles: ["manager"],
        modules: { lead: ["view"] },
    }));
    service.on("getLeadSourceData", (0, withAuth_1.withAuth)(reports_lsd_1.leadSourceHandler, {
        roles: ["manager"],
        modules: { lead: ["view"] },
    }));
    service.on("getSourceConversionData", (0, withAuth_1.withAuth)(report_scd_1.sourceConversionRateHandler, {
        roles: ["manager"],
        modules: { lead: ["view"] },
    }));
};
exports.bindOrganizationReports = bindOrganizationReports;
