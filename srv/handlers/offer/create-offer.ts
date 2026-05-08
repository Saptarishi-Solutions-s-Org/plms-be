import { pool } from "../../lib/db";
import { randomUUID } from "crypto";


const VALID_DISCOUNT_TYPES = [
  "Fixed_Amount",
  "Percentage",
  "Combo_Offer",
  "Buy_One_Get_One_Free",
  "Conditional_Discount",
  "Flag_Discount",
];

export const createOfferHandler = async (req: any) => {
  const client = await pool.connect();

  try {
    const data = req.data ?? {};


    const orgId = req.user?.orgId;
    if (!orgId) {
      return req.reject(401, "Unauthorized");
    }


    const is_global = data.is_global;
    const title = data.title?.trim();
    const code = data.code?.trim()?.toUpperCase();
    const description = data.description?.trim() || null;
    const discount_type = data.discount_type;
    const valid_from = data.valid_from;
    const valid_to = data.valid_to;


    const managerIds: string[] = Array.isArray(data.manager_ids)
      ? data.manager_ids
      : data.manager_ids
        ? [data.manager_ids]
        : [];


    if (typeof is_global !== "boolean") {
      return req.reject(400, "`is_global` must be boolean");
    }

    if (!title || !code || !discount_type || !valid_from || !valid_to) {
      return req.reject(400, "Missing required fields: title, code, discount_type, valid_from, valid_to");
    }


    if (!VALID_DISCOUNT_TYPES.includes(discount_type)) {
      return req.reject(
        400,
        `Invalid discount_type. Must be one of: ${VALID_DISCOUNT_TYPES.join(", ")}`
      );
    }

    if (!is_global && managerIds.length === 0) {
      return req.reject(400, "Assign at least one manager for a non-global offer");
    }

    if (is_global && managerIds.length > 0) {
      return req.reject(400, "Global offers cannot have managers assigned");
    }

    if (valid_to < valid_from) {
      return req.reject(400, "`valid_to` must be after `valid_from`");
    }

    // ── Discount type specific validations ───────────────────────────────────
    if (discount_type === "Fixed_Amount" && !data.discount_amount) {
      return req.reject(400, "`discount_amount` is required for Fixed_Amount");
    }

    if (discount_type === "Percentage" && !data.discount_percentage) {
      return req.reject(400, "`discount_percentage` is required for Percentage");
    }

    if (discount_type === "Combo_Offer" && !data.combo_description) {
      return req.reject(400, "`combo_description` is required for Combo_Offer");
    }

    if (discount_type === "Buy_One_Get_One_Free" && (!data.buy_quantity || !data.get_quantity)) {
      return req.reject(400, "`buy_quantity` and `get_quantity` are required for Buy_One_Get_One_Free");
    }

    if (discount_type === "Conditional_Discount" && (!data.min_purchase_amount || !data.discount_value)) {
      return req.reject(400, "`min_purchase_amount` and `discount_value` are required for Conditional_Discount");
    }

    if (discount_type === "Flag_Discount" && !data.flag_discount_amount) {
      return req.reject(400, "`flag_discount_amount` is required for Flag_Discount");
    }


    const id = randomUUID();

    await client.query("BEGIN");


    await client.query(
      `INSERT INTO crm_offer (
        id, organization_id, is_global, title, code, description,
        discount_type, discount_amount, discount_percentage, max_discount_amount,
        combo_description, buy_quantity, get_quantity,
        min_purchase_amount, discount_value, flag_discount_amount,
        valid_from, valid_to, status
      ) VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,
        $11,$12,$13,
        $14,$15,$16,
        $17,$18,$19
      )`,
      [
        id,
        is_global ? null : orgId,
        is_global,
        title,
        code,
        description,
        discount_type,
        data.discount_amount ?? null,
        data.discount_percentage ?? null,
        data.max_discount_amount ?? null,
        data.combo_description ?? null,
        data.buy_quantity ?? null,
        data.get_quantity ?? null,
        data.min_purchase_amount ?? null,
        data.discount_value ?? null,
        data.flag_discount_amount ?? null,
        valid_from,
        valid_to,
        "Active",
      ]
    );


    if (!is_global && managerIds.length > 0) {

      const validCheck = await client.query(
        `SELECT u.id 
         FROM crm_user u
         JOIN crm_organizationroles or_ ON or_.id = u.role_id
         JOIN crm_roles r ON r.id = or_.role_id
         WHERE u.id = ANY($1)
           AND u.organization_id = $2
           AND u.is_active = true
           AND LOWER(r.name) = 'manager'`,
        [managerIds, orgId]
      );

      if (validCheck.rows.length !== managerIds.length) {
        throw new Error("One or more selected managers are invalid or do not belong to your organization");
      }

      const values = managerIds
        .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
        .join(", ");

      const params = managerIds.flatMap((managerId) => [
        randomUUID(),
        id,
        managerId,
      ]);

      await client.query(
        `INSERT INTO crm_offerassignment (id, offer_id, user_id)
         VALUES ${values}`,
        params
      );
    }

    await client.query("COMMIT");

    return {
      id,
      message: "Offer created successfully",
    };

  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("CreateOffer Error:", error);

    if (error.message?.includes("invalid or do not belong")) {
      return req.reject(400, error.message);
    }

    return req.reject(500, "Failed to create offer");
  } finally {
    client.release();
  }
};