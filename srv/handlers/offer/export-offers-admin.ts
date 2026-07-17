import { pool } from "../../lib/db";

export const exportOffersAdminHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;

    if (!orgId) return req.error(401, "Unauthorized");

    const res = await pool.query(
      `SELECT
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
           STRING_AGG(DISTINCT u.name, ', ') FILTER (WHERE u.id IS NOT NULL),
           ''
         )                         AS "assignedManagers"

       FROM crm_offer o
        LEFT JOIN crm_managerofferassignment a
          ON a.offer_id = o.id
        LEFT JOIN crm_user u
          ON u.id = a.user_id

        WHERE (o.organization_id = $1 OR o.is_global = true)
        GROUP BY o.id
        ORDER BY o.createdat DESC`,
      [orgId]
    );

    return res.rows;
  } catch (error: any) {
    console.error("Error exporting offers:", error?.message ?? error);
    return req.error(500, "Failed to export offers");
  }
};
