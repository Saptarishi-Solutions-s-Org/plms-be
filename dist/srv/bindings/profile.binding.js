"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindProfile = void 0;
const cds_1 = __importDefault(require("@sap/cds"));
const withAuth_1 = require("../lib/withAuth");
const profile_handler_1 = require("../handlers/profile.handler");
const bindProfile = () => {
    const service = cds_1.default.services["ProfileService"];
    if (!service) {
        console.error("ProfileService not found");
        return;
    }
    service.on("getProfile", (0, withAuth_1.withAuth)(profile_handler_1.getProfileHandler));
    service.on("updateProfile", (0, withAuth_1.withAuth)(profile_handler_1.updateProfileHandler));
    service.on("changePassword", (0, withAuth_1.withAuth)(profile_handler_1.changePasswordHandler));
    console.log("ProfileService bound");
};
exports.bindProfile = bindProfile;
