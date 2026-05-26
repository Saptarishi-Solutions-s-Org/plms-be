"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOffersHandler = void 0;
const db_1 = require("../../lib/db");
const getOffersHandler = async (req) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId) {
            return req.error(401, "Unauthorized");
        }
        await db_1.pool.query(`
  UPDATE crm_offer
  SET status = 'Expired'
  WHERE valid_to::date < CURRENT_DATE
    AND LOWER(status) != 'expired'
`);
        const result = await db_1.pool.query(`
      SELECT 
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
         o.createdat,

         COALESCE(
           JSON_AGG(
             JSON_BUILD_OBJECT(
               'id', u.id,
               'name', u.name,
               'email', u.email
             )
           ) FILTER (WHERE u.id IS NOT NULL),
           '[]'
         ) AS managers

       FROM crm_offer o

      LEFT JOIN crm_managerofferassignment a
        ON a."offer_ID" = o.id

       LEFT JOIN crm_user u
        ON u.id = a."user_ID"

       WHERE o.is_global = true
          OR o.organization_id = $1

       GROUP BY o.id

       ORDER BY o.createdat DESC
      `, [orgId]);
        return result.rows;
    }
    catch (err) {
        return req.error(500, err?.message || "Failed to fetch offers");
    }
};
exports.getOffersHandler = getOffersHandler;
