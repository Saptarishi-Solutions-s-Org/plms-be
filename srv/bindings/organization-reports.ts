import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";
import { ReportDashboardHandler } from "../handlers/organization-reports/overview/stat-cards";
import { leadSourceAnalyticsHandler } from "../handlers/organization-reports/overview/reports-leadsource-sourceconversionrate";
import { exportExecutivesHandler } from "../handlers/organization-reports/exportExecutives";
import { getReportLeadsHandler } from "../handlers/organization-reports/getReportLeads";
import { getReportExecutivesHandler } from "../handlers/organization-reports/getReportExecutives";
import { getReportExecutivePerformanceHandler } from "../handlers/organization-reports/getReportExecutivePerformance";
import { getReportManagerPerformanceHandler } from "../handlers/organization-reports/getReportManagerPerformance";
import { getReportManagersHandler } from "../handlers/organization-reports/getReportManagers";
import { getReportExecutivesForManagerHandler } from "../handlers/organization-reports/getReportExecutivesForManager";

export const bindOrganizationReports = () => {
  const service = cds.services["ReportDashboardService"];
  if (!service) return;

  service.on(
    "getReportStats",
    withAuth(ReportDashboardHandler, {
      roles: ["admin", "manager", "executive"],
      modules: { reports: ["view"] },
    }),
  );
  service.on(
    "getLeadSourceAnalytics",
    withAuth(leadSourceAnalyticsHandler, {
      roles: ["admin", "manager", "executive"],
      modules: { reports: ["view"] },
    }),
  );
  service.on(
    "getReportExecutives",
    withAuth(getReportExecutivesHandler, {
      roles: ["manager"],
      modules: { reports: ["view"] },
    }),
  );
  service.on(
    "getReportExecutivePerformance",
    withAuth(getReportExecutivePerformanceHandler, {
      roles: ["manager"],
      modules: { reports: ["view"] },
    }),
  );
  service.on(
    "getReportManagerPerformance",
    withAuth(getReportManagerPerformanceHandler, {
      roles: ["admin"],
      modules: { reports: ["view"] },
    }),
  );
  service.on(
    "getReportManagers",
    withAuth(getReportManagersHandler, {
      roles: ["admin"],
      modules: { reports: ["view"] },
    }),
  );
  service.on(
    "getReportExecutivesForManager",
    withAuth(getReportExecutivesForManagerHandler, {
      roles: ["admin"],
      modules: { reports: ["view"] },
    }),
  );
  service.on(
    "getReportLeads",
    withAuth(getReportLeadsHandler, {
      roles: ["admin", "manager", "executive"],
      modules: { reports: ["view"] },
    }),
  );
  service.on(
    "exportExecutives",
    withAuth(exportExecutivesHandler, {
      roles: ["manager"],
      modules: { reports: ["export"] },
    }),
  );
};
