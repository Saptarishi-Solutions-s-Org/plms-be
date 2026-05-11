import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";
import {
  changePasswordHandler,
  getProfileHandler,
  updateProfileHandler,
} from "../handlers/profile.handler";

export const bindProfile = () => {
  const service = cds.services["ProfileService"];

  if (!service) {
    console.error("ProfileService not found");
    return;
  }

  service.on("getProfile", withAuth(getProfileHandler));
  service.on("updateProfile", withAuth(updateProfileHandler));
  service.on("changePassword", withAuth(changePasswordHandler));

  console.log("ProfileService bound");
};
