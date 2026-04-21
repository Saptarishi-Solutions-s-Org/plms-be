import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";
import { managerDashboardHandler } from "../handlers/organization-manager/getmstats";
import { leadStatusOverviewHandler } from "../handlers/organization-manager/getleadstatusoverview";
import { executivePerformanceHandler } from "../handlers/organization-manager/getexecutiveperformance";
export const bindManagerDashboard = () => {
  const service = cds.services["ManagerDashboardService"];
  if (!service) return;

  service.on(
    "getManagerDashboard",
    managerDashboardHandler
    //withAuth(managerDashboardHandler, "lead", ["view"])
  );
  service.on(
    "getLeadStatusOverview",
    leadStatusOverviewHandler
    //withAuth(leadStatusOverviewHandler, "lead", ["view"])
  );
  service.on(
  "getExecutivePerformance",
    executivePerformanceHandler
  //withAuth(executivePerformanceHandler, "lead", ["view"])
);

  console.log("ManagerDashboardService bound successfully");
};