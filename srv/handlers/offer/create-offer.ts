import { pool } from "../../lib/db";
import { randomUUID } from "crypto";

export const createOfferHandler = async (req: any) => {
  const client = await pool.connect();

  try {
    const data = req.data ?? {};

    const orgId = req.user?.orgId;

    if (!orgId) {
      return req.reject(401, "Unauthorized");
    }

    const {
      is_global,
      title,
      code,
      description = null,
      discount_type,
      valid_from,
      valid_to,
      discount_amount = null,
      discount_percentage = null,
      max_discount_amount = null,
      combo_description = null,
      buy_quantity = null,
      get_quantity = null,
      min_purchase_amount = null,
      discount_value = null,
      flag_discount_amount = null,
    } = data;

    const managerIds: string[] = Array.isArray(data.manager_ids)
      ? data.manager_ids
      : data.manager_ids
        ? [data.manager_ids]
        : [];

    const id = randomUUID();

    await client.query("BEGIN");

    // Create Offer
    await client.query(
      `
      INSERT INTO crm_offer (
        id,
        organization_id,
        is_global,
        title,
        code,
        description,
        discount_type,
        discount_amount,
        discount_percentage,
        max_discount_amount,
        combo_description,
        buy_quantity,
        get_quantity,
        min_purchase_amount,
        discount_value,
        flag_discount_amount,
        valid_from,
        valid_to,
        status
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,
        $11,$12,$13,
        $14,$15,$16,
        $17,$18,$19
      )
      `,
      [
        id,
        is_global ? null : orgId,
        is_global,
        title?.trim(),
        `${code?.trim()?.toUpperCase()}_${Date.now()}`,
        description?.trim() || null,
        discount_type,
        discount_amount,
        discount_percentage,
        max_discount_amount,
        combo_description,
        buy_quantity,
        get_quantity,
        min_purchase_amount,
        discount_value,
        flag_discount_amount,
        valid_from,
        valid_to,
        "Active",
      ]
    );

    // Assign Managers
    if (!is_global && managerIds.length > 0) {
      const validCheck = await client.query(
        `
        SELECT u.id
        FROM crm_user u
        JOIN crm_organizationroles or_ ON or_.id = u.role_id
        JOIN crm_roles r ON r.id = or_.role_id
        WHERE u.id = ANY($1)
          AND u.organization_id = $2
          AND u.is_active = true
          AND LOWER(r.name) = 'manager'
        `,
        [managerIds, orgId]
      );

      const validManagerIds = validCheck.rows.map((row) => row.id);

      if (validManagerIds.length === 0) {
        throw new Error("No valid managers found");
      }

      const assignmentValues = validManagerIds
        .map((_, i) => {
          const base = i * 3;
          return `($${base + 1}, $${base + 2}, $${base + 3})`;
        })
        .join(", ");

      const assignmentParams = validManagerIds.flatMap((managerId) => [
        randomUUID(),
        id,           
        managerId,    
      ]);

      await client.query(
        `
        INSERT INTO crm_offerassignment (
          id,
          offer_id,
          user_id
        )
        VALUES ${assignmentValues}
        `,
        assignmentParams
      );
    }

    await client.query("COMMIT");

    return {
      id,
      message: "Offer created successfully",
    };

  } catch (error: any) {
    await client.query("ROLLBACK");

    

    return req.reject(
      500,
      error?.message || "Failed to create offer"
    );

  } finally {
    client.release();
  }
};