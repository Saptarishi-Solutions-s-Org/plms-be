import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";
import { getexecutivestats } from "../handlers/executive/getexecutivestats";
import { executiveRecentLeadsHandler } from "../handlers/executive/getexecutiverecentleads";
import { executiveLeadStatsHandler } from "../handlers/executive/getleadstats";
import { getExecutiveOffersHandler } from "../handlers/offer/get-executive-offers";
import {
  assignOfferToLeadHandler,
  assignOffersToLeadsHandler,
} from "../handlers/executive/assign-offers-to-leads";

export const bindExecutiveDashboard = () => {
  const service = cds.services["OrganizationExecutiveService"];
  if (!service) return;

  service.on(
    "getExecutiveStats",
    withAuth(getexecutivestats),
  );

  service.on(
    "getExecutiveRecentLeads",
    withAuth(executiveRecentLeadsHandler),
  );
  service.on(
    "getExecutiveLeadStats",
    withAuth(executiveLeadStatsHandler),
  );

  service.on(
    "getExecutiveOffers",
    withAuth(getExecutiveOffersHandler),
  );

  service.on(
    "assignOfferToLead",
    withAuth(assignOfferToLeadHandler),
  );

  service.on(
    "assignOffersToLeads",
    withAuth(assignOffersToLeadsHandler),
  );
};
