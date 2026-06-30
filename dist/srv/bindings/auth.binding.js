"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindAuth = void 0;
const cds_1 = __importDefault(require("@sap/cds"));
const auth_handler_1 = require("../handlers/auth.handler");
const forgotPassword_1 = require("../handlers/forgotPassword");
const withAuth_1 = require("../lib/withAuth");
const bindAuth = () => {
    const service = cds_1.default.services["AuthService"];
    if (!service) {
        console.error("AuthService not found");
        return;
    }
    service.on("login", auth_handler_1.loginHandler);
    service.on("refresh", auth_handler_1.refreshHandler);
    service.on("setPassword", (0, withAuth_1.withAuth)(auth_handler_1.setPasswordHandler, { allowForcedPasswordChange: true }));
    service.on("logout", auth_handler_1.logoutHandler);
    service.on("forgotPassword", forgotPassword_1.forgotPasswordHandler);
    service.on("resetPassword", forgotPassword_1.resetPasswordHandler);
    console.log("AuthService bound");
};
exports.bindAuth = bindAuth;
