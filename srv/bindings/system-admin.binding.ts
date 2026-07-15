import cds from "@sap/cds";
import { systemAdminDashboardHandler } from "../handlers/system-admin/dashboard";
import { updateAdminPermissionsHandler } from "../handlers/system-admin/updateAdminPermissions";
import { withAuth } from "../lib/withAuth";

export const bindSystemAdmin = () => {
  const service = cds.services["SystemAdminService"];

  if (!service) {
    console.error("SystemAdminService not found");
    return;
  }

  service.on(
    "getDashboard",
    withAuth(systemAdminDashboardHandler, {
      roles: ["SYSTEM ADMIN"],
    }),
  );

  service.on(
    "updateOrganizationAdminPermissions",
    withAuth(updateAdminPermissionsHandler, {
      roles: ["SYSTEM ADMIN"],
    }),
  );

  console.log("SystemAdminService secured & bound");
};