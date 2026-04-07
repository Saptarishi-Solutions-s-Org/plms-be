import cds from "@sap/cds";
import { loginHandler } from "./handlers/auth.handler";

export default cds.service.impl((srv: any) => {
  srv.on("login", loginHandler);
});
