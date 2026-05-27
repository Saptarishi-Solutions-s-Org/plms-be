import { pool } from "../../../lib/db";
import { getTotalLeads} from "../../organization-manager/getmanagerstats";
export const ReportDashboardHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;

    if (!orgId) {
      return req.error(400, "Organization ID missing");
    }

    const totalLeads = await getTotalLeads(orgId);
    const leadsAssignedRes = await pool.query(
      `SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       AND assigned_to_id IS NOT NULL`,
      [orgId],
    );

    const convertedLeadsRes = await pool.query(
      `SELECT COUNT(*) AS count
       FROM crm_leads
       WHERE organization_id = $1
       AND status = 'Qualified'`,
      [orgId],
    );



    const leadsAssigned = Number(leadsAssignedRes.rows[0]?.count) || 0;
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
