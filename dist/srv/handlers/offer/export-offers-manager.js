"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportOffersManagerHandler = void 0;
const db_1 = require("../../lib/db");
const exportOffersManagerHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        const managerId = req.user?.id;
        if (!orgId || !managerId)
            return req.error(401, "Unauthorized");
        const res = await db_1.pool.query(`SELECT
         o.code                    AS "offerCode",
         o.title                   AS "title",
         o.description             AS "description",
         o.is_global               AS "isGlobal",
         o.status                  AS "status",
         o.discount_type           AS "discountType",
         o.discount_amount         AS "discountAmount",
         o.discount_percentage     AS "discountPercentage",
         o.max_discount_amount     AS "maxDiscountAmount",
         o.combo_description       AS "comboDescription",
         o.buy_quantity            AS "buyQuantity",
         o.get_quantity            AS "getQuantity",
         o.min_purchase_amount     AS "minPurchaseAmount",
         o.discount_value          AS "discountValue",
         o.flag_discount_amount    AS "flagDiscountAmount",
         o.valid_from              AS "validFrom",
         o.valid_to                AS "validTo",
         o.createdat               AS "createdAt",
         COALESCE(
           STRING_AGG(DISTINCT eu.name, ', ') FILTER (WHERE eu.id IS NOT NULL),
           ''
         )                         AS "assignedExecutives"

       FROM crm_offer o
       LEFT JOIN crm_managerofferassignment oa
         ON oa."offer_ID" = o.id
       LEFT JOIN crm_executiveofferassignment ea
         ON ea."offer_ID" = o.id
         AND ea."assigned_by_ID" = $2
       LEFT JOIN crm_user eu
         ON eu.id = ea."executive_ID"
         AND eu.reporting_manager_id = $2
         AND eu.is_active = true

       WHERE (o.organization_id = $1 OR o.is_global = true)
         AND (o.is_global = true OR oa."user_ID" = $2)

       GROUP BY o.id
       ORDER BY o.createdat DESC`, [orgId, managerId]);
        return res.rows;
    }
    catch (error) {
        console.error("Error exporting offers:", error?.message ?? error);
        return req.error(500, "Failed to export offers");
    }
};
exports.exportOffersManagerHandler = exportOffersManagerHandler;
