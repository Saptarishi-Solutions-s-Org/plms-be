"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleOfferStatusHandler = void 0;
const cds_1 = __importDefault(require("@sap/cds"));
const { SELECT, UPDATE } = cds_1.default.ql;
const toggleOfferStatusHandler = async (req) => {
    const db = await cds_1.default.connect.to("db");
    const { id } = req.data;
    const Offer = cds_1.default.entities["crm.Offer"];
    try {
        const offer = await db.run(SELECT.one.from(Offer).where({ ID: id }));
        if (!offer) {
            return req.reject(404, "Offer not found");
        }
        const newStatus = (offer.status || "").toLowerCase() === "active"
            ? "inactive"
            : "active";
        await db.run(UPDATE(Offer)
            .set({ status: newStatus })
            .where({ ID: id }));
        return {
            id,
            oldStatus: offer.status,
            newStatus,
            message: `Offer ${newStatus === "active" ? "activated" : "deactivated"} successfully`
        };
    }
    catch (error) {
        return req.reject(500, "Failed to toggle offer status");
    }
};
exports.toggleOfferStatusHandler = toggleOfferStatusHandler;
