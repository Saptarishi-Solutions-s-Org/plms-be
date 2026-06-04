"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.managerDashboardHandler = exports.getTotalLeads = void 0;
const db_1 = require("../../lib/db");
const getTotalLeads = async (orgId) => {
    const res = await db_1.pool.query(`SELECT COUNT(*) AS count
     FROM crm_leads
     WHERE organization_id = $1`, [orgId]);
    return Number(res.rows[0]?.count) || 0;
};
exports.getTotalLeads = getTotalLeads;
const managerDashboardHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId) {
            return req.error(400, "Organization ID missing");
        }
        const totalLeads = await (0, exports.getTotalLeads)(orgId);
        // Converted Leads
        const convertedLeadsRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       AND status = 'Qualified'`, [orgId]);
        // This Week Leads
        const thisWeekLeadsRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       AND createdat >= NOW() - INTERVAL '7 days'`, [orgId]);
        // Active Offers
        const activeOffersRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_offer
       WHERE organization_id = $1
       AND valid_from <= CURRENT_DATE
       AND valid_to >= CURRENT_DATE`, [orgId]);
        return {
            totalLeads,
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
