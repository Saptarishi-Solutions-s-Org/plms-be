"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindExecutiveDashboard = void 0;
const cds_1 = __importDefault(require("@sap/cds"));
const withAuth_1 = require("../lib/withAuth");
const getexecutivestats_1 = require("../handlers/executive/getexecutivestats");
const getexecutiverecentleads_1 = require("../handlers/executive/getexecutiverecentleads");
const getleadstats_1 = require("../handlers/executive/getleadstats");
const get_executive_offers_1 = require("../handlers/offer/get-executive-offers");
const assign_offers_to_leads_1 = require("../handlers/executive/assign-offers-to-leads");
const bindExecutiveDashboard = () => {
    const service = cds_1.default.services["OrganizationExecutiveService"];
    if (!service)
        return;
    service.on("getExecutiveStats", (0, withAuth_1.withAuth)(getexecutivestats_1.getexecutivestats));
    service.on("getExecutiveRecentLeads", (0, withAuth_1.withAuth)(getexecutiverecentleads_1.executiveRecentLeadsHandler));
    service.on("getExecutiveLeadStats", (0, withAuth_1.withAuth)(getleadstats_1.executiveLeadStatsHandler));
    service.on("getExecutiveOffers", (0, withAuth_1.withAuth)(get_executive_offers_1.getExecutiveOffersHandler));
    service.on("assignOfferToLead", (0, withAuth_1.withAuth)(assign_offers_to_leads_1.assignOfferToLeadHandler));
    service.on("assignOffersToLeads", (0, withAuth_1.withAuth)(assign_offers_to_leads_1.assignOffersToLeadsHandler));
};
exports.bindExecutiveDashboard = bindExecutiveDashboard;
