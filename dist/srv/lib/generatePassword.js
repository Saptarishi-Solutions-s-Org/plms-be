"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePassword = void 0;
const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";
    let pass = "";
    for (let i = 0; i < 8; i++) {
        pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return pass;
};
exports.generatePassword = generatePassword;
