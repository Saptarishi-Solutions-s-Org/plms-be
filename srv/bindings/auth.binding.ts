import cds from "@sap/cds";
import { loginHandler } from "../handlers/auth.handler";

export const bindAuth = () => {
  const service = cds.services["AuthService"];

  if (!service) {
    console.error("AuthService not found");
    return;
  }

  service.on("login", loginHandler);

  console.log("AuthService bound");
};
