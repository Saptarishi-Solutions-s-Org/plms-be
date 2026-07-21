import { pool } from "../../lib/db";

export const exportOffersExecutiveHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const executiveId = req.user?.id;

    if (!orgId || !executiveId) return req.error(401, "Unauthorized");

    const res = await pool.query(
      `SELECT DISTINCT
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
