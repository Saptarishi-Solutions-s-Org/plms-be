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
        const { name, gender, email, phone, city, state, country, postalCode, leadSource, status, assignedTo, managerId, priority, notes, } = req.data;
        if (!name || !email || !phone || !status || !priority || !leadSource) {
            await client.query("ROLLBACK");
            return req.error(400, "Missing required fields");
        }
        let actualCreatedBy = createdBy;
        let actualAssignedTo = assignedTo || null;
        if (managerId) {
            actualCreatedBy = managerId;
            if (!assignedTo) {
                actualAssignedTo = null;
            }
        }
        if (actualAssignedTo) {
            const assignee = await client.query(`SELECT u.id
           FROM crm_user u
           JOIN crm_organizationroles organization_role
             ON organization_role.id = u.role_id
           JOIN crm_roles role
             ON role.id = organization_role.role_id
          WHERE u.id = $1
            AND u.organization_id = $2
            AND u.is_active = true
            AND LOWER(role.name) IN ('manager', 'executive')
          LIMIT 1`, [actualAssignedTo, orgId]);
            if (!assignee.rowCount) {
                await client.query("ROLLBACK");
                return req.error(400, "Assignee must be an active manager or executive in your organization");
            }
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
            actualAssignedTo,
            actualCreatedBy,
        ]);
        if (notes?.trim()) {
            await client.query(`INSERT INTO crm_leadactivity
           (id, lead_id, notes, createdat, createdby, modifiedat, modifiedby)
         VALUES ($1,$2,$3,NOW(),$4,NOW(),$4)`, [(0, crypto_1.randomUUID)(), leadId, notes.trim(), actualCreatedBy]);
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
