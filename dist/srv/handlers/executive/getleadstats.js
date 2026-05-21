"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executiveLeadStatsHandler = void 0;
const db_1 = require("../../lib/db");
const executiveLeadStatsHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        const userId = req.user?.id;
        if (!orgId || !userId) {
            return req.error(400, "User or Organization ID missing");
        }
        const res = await db_1.pool.query(`SELECT status, COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       AND assigned_to_id = $2
       GROUP BY status`, [orgId, userId]);
        const overview = {
            New: 0,
            Contacted: 0,
            Qualified: 0,
            Lost: 0,
        };
        res.rows.forEach((row) => {
            if (row.status in overview) {
                overview[row.status] = Number(row.count);
            }
        });
        return overview;
    }
    catch (error) {
        return req.error(500, "Failed to fetch executive lead status");
    }
};
exports.executiveLeadStatsHandler = executiveLeadStatsHandler;
