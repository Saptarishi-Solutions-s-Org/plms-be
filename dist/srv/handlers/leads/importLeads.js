"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importLeadsHandler = void 0;
const db_1 = require("../../lib/db");
const crypto_1 = require("crypto");
const leadcode_1 = require("../../lib/leadcode");
const socket_1 = require("../../realtime/socket");
const events_1 = require("../../realtime/events");
const importLeadsHandler = async (req) => {
    const client = await db_1.pool.connect();
    try {
        await client.query("BEGIN");
        const orgId = req.user?.orgId;
        const createdBy = req.user?.id;
        if (!orgId || !createdBy)
            return req.error(401, "Unauthorized");
        const rows = req.data?.rows ?? [];
        if (!rows.length)
            return req.error(400, "No rows provided");
        let imported = 0;
        let failed = 0;
        for (const row of rows) {
            const { name, gender, email, phone, city, stateId, countryId, postalCode, leadSource, status, priority, notes, assignedTo, } = row;
            // Skip rows missing the five required fields
            if (!name || !gender || !email || !phone || !leadSource) {
                failed++;
                continue;
            }
            try {
                // Skip if a lead with same email or phone already exists for the org
                const dup = await client.query(`SELECT id FROM crm_leads WHERE organization_id=$1 AND (email=$2 OR phone=$3) LIMIT 1`, [orgId, email, phone]);
                if (dup.rowCount) {
                    failed++;
                    continue;
                }
                // Do not insert duplicates: skip if a lead with same email or phone exists for this org
                const dupCheck = await client.query(`SELECT id FROM crm_leads WHERE organization_id = $1 AND (email = $2 OR phone = $3) LIMIT 1`, [orgId, email, phone]);
                if (dupCheck.rowCount) {
                    failed++;
                    continue;
                }
                const leadId = (0, crypto_1.randomUUID)();
                const code = (0, leadcode_1.generateLeadCode)();
                await client.query(`INSERT INTO crm_leads
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
              NOW(),$16,NOW(),$16)`, [
                    leadId, code,
                    name, gender, email, phone,
                    status ?? 'New', priority ?? null, leadSource,
                    city ?? "", postalCode ?? "",
                    stateId || null, countryId || null,
                    orgId, assignedTo || null,
                    createdBy,
                ]);
                if (notes?.trim()) {
                    await client.query(`INSERT INTO crm_leadactivity
               (id, lead_id, notes, createdat, createdby, modifiedat, modifiedby)
             VALUES ($1,$2,$3,NOW(),$4,NOW(),$4)`, [(0, crypto_1.randomUUID)(), leadId, notes.trim(), createdBy]);
                }
                imported++;
            }
            catch {
                failed++;
            }
        }
        await client.query("COMMIT");
        if (imported > 0) {
            (0, socket_1.emitToOrg)(orgId, events_1.LEAD_LIST_CHANGED, {
                reason: "leads-imported",
                imported,
                failed,
            });
        }
        return { imported, failed };
    }
    catch (error) {
        await client.query("ROLLBACK");
        console.error("Error importing leads:", error?.message ?? error);
        return req.error(500, "Failed to import leads");
    }
    finally {
        client.release();
    }
};
exports.importLeadsHandler = importLeadsHandler;
