import { pool } from "../../lib/db";

export const getExecutivesByOfferHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const userId = req.user?.id;
    const offerId = req.data?.offerId;

    if (!orgId || !userId) {
      return req.error(401, "Unauthorized");
    }

    if (!offerId) {
      return req.error(400, "Offer ID is required");
    }

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone
      FROM crm_executiveofferassignment ea
      JOIN crm_user u
        ON u.id = ea."executive_ID"
      JOIN crm_offer o
        ON o.id = ea."offer_ID"
      WHERE ea."offer_ID" = $1
        AND ea."assigned_by_ID" = $2
        AND u.reporting_manager_id = $2
        AND u.organization_id = $3
        AND u.is_active = true
        AND (o.is_global = true OR o.organization_id = $3)
      ORDER BY u.name
      `,
      [offerId, userId, orgId]
    );

    return result.rows;
  } catch (err: any) {
    return req.error(
      500,
      err?.message || "Failed to fetch executives by offer"
    );
  }
};