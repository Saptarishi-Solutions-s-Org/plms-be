"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLeadHandler = void 0;
const db_1 = require("../../lib/db");
const crypto_1 = require("crypto");
const leadcode_1 = require("../../lib/leadcode");
const socket_1 = require("../../realtime/socket");
const events_1 = require("../../realtime/events");
const createLeadHandler = async (req) => {
    const client = await db_1.pool.connect();
    try {
        await client.query("BEGIN");
        const orgId = req.user?.orgId;
        const createdBy = req.user?.id;
        if (!orgId) {
            return req.error(401, "Unauthorized");
        }
        const { name, gender, email, phone, city, state, country, postalCode, leadSource, status, assignedTo, priority, notes, } = req.data;
        if (!name || !email || !phone || !status || !priority || !leadSource) {
            return req.error(400, "Missing required fields");
        }
        const duplicate = await client.query(`SELECT id FROM crm_leads
       WHERE organization_id = $1
         AND (LOWER(email) = LOWER($2) OR phone = $3)
       LIMIT 1`, [orgId, email, phone]);
        if (duplicate.rowCount) {
            await client.query("ROLLBACK");
            return req.error(409, "A lead with this email or phone already exists");
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
            leadId,
            code,
            name,
            gender,
            email,
            phone,
            status,
            priority,
            leadSource,
            city,
            postalCode,
            state || null,
            country || null,
            orgId,
            assignedTo || null,
            createdBy,
        ]);
        if (notes?.trim()) {
            await client.query(`INSERT INTO crm_leadactivity
           (id, lead_id, notes, createdat, createdby, modifiedat, modifiedby)
         VALUES ($1,$2,$3,NOW(),$4,NOW(),$4)`, [(0, crypto_1.randomUUID)(), leadId, notes.trim(), createdBy]);
        }
        await client.query("COMMIT");
        (0, socket_1.emitToOrg)(orgId, events_1.LEAD_LIST_CHANGED, {
            reason: "lead-created",
            leadId,
            leadCode: code,
        });
        return { message: "Lead created successfully", leadCode: code };
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
