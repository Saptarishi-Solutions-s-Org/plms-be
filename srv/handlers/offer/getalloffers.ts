import { pool } from "../../lib/db";

export const getOffersHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return req.error(401, "Unauthorized");
    }

    const result = await pool.query(
      `SELECT 
         o.id,
         o.organization_id,
         o.title,
         o.code,
         o.description,
         o.is_global,
         o.status,
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
         o.createdat,        -- ✅ fixed: no underscore
         COALESCE(
           JSON_AGG(
             JSON_BUILD_OBJECT('id', u.id, 'name', u.name, 'email', u.email)
           ) FILTER (WHERE u.id IS NOT NULL),
           '[]'
         ) AS managers
       FROM crm_offer o
       LEFT JOIN crm_offerassignment a ON a.offer_id = o.id
       LEFT JOIN crm_user u ON u.id = a.user_id
       WHERE o.is_global = true
          OR o.organization_id = $1
       GROUP BY o.id
       ORDER BY o.createdat DESC`,  
      [orgId]
    );

    return result.rows;

  } catch (err: any) {
    console.error("GET OFFERS ERROR MESSAGE:", err.message);  // ✅ detailed logging
    return req.error(500, "Failed to fetch offers");
  }
};