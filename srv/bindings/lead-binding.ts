// plms-be/srv/bindings/lead-binding.ts
// Full file — replaces existing lead-binding.ts

import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";

import { getLeadsWithStatsHandler } from "../handlers/leads/getLeadsWithStats";
import { getExecutiveUsersHandler }  from "../handlers/leads/getExecutiveUsers";
import { createLeadHandler }         from "../handlers/leads/createLead";
import { updateLeadHandler }         from "../handlers/leads/updateLead";
import { exportLeadsHandler }        from "../handlers/leads/exportLeads";
import { importLeadsHandler }        from "../handlers/leads/importLeads";
import { getLeadDetailHandler }      from "../handlers/leads/getLeadDetails";      // NEW
import { addLeadActivityHandler }    from "../handlers/leads/addLeadActivity";    // NEW

export const bindLead = () => {
  const service = cds.services["LeadService"];
  if (!service) return;

  // ── existing ────────────────────────────────────────────────────────────────

  service.on(
    "getLeadsWithStats",
    withAuth(getLeadsWithStatsHandler, {
      roles: ["manager", "executive"],
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
      roles: ["manager", "executive"],
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
    "exportLeads",
    withAuth(exportLeadsHandler, {
      roles: ["manager", "executive"],
      modules: { lead: ["export"] },
    }),
  );

  service.on(
    "importLeads",
    withAuth(importLeadsHandler, {
      roles: ["manager"],
      modules: { lead: ["import"] },
    }),
  );

  // ── NEW ─────────────────────────────────────────────────────────────────────

  service.on(
    "getLeadDetail",
    withAuth(getLeadDetailHandler, {
      roles: ["manager", "executive"],
      modules: { lead: ["view"] },
    }),
  );

  service.on(
    "addLeadActivity",
    withAuth(addLeadActivityHandler, {
      roles: ["manager", "executive"],
      modules: { lead: ["update"] },
    }),
  );
};