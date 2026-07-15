import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";

import { createOrganizationHandler } from "../handlers/organization/create";
import { getOrganizationsHandler } from "../handlers/organization/getAll";
import { getOrganizationByCodeHandler } from "../handlers/organization/getOne";
import { updateOrganizationHandler } from "../handlers/organization/update";
import { createUserHandler } from "../handlers/organization/createUser";
import { updateUserHandler } from "../handlers/organization/updateUser";
import { getAdminUsersHandler } from "../handlers/organization/getAdminUsers";

export const bindOrganization = () => {
  const service = cds.services["OrganizationService"];
  if (!service) return;

  service.on(
    "createOrganization",
    withAuth(createOrganizationHandler),
  );

  service.on(
    "getOrganizations",
    withAuth(getOrganizationsHandler),
  );

  service.on(
    "getOrganizationByCode",
    withAuth(getOrganizationByCodeHandler),
  );

  service.on(
    "updateOrganization",
    withAuth(updateOrganizationHandler),
  );

  service.on(
    "createUser",
    withAuth(createUserHandler),
  );

  service.on(
    "updateUser",
    withAuth(updateUserHandler),
  );

  service.on(
    "getAdminUsers",
    withAuth(getAdminUsersHandler),
  );
  console.log("OrganizationService bound with Users");
};

 