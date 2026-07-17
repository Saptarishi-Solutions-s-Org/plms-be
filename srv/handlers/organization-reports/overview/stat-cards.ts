import { pool } from "../../../lib/db";
import {
  getAssignedLeads,
  getTotalLeads,
} from "../../organization-manager/getmanagerstats";
export const ReportDashboardHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const userId = req.user?.id;
    const roles = (req.user?.roles ?? []).map((role: string) =>
      role.toLowerCase(),
    );
    const isExecutive =
      roles.includes("executive") && !roles.includes("manager");

    if (!orgId || !userId) {
      return req.error(400, "Organization ID missing");
    }

    const totalLeads = isExecutive
      ? await getExecutiveLeadCount(orgId, userId)
      : await getTotalLeads(orgId, userId);
    const leadsAssigned = isExecutive
      ? totalLeads
      : await getAssignedLeads(orgId, userId);

    const convertedLeadsRes = await pool.query(
      `SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       AND status = 'Qualified'
       AND ${isExecutive ? "assigned_to_id" : "createdby"} = $2`,
      [orgId, userId],
    );

    const convertedLeads = Number(convertedLeadsRes.rows[0]?.count) || 0;
    const activeOffersRes = await pool.query(
      `SELECT COUNT(*) AS count
       FROM crm_offer
       WHERE organization_id = $1
         AND status = 'Active'`,
      [orgId],
    );

    return {
      totalLeads,
      leadsAssigned,
      convertedLeads,
      conversionRate:
        totalLeads > 0
          ? Number(((convertedLeads / totalLeads) * 100).toFixed(1))
          : 0,
      activeOffers: Number(activeOffersRes.rows[0]?.count) || 0,
    };
  } catch (error: any) {
    console.error("Error fetching report stats:", error?.message ?? error);
    return req.error(500, "Failed to fetch report stats");
  }
};

const getExecutiveLeadCount = async (orgId: string, userId: string) => {
  const res = await pool.query(
    `SELECT COUNT(*) AS count
     FROM crm_leads
     WHERE organization_id = $1
       AND assigned_to_id = $2`,
    [orgId, userId],
  );

  return Number(res.rows[0]?.count) || 0;
};
