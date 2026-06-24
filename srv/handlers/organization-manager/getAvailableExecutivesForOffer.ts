import { pool } from "../../lib/db";

export const getAvailableExecutivesForOfferHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const managerId = req.user?.id;
    const offerId = req.data?.offerId;

    if (!orgId) {
      return req.error(400, "Organization ID missing");
    }

    if (!managerId) {
      return req.error(400, "Manager ID missing");
    }

    if (!offerId) {
      return req.error(400, "Offer ID is required");
    }

    const result = await pool.query(
      `
      SELECT DISTINCT u.id, u.name, u.email, u.phone
      FROM crm_user u
      JOIN crm_organizationroles r ON u.role_id = r.id
      JOIN crm_roles rl ON rl.id = r.role_id
      JOIN crm_offer o ON o.id = $3
      LEFT JOIN crm_managerofferassignment oa
        ON oa."offer_ID" = o.id
      WHERE u.reporting_manager_id = $1
        AND u.organization_id = $2
        AND u.is_active = true
        AND LOWER(rl.name) = 'executive'
        AND (o.organization_id = $2 OR o.is_global = true)
        AND (o.is_global = true OR oa."user_ID" = $1)
        AND NOT EXISTS (
          SELECT 1
          FROM crm_executiveofferassignment eoa
          WHERE eoa."offer_ID" = $3
            AND eoa."executive_ID" = u.id
        )
      ORDER BY u.name ASC
      `,
      [managerId, orgId, offerId],
    );

    return result.rows;
  } catch (error: any) {
    return req.error(
      500,
      error?.message || "Failed to fetch available executives",
    );
  }
};
