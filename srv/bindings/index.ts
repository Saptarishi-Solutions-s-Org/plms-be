// srv/bindings/index.ts
import { bindAuth } from "./auth.binding";
import { bindLocation } from "./location-binding";
import { bindOffer } from "./offer.binding";
import { bindOrganization } from "./organization.binding";
import { bindSystemAdmin } from "./system-admin.binding";

export const bindAllServices = () => {
  bindAuth();
  bindSystemAdmin();
  bindLocation();
  bindOrganization();
  bindOffer();
};