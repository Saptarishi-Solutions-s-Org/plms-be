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
    withAuth(getAllUsersHandler, "user", ["view"])
  );

  service.on(
    "createOrgUser",
    withAuth(createOrgUserHandler , "user" ,["create"])
  )

  service.on("getAllManagers", withAuth(getManagersHandler, "user", ["view"]));

}