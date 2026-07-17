import { pool } from "../../lib/db";
import { randomUUID } from "crypto";
import { generateOfferCode } from "../../lib/generateOfferCode";
import { emitToOrg } from "../../realtime/socket";
import { OFFER_LIST_CHANGED } from "../../realtime/events";
export const createOfferHandler = async (req: any) => {
  const client = await pool.connect();

  try {
    const data = req.data ?? {};

    const orgId = req.user?.orgId;
    const userId = req.user?.id;

    if (!orgId) {
      return req.reject(401, "Unauthorized");
    }

    const {
      is_global,
      title,
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
        status,
        createdat,
        createdby
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,
        $11,$12,$13,
        $14,$15,$16,
        $17,$18,$19,
        $20,$21
      )
      `,
      [
        id,
        orgId,
        is_global,
        title?.trim(),
        generateOfferCode(),
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
        "Active",
        new Date(),
        userId,
      ]
    );

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

      const validManagerIds = validCheck.rows.map(
        (row) => row.id
      );

      if (validManagerIds.length === 0) {
        throw new Error("No valid managers found");
      }

      const assignmentValues = validManagerIds
        .map((_, i) => {
          const base = i * 3;

          return `($${base + 1}, $${base + 2}, $${base + 3})`;
        })
        .join(", ");

      const assignmentParams = validManagerIds.flatMap(
        (managerId) => [
          randomUUID(),
          id,
          managerId,
        ]
      );

      await client.query(
        `
        INSERT INTO crm_managerofferassignment (
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

    emitToOrg(orgId, OFFER_LIST_CHANGED, {
      reason: "offer-created",
      offerId: id,
    });

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