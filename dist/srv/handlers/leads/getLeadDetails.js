"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeadDetailHandler = void 0;
const db_1 = require("../../lib/db");
const getLeadDetailHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        const { id } = req.data;
        if (!orgId)
            return req.error(401, "Unauthorized");
        if (!id)
            return req.error(400, "Lead ID is required");
        const activitiesRes = await db_1.pool.query(`SELECT
         la.id                              AS "id",
         la.type                            AS "type",
         la.notes                           AS "notes",
         la.free_text                       AS "freeText",
         la.call_status                     AS "callStatus",
         la.next_follow_up_date             AS "nextFollowUpDate",
         la.createdat                       AS "createdAt",
         COALESCE(u.name, 'System Bot')     AS "createdByName",
         COALESCE(r.name, '')               AS "createdByRole"
       FROM crm_leadactivity la
       LEFT JOIN crm_user            u   ON u.id::text = la.createdby
       LEFT JOIN crm_organizationroles orr ON orr.id = u.role_id
       LEFT JOIN crm_roles           r   ON r.id  = orr.role_id
       JOIN crm_leads                 l   ON l.id = la.lead_id
       WHERE la.lead_id = $1
         AND l.organization_id = $2
       ORDER BY la.createdat DESC`, [id, orgId]);
        return {
            activities: activitiesRes.rows,
        };
    }
    catch (error) {
        console.error("getLeadDetail error:", error?.message ?? error);
        return req.error(500, "Failed to fetch lead detail");
    }
};
exports.getLeadDetailHandler = getLeadDetailHandler;
