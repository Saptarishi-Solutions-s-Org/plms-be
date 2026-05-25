import { pool }             from "../../lib/db";
import { randomUUID }       from "crypto";
import { generateLeadCode } from "../../lib/leadcode";

export const importLeadsHandler = async (req: any) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orgId     = req.user?.orgId;
    const createdBy = req.user?.id;

    if (!orgId) return req.error(401, "Unauthorized");

    const rows: any[] = req.data?.rows ?? [];

    if (!rows.length) return req.error(400, "No rows provided");

    let imported = 0;
    let failed   = 0;

    for (const row of rows) {
      const {
        name, gender, email, phone,
        city, state, stateId, country, countryId, postalCode,
        leadSource, source, status, priority, notes, assignedTo,
      } = row;

      const resolvedLeadSource = leadSource ?? source;
      const resolvedStateId = stateId ?? state;
      const resolvedCountryId = countryId ?? country;

      // Skip rows missing required fields
      if (!name || !email || !phone || !status || !priority || !resolvedLeadSource) {
        failed++;
        continue;
      }

      try {
        const leadId = randomUUID();
        const code   = generateLeadCode();

        await client.query(
          `INSERT INTO crm_leads
             (id, code, name, gender, email, phone,
              status, priority, source, import_type,
              address, postal_code,
              state_id, country_id,
              organization_id, assigned_to_id,
              createdat, createdby, modifiedat, modifiedby)
           VALUES
             ($1,$2,$3,$4,$5,$6,
              $7,$8,$9,'Import',
              $10,$11,
              $12,$13,
              $14,$15,
              NOW(),$16,NOW(),$16)`,
          [
            leadId, code,
            name, gender ?? "Prefer not to say", email, phone,
            status, priority, resolvedLeadSource,
            city ?? "", postalCode ?? "",
            resolvedStateId || null, resolvedCountryId || null,
            orgId, assignedTo || null,
            createdBy,
          ]
        );

        if (notes?.trim()) {
          await client.query(
            `INSERT INTO crm_leadactivity
               (id, lead_id, notes, createdat, createdby, modifiedat, modifiedby)
             VALUES ($1,$2,$3,NOW(),$4,NOW(),$4)`,
            [randomUUID(), leadId, notes.trim(), createdBy]
          );
        }

        imported++;
      } catch {
        failed++;
      }
    }

    await client.query("COMMIT");
    return { imported, failed };
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Error importing leads:", error?.message ?? error);
    return req.error(500, "Failed to import leads");
  } finally {
    client.release();
  }
};
