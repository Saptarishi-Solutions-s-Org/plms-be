import { bindAuth } from "./auth.binding";
import { bindLocation } from "./location-binding";
import { bindOrganization } from "./organization.binding";
import { bindSystemAdmin } from "./system-admin.binding";
import { bindExecutiveDashboard } from "./executive.binding";

export const bindAllServices = () => {
  bindAuth();
  bindSystemAdmin();
  bindLocation();
  bindOrganization();
  bindExecutiveDashboard();
};
