"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportLeadsHandler = void 0;
const db_1 = require("../../lib/db");
const exportLeadsHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId)
            return req.error(401, "Unauthorized");
        const res = await db_1.pool.query(`SELECT
         l.code                    AS "leadCode",
         l.name                    AS "name",
         l.gender                  AS "gender",
         l.email                   AS "email",
         l.phone                   AS "phone",
         l.address                 AS "city",
         s.name                    AS "state",
         c.name                    AS "country",
         l.postal_code             AS "postalCode",
         l.source                  AS "leadSource",
         l.status                  AS "status",
         l.priority                AS "priority",
         COALESCE(u.name, '')      AS "assignedTo",
         COALESCE(la.notes, '')    AS "notes"

       FROM crm_leads l
       LEFT JOIN crm_state   s ON s.id = l.state_id
       LEFT JOIN crm_country c ON c.id = l.country_id
       LEFT JOIN crm_user    u ON u.id = l.assigned_to_id
       LEFT JOIN LATERAL (
         SELECT notes
         FROM   crm_leadactivity
         WHERE  lead_id = l.id
         ORDER  BY createdat DESC
         LIMIT  1
       ) la ON true

       WHERE l.organization_id = $1
       ORDER BY l.createdat DESC`, [orgId]);
        return res.rows;
    }
    catch (error) {
        console.error("Error exporting leads:", error?.message ?? error);
        return req.error(500, "Failed to export leads");
    }
};
exports.exportLeadsHandler = exportLeadsHandler;
