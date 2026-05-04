import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";
import { getexecutivestats } from "../handlers/executive/getexecutivestats";


export const bindExecutiveDashboard = () => {
  const service = cds.services["ExecutiveService"];
  if (!service) return;

  // Get All Cards
  service.on(
    "getExecutiveStats",
    withAuth(getexecutivestats, "lead", ["view"])
    
  );

};