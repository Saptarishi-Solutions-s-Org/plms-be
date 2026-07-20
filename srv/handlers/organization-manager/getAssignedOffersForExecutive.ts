import { pool } from "../../lib/db";

export const getAssignedOffersForExecutiveHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const managerId = req.user?.id;
    const executiveId = req.data?.executiveId;

    if (!orgId) {
      return req.error(400, "Organization ID missing");
    }

    if (!managerId) {
      return req.error(400, "Manager ID missing");
    }

    if (!executiveId) {
      return req.error(400, "Executive ID is required");
    }

    const result = await pool.query(
      `
      SELECT 
        o.id,
        o.title,
        o.code,
        o.description,
        o.status,
        o.discount_type,
        o.discount_amount,
        o.discount_percentage,
        o.valid_from,
        o.valid_to
      FROM crm_offer o
      JOIN crm_executiveofferassignment eoa ON eoa.offer_id = o.id
      WHERE eoa.executive_id = $1 
        AND o.organization_id = $2
      ORDER BY o.title ASC
      `,
      [executiveId, orgId],
    );

    return result.rows;
  } catch (error: any) {
    return req.error(
      500,
      error?.message || "Failed to fetch assigned offers for executive",
    );
  }
};
