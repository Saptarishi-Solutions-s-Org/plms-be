import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";
import { getexecutivestats } from "../handlers/executive/getexecutivestats";
import { executiveRecentLeadsHandler } from "../handlers/executive/getexecutiverecentleads";

export const bindExecutiveDashboard = () => {
  const service = cds.services["ExecutiveService"];
  if (!service) return;

  service.on(
    "getExecutiveStats",
    withAuth(getexecutivestats, {
      roles: ["Executive"],
      modules: { lead: ["view"] },
    }),
  );
  service.on(
    "getExecutiveRecentLeads",
    withAuth(executiveRecentLeadsHandler, {
      roles: ["Executive"],
      modules: { lead: ["view"] },
    }),
  );
};
