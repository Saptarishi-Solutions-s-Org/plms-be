import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";
import { createOfferHandler } from "../handlers/offer/create-offer";
import { getOffersHandler } from "../handlers/offer/getalloffers";
import { toggleOfferStatusHandler } from "../handlers/offer/toggle-status";
import { getManagersHandler } from "../handlers/offer/get-managers";
import { getsummarycards } from "../handlers/offer/offer-cards";

export const bindOffer = () => {
  const service = cds.services["OfferService"];

  if (!service) {
    console.error("OfferService not found");
    return;
  }

  service.on(
    "createOffer",
    withAuth(createOfferHandler, {
      roles: ["admin"],
      modules: {
        offers: ["create"],
      },
    })
  );

  service.on(
    "getOffers",
    withAuth(getOffersHandler, {
      roles: ["admin"],
      modules: {
        offers: ["view"],
      },
    })
  );

  service.on(
    "toggleOfferStatus",
    withAuth(toggleOfferStatusHandler, {
      roles: ["admin"],
      modules: {
        offers: ["update"],
      },
    })
  );

  service.on(
    "getManagers",
    withAuth(getManagersHandler, {
      roles: ["admin"],
      modules: {
        offers: ["view"],
      },
    })
  );

  service.on(
    "getOfferSummary",
    withAuth(getsummarycards, {
      roles: ["admin"],
      modules: {
        offers: ["view"],
      },
    })
  );

  console.log("OfferService bound successfully");
};