import { pool } from "../../lib/db";
import { createPaginationMeta, parsePaginationParams } from "../../lib/pagination";

export const getOffersHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const { page, limit, offset } = parsePaginationParams(req.data);
    const shouldReturnAll = req.data?.all === true || req.data?.all === "true";
    const statusFilter =
      typeof req.data?.status === "string" ? req.data.status.trim() : "";
    const normalizedStatuses =
      statusFilter && statusFilter.toLowerCase() !== "all"
        ? decodeURIComponent(statusFilter)
            .split(",")
            .map((status) => status.trim().toLowerCase())
            .filter(Boolean)
        : [];
    const statusParams = normalizedStatuses.length ? normalizedStatuses : null;
    const searchFilter =
      typeof req.data?.search === "string"
        ? decodeURIComponent(req.data.search).trim()
        : "";
    const searchParam = searchFilter ? `%${searchFilter}%` : null;
    const discountTypeFilter =
      typeof req.data?.discountType === "string"
        ? req.data.discountType.trim()
        : "";
    const normalizedDiscountTypes =
      discountTypeFilter && discountTypeFilter.toLowerCase() !== "all"
        ? decodeURIComponent(discountTypeFilter)
            .split(",")
            .map((discountType) => discountType.trim().toLowerCase())
            .filter(Boolean)
        : [];
    const discountTypeParams = normalizedDiscountTypes.length
      ? normalizedDiscountTypes
      : null;

    if (!orgId) {
      return req.error(401, "Unauthorized");
    }


    await pool.query(`
  UPDATE crm_offer
  SET status = 'Expired'
  WHERE valid_to::date < CURRENT_DATE
    AND LOWER(status) != 'expired'
`);

    const filterParams = [
      orgId,
      statusParams,
      searchParam,
      discountTypeParams,
    ];
    const offersFilterSql = `
      WHERE (o.is_global = true OR o.organization_id = $1)
        AND ($2::text[] IS NULL OR LOWER(o.status) = ANY($2::text[]))
        AND (
          $3::text IS NULL
          OR o.title ILIKE $3
          OR o.code ILIKE $3
          OR o.description ILIKE $3
        )
        AND ($4::text[] IS NULL OR LOWER(o.discount_type) = ANY($4::text[]))
    `;

    const countResult = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM crm_offer o
      ${offersFilterSql}
      `,
      filterParams,
    );

    const result = await pool.query(
      `
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

       ${offersFilterSql}

       GROUP BY o.id

       ORDER BY o.createdat DESC
       ${shouldReturnAll ? "" : "LIMIT $5 OFFSET $6"}
      `,
      shouldReturnAll ? filterParams : [...filterParams, limit, offset]
    );

    const total = Number(countResult.rows[0]?.total) || 0;

    return {
      offers: result.rows,
      pagination: createPaginationMeta({
        page,
        limit: shouldReturnAll ? Math.max(total, limit) : limit,
        total,
      }),
    };

  } catch (err: any) {

    

    return req.error(
      500,
      err?.message || "Failed to fetch offers"
    );
  }
};
