import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";
import { createOfferHandler } from "../handlers/offer/create-offer";
import { getOffersHandler } from "../handlers/offer/getalloffers";
import { toggleOfferStatusHandler } from "../handlers/offer/toggle-status";
import { getManagersHandler } from "../handlers/offer/get-managers";
import { getsummarycards } from "../handlers/offer/offer-cards";
import { getExecutivesByOfferHandler } from "../handlers/offer/get-executives-by-offer";

export const bindOffer = () => {
  const service = cds.services["OfferService"];

  if (!service) {
    console.error("OfferService not found");
    return;
  }

  service.on(
    "createOffer",
    withAuth(createOfferHandler)
  );

  service.on(
    "getOffers",
    withAuth(getOffersHandler)
  );

  service.on(
    "toggleOfferStatus",
    withAuth(toggleOfferStatusHandler)
  );

  service.on(
    "getManagers",
    withAuth(getManagersHandler)
  );

  service.on(
    "getOfferSummary",
    withAuth(getsummarycards)
  );

  service.on(
    "getExecutivesByOffer",
    withAuth(getExecutivesByOfferHandler)
  );

  console.log("OfferService bound successfully");
};