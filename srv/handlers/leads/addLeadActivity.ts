import { pool } from "../../lib/db";
import { randomUUID } from "crypto";

export const addLeadActivityHandler = async (req: any) => {
  const orgId     = req.user?.orgId;
  const createdBy = req.user?.id;

  if (!orgId) return req.error(401, "Unauthorized");

  const { leadId, type, notes, freeText, callStatus, nextFollowUpDate } = req.data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const activityId = randomUUID();

    await client.query(
      `INSERT INTO crm_leadactivity
         (id, lead_id, type, notes, free_text, call_status, next_follow_up_date,
          createdat, createdby, modifiedat, modifiedby)
       VALUES ($1,$2,$3,$4,$5,$6,$7, NOW(),$8, NOW(),$8)`,
      [
        activityId,
        leadId,
        type             || null,
        notes,
        freeText         || null,
        callStatus       || null,
        nextFollowUpDate || null,
        createdBy,
      ],
    );

    await client.query("COMMIT");

    const result = await pool.query(
      `SELECT
         la.id                              AS "id",
         la.type                            AS "type",
         la.notes                           AS "notes",
         la.free_text                       AS "freeText",
         la.call_status                     AS "callStatus",
         la.next_follow_up_date             AS "nextFollowUpDate",
         la.createdat                       AS "createdAt",
         COALESCE(u.name, 'System Bot')     AS "createdByName",
         COALESCE(r.name, '')               AS "createdByRole"
       FROM crm_leadactivity la
       LEFT JOIN crm_user             u   ON u.id::text = la.createdby
       LEFT JOIN crm_organizationroles orr ON orr.id = u.role_id
       LEFT JOIN crm_roles            r   ON r.id  = orr.role_id
       WHERE la.id = $1`,
      [activityId],
    );

    return { message: "Activity added", activity: result.rows[0] };
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("addLeadActivity error:", error?.message ?? error);
    return req.error(500, "Failed to add activity");
  } finally {
    client.release();
  }
};
