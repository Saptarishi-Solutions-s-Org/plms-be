"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSegmentCode = void 0;
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const generateSegmentCode = () => {
    let code = "SEG";
    for (let i = 0; i < 12; i++) {
        code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }
    return code;
};
exports.generateSegmentCode = generateSegmentCode;
