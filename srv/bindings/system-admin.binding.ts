import cds from "@sap/cds";
import { systemAdminDashboardHandler } from "../handlers/system-admin/dashboard";
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

  console.log("SystemAdminService secured & bound");
};