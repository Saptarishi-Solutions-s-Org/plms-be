import { bindAuth } from "./auth.binding";
import { bindSystemAdmin } from "./system-admin.binding";

export const bindAllServices = () => {
  bindAuth();
  bindSystemAdmin();
};
