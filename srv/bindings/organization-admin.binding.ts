import cds from "@sap/cds";
import { getAllUsersHandler } from "../handlers/organization-admin/getAllUsers";
import { withAuth } from "../lib/withAuth";
import { createOrgUserHandler } from "../handlers/organization-admin/createOrgUser";
import { getManagersHandler } from "../handlers/organization-admin/getAllManagers";

export const bindOrganizationAdmin = () => {
  const service = cds.services["OrganizationAdminService"];

  if (!service) {
    console.error("OrganizationAdminService not found");
    return;
  }

  service.on(
    "getAllUsers",
    withAuth(getAllUsersHandler, {
      modules: { user: ["view"] },
    })
  );

  service.on(
    "createOrgUser",
    withAuth(createOrgUserHandler , {
      modules: { user: ["create"] },
      roles: ["ADMIN"],
    })
  );


  service.on("getAllManagers", withAuth(getManagersHandler, {
    modules: { user: ["view"] },
  }));

}