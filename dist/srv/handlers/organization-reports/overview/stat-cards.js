"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportDashboardHandler = void 0;
const db_1 = require("../../../lib/db");
const getmanagerstats_1 = require("../../organization-manager/getmanagerstats");
const ReportDashboardHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId) {
            return req.error(400, "Organization ID missing");
        }
        const totalLeads = await (0, getmanagerstats_1.getTotalLeads)(orgId);
        const leadsAssignedRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       AND assigned_to_id IS NOT NULL`, [orgId]);
        const convertedLeadsRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       AND status = 'Qualified'`, [orgId]);
        const leadsAssigned = Number(leadsAssignedRes.rows[0]?.count) || 0;
        const convertedLeads = Number(convertedLeadsRes.rows[0]?.count) || 0;
        return {
            leadsAssigned,
            convertedLeads,
            conversionRate: totalLeads > 0
                ? Number(((convertedLeads / totalLeads) * 100).toFixed(1))
                : 0,
        };
    }
    catch (error) {
        console.error("Error fetching report stats:", error?.message ?? error);
        return req.error(500, "Failed to fetch report stats");
    }
};
exports.ReportDashboardHandler = ReportDashboardHandler;
