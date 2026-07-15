import cds from "@sap/cds";
import { getAllUsersHandler } from "../handlers/organization-admin/getAllUsers";
import { getPermissionsHandler } from "../handlers/organization-admin/getPermissions";
import { withAuth } from "../lib/withAuth";
import { createOrgUserHandler } from "../handlers/organization-admin/createOrgUser";
import { getManagersHandler } from "../handlers/organization-admin/getAllManagers";
import { getExecutivesHandler } from "../handlers/organization-admin/getAllExecutives";
import { deactivateExecutiveHandler } from "../handlers/organization-admin/deactivateExecutive";
import { deactivateManagerHandler } from "../handlers/organization-admin/deactivateManager";
import { getExecutivesForManagerHandler } from "../handlers/organization-admin/getExecutivesForManager";
import { getManagersForReassignHandler } from "../handlers/organization-admin/getManagersForReassign";
import { activateUserHandler } from "../handlers/organization-admin/activateUser";
import { updateOrgUserHandler } from "../handlers/organization-admin/useredit";

export const bindOrganizationAdmin = () => {
  const service = cds.services["OrganizationAdminService"];

  if (!service) {
    console.error("OrganizationAdminService not found");
    return;
  }

  service.on(
    "getAllUsers",
    withAuth(getAllUsersHandler)
  );

  service.on(
    "createOrgUser",
    withAuth(createOrgUserHandler)
  );

  service.on(
    "updateOrgUser",
    withAuth(updateOrgUserHandler),
  );

  service.on("getPermissions", withAuth(getPermissionsHandler));

  service.on("getAllManagers", withAuth(getManagersHandler));

  service.on("getAllExecutives", withAuth(getExecutivesHandler));

  service.on("getExecutivesForManager", withAuth(getExecutivesForManagerHandler));

  service.on("getManagersForReassign", withAuth(getManagersForReassignHandler));

  service.on("deactivateExecutive", withAuth(deactivateExecutiveHandler));

  service.on("deactivateManager", withAuth(deactivateManagerHandler));
  
  service.on("activateUser", withAuth(activateUserHandler));

}
