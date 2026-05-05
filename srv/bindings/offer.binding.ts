import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";

import { createOfferHandler } from "../handlers/offer/create-offer";
import { getOffersHandler } from "../handlers/offer/getalloffers";
import { toggleOfferStatusHandler } from "../handlers/offer/toggle-status";
import { getManagersHandler } from "../handlers/offer/get-managers";
import { getsummarycards } from "../handlers/offer/offer-cards"; // ✅ ADD

export const bindOffer = () => {
  const service = cds.services["OfferService"];
  if (!service) {
    console.error("❌ OfferService not found in cds.services");
    return;
  }

  service.on("createOffer", withAuth(createOfferHandler, "offers", ["create"]));
  service.on("getOffers", withAuth(getOffersHandler, "offers", ["view"]));
  service.on("toggleOfferStatus", withAuth(toggleOfferStatusHandler, "offers", ["update"]));
  service.on("getManagers", withAuth(getManagersHandler, "offers", ["view"]));

  // ✅ FIX
  service.on("getOfferSummary", withAuth(getsummarycards, "offers", ["view"]));

  console.log("✅ OfferService bound successfully");
};