"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatesByCountryHandler = void 0;
const db_1 = require("../../lib/db");
const getStatesByCountryHandler = async (req) => {
    try {
        const { countryId } = req.data;
        const res = await db_1.pool.query(`
      SELECT id, name
      FROM crm_state
      WHERE country_id = $1
      ORDER BY name ASC
      `, [countryId]);
        return res.rows;
    }
    catch (err) {
        console.error(err);
        return req.error(500, "Failed to fetch states");
    }
};
exports.getStatesByCountryHandler = getStatesByCountryHandler;
