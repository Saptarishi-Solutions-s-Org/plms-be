"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCountriesHandler = void 0;
const db_1 = require("../../lib/db");
const getCountriesHandler = async (req) => {
    try {
        const res = await db_1.pool.query(`
      SELECT id, name
      FROM crm_country
      ORDER BY name ASC
    `);
        return res.rows;
    }
    catch (err) {
        console.error(err);
        return req.error(500, "Failed to fetch countries");
    }
};
exports.getCountriesHandler = getCountriesHandler;
