import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";

import { getLeadsWithStatsHandler } from "../handlers/leads/getLeadsWithStats";
import { getAllOrganizationLeadsHandler } from "../handlers/leads/getAllOrganizationLeads";
import { getExecutiveUsersHandler }  from "../handlers/leads/getExecutiveUsers";
import { createLeadHandler }         from "../handlers/leads/createLead";
import { bulkAssignLeadsHandler, updateLeadHandler } from "../handlers/leads/updateLead";
import { importLeadsHandler }        from "../handlers/leads/importLeads";
import { getLeadDetailHandler }      from "../handlers/leads/getLeadDetails";     
import { addLeadActivityHandler }    from "../handlers/leads/addLeadActivity";    
import { updateLeadActivityHandler } from "../handlers/leads/updateLeadActivity";

export const bindLead = () => {
  const service = cds.services["LeadService"];
  if (!service) return;

  service.on(
    "getLeadsWithStats",
    withAuth(getLeadsWithStatsHandler, {
      roles: ["admin", "manager", "executive"],
      modules: { lead: ["view"] },
    }),
  );

  service.on(
    "getAllOrganizationLeads",
    withAuth(getAllOrganizationLeadsHandler, {
      roles: ["admin"],
      modules: { lead: ["view"] },
    }),
  );

  service.on(
    "getExecutiveUsers",
    withAuth(getExecutiveUsersHandler, {
      roles: ["manager"],
      modules: { lead: ["view"] },
    }),
  );

  service.on(
    "createLead",
    withAuth(createLeadHandler, {
      roles: ["admin", "manager", "executive"],
      modules: { lead: ["create"] },
    }),
  );

  service.on(
    "updateLead",
    withAuth(updateLeadHandler, {
      roles: ["manager", "executive"],
      modules: { lead: ["update"] },
    }),
  );

  service.on(
    "bulkAssignLeads",
    withAuth(bulkAssignLeadsHandler, {
      roles: ["manager"],
      modules: { lead: ["update"] },
    }),
  );

  service.on(
    "importLeads",
    withAuth(importLeadsHandler, {
      roles: ["manager", "executive"],
      modules: { lead: ["import"] },
    }),
  );

  service.on(
    "getLeadDetail",
    withAuth(getLeadDetailHandler, {
      roles: ["admin", "manager", "executive"],
      modules: { lead: ["view"] },
    }),
  );

  service.on(
    "addLeadActivity",
    withAuth(addLeadActivityHandler, {
      roles: ["admin", "manager", "executive"],
      modules: { "lead_activity": ["create"] },
    }),
  );

  service.on(
    "updateLeadActivity",
    withAuth(updateLeadActivityHandler, {
      roles: ["admin", "manager", "executive"],
      modules: { "lead_activity": ["update"] },
    }),
  );
};
