import cds from "@sap/cds";
import { getCountriesHandler } from "../handlers/locations/getCountries";
import { getStatesByCountryHandler } from "../handlers/locations/getStatesByCountry";
import { withAuth } from "../lib/withAuth";

export const bindLocation = () => {
  const service = cds.services["LocationService"];

  service.on("getCountries", withAuth(getCountriesHandler));

  service.on("getStatesByCountry", withAuth(getStatesByCountryHandler));
  console.log("LocationService secured & bound");
};
