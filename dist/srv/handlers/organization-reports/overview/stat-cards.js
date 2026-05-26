"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportDashboardHandler = void 0;
const db_1 = require("../../../lib/db");
const ReportDashboardHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId) {
            return req.error(400, "Organization ID missing");
        }
        const totalLeadsRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1`, [orgId]);
        const leadsAssignedRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       AND assigned_to_id IS NOT NULL`, [orgId]);
        const convertedLeadsRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       AND status = 'Qualified'`, [orgId]);
        const activeOffersRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_offer
       WHERE organization_id = $1
       AND status = 'Active'
       AND valid_from <= CURRENT_DATE
       AND valid_to >= CURRENT_DATE`, [orgId]);
        const offersUtilizedRes = await db_1.pool.query(`SELECT COUNT(DISTINCT o.id) AS count
       FROM crm_offerassignment a
       JOIN crm_offer o
         ON o.id = a.offer_id
       WHERE o.organization_id = $1
       AND o.status = 'Active'
       AND o.valid_from <= CURRENT_DATE
       AND o.valid_to >= CURRENT_DATE`, [orgId]);
        return {
            totalLeads: Number(totalLeadsRes.rows[0]?.count) || 0,
            leadsAssigned: Number(leadsAssignedRes.rows[0]?.count) || 0,
            convertedLeads: Number(convertedLeadsRes.rows[0]?.count) || 0,
            activeOffers: Number(activeOffersRes.rows[0]?.count) || 0,
            offersUtilized: Number(offersUtilizedRes.rows[0]?.count) || 0,
        };
    }
    catch (error) {
        return req.error(500, "Failed to fetch report stats");
    }
};
exports.ReportDashboardHandler = ReportDashboardHandler;
