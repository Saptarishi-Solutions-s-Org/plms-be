import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";
import { ReportDashboardHandler } from "../handlers/organization-reports/overview/stat-cards";
import { leadSourceAnalyticsHandler } from "../handlers/organization-reports/overview/reports-leadsource-sourceconversionrate";
import { exportExecutivesHandler } from "../handlers/organization-reports/exportExecutives";


export const bindOrganizationReports = () => {
  const service = cds.services["ReportDashboardService"];
  if (!service) return;

  service.on(
    "getReportStats",
    withAuth(ReportDashboardHandler),
  );
  service.on(
    "getLeadSourceAnalytics",
    withAuth(leadSourceAnalyticsHandler),
  );
  service.on(
    "exportExecutives",
    withAuth(exportExecutivesHandler),
  );
};
