import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";
import { ReportDashboardHandler } from "../handlers/organization-reports/overview/stat-cards";
import { leadSourceHandler } from "../handlers/organization-reports/overview/reports-leadsourcedistribution";
import { sourceConversionRateHandler } from "../handlers/organization-reports/overview/report-sourcevsconversionrate";
export const bindOrganizationReports = () => {
  const service = cds.services["ReportDashboardService"];
  if (!service) return;

  service.on(
    "getReportStats",
    withAuth(ReportDashboardHandler, {
      roles: ["manager"],
      modules: { lead: ["view"] },
    }),
  );
  service.on(
    "getLeadSourceData",
    withAuth(leadSourceHandler, {
      roles: ["manager"],
      modules: { lead: ["view"] },
    }),
  );
  service.on(
    "getSourceConversionData",
    withAuth(sourceConversionRateHandler, {
      roles: ["manager"],
      modules: { lead: ["view"] },
    }),
  );
};
