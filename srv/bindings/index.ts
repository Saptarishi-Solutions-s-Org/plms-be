import { bindAuth } from "./auth.binding";
import { bindLocation } from "./location-binding";
import { bindOrganizationAdmin } from "./organization-admin.binding";
import { bindOrganization } from "./organization.binding";
import { bindSystemAdmin } from "./system-admin.binding";

export const bindAllServices = () => {
  bindAuth();
  bindSystemAdmin();
  bindLocation();
  bindOrganization();
  bindOrganizationAdmin();
};
