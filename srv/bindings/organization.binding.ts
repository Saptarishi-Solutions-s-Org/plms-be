import cds from "@sap/cds";
import { getOrganizationsHandler } from "../handlers/organization/getAll";
import { createOrganizationHandler } from "../handlers/organization/create";
import { updateOrganizationHandler } from "../handlers/organization/update";
import { withAuth } from "../lib/withAuth";

export const bindOrganization = () => {
  const service = cds.services["OrganizationService"];

  if (!service) {
    console.error("OrganizationService not found");
    return;
  }

  service.on("getOrganizations", getOrganizationsHandler);
  service.on("createOrganization", createOrganizationHandler);
  service.on("updateOrganization", updateOrganizationHandler);

  console.log("OrganizationService secured & bound");
};
