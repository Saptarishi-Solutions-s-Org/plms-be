import cds from "@sap/cds";
import {
  loginHandler,
  logoutHandler,
  refreshHandler,
  setPasswordHandler,
} from "../handlers/auth.handler";
import { withAuth } from "../lib/withAuth";

export const bindAuth = () => {
  const service = cds.services["AuthService"];

  if (!service) {
    console.error("AuthService not found");
    return;
  }

  service.on("login", loginHandler);
  service.on("refresh", refreshHandler);
  service.on(
    "setPassword",
    withAuth(setPasswordHandler, { allowForcedPasswordChange: true }),
  );
  service.on("logout", logoutHandler);

  console.log("AuthService bound");
};
