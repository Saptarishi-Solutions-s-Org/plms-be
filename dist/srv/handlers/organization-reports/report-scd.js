"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sourceConversionRateHandler = void 0;
const db_1 = require("../../lib/db");
const sourceLabelSql = `
  CASE
    WHEN source IS NULL OR source = '' THEN 'Unknown'
    WHEN source = 'Socil_Media' THEN 'Social Media'
    WHEN source = 'Manual_Entry' THEN 'Manual Entry'
    ELSE REPLACE(source, '_', ' ')
  END
`;
const sourceConversionRateHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId) {
            return req.error(400, "Organization ID missing");
        }
        const res = await db_1.pool.query(`SELECT
         ${sourceLabelSql} AS source,
         COUNT(*) AS leads,
         COUNT(*) FILTER (WHERE status = 'Qualified') AS converted
       FROM crm_leads
       WHERE organization_id = $1
       GROUP BY ${sourceLabelSql}
       ORDER BY leads DESC, source ASC`, [orgId]);
        return res.rows.map((row) => ({
            source: row.source,
            leads: Number(row.leads),
            converted: Number(row.converted),
        }));
    }
    catch (error) {
        return req.error(500, "Failed to fetch source conversion rate");
    }
};
exports.sourceConversionRateHandler = sourceConversionRateHandler;
