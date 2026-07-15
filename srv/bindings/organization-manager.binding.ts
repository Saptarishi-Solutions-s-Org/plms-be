import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";
import { managerDashboardHandler } from "../handlers/organization-manager/getmanagerstats";
import { leadStatusOverviewHandler } from "../handlers/organization-manager/getleadstatusoverview";
import { executivePerformanceHandler } from "../handlers/organization-manager/getexecutiveperformance";
import { getExecutiveOverviewHandler } from "../handlers/organization-manager/getexecutiveoverview";
import { getManagerOfferOverviewHandler } from "../handlers/organization-manager/getmanagerofferoverview";
import { assignOfferToExecutiveHandler } from "../handlers/organization-manager/assign-offer-to-executive";
import { bulkAssignOffersToExecutivesHandler } from "../handlers/organization-manager/bulk-assign-offers-to-executives";
import { deactivateExecutiveForManagerHandler } from "../handlers/organization-manager/deactivateExecutiveForManager";
import { getOtherExecutivesForReassignHandler } from "../handlers/organization-manager/getOtherExecutivesForReassign";
import { getAvailableExecutivesForOfferHandler } from "../handlers/organization-manager/getAvailableExecutivesForOffer";

export const bindManagerDashboard = () => {
  const service = cds.services["ManagerDashboardService"];
  if (!service) return;

  service.on(
    "getManagerDashboard",
    withAuth(managerDashboardHandler),
  );
  service.on(
    "getLeadStatusOverview",
    withAuth(leadStatusOverviewHandler),
  );
  service.on(
    "getExecutivePerformance",
    withAuth(executivePerformanceHandler),
  );

  service.on(
    "getExecutiveOverview",
    withAuth(getExecutiveOverviewHandler),
  );

  service.on(
    "getManagerOfferOverview",
    withAuth(getManagerOfferOverviewHandler),
  );
  
  service.on(
    "assignOfferToExecutive",
    withAuth(assignOfferToExecutiveHandler),
  );

  service.on(
    "bulkAssignOffersToExecutives",
    withAuth(bulkAssignOffersToExecutivesHandler),
  );

  service.on(
    "getAvailableExecutivesForOffer",
    withAuth(getAvailableExecutivesForOfferHandler),
  );

  service.on(
    "deactivateExecutiveForManager",
    withAuth(deactivateExecutiveForManagerHandler),
  );

  service.on(
    "getOtherExecutivesForReassign",
    withAuth(getOtherExecutivesForReassignHandler),
  );
  
};
