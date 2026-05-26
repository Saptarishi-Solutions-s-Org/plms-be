"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManagerOfferOverviewHandler = void 0;
const db_1 = require("../../lib/db");
const getManagerOfferOverviewHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        const managerId = req.user?.id;
        if (!orgId) {
            return req.error(400, "Organization ID missing");
        }
        if (!managerId) {
            return req.error(400, "Manager ID missing");
        }
        const offersQuery = `
      SELECT DISTINCT
        o.id,
        o.title,
        o.code,
        o.description,
        o.is_global,
        o.status,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM crm_executiveofferassignment ea
            WHERE ea."offer_ID" = o.id
          ) THEN 'Assigned'
          ELSE 'Unassigned'
        END AS "assignStatus",
        o.discount_type,
        o.discount_amount,
        o.discount_percentage,
        o.max_discount_amount,
        o.combo_description,
        o.buy_quantity,
        o.get_quantity,
        o.min_purchase_amount,
        o.discount_value,
        o.flag_discount_amount,
        o.valid_from,
        o.valid_to,
        o.createdat
      FROM crm_offer o
      LEFT JOIN crm_managerofferassignment oa
        ON oa."offer_ID" = o.id
      WHERE (o.organization_id = $1 OR o.is_global = true)
        AND (o.is_global = true OR oa."user_ID" = $2)
      ORDER BY o.createdat DESC
    `;
        const offersResult = await db_1.pool.query(offersQuery, [orgId, managerId]);
        const statsQuery = `
      WITH manager_offers AS (
        SELECT DISTINCT
          o.id,
          o.status,
          o.is_global
        FROM crm_offer o
        LEFT JOIN crm_managerofferassignment oa
          ON oa."offer_ID" = o.id
        WHERE (o.organization_id = $1 OR o.is_global = true)
          AND (o.is_global = true OR oa."user_ID" = $2)
      )
      SELECT
        COUNT(*) AS total_count,
        COUNT(*) FILTER (WHERE LOWER(status) = 'active') AS active_count,
        COUNT(*) FILTER (WHERE LOWER(status) = 'inactive') AS inactive_count,
        COUNT(*) FILTER (WHERE is_global = true) AS global_count
      FROM manager_offers
    `;
        const statsResult = await db_1.pool.query(statsQuery, [orgId, managerId]);
        const stats = statsResult.rows[0] || {};
        return {
            stats: {
                totalOffers: Number(stats.total_count) || 0,
                activeOffers: Number(stats.active_count) || 0,
                inactiveOffers: Number(stats.inactive_count) || 0,
                globalOffers: Number(stats.global_count) || 0,
            },
            offers: offersResult.rows,
        };
    }
    catch (error) {
        return req.error(500, error?.message || "Failed to fetch manager offer overview");
    }
};
exports.getManagerOfferOverviewHandler = getManagerOfferOverviewHandler;
