import cds from "@sap/cds";
import {
  loginHandler,
  logoutHandler,
  refreshHandler,
} from "../handlers/auth.handler";
import {
  forgotPasswordHandler,
  resetPasswordHandler,
} from "../handlers/forgotPassword";

export const bindAuth = () => {
  const service = cds.services["AuthService"];

  if (!service) {
    console.error("AuthService not found");
    return;
  }

  service.on("login", loginHandler);
  service.on("refresh", refreshHandler);
  service.on("logout", logoutHandler);
  service.on("forgotPassword", forgotPasswordHandler);
  service.on("resetPassword", resetPasswordHandler);

  console.log("AuthService bound");
};
