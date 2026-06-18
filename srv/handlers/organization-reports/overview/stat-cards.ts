import { pool } from "../../../lib/db";
import {
  getAssignedLeads,
  getTotalLeads,
} from "../../organization-manager/getmanagerstats";
export const ReportDashboardHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const userId = req.user?.id;

    if (!orgId || !userId) {
      return req.error(400, "Organization ID missing");
    }

    const totalLeads = await getTotalLeads(orgId);
    const leadsAssigned = await getAssignedLeads(orgId, userId);

    const convertedLeadsRes = await pool.query(
      `SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       AND status = 'Qualified'`,
      [orgId],
    );

    const convertedLeads = Number(convertedLeadsRes.rows[0]?.count) || 0;

    return {
      leadsAssigned,
      convertedLeads,
      conversionRate:
        totalLeads > 0
          ? Number(((convertedLeads / totalLeads) * 100).toFixed(1))
          : 0,
    };
  } catch (error: any) {
    console.error("Error fetching report stats:", error?.message ?? error);
    return req.error(500, "Failed to fetch report stats");
  }
};
