import { pool } from "../../lib/db";
import { randomUUID } from "crypto";

export const updateLeadHandler = async (req: any) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orgId      = req.user?.orgId;
    const modifiedBy = req.user?.id;

    if (!orgId) {
      return req.error(401, "Unauthorized");
    }

    const {
      id, name, gender, email, phone,
      city, stateId, countryId, postalCode,
      leadSource, status, assignedTo, priority, notes,
    } = req.data;

    if (!id) {
      return req.error(400, "Lead ID is required");
    }

    const existsRes = await client.query(
      `SELECT id FROM crm_leads WHERE id = $1 AND organization_id = $2`,
      [id, orgId]
    );

    if (existsRes.rows.length === 0) {
      return req.error(404, "Lead not found");
    }

    await client.query(
      `UPDATE crm_leads SET
         name           = $1,
         gender         = $2,
         email          = $3,
         phone          = $4,
         address        = $5,
         postal_code    = $6,
         state_id       = $7,
         country_id     = $8,
         source         = $9,
         status         = $10,
         priority       = $11,
         assigned_to_id = $12,
         modifiedat     = NOW(),
         modifiedby     = $13
       WHERE id = $14 AND organization_id = $15`,
      [
        name, gender, email, phone,
        city, postalCode,
        stateId || null, countryId || null,
        leadSource, status, priority,
        assignedTo || null,
        modifiedBy,
        id, orgId,
      ]
    );

    if (notes?.trim()) {
      await client.query(
        `INSERT INTO crm_leadactivity
           (id, lead_id, notes, createdat, createdby, modifiedat, modifiedby)
         VALUES ($1,$2,$3,NOW(),$4,NOW(),$4)`,
        [randomUUID(), id, notes.trim(), modifiedBy]
      );
    }

    await client.query("COMMIT");

    return { message: "Lead updated successfully" };
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Error updating lead:", error?.message ?? error);
    return req.error(500, "Failed to update lead");
  } finally {
    client.release();
  }
};