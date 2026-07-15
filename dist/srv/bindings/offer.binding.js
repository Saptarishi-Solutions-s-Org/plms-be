"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindOffer = void 0;
const cds_1 = __importDefault(require("@sap/cds"));
const withAuth_1 = require("../lib/withAuth");
const create_offer_1 = require("../handlers/offer/create-offer");
const getalloffers_1 = require("../handlers/offer/getalloffers");
const toggle_status_1 = require("../handlers/offer/toggle-status");
const get_managers_1 = require("../handlers/offer/get-managers");
const offer_cards_1 = require("../handlers/offer/offer-cards");
const get_executives_by_offer_1 = require("../handlers/offer/get-executives-by-offer");
const bindOffer = () => {
    const service = cds_1.default.services["OfferService"];
    if (!service) {
        console.error("OfferService not found");
        return;
    }
    service.on("createOffer", (0, withAuth_1.withAuth)(create_offer_1.createOfferHandler));
    service.on("getOffers", (0, withAuth_1.withAuth)(getalloffers_1.getOffersHandler));
    service.on("toggleOfferStatus", (0, withAuth_1.withAuth)(toggle_status_1.toggleOfferStatusHandler));
    service.on("getManagers", (0, withAuth_1.withAuth)(get_managers_1.getManagersHandler));
    service.on("getOfferSummary", (0, withAuth_1.withAuth)(offer_cards_1.getsummarycards));
    service.on("getExecutivesByOffer", (0, withAuth_1.withAuth)(get_executives_by_offer_1.getExecutivesByOfferHandler));
    console.log("OfferService bound successfully");
};
exports.bindOffer = bindOffer;
