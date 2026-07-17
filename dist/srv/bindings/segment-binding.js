"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindSegment = void 0;
const cds_1 = __importDefault(require("@sap/cds"));
const withAuth_1 = require("../lib/withAuth");
const getSegments_1 = require("../handlers/segment/getSegments");
const getSegmentByCode_1 = require("../handlers/segment/getSegmentByCode");
const previewSegment_1 = require("../handlers/segment/previewSegment");
const saveSegment_1 = require("../handlers/segment/saveSegment");
const deleteSegment_1 = require("../handlers/segment/deleteSegment");
const assignOffersToSegment_1 = require("../handlers/segment/assignOffersToSegment");
const getSegmentAuditHistory_1 = require("../handlers/segment/getSegmentAuditHistory");
const exportSegment_1 = require("../handlers/segment/exportSegment");
const getActiveFilterTypes_1 = require("../handlers/segment/getActiveFilterTypes");
const toggleSegmentFilter_1 = require("../handlers/segment/toggleSegmentFilter");
const bindSegment = () => {
    const service = cds_1.default.services["SegmentService"];
    if (!service)
        return;
    service.on("getSegments", (0, withAuth_1.withAuth)(getSegments_1.getSegmentsHandler, {
        roles: ["admin", "manager", "executive"],
        modules: { segmentation: ["view"] },
    }));
    service.on("getSegmentByCode", (0, withAuth_1.withAuth)(getSegmentByCode_1.getSegmentByCodeHandler, {
        roles: ["admin", "manager", "executive"],
        modules: { segmentation: ["view"] },
    }));
    service.on("previewSegment", (0, withAuth_1.withAuth)(previewSegment_1.previewSegmentHandler, {
        roles: ["manager", "executive"],
        modules: { segmentation: ["view"] },
    }));
    service.on("saveSegment", (0, withAuth_1.withAuth)(saveSegment_1.saveSegmentHandler, {
        roles: ["manager", "executive"],
        modules: { segmentation: ["view"] }, // Granular create/update check inside the handler
    }));
    service.on("deleteSegment", (0, withAuth_1.withAuth)(deleteSegment_1.deleteSegmentHandler, {
        roles: ["manager", "executive"],
        modules: { segmentation: ["delete"] },
    }));
    service.on("assignOffersToSegment", (0, withAuth_1.withAuth)(assignOffersToSegment_1.assignOffersToSegmentHandler, {
        roles: ["manager", "executive"],
        modules: { segmentation: ["update"] },
    }));
    service.on("getSegmentAuditHistory", (0, withAuth_1.withAuth)(getSegmentAuditHistory_1.getSegmentAuditHistoryHandler, {
        roles: ["admin", "manager", "executive"],
        modules: { segmentation: ["view"] },
    }));
    service.on("exportSegment", (0, withAuth_1.withAuth)(exportSegment_1.exportSegmentHandler, {
        roles: ["manager", "executive"],
        modules: { segmentation: ["export"] },
    }));
    service.on("getActiveFilterTypes", (0, withAuth_1.withAuth)(getActiveFilterTypes_1.getActiveFilterTypesHandler, {
        roles: ["admin", "manager", "executive"],
        modules: { segmentation: ["view"] },
    }));
    service.on("toggleSegmentFilter", (0, withAuth_1.withAuth)(toggleSegmentFilter_1.toggleSegmentFilterHandler, {
        roles: ["system admin", "admin"],
        modules: { segmentation: ["update"] },
    }));
    console.log("SegmentService bound successfully");
};
exports.bindSegment = bindSegment;
