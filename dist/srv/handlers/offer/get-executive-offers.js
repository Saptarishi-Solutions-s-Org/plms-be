"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExecutiveOffersHandler = void 0;
const db_1 = require("../../lib/db");
const pagination_1 = require("../../lib/pagination");
const getExecutiveOffersHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        const executiveId = req.user?.id;
        const { page, limit, offset } = (0, pagination_1.parsePaginationParams)(req.data);
        const statusFilter = typeof req.data?.status === "string" ? req.data.status.trim() : "";
        const normalizedStatuses = statusFilter && statusFilter.toLowerCase() !== "all"
            ? decodeURIComponent(statusFilter)
                .split(",")
                .map((status) => status.trim().toLowerCase())
                .filter(Boolean)
            : [];
        const statusParams = normalizedStatuses.length ? normalizedStatuses : null;
        if (!orgId || !executiveId) {
            return req.error(401, "Unauthorized");
        }
        const countRes = await db_1.pool.query(`
      SELECT COUNT(*) AS total
      FROM crm_executiveofferassignment ea
      JOIN crm_offer o
        ON o.id = ea."offer_ID"
      JOIN crm_user executive
        ON executive.id = ea."executive_ID"
      JOIN crm_user manager
        ON manager.id = ea."assigned_by_ID"
      WHERE ea."executive_ID" = $1
        AND ea."assigned_by_ID" = executive.reporting_manager_id
        AND executive.organization_id = $2
        AND manager.organization_id = $2
        AND (o.organization_id = $2 OR o.is_global = true)
        AND ($3::text[] IS NULL OR LOWER(o.status) = ANY($3::text[]))
      `, [executiveId, orgId, statusParams]);
        const res = await db_1.pool.query(`
      SELECT
        o.id                     AS "id",
        o.title                  AS "title",
        o.description            AS "description",
        o.discount_type          AS "discountType",
        COALESCE(
          o.discount_value,
          o.discount_amount,
          o.discount_percentage,
          o.flag_discount_amount
        )                        AS "discountValue",
        o.valid_from             AS "validFrom",
        o.valid_to               AS "validTo",
        o.status                 AS "status"
      FROM crm_executiveofferassignment ea
      JOIN crm_offer o
        ON o.id = ea."offer_ID"
      JOIN crm_user executive
        ON executive.id = ea."executive_ID"
      JOIN crm_user manager
        ON manager.id = ea."assigned_by_ID"
      WHERE ea."executive_ID" = $1
        AND ea."assigned_by_ID" = executive.reporting_manager_id
        AND executive.organization_id = $2
        AND manager.organization_id = $2
        AND (o.organization_id = $2 OR o.is_global = true)
        AND ($3::text[] IS NULL OR LOWER(o.status) = ANY($3::text[]))
      ORDER BY ea."createdAt" DESC
      LIMIT $4 OFFSET $5
      `, [executiveId, orgId, statusParams, limit, offset]);
        const total = Number(countRes.rows[0]?.total) || 0;
        return {
            offers: res.rows,
            pagination: (0, pagination_1.createPaginationMeta)({
                page,
                limit,
                total,
            }),
        };
    }
    catch (error) {
        console.error("Error fetching executive offers:", error?.message ?? error);
        return req.error(500, "Failed to fetch executive offers");
    }
};
exports.getExecutiveOffersHandler = getExecutiveOffersHandler;
