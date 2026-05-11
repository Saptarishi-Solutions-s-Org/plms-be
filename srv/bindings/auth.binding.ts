import cds from "@sap/cds";
import {
  loginHandler,
  logoutHandler,
  refreshHandler,
} from "../handlers/auth.handler";

export const bindAuth = () => {
  const service = cds.services["AuthService"];

  if (!service) {
    console.error("AuthService not found");
    return;
  }

  service.on("login", loginHandler);
  service.on("refresh", refreshHandler);
  service.on("logout", logoutHandler);

  console.log("AuthService bound");
};
