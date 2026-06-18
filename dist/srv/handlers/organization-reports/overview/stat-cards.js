"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportDashboardHandler = void 0;
const db_1 = require("../../../lib/db");
const getmanagerstats_1 = require("../../organization-manager/getmanagerstats");
const ReportDashboardHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        const userId = req.user?.id;
        if (!orgId || !userId) {
            return req.error(400, "Organization ID missing");
        }
        const totalLeads = await (0, getmanagerstats_1.getTotalLeads)(orgId, userId);
        const leadsAssigned = await (0, getmanagerstats_1.getAssignedLeads)(orgId, userId);
        const convertedLeadsRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       AND status = 'Qualified'
       AND createdby = $2`, [orgId, userId]);
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
