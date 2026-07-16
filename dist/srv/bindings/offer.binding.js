"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindOffer = void 0;
const cds_1 = __importDefault(require("@sap/cds"));
const withAuth_1 = require("../lib/withAuth");
const create_offer_1 = require("../handlers/offer/create-offer");
const create_manager_offer_1 = require("../handlers/offer/create-manager-offer");
const update_manager_offer_1 = require("../handlers/offer/update-manager-offer");
const getalloffers_1 = require("../handlers/offer/getalloffers");
const toggle_status_1 = require("../handlers/offer/toggle-status");
const edit_offer_1 = require("../handlers/offer/edit-offer");
const export_offers_admin_1 = require("../handlers/offer/export-offers-admin");
const export_offers_manager_1 = require("../handlers/offer/export-offers-manager");
const export_offers_executive_1 = require("../handlers/offer/export-offers-executive");
const get_managers_1 = require("../handlers/offer/get-managers");
const offer_cards_1 = require("../handlers/offer/offer-cards");
const get_executives_by_offer_1 = require("../handlers/offer/get-executives-by-offer");
const bindOffer = () => {
    const service = cds_1.default.services["OfferService"];
    if (!service) {
        console.error("OfferService not found");
        return;
    }
    service.on("createOffer", (0, withAuth_1.withAuth)(create_offer_1.createOfferHandler, {
        roles: ["admin"],
        modules: {
            offers: ["create"],
        },
    }));
    service.on("createManagerOffer", (0, withAuth_1.withAuth)(create_manager_offer_1.createManagerOfferHandler, {
        roles: ["manager"],
        modules: {
            offers: ["create"],
        },
    }));
    service.on("updateManagerOffer", (0, withAuth_1.withAuth)(update_manager_offer_1.updateManagerOfferHandler, {
        roles: ["manager"],
        modules: {
            offers: ["update"],
        },
    }));
    service.on("getOffers", (0, withAuth_1.withAuth)(getalloffers_1.getOffersHandler, {
        roles: ["admin"],
        modules: {
            offers: ["view"],
        },
    }));
    service.on("toggleOfferStatus", (0, withAuth_1.withAuth)(toggle_status_1.toggleOfferStatusHandler, {
        roles: ["admin"],
        modules: {
            offers: ["update"],
        },
    }));
    service.on("updateOffer", (0, withAuth_1.withAuth)(edit_offer_1.editOfferHandler, {
        roles: ["admin"],
        modules: {
            offers: ["update"],
        },
    }));
    service.on("exportOffersAdmin", (0, withAuth_1.withAuth)(export_offers_admin_1.exportOffersAdminHandler, {
        roles: ["admin"],
        modules: {
            offers: ["export"],
        },
    }));
    service.on("exportOffersManager", (0, withAuth_1.withAuth)(export_offers_manager_1.exportOffersManagerHandler, {
        roles: ["manager"],
        modules: {
            offers: ["export"],
        },
    }));
    service.on("exportOffersExecutive", (0, withAuth_1.withAuth)(export_offers_executive_1.exportOffersExecutiveHandler, {
        roles: ["executive"],
        modules: {
            offers: ["export"],
        },
    }));
    service.on("getManagers", (0, withAuth_1.withAuth)(get_managers_1.getManagersHandler, {
        roles: ["admin"],
        modules: {
            offers: ["view"],
        },
    }));
    service.on("getOfferSummary", (0, withAuth_1.withAuth)(offer_cards_1.getsummarycards, {
        roles: ["admin"],
        modules: {
            offers: ["view"],
        },
    }));
    service.on("getExecutivesByOffer", (0, withAuth_1.withAuth)(get_executives_by_offer_1.getExecutivesByOfferHandler, {
        roles: ["manager"],
        modules: {
            offers: ["view"],
        },
    }));
    console.log("OfferService bound successfully");
};
exports.bindOffer = bindOffer;
