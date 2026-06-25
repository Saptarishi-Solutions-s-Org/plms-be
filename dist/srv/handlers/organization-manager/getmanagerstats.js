"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.managerDashboardHandler = exports.getAssignedLeads = exports.getTotalLeads = void 0;
const db_1 = require("../../lib/db");
const getTotalLeads = async (orgId, userId) => {
    const res = await db_1.pool.query(`SELECT COUNT(*) AS count
     FROM crm_leads
     WHERE organization_id = $1
     AND createdby = $2`, [orgId, userId]);
    return Number(res.rows[0]?.count) || 0;
};
exports.getTotalLeads = getTotalLeads;
const getAssignedLeads = async (orgId, userId) => {
    const res = await db_1.pool.query(`SELECT COUNT(*) AS count
     FROM crm_leads
     WHERE organization_id = $1
     AND assigned_to_id IS NOT NULL
     AND createdby = $2`, [orgId, userId]);
    return Number(res.rows[0]?.count) || 0;
};
exports.getAssignedLeads = getAssignedLeads;
const managerDashboardHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        const userId = req.user?.id;
        if (!orgId || !userId) {
            return req.error(400, "Organization ID missing");
        }
        const totalLeads = await (0, exports.getTotalLeads)(orgId, userId);
        // Converted Leads
        const convertedLeadsRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_leads l
       JOIN crm_user u
         ON u.id = l.assigned_to_id
       WHERE l.organization_id = $1
       AND u.reporting_manager_id = $2
       AND l.status = 'Qualified'`, [orgId, userId]);
        // This Week Leads
        const thisWeekLeadsRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_leads l
       JOIN crm_user u
         ON u.id = l.assigned_to_id
       WHERE l.organization_id = $1
       AND u.reporting_manager_id = $2
       AND l.createdat >= NOW() - INTERVAL '7 days'`, [orgId, userId]);
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
