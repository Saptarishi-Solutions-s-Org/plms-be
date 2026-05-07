import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";
import { managerDashboardHandler } from "../handlers/organization-manager/getmanagerstats";
import { leadStatusOverviewHandler } from "../handlers/organization-manager/getleadstatusoverview";

export const bindManagerDashboard = () => {
  const service = cds.services["ManagerDashboardService"];
  if (!service) return;

  service.on(
    "getManagerDashboard",
    withAuth(managerDashboardHandler, {
      modules: { lead: ["view"],
      },
    }),
  );
  service.on(
    "getLeadStatusOverview",
    withAuth(leadStatusOverviewHandler, {
      modules: { lead: ["view"] },
    }),
  );
};
