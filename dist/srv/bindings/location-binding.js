"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindLocation = void 0;
const cds_1 = __importDefault(require("@sap/cds"));
const getCountries_1 = require("../handlers/locations/getCountries");
const getStatesByCountry_1 = require("../handlers/locations/getStatesByCountry");
const withAuth_1 = require("../lib/withAuth");
const bindLocation = () => {
    const service = cds_1.default.services["LocationService"];
    service.on("getCountries", (0, withAuth_1.withAuth)(getCountries_1.getCountriesHandler));
    service.on("getStatesByCountry", (0, withAuth_1.withAuth)(getStatesByCountry_1.getStatesByCountryHandler));
    console.log("LocationService secured & bound");
};
exports.bindLocation = bindLocation;
