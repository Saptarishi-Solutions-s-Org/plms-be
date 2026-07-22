"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeadDetailHandler = void 0;
const db_1 = require("../../lib/db");
const queryHelper_1 = require("../segment/queryHelper");
const getLeadDetailHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        const { id, leadCode } = req.data ?? {};
        if (!orgId)
            return req.error(401, "Unauthorized");
        if (!id && !leadCode)
            return req.error(400, "Lead id or code is required");
        // Fetch the lead's basic information and verify organization membership
        const leadRes = await db_1.pool.query(`SELECT
         l.id                 AS "uuid",
         l.code               AS "leadCode",
         l.name               AS "name",
         l.gender             AS "gender",
         l.email              AS "email",
         l.phone              AS "phone",
         l.address            AS "city",
         l.state_id           AS "state",
         l.country_id         AS "country",
         s.name               AS "stateName",
         c.name               AS "countryName",
         l.postal_code        AS "postalCode",
         l.source             AS "leadSource",
         l.status             AS "status",
         l.priority           AS "priority",
         ''                   AS "notes",
         l.assigned_to_id     AS "assignedTo",
         ae.name              AS "assignedToName",
         l.import_type        AS "importType",
         l.createdat          AS "createdAt",
         l.createdby          AS "createdById",
         creator.name         AS "createdByName",
         r.name               AS "createdByRole"
       FROM crm_leads l
       LEFT JOIN crm_user ae ON ae.id = l.assigned_to_id
       LEFT JOIN crm_state s ON s.id = l.state_id
       LEFT JOIN crm_country c ON c.id = l.country_id
       LEFT JOIN crm_user creator ON creator.id::text = l.createdby
       LEFT JOIN crm_organizationroles orr ON orr.id = creator.role_id
       LEFT JOIN crm_roles r ON r.id = orr.role_id
       WHERE (l.id = $1 OR l.code = $2) AND l.organization_id = $3`, [id || null, leadCode || null, orgId]);
        if (leadRes.rows.length === 0) {
            return req.error(404, "Lead not found");
        }
        const leadInfo = leadRes.rows[0];
        const leadId = leadInfo.uuid;
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
         WHERE l.id = $1 AND l.organization_id = $2
         ORDER BY la.createdat DESC`, [leadId, orgId]),
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
         WHERE l.id = $1 AND l.organization_id = $2
         ORDER BY loa.createdat DESC`, [leadId, orgId]),
        ]);
        // Query segment-assigned offers
        const segmentOffers = [];
        const segmentsRes = await db_1.pool.query(`SELECT id, type, name FROM crm_segment WHERE organization_id = $1 AND is_active = true`, [orgId]);
        const matchedSegmentIds = [];
        for (const seg of segmentsRes.rows) {
            if (seg.type === "Static") {
                const checkRes = await db_1.pool.query(`SELECT 1 FROM crm_segmentleads WHERE segment_id = $1 AND lead_id = $2`, [seg.id, leadId]);
                if (checkRes.rows.length > 0) {
                    matchedSegmentIds.push({ id: seg.id, name: seg.name });
                }
            }
            else {
                // Dynamic segment
                const filtersRes = await db_1.pool.query(`SELECT sf.filter_type_id, sf.operator, sf.value, sf.group_id, sf.logical_op, ft.name
           FROM crm_segmentfilters sf
           JOIN crm_segmentfiltertypes ft ON ft.id = sf.filter_type_id
           WHERE sf.segment_id = $1`, [seg.id]);
                const resolvedFilters = filtersRes.rows.map((row) => ({
                    filter_type_id: row.filter_type_id,
                    name: row.name,
                    operator: row.operator,
                    value: row.value,
                    group_id: row.group_id,
                    logical_op: row.logical_op
                }));
                const params = [leadId];
                const conditionSql = (0, queryHelper_1.buildFiltersQuery)(resolvedFilters, params);
                const checkQuery = `
          SELECT 1 
          FROM crm_leads l
          LEFT JOIN crm_user ae ON ae.id = l.assigned_to_id
          LEFT JOIN crm_state s ON s.id = l.state_id
          LEFT JOIN crm_country c ON c.id = l.country_id
          WHERE l.id = $1 AND (${conditionSql})
        `;
                try {
                    const checkRes = await db_1.pool.query(checkQuery, params);
                    if (checkRes.rows.length > 0) {
                        matchedSegmentIds.push({ id: seg.id, name: seg.name });
                    }
                }
                catch (err) {
                    console.error(`Error checking dynamic segment ${seg.name} for lead ${leadId}:`, err);
                }
            }
        }
        if (matchedSegmentIds.length > 0) {
            const segmentIds = matchedSegmentIds.map(s => s.id);
            const segOffersRes = await db_1.pool.query(`SELECT 
           o.id        AS "offerId",
           o.title     AS "title",
           o.code      AS "code",
           o.description AS "description",
           o.status    AS "status",
           o.valid_from AS "validFrom",
           o.valid_to  AS "validTo",
           so.segment_id
         FROM crm_segmentoffers so
         JOIN crm_offer o ON o.id = so.offer_id
         WHERE so.segment_id = ANY($1) AND o.status = 'Active'
         ORDER BY o.title ASC`, [segmentIds]);
            const formatDateToYYYYMMDD = (val) => {
                if (!val)
                    return null;
                const d = new Date(val);
                if (isNaN(d.getTime()))
                    return null;
                return d.toISOString().split("T")[0];
            };
            for (const row of segOffersRes.rows) {
                const segmentName = matchedSegmentIds.find(s => s.id === row.segment_id)?.name || "Segment";
                segmentOffers.push({
                    assignmentId: `segment-${row.segment_id}-${row.offerId}`,
                    assignedAt: new Date(),
                    assignedByName: `Segment: ${segmentName}`,
                    offerId: row.offerId,
                    title: row.title,
                    code: row.code,
                    description: row.description,
                    status: row.status,
                    validFrom: formatDateToYYYYMMDD(row.validFrom),
                    validTo: formatDateToYYYYMMDD(row.validTo)
                });
            }
        }
        const allOffers = [...offersRes.rows, ...segmentOffers];
        const uniqueOffersMap = new Map();
        for (const offer of allOffers) {
            if (!uniqueOffersMap.has(offer.offerId)) {
                uniqueOffersMap.set(offer.offerId, offer);
            }
        }
        const finalOffers = Array.from(uniqueOffersMap.values());
        return {
            lead: leadInfo,
            activities: activitiesRes.rows,
            offers: finalOffers,
        };
    }
    catch (error) {
        console.error("getLeadDetail error:", error?.message ?? error);
        return req.error(500, "Failed to fetch lead detail");
    }
};
exports.getLeadDetailHandler = getLeadDetailHandler;
