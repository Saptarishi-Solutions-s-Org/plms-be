import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";

import { getLeadsWithStatsHandler } from "../handlers/leads/getLeadsWithStats";
import { getExecutiveUsersHandler }  from "../handlers/leads/getExecutiveUsers";
import { createLeadHandler }         from "../handlers/leads/createLead";
import { bulkAssignLeadsHandler, updateLeadHandler } from "../handlers/leads/updateLead";
import { exportLeadsHandler }        from "../handlers/leads/exportLeads";
import { importLeadsHandler }        from "../handlers/leads/importLeads";
import { getLeadDetailHandler }      from "../handlers/leads/getLeadDetails";     
import { addLeadActivityHandler }    from "../handlers/leads/addLeadActivity";    

export const bindLead = () => {
  const service = cds.services["LeadService"];
  if (!service) return;

  service.on(
    "getLeadsWithStats",
    withAuth(getLeadsWithStatsHandler),
  );

  service.on(
    "getExecutiveUsers",
    withAuth(getExecutiveUsersHandler),
  );

  service.on(
    "createLead",
    withAuth(createLeadHandler),
  );

  service.on(
    "updateLead",
    withAuth(updateLeadHandler),
  );

  service.on(
    "bulkAssignLeads",
    withAuth(bulkAssignLeadsHandler),
  );

  service.on(
    "exportLeads",
    withAuth(exportLeadsHandler),
  );

  service.on(
    "importLeads",
    withAuth(importLeadsHandler),
  );

  service.on(
    "getLeadDetail",
    withAuth(getLeadDetailHandler),
  );

  service.on(
    "addLeadActivity",
    withAuth(addLeadActivityHandler),
  );
};
