import { pool } from "../../lib/db";
import { createPaginationMeta, parsePaginationParams } from "../../lib/pagination";

const normalizeListFilter = (value: unknown) => {
  if (typeof value !== "string" || value.trim().toLowerCase() === "all") {
    return null;
  }

  const values = decodeURIComponent(value)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return values.length ? values : null;
};

export const getReportOffersHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;
    const managerId = req.user?.id;

    if (!orgId || !managerId) {
      return req.error(401, "Unauthorized");
    }

    const paramsSource = { ...(req.data ?? {}), ...(req.query ?? {}) };
    const { page, limit, offset } = parsePaginationParams(paramsSource);
    const shouldReturnAll =
      paramsSource.all === true || paramsSource.all === "true";
    const statuses = normalizeListFilter(paramsSource.status);
    const discountTypes = normalizeListFilter(paramsSource.discountType);
    const rawSearch =
      typeof paramsSource.search === "string"
        ? decodeURIComponent(paramsSource.search).trim()
        : "";
    const search = rawSearch ? `%${rawSearch}%` : null;

    const params = [orgId, managerId, statuses, search, discountTypes];
    const whereClause = `
      (o.organization_id = $1 OR o.is_global = true)
      AND (o.is_global = true OR moa."user_ID" = $2)
      AND ($3::text[] IS NULL OR LOWER(o.status) = ANY($3::text[]))
      AND (
        $4::text IS NULL
        OR o.title ILIKE $4
        OR o.code ILIKE $4
        OR o.description ILIKE $4
      )
      AND ($5::text[] IS NULL OR LOWER(o.discount_type) = ANY($5::text[]))
    `;

    const offersQuery = `
      SELECT DISTINCT
        o.id,
        o.title,
        o.code,
        o.description,
        o.status,
        o.is_global AS "isGlobal",
        o.discount_type AS "discountType",
        o.discount_amount AS "discountAmount",
        o.discount_percentage AS "discountPercentage",
        o.max_discount_amount AS "maxDiscountAmount",
        o.combo_description AS "comboDescription",
        o.buy_quantity AS "buyQuantity",
        o.get_quantity AS "getQuantity",
        o.min_purchase_amount AS "minPurchaseAmount",
        o.discount_value AS "discountValue",
        o.flag_discount_amount AS "flagDiscountAmount",
        o.valid_from AS "validFrom",
        o.valid_to AS "validTo",
        o.createdat AS "createdAt",
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM crm_executiveofferassignment eoa
            WHERE eoa."offer_ID" = o.id
              AND eoa."assigned_by_ID" = $2
          ) THEN 'Assigned'
          ELSE 'Unassigned'
        END AS "assignmentStatus"
      FROM crm_offer o
      LEFT JOIN crm_managerofferassignment moa ON moa."offer_ID" = o.id
      WHERE ${whereClause}
      ORDER BY o.createdat DESC
      ${shouldReturnAll ? "" : "LIMIT $6 OFFSET $7"}
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT o.id) AS total
      FROM crm_offer o
      LEFT JOIN crm_managerofferassignment moa ON moa."offer_ID" = o.id
      WHERE ${whereClause}
    `;

    const [offersRes, countRes] = await Promise.all([
      pool.query(
        offersQuery,
        shouldReturnAll ? params : [...params, limit, offset],
      ),
      pool.query(countQuery, params),
    ]);

    const total = Number(countRes.rows[0]?.total ?? 0);

    return {
      offers: offersRes.rows,
      pagination: createPaginationMeta({
        page,
        limit: shouldReturnAll ? Math.max(total, limit) : limit,
        total,
      }),
    };
  } catch (error: any) {
    console.error("Error fetching report offers:", error?.message ?? error);
    return req.error(500, "Failed to fetch report offers");
  }
};
