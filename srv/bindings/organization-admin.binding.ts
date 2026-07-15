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

  service.on(
    "updateOrgUser",
    withAuth(updateOrgUserHandler, {
      modules: { user: ["update"] },
      roles: ["ADMIN"],
    }),
  );

  service.on("getPermissions", withAuth(getPermissionsHandler, {
    modules: { user: ["view"] },
    roles: ["ADMIN"],
  }));

  service.on("getAllManagers", withAuth(getManagersHandler, {
    modules: { user: ["view"] },
  }));

  service.on("getAllExecutives", withAuth(getExecutivesHandler, {
    modules: { user: ["view"] },
  }));

  service.on("getExecutivesForManager", withAuth(getExecutivesForManagerHandler, {
    modules: { user: ["view"] },
  }));

  service.on("getManagersForReassign", withAuth(getManagersForReassignHandler, {
    modules: { user: ["view"] },
  }));

  service.on("deactivateExecutive", withAuth(deactivateExecutiveHandler, {
    modules: { user: ["update"] },
    roles: ["ADMIN"],
  }));

  service.on("deactivateManager", withAuth(deactivateManagerHandler, {
    modules: { user: ["update"] },
    roles: ["ADMIN"],
  }));
  service.on("activateUser", withAuth(activateUserHandler, {
    modules: { user: ["update"] },
    roles: ["ADMIN"],
  }));

}
