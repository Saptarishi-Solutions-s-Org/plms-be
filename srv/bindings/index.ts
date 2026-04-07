import { bindAuth } from "./auth.binding";
import { bindSystemAdmin } from "./system-admin.binding";
import { bindOrganization } from "./organization.binding";
import { bindLocation } from "./location.binding";

export const bindAllServices = () => {
  bindAuth();
  bindSystemAdmin();
  bindOrganization();
  bindLocation();
};
