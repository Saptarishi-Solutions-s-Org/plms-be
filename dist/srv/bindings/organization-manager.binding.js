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
const createExecutive_1 = require("../handlers/organization-manager/createExecutive");
const bindManagerDashboard = () => {
    const service = cds_1.default.services["ManagerDashboardService"];
    if (!service)
        return;
    service.on("getManagerDashboard", (0, withAuth_1.withAuth)(getmanagerstats_1.managerDashboardHandler, {
        roles: ["manager"],
        modules: { lead: ["view"] },
    }));
    service.on("getLeadStatusOverview", (0, withAuth_1.withAuth)(getleadstatusoverview_1.leadStatusOverviewHandler, {
        roles: ["manager"],
        modules: { lead: ["view"] },
    }));
    service.on("getExecutivePerformance", (0, withAuth_1.withAuth)(getexecutiveperformance_1.executivePerformanceHandler, {
        roles: ["manager"],
        modules: { lead: ["view"] },
    }));
    service.on("getExecutiveOverview", (0, withAuth_1.withAuth)(getexecutiveoverview_1.getExecutiveOverviewHandler, {
        roles: ["manager"],
        modules: { user: ["view"] },
    }));
    service.on("createExecutive", (0, withAuth_1.withAuth)(createExecutive_1.createExecutiveHandler, {
        roles: ["manager"],
        modules: { user: ["create"] },
    }));
    service.on("getManagerOfferOverview", (0, withAuth_1.withAuth)(getmanagerofferoverview_1.getManagerOfferOverviewHandler, {
        roles: ["manager"],
        modules: { offers: ["view"] },
    }));
    service.on("assignOfferToExecutive", (0, withAuth_1.withAuth)(assign_offer_to_executive_1.assignOfferToExecutiveHandler, {
        roles: ["manager"],
        modules: { offers: ["view"] },
    }));
    service.on("bulkAssignOffersToExecutives", (0, withAuth_1.withAuth)(bulk_assign_offers_to_executives_1.bulkAssignOffersToExecutivesHandler, {
        roles: ["manager"],
        modules: { offers: ["view"] },
    }));
    service.on("getAvailableExecutivesForOffer", (0, withAuth_1.withAuth)(getAvailableExecutivesForOffer_1.getAvailableExecutivesForOfferHandler, {
        roles: ["manager"],
        modules: { offers: ["view"] },
    }));
    service.on("deactivateExecutiveForManager", (0, withAuth_1.withAuth)(deactivateExecutiveForManager_1.deactivateExecutiveForManagerHandler, {
        roles: ["manager"],
        modules: { lead: ["update"] },
    }));
    service.on("getOtherExecutivesForReassign", (0, withAuth_1.withAuth)(getOtherExecutivesForReassign_1.getOtherExecutivesForReassignHandler, {
        roles: ["manager"],
        modules: { lead: ["view"] },
    }));
};
exports.bindManagerDashboard = bindManagerDashboard;
