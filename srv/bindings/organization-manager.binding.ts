import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";
import { managerDashboardHandler } from "../handlers/organization-manager/getmanagerstats";
import { leadStatusOverviewHandler } from "../handlers/organization-manager/getleadstatusoverview";
import { executivePerformanceHandler } from "../handlers/organization-manager/getexecutiveperformance";
import { getExecutiveOverviewHandler } from "../handlers/organization-manager/getexecutiveoverview";
import { getManagerOfferOverviewHandler } from "../handlers/organization-manager/getmanagerofferoverview";
import { assignOfferToExecutiveHandler } from "../handlers/organization-manager/assign-offer-to-executive";
import { deactivateExecutiveForManagerHandler } from "../handlers/organization-manager/deactivateExecutiveForManager";
import { getOtherExecutivesForReassignHandler } from "../handlers/organization-manager/getOtherExecutivesForReassign";
import { getAvailableExecutivesForOfferHandler } from "../handlers/organization-manager/getAvailableExecutivesForOffer";

export const bindManagerDashboard = () => {
  const service = cds.services["ManagerDashboardService"];
  if (!service) return;

  service.on(
    "getManagerDashboard",
    withAuth(managerDashboardHandler, {
      roles: ["manager"],
      modules: { lead: ["view"] },
    }),
  );
  service.on(
    "getLeadStatusOverview",
    withAuth(leadStatusOverviewHandler, {
      roles: ["manager"],
      modules: { lead: ["view"] },
    }),
  );
  service.on(
    "getExecutivePerformance",
    withAuth(executivePerformanceHandler, {
      roles: ["manager"],
      modules: { lead: ["view"] },
    }),
  );

  service.on(
    "getExecutiveOverview",
    withAuth(getExecutiveOverviewHandler, {
      roles: ["manager"],
      modules: { lead: ["view"], offers: ["view"] },
    }),
  );

  service.on(
    "getManagerOfferOverview",
    withAuth(getManagerOfferOverviewHandler, {
      roles: ["manager"],
      modules: { offers: ["view"] },
    }),
  );
  
  service.on(
    "assignOfferToExecutive",
    withAuth(assignOfferToExecutiveHandler, {
      roles: ["manager"],
      modules: { offers: ["view"] },
     }),
  );

  service.on(
    "getAvailableExecutivesForOffer",
    withAuth(getAvailableExecutivesForOfferHandler, {
      roles: ["manager"],
      modules: { offers: ["view"] },
    }),
  );

  service.on(
    "deactivateExecutiveForManager",
    withAuth(deactivateExecutiveForManagerHandler, {
      roles: ["manager"],
      modules: { lead: ["update"] },
    }),
  );

  service.on(
    "getOtherExecutivesForReassign",
    withAuth(getOtherExecutivesForReassignHandler, {
      roles: ["manager"],
      modules: { lead: ["view"] },
    }),
  );
  
};
