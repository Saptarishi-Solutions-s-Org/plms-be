import cds from "@sap/cds";
import { withAuth } from "../lib/withAuth";
import { createOfferHandler } from "../handlers/offer/create-offer";
import { createManagerOfferHandler } from "../handlers/offer/create-manager-offer";
import { updateManagerOfferHandler } from "../handlers/offer/update-manager-offer";
import { getOffersHandler } from "../handlers/offer/getalloffers";
import { toggleOfferStatusHandler } from "../handlers/offer/toggle-status";
import { editOfferHandler } from "../handlers/offer/edit-offer";
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
    withAuth(createOfferHandler, {
      roles: ["admin"],
      modules: {
        offers: ["create"],
      },
    })
  );

  service.on(
    "createManagerOffer",
    withAuth(createManagerOfferHandler, {
      roles: ["manager"],
      modules: {
        offers: ["create"],
      },
    })
  );

  service.on(
    "updateManagerOffer",
    withAuth(updateManagerOfferHandler, {
      roles: ["manager"],
      modules: {
        offers: ["update"],
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
    "updateOffer",
    withAuth(editOfferHandler, {
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

  service.on(
    "getExecutivesByOffer",
    withAuth(getExecutivesByOfferHandler, {
      roles: ["manager"],
      modules: {
        offers: ["view"],
      },
    })
  );

  console.log("OfferService bound successfully");
};