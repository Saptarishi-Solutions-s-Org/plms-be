"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getsummarycards = void 0;
const db_1 = require("../../lib/db");
const getsummarycards = async (req) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId) {
            return req.error(400, "orgId is required");
        }
        const query = `
      SELECT
        COUNT(*)                                     AS "totalCount",
        COUNT(*) FILTER (WHERE status = 'Active')     AS "activeCount",
        COUNT(*) FILTER (WHERE status = 'Inactive')   AS "inactiveCount",
        COUNT(*) FILTER (WHERE is_global = true)      AS "globalCount"
      FROM crm_offer
      WHERE is_global = true OR organization_id = $1
    `;
        const { rows } = await db_1.pool.query(query, [orgId]);
        const row = rows[0];
        return {
            totalCount: parseInt(row.totalCount),
            activeCount: parseInt(row.activeCount),
            inactiveCount: parseInt(row.inactiveCount),
            globalCount: parseInt(row.globalCount),
        };
    }
    catch (err) {
        return req.error(500, "Failed to fetch offer summary");
    }
};
exports.getsummarycards = getsummarycards;
