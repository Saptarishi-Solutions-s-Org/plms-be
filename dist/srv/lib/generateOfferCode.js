"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOfferCode = void 0;
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const generateOfferCode = (length = 5) => {
    let code = "";
    for (let i = 0; i < length; i++) {
        code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }
    return code;
};
exports.generateOfferCode = generateOfferCode;
