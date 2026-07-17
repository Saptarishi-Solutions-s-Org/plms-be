import { pool } from "../../lib/db";

export const exportOffersExecutiveHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const executiveId = req.user?.id;

    if (!orgId || !executiveId) return req.error(401, "Unauthorized");

    const res = await pool.query(
      `SELECT DISTINCT
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
         o.createdat               AS "createdAt"

       FROM crm_executiveofferassignment ea
       JOIN crm_offer o
         ON o.id = ea.offer_id
       JOIN crm_user executive
         ON executive.id = ea.executive_id
       JOIN crm_user manager
         ON manager.id = ea.assigned_by_id

       WHERE ea.executive_id = $1
         AND ea.assigned_by_id = executive.reporting_manager_id
         AND executive.organization_id = $2
         AND manager.organization_id = $2
         AND (o.organization_id = $2 OR o.is_global = true)

       ORDER BY o.createdat DESC`,
      [executiveId, orgId]
    );

    return res.rows;
  } catch (error: any) {
    console.error("Error exporting offers:", error?.message ?? error);
    return req.error(500, "Failed to export offers");
  }
};
