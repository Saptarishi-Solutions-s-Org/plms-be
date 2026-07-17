import { pool } from "../../lib/db";
import { createPaginationMeta, parsePaginationParams } from "../../lib/pagination";

export const getManagerOfferOverviewHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const managerId = req.user?.id;
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
      return req.error(400, "Organization ID missing");
    }

    if (!managerId) {
      return req.error(400, "Manager ID missing");
    }

    const offersQuery = `
      SELECT DISTINCT
        o.id,
        o.title,
        o.code,
        o.description,
        o.is_global,
        o.status,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM crm_executiveofferassignment ea
            WHERE ea.offer_id = o.id
          ) THEN 'Assigned'
          ELSE 'Unassigned'
        END AS "assignStatus",
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
        o.createdat
      FROM crm_offer o
      LEFT JOIN crm_managerofferassignment oa
        ON oa.offer_id = o.id
      WHERE (o.organization_id = $1 OR o.is_global = true)
        AND (o.is_global = true OR oa.user_id = $2)
        AND ($3::text[] IS NULL OR LOWER(o.status) = ANY($3::text[]))
        AND (
          $4::text IS NULL
          OR o.title ILIKE $4
          OR o.code ILIKE $4
          OR o.description ILIKE $4
        )
        AND ($5::text[] IS NULL OR LOWER(o.discount_type) = ANY($5::text[]))
      ORDER BY o.createdat DESC
      ${shouldReturnAll ? "" : "LIMIT $6 OFFSET $7"}
    `;

    const offersResult = await pool.query(offersQuery, [
      orgId,
      managerId,
      statusParams,
      searchParam,
      discountTypeParams,
      ...(shouldReturnAll ? [] : [limit, offset]),
    ]);

    const statsQuery = `
      WITH manager_offers AS (
        SELECT DISTINCT
          o.id,
          o.status,
          o.is_global
        FROM crm_offer o
        LEFT JOIN crm_managerofferassignment oa
          ON oa.offer_id = o.id
        WHERE (o.organization_id = $1 OR o.is_global = true)
          AND (o.is_global = true OR oa.user_id = $2)
          AND ($3::text[] IS NULL OR LOWER(o.status) = ANY($3::text[]))
          AND (
            $4::text IS NULL
            OR o.title ILIKE $4
            OR o.code ILIKE $4
            OR o.description ILIKE $4
          )
          AND ($5::text[] IS NULL OR LOWER(o.discount_type) = ANY($5::text[]))
      )
      SELECT
        COUNT(*) AS total_count,
        COUNT(*) FILTER (WHERE LOWER(status) = 'active') AS active_count,
        COUNT(*) FILTER (WHERE LOWER(status) = 'inactive') AS inactive_count,
        COUNT(*) FILTER (WHERE is_global = true) AS global_count
      FROM manager_offers
    `;

    const statsResult = await pool.query(statsQuery, [
      orgId,
      managerId,
      statusParams,
      searchParam,
      discountTypeParams,
    ]);
    const stats = statsResult.rows[0] || {};

    return {
      stats: {
        totalOffers: Number(stats.total_count) || 0,
        activeOffers: Number(stats.active_count) || 0,
        inactiveOffers: Number(stats.inactive_count) || 0,
        globalOffers: Number(stats.global_count) || 0,
      },
      offers: offersResult.rows,
      pagination: createPaginationMeta({
        page,
        limit: shouldReturnAll ? Math.max(Number(stats.total_count) || 0, limit) : limit,
        total: Number(stats.total_count) || 0,
      }),
    };
  } catch (error: any) {
    return req.error(
      500,
      error?.message || "Failed to fetch manager offer overview",
    );
  }
};
