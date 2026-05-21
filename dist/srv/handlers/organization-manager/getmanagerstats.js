"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.managerDashboardHandler = void 0;
const db_1 = require("../../lib/db");
const managerDashboardHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        // 1. Total Leads
        const totalLeadsRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1`, [orgId]);
        // 2. Converted Leads
        const convertedLeadsRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       AND status = 'Qualified'`, [orgId]);
        // 3. This Week Leads
        const thisWeekLeadsRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       AND createdat >= NOW() - INTERVAL '7 days'`, [orgId]);
        // 4. Active Offers
        const activeOffersRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_offer
       WHERE organization_id = $1
       AND valid_from <= CURRENT_DATE
       AND valid_to >= CURRENT_DATE`, [orgId]);
        return {
            totalLeads: Number(totalLeadsRes.rows[0]?.count) || 0,
            convertedLeads: Number(convertedLeadsRes.rows[0]?.count) || 0,
            thisWeekLeads: Number(thisWeekLeadsRes.rows[0]?.count) || 0,
            activeOffers: Number(activeOffersRes.rows[0]?.count) || 0,
        };
    }
    catch (error) {
        return req.error(500, "Failed to fetch dashboard");
    }
};
exports.managerDashboardHandler = managerDashboardHandler;
