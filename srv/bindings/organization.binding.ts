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
    withAuth(createOrganizationHandler, {
      modules: { organization: ["create"] },
    }),
  );

  service.on(
    "getOrganizations",
    withAuth(getOrganizationsHandler, {
      modules: { organization: ["view"] },
    }),
  );

  service.on(
    "getOrganizationByCode",
    withAuth(getOrganizationByCodeHandler, {
      modules: { organization: ["view"] },
    }),
  );

  service.on(
    "updateOrganization",
    withAuth(updateOrganizationHandler, {
      modules: { organization: ["update"] },
    }),
  );

  service.on(
    "createUser",
    withAuth(createUserHandler, {
      modules: { user: ["create"] },
    }),
  );

  service.on(
    "updateUser",
    withAuth(updateUserHandler, {
      modules: { user: ["update"] },
    }),
  );

  service.on(
    "getAdminUsers",
    withAuth(getAdminUsersHandler, {
      modules: { user: ["view"] },
    }),
  );
  console.log("OrganizationService bound with Users");
};

 