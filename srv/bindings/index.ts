import { bindAuth } from "./auth.binding";
import { bindLead } from "./lead-binding";
import { bindLocation } from "./location-binding";
import { bindOrganization } from "./organization.binding";
import { bindSystemAdmin } from "./system-admin.binding";

export const bindAllServices = () => {
  bindAuth();
  bindSystemAdmin();
  bindLocation();
  bindOrganization();
  bindLead();
};
