import cds from "@sap/cds";

import {
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
} from "../handlers/auth.handler";

import { withAuth } from "../lib/withAuth";

export const bindAuth = () => {
  const service =
    cds.services["AuthService"];

  if (!service) {
    console.error(
      "AuthService not found",
    );

    return;
  }

  service.on(
    "login",
    loginHandler,
  );

  service.on(
    "refresh",
    refreshHandler,
  );

  service.on(
    "logout",
    withAuth(
      logoutHandler,
    ),
  );

  service.on(
    "me",
    withAuth(meHandler),
  );

  console.log(
    "AuthService bound",
  );
};