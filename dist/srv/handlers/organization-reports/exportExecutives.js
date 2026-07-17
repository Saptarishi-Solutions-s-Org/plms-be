"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportExecutivesHandler = void 0;
const db_1 = require("../../lib/db");
const reportUtils_1 = require("./reportUtils");
const exportExecutivesHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        const userId = req.user?.id;
        if (!orgId || !userId) {
            return req.error(401, "Unauthorized");
        }
        const res = await db_1.pool.query(`
      SELECT
        u.name AS "name",
        u.email AS "email",
        u.phone AS "phone",

        CASE 
          WHEN u.is_active THEN 'Active' 
          ELSE 'Inactive' 
        END AS "status",

        COUNT(DISTINCT l.id)::int AS "assignedLeads",

        COUNT(DISTINCT l.id) FILTER (
          WHERE LOWER(l.status) = '${reportUtils_1.REPORT_STATUSES.qualified}'
        )::int AS "qualifiedLeads",

        CASE
          WHEN COUNT(DISTINCT l.id) > 0 THEN
            ROUND(
              (
                COUNT(DISTINCT l.id) FILTER (
                  WHERE LOWER(l.status) = '${reportUtils_1.REPORT_STATUSES.qualified}'
                )::numeric
                / COUNT(DISTINCT l.id)::numeric
              ) * 100,
              1
            )::float
          ELSE 0
        END AS "conversionRate",

        COUNT(DISTINCT ea.offer_id)::int AS "assignedOffers"

      FROM crm_user u

      JOIN crm_organizationroles org_role
        ON org_role.id = u.role_id

      JOIN crm_roles role
        ON role.id = org_role.role_id

      LEFT JOIN crm_leads l
        ON l.assigned_to_id = u.id
       AND l.organization_id = u.organization_id

      LEFT JOIN crm_executiveofferassignment ea
        ON ea.executive_id = u.id

      WHERE u.organization_id = $1
        AND LOWER(role.name) = 'executive'
        AND u.reporting_manager_id = $2

      GROUP BY 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.is_active

      ORDER BY u.name ASC
      `, [orgId, userId]);
        return res.rows;
    }
    catch (error) {
        console.error("Error exporting executives:", error?.message ?? error);
        return req.error(500, "Failed to export executives");
    }
};
exports.exportExecutivesHandler = exportExecutivesHandler;
