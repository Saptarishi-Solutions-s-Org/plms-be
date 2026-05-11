"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getexecutivestats = void 0;
const db_1 = require("../../lib/db");
const getexecutivestats = async (req) => {
    try {
        const userId = req.user?.id;
        const orgId = req.user?.orgId;
        if (!userId)
            return req.error(401, "User not identified");
        // 1. My Leads
        const MyLeadsRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_ID = $1 
       AND assigned_to_ID = $2`, [orgId, userId]);
        // 2. Converted Leads
        const convertedLeadsRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_ID = $1
       AND assigned_to_ID = $2
       AND status = 'Qualified'`, [orgId, userId]);
        // 3. This Week Leads
        const thisWeekLeadsRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_ID = $1
       AND assigned_to_ID = $2
       AND createdAt >= NOW() - INTERVAL '7 days'`, [orgId, userId]);
        // 4. Active Offers
        const activeOffersRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_offer
       WHERE organization_ID = $1`, [orgId]);
        return {
            totalLeads: Number(MyLeadsRes.rows[0]?.count) || 0,
            convertedLeads: Number(convertedLeadsRes.rows[0]?.count) || 0,
            thisWeekLeads: Number(thisWeekLeadsRes.rows[0]?.count) || 0,
            activeOffers: Number(activeOffersRes.rows[0]?.count) || 0,
        };
    }
    catch (error) {
        return req.error(500, "Failed to fetch dashboard");
    }
};
exports.getexecutivestats = getexecutivestats;
