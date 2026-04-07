import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";

import { createOrganizationHandler } from "../handlers/organization/create";
import { getOrganizationsHandler } from "../handlers/organization/getAll";
import { getOrganizationByCodeHandler } from "../handlers/organization/getOne";
import { updateOrganizationHandler } from "../handlers/organization/update";

export const bindOrganization = () => {
  const service = cds.services["OrganizationService"];
  if (!service) return;

  service.on(
    "createOrganization",
    withAuth(createOrganizationHandler, "organization", ["create"]),
  );

  service.on(
    "getOrganizations",
    withAuth(getOrganizationsHandler, "organization", ["view"]),
  );

  service.on(
    "getOrganizationByCode",
    withAuth(getOrganizationByCodeHandler, "organization", ["view"]),
  );

  service.on(
    "updateOrganization",
    withAuth(updateOrganizationHandler, "organization", ["update"]),
  );

  console.log("OrganizationService bound");
};
