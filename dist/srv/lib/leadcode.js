"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLeadCode = void 0;
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const generateLeadCode = () => {
    let code = "";
    for (let i = 0; i < 15; i++) {
        code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }
    return code;
};
exports.generateLeadCode = generateLeadCode;
