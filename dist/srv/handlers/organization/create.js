"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrganizationHandler = void 0;
const db_1 = require("../../lib/db");
const orgcode_1 = require("../../lib/orgcode");
const sendOrganizationCreationMail_1 = require("../../mail/sendOrganizationCreationMail");
const crypto_1 = require("crypto");
const socket_1 = require("../../realtime/socket");
const events_1 = require("../../realtime/events");
const createOrganizationHandler = async (req) => {
    const client = await db_1.pool.connect();
    try {
        await client.query("BEGIN");
        const { name, email, phone, address, state, country, start_date, end_date, trial, } = req.data;
        const userId = req.user?.id || null;
        const code = (0, orgcode_1.generateOrgCode)();
        const orgId = (0, crypto_1.randomUUID)();
        await client.query(`INSERT INTO crm_organization 
      (id, name, code, is_active, email, phone, address, state_id, country_id, start_date, end_date, trial, is_super_organization, createdat, createdby, modifiedat, modifiedby)
      VALUES ($1,$2,$3,true,$4,$5,$6,$7,$8,$9,$10,$11,false,NOW(),$12,NOW(),$12)`, [
            orgId,
            name,
            code,
            email,
            phone,
            address,
            state,
            country,
            start_date,
            end_date,
            trial,
            userId,
        ]);
        const modules = await client.query(`SELECT id FROM crm_modules WHERE "default" = true`);
        for (const m of modules.rows) {
            await client.query(`INSERT INTO crm_organizationmodules 
        (id, organization_id, module_id, createdat, createdby, modifiedat, modifiedby)
        VALUES ($1,$2,$3,NOW(),$4,NOW(),$4)`, [(0, crypto_1.randomUUID)(), orgId, m.id, userId]);
        }
        const roles = await client.query(`SELECT id FROM crm_roles WHERE "default" = true`);
        const orgRoleMap = {};
        for (const r of roles.rows) {
            const newId = (0, crypto_1.randomUUID)();
            await client.query(`INSERT INTO crm_organizationroles 
        (id, organization_id, role_id, createdat, createdby, modifiedat, modifiedby)
        VALUES ($1,$2,$3,NOW(),$4,NOW(),$4)`, [newId, orgId, r.id, userId]);
            orgRoleMap[r.id] = newId;
        }
        const rmps = await client.query(`SELECT id, role_id, access FROM crm_rolemodulepermissions`);
        for (const rmp of rmps.rows) {
            const orgRoleId = orgRoleMap[rmp.role_id];
            if (!orgRoleId)
                continue;
            await client.query(`INSERT INTO crm_organizationrolemodulepermissions
        (id, organization_id, organizationrole_id, rmp_id, access, createdat, createdby, modifiedat, modifiedby)
        VALUES ($1,$2,$3,$4,$5,NOW(),$6,NOW(),$6)`, [(0, crypto_1.randomUUID)(), orgId, orgRoleId, rmp.id, rmp.access, userId]);
        }
        await client.query("COMMIT");
        (0, socket_1.emitToSystemAdmins)(events_1.SYSTEM_ADMIN_DASHBOARD_CHANGED, {
            reason: "organization-created",
            orgId,
            orgCode: code,
        });
        (0, socket_1.emitToSystemAdmins)(events_1.ORGANIZATION_LIST_CHANGED, {
            reason: "organization-created",
            orgId,
            orgCode: code,
        });
        if (email) {
            await (0, sendOrganizationCreationMail_1.sendOrganizationCreationMail)({
                to: email,
                name,
                orgName: name,
                orgCode: code,
            });
        }
        return {
            message: "Organization created successfully",
            code,
        };
    }
    catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        return req.error(500, "Failed to create organization");
    }
    finally {
        client.release();
    }
};
exports.createOrganizationHandler = createOrganizationHandler;
