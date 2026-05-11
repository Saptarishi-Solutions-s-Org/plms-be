"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
exports.generateAccessToken = generateAccessToken;
exports.verifyAccessToken = verifyAccessToken;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const SECRET = env_1.ENV.JWT_SECRET;
const ACCESS_EXPIRES_IN = env_1.ENV.JWT_EXPIRES_IN;
if (!SECRET) {
    throw new Error("JWT_SECRET is not defined");
}
function generateAccessToken(payload) {
    return jsonwebtoken_1.default.sign({ ...payload, type: "access" }, SECRET, {
        expiresIn: ACCESS_EXPIRES_IN,
    });
}
function verifyAccessToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, SECRET);
    if (decoded.type !== "access") {
        throw new Error("Invalid token type");
    }
    return decoded;
}
exports.generateToken = generateAccessToken;
exports.verifyToken = verifyAccessToken;
