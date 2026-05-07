import { bindAuth } from "./auth.binding";
import { bindLead } from "./lead-binding";
import { bindLocation } from "./location-binding";
import { bindOrganizationAdmin } from "./organization-admin.binding";
import { bindOrganization } from "./organization.binding";
import { bindSystemAdmin } from "./system-admin.binding";
import { bindExecutiveDashboard } from "./organization-executive.binding";
import { bindManagerDashboard } from "./organization-manager.binding";

export const bindAllServices = () => {
  bindAuth();
  bindSystemAdmin();
  bindLocation();
  bindOrganization();
  bindExecutiveDashboard();
  bindManagerDashboard();
  bindOrganizationAdmin();
  bindLead();
};
