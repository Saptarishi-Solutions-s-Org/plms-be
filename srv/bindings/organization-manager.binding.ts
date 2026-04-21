import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";
import { managerDashboardHandler } from "../handlers/organization-manager/getmanagerstats";
import { leadStatusOverviewHandler } from "../handlers/organization-manager/getleadstatusoverview";
import { executivePerformanceHandler } from "../handlers/organization-manager/getexecutiveperformance";
export const bindManagerDashboard = () => {
  const service = cds.services["ManagerDashboardService"];
  if (!service) return;

  service.on(
    "getManagerDashboard",
    withAuth(managerDashboardHandler, "lead", ["view"])
  );
  service.on(
    "getLeadStatusOverview",
    withAuth(leadStatusOverviewHandler, "lead", ["view"])
  );
  service.on(
  "getExecutivePerformance",
    withAuth(executivePerformanceHandler, "lead", ["view"])
);
};