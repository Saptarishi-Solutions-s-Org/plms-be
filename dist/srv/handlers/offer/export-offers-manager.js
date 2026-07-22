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
         ROW_NUMBER() OVER (ORDER BY o.createdat DESC) AS "S.NO",
         COALESCE(o.code, '-') AS "offerCode",
         COALESCE(o.title, '-') AS "title",
         COALESCE(o.description, '-') AS "description",
         CASE
            WHEN o.is_global THEN 'Yes'
            ELSE 'No'
         END AS "isGlobal",
        COALESCE(o.status, '-') AS "status",
        COALESCE(o.discount_type, '-') AS "discountType",
        COALESCE(o.discount_amount::text, '-') AS "discountAmount",
        COALESCE(o.discount_percentage::text, '-') AS "discountPercentage",
        COALESCE(o.max_discount_amount::text, '-') AS "maxDiscountAmount",
        COALESCE(o.combo_description, '-') AS "comboDescription",
        COALESCE(o.buy_quantity::text, '-') AS "buyQuantity",
        COALESCE(o.get_quantity::text, '-') AS "getQuantity",
        COALESCE(o.min_purchase_amount::text, '-') AS "minPurchaseAmount",
        COALESCE(o.discount_value::text, '-') AS "discountValue",
        COALESCE(o.flag_discount_amount::text, '-') AS "flagDiscountAmount",
        COALESCE(TO_CHAR(o.valid_from, 'DD/MM/YYYY'), '-') AS "validFrom",
        COALESCE(TO_CHAR(o.valid_to, 'DD/MM/YYYY'), '-') AS "validTo",
         COALESCE(
           STRING_AGG(DISTINCT eu.name, ', ') FILTER (WHERE eu.id IS NOT NULL),
           ''
         )                         AS "assignedExecutives"

       FROM crm_offer o
        LEFT JOIN crm_managerofferassignment oa
          ON oa.offer_id = o.id
        LEFT JOIN crm_executiveofferassignment ea
          ON ea.offer_id = o.id
          AND ea.assigned_by_id = $2
        LEFT JOIN crm_user eu
          ON eu.id = ea.executive_id
          AND eu.reporting_manager_id = $2
          AND eu.is_active = true

        WHERE (o.organization_id = $1 OR o.is_global = true)
          AND (o.is_global = true OR oa.user_id = $2)

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
