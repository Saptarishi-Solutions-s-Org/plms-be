"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportDashboardHandler = void 0;
const db_1 = require("../../../lib/db");
const getmanagerstats_1 = require("../../organization-manager/getmanagerstats");
const ReportDashboardHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        const userId = req.user?.id;
        const roles = (req.user?.roles ?? []).map((role) => role.toLowerCase());
        const isExecutive = roles.includes("executive") && !roles.includes("manager");
        if (!orgId || !userId) {
            return req.error(400, "Organization ID missing");
        }
        const totalLeads = isExecutive
            ? await getExecutiveLeadCount(orgId, userId)
            : await (0, getmanagerstats_1.getTotalLeads)(orgId, userId);
        const leadsAssigned = isExecutive
            ? totalLeads
            : await (0, getmanagerstats_1.getAssignedLeads)(orgId, userId);
        const convertedLeadsRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       AND status = 'Qualified'
       AND ${isExecutive ? "assigned_to_id" : "createdby"} = $2`, [orgId, userId]);
        const convertedLeads = Number(convertedLeadsRes.rows[0]?.count) || 0;
        const activeOffersRes = await db_1.pool.query(`SELECT COUNT(*) AS count
       FROM crm_offer
       WHERE organization_id = $1
         AND status = 'Active'`, [orgId]);
        return {
            totalLeads,
            leadsAssigned,
            convertedLeads,
            conversionRate: totalLeads > 0
                ? Number(((convertedLeads / totalLeads) * 100).toFixed(1))
                : 0,
            activeOffers: Number(activeOffersRes.rows[0]?.count) || 0,
        };
    }
    catch (error) {
        console.error("Error fetching report stats:", error?.message ?? error);
        return req.error(500, "Failed to fetch report stats");
    }
};
exports.ReportDashboardHandler = ReportDashboardHandler;
const getExecutiveLeadCount = async (orgId, userId) => {
    const res = await db_1.pool.query(`SELECT COUNT(*) AS count
     FROM crm_leads
     WHERE organization_id = $1
       AND assigned_to_id = $2`, [orgId, userId]);
    return Number(res.rows[0]?.count) || 0;
};
