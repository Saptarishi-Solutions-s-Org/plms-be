"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReportOffersHandler = void 0;
const db_1 = require("../../lib/db");
const getReportOffersHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId) {
            return req.error(400, "Organization ID missing");
        }
        const activeOffersRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_offer
       WHERE (organization_id = $1 OR is_global = true)
         AND LOWER(status) = 'active'`, [orgId]);
        const activeOffers = Number(activeOffersRes.rows[0]?.count) || 0;
        return {
            stats: {
                activeOffers,
            },
        };
    }
    catch (error) {
        console.error("Error fetching report offers:", error?.message ?? error);
        return req.error(500, "Failed to fetch report offers");
    }
};
exports.getReportOffersHandler = getReportOffersHandler;
