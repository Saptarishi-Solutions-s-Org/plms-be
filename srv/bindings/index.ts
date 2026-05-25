import { bindAuth } from "./auth.binding";
import { bindLead } from "./lead-binding";
import { bindLocation } from "./location-binding";
import { bindOrganizationAdmin } from "./organization-admin.binding";
import { bindOffer } from "./offer.binding";
import { bindOrganization } from "./organization.binding";
import { bindSystemAdmin } from "./system-admin.binding";
import { bindExecutiveDashboard } from "./organization-executive.binding";
import { bindManagerDashboard } from "./organization-manager.binding";
import { bindOrganizationReports } from "./organization-reports";
import { bindProfile } from "./profile.binding";

export const bindAllServices = () => {
  bindAuth();
  bindSystemAdmin();
  bindLocation();
  bindOrganization();
  bindExecutiveDashboard();
  bindManagerDashboard();
  bindOrganizationReports();
  bindOrganizationAdmin();
  bindLead();
  bindOffer();
  bindProfile();
};
