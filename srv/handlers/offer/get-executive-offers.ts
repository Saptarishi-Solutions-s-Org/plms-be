import { pool } from "../../lib/db";
import { createPaginationMeta, parsePaginationParams } from "../../lib/pagination";

export const getExecutiveOffersHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const executiveId = req.user?.id;
    const { page, limit, offset } = parsePaginationParams(req.data);
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

    if (!orgId || !executiveId) {
      return req.error(401, "Unauthorized");
    }

    const baseParams = [
      executiveId,
      orgId,
      statusParams,
      searchParam,
      discountTypeParams,
    ];
    const offerFilterSql = `
      FROM crm_executiveofferassignment ea
      JOIN crm_offer o
        ON o.id = ea."offer_ID"
      JOIN crm_user executive
        ON executive.id = ea."executive_ID"
      JOIN crm_user manager
        ON manager.id = ea."assigned_by_ID"
      WHERE ea."executive_ID" = $1
        AND ea."assigned_by_ID" = executive.reporting_manager_id
        AND executive.organization_id = $2
        AND manager.organization_id = $2
        AND (o.organization_id = $2 OR o.is_global = true)
        AND ($3::text[] IS NULL OR LOWER(o.status) = ANY($3::text[]))
        AND (
          $4::text IS NULL
          OR o.title ILIKE $4
          OR o.code ILIKE $4
          OR o.description ILIKE $4
        )
        AND ($5::text[] IS NULL OR LOWER(o.discount_type) = ANY($5::text[]))
    `;

    const countRes = await pool.query(
      `
      SELECT COUNT(*) AS total
      ${offerFilterSql}
      `,
      baseParams,
    );

    const res = await pool.query(
      `
      SELECT
        o.id                     AS "id",
        o.title                  AS "title",
        o.description            AS "description",
        o.discount_type          AS "discountType",
        COALESCE(
          o.discount_value,
          o.discount_amount,
          o.discount_percentage,
          o.flag_discount_amount
        )                        AS "discountValue",
        o.valid_from             AS "validFrom",
        o.valid_to               AS "validTo",
        o.status                 AS "status"
      ${offerFilterSql}
      ORDER BY ea."createdAt" DESC
      LIMIT $6 OFFSET $7
      `,
      [...baseParams, limit, offset],
    );

    const total = Number(countRes.rows[0]?.total) || 0;

    return {
      offers: res.rows,
      pagination: createPaginationMeta({
        page,
        limit,
        total,
      }),
    };
  } catch (error: any) {
    console.error("Error fetching executive offers:", error?.message ?? error);
    return req.error(500, "Failed to fetch executive offers");
  }
};
 
