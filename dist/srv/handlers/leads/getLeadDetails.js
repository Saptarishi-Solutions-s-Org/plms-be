"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeadDetailHandler = void 0;
const db_1 = require("../../lib/db");
const getLeadDetailHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        const { id, leadCode } = req.data ?? {};
        if (!orgId)
            return req.error(401, "Unauthorized");
        if (!id && !leadCode)
            return req.error(400, "Lead id or code is required");
        const [activitiesRes, offersRes] = await Promise.all([
            db_1.pool.query(`SELECT
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
         WHERE ($1::text IS NULL OR l.id::text = $1)
           AND ($2::text IS NULL OR l.code = $2 OR l.id::text = $2)
           AND l.organization_id = $3
         ORDER BY la.createdat DESC`, [id || null, leadCode || null, orgId]),
            db_1.pool.query(`SELECT
           loa.id                 AS "assignmentId",
           loa.createdat          AS "assignedAt",
           COALESCE(u.name, '')   AS "assignedByName",
           o.id                   AS "offerId",
           o.title                AS "title",
           o.code                 AS "code",
           o.description          AS "description",
           o.status               AS "status",
           o.valid_from           AS "validFrom",
           o.valid_to             AS "validTo"
         FROM crm_leadofferassignment loa
         JOIN crm_offer o   ON o.id = loa.offer_id
         LEFT JOIN crm_user u ON u.id::text = loa.assigned_by_id::text
         JOIN crm_leads l   ON l.id = loa.lead_id
         WHERE ($1::text IS NULL OR l.id::text = $1)
           AND ($2::text IS NULL OR l.code = $2 OR l.id::text = $2)
           AND l.organization_id = $3
         ORDER BY loa.createdat DESC`, [id || null, leadCode || null, orgId]),
        ]);
        return {
            activities: activitiesRes.rows,
            offers: offersRes.rows,
        };
    }
    catch (error) {
        console.error("getLeadDetail error:", error?.message ?? error);
        return req.error(500, "Failed to fetch lead detail");
    }
};
exports.getLeadDetailHandler = getLeadDetailHandler;
