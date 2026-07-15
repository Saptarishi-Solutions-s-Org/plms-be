"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindManagerDashboard = void 0;
const cds_1 = __importDefault(require("@sap/cds"));
const withAuth_1 = require("../lib/withAuth");
const getmanagerstats_1 = require("../handlers/organization-manager/getmanagerstats");
const getleadstatusoverview_1 = require("../handlers/organization-manager/getleadstatusoverview");
const getexecutiveperformance_1 = require("../handlers/organization-manager/getexecutiveperformance");
const getexecutiveoverview_1 = require("../handlers/organization-manager/getexecutiveoverview");
const getmanagerofferoverview_1 = require("../handlers/organization-manager/getmanagerofferoverview");
const assign_offer_to_executive_1 = require("../handlers/organization-manager/assign-offer-to-executive");
const bulk_assign_offers_to_executives_1 = require("../handlers/organization-manager/bulk-assign-offers-to-executives");
const deactivateExecutiveForManager_1 = require("../handlers/organization-manager/deactivateExecutiveForManager");
const getOtherExecutivesForReassign_1 = require("../handlers/organization-manager/getOtherExecutivesForReassign");
const getAvailableExecutivesForOffer_1 = require("../handlers/organization-manager/getAvailableExecutivesForOffer");
const bindManagerDashboard = () => {
    const service = cds_1.default.services["ManagerDashboardService"];
    if (!service)
        return;
    service.on("getManagerDashboard", (0, withAuth_1.withAuth)(getmanagerstats_1.managerDashboardHandler));
    service.on("getLeadStatusOverview", (0, withAuth_1.withAuth)(getleadstatusoverview_1.leadStatusOverviewHandler));
    service.on("getExecutivePerformance", (0, withAuth_1.withAuth)(getexecutiveperformance_1.executivePerformanceHandler));
    service.on("getExecutiveOverview", (0, withAuth_1.withAuth)(getexecutiveoverview_1.getExecutiveOverviewHandler));
    service.on("getManagerOfferOverview", (0, withAuth_1.withAuth)(getmanagerofferoverview_1.getManagerOfferOverviewHandler));
    service.on("assignOfferToExecutive", (0, withAuth_1.withAuth)(assign_offer_to_executive_1.assignOfferToExecutiveHandler));
    service.on("bulkAssignOffersToExecutives", (0, withAuth_1.withAuth)(bulk_assign_offers_to_executives_1.bulkAssignOffersToExecutivesHandler));
    service.on("getAvailableExecutivesForOffer", (0, withAuth_1.withAuth)(getAvailableExecutivesForOffer_1.getAvailableExecutivesForOfferHandler));
    service.on("deactivateExecutiveForManager", (0, withAuth_1.withAuth)(deactivateExecutiveForManager_1.deactivateExecutiveForManagerHandler));
    service.on("getOtherExecutivesForReassign", (0, withAuth_1.withAuth)(getOtherExecutivesForReassign_1.getOtherExecutivesForReassignHandler));
};
exports.bindManagerDashboard = bindManagerDashboard;
