"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrgCode = void 0;
const generateOrgCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "sapt";
    for (let i = 0; i < 14; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};
exports.generateOrgCode = generateOrgCode;
