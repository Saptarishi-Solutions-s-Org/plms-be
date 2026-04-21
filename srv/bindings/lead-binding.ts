import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";
import { getLeadsWithStatsHandler } from "../handlers/leads/getLeadsWithStats";

export const bindLead = () => {
  const service = cds.services["LeadService"];
  service.on("getLeadsWithStats", withAuth(getLeadsWithStatsHandler, "lead", ["view"]));

};