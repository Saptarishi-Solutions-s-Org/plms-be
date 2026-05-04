//srv/binding/lead-binding.ts
import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";
import { getLeadsWithStatsHandler } from "../handlers/leads/getLeadsWithStats";
import { getExecutiveUsersHandler }  from "../handlers/leads/getExecutiveUsers";
import { createLeadHandler }         from "../handlers/leads/createLead";
import { updateLeadHandler }         from "../handlers/leads/updateLead";

export const bindLead = () => {
  const service = cds.services["LeadService"];
  if (!service) return;

  service.on("getLeadsWithStats", withAuth(getLeadsWithStatsHandler, "lead", ["view"]));
  service.on("getExecutiveUsers", withAuth(getExecutiveUsersHandler, "lead", ["view"]));
  service.on("createLead",        withAuth(createLeadHandler,        "lead", ["create"]));
  service.on("updateLead",        withAuth(updateLeadHandler,        "lead", ["update"]));
};