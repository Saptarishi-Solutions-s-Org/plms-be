"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLeadHandler = void 0;
const db_1 = require("../../lib/db");
const crypto_1 = require("crypto");
const leadcode_1 = require("../../lib/leadcode");
const createLeadHandler = async (req) => {
    const client = await db_1.pool.connect();
    try {
        await client.query("BEGIN");
        const orgId = req.user?.orgId;
        const createdBy = req.user?.id;
        if (!orgId) {
            return req.error(401, "Unauthorized");
        }
        const { name, gender, email, phone, city, stateId, countryId, postalCode, leadSource, status, assignedTo, priority, notes, } = req.data;
        if (!name || !email || !phone || !status || !priority || !leadSource) {
            return req.error(400, "Missing required fields");
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
          $7,$8,$9,'Manual',
          $10,$11,
          $12,$13,
          $14,$15,
          NOW(),$16,NOW(),$16)`, [
            leadId, code, name, gender, email, phone,
            status, priority, leadSource,
            city, postalCode,
            stateId || null, countryId || null,
            orgId, assignedTo || null,
            createdBy,
        ]);
        if (notes?.trim()) {
            await client.query(`INSERT INTO crm_leadactivity
           (id, lead_id, notes, createdat, createdby, modifiedat, modifiedby)
         VALUES ($1,$2,$3,NOW(),$4,NOW(),$4)`, [(0, crypto_1.randomUUID)(), leadId, notes.trim(), createdBy]);
        }
        await client.query("COMMIT");
        return { message: "Lead created successfully", leadId };
    }
    catch (error) {
        await client.query("ROLLBACK");
        console.error("Error creating lead:", error?.message ?? error);
        return req.error(500, "Failed to create lead");
    }
    finally {
        client.release();
    }
};
exports.createLeadHandler = createLeadHandler;
