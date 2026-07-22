"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserHandler = void 0;
const db_1 = require("../../lib/db");
const crypto_1 = require("crypto");
const sendUserCreationMail_1 = require("../../mail/sendUserCreationMail");
const generatePassword_1 = require("../../lib/generatePassword");
const bcrypt_1 = __importDefault(require("bcrypt"));
const socket_1 = require("../../realtime/socket");
const events_1 = require("../../realtime/events");
const createUserHandler = async (req) => {
    const client = await db_1.pool.connect();
    try {
        await client.query("BEGIN");
        const { name, email, phone, gender, dob, state, country, organizationId } = req.data;
        const createdBy = req.user?.userId || req.user?.id || null;
        if (!organizationId) {
            return req.error(400, "Organization is required");
        }
        const emailCheck = await client.query(`SELECT id FROM crm_user WHERE email=$1`, [email]);
        if (emailCheck.rows.length) {
            await client.query("ROLLBACK");
            return req.error(409, "Email is already in use by another user");
        }
        const orgRes = await client.query(`SELECT name, code FROM crm_organization WHERE id = $1`, [organizationId]);
        if (!orgRes.rows.length) {
            return req.error(404, "Organization not found");
        }
        const orgName = orgRes.rows[0].name;
        const orgCode = orgRes.rows[0].code;
        const password = (0, generatePassword_1.generatePassword)();
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const userId = (0, crypto_1.randomUUID)();
        const roleRes = await client.query(`SELECT orr.id
       FROM crm_organizationroles orr
       JOIN crm_roles r ON r.id = orr.role_id
       WHERE orr.organization_id = $1 
       AND LOWER(r.name) LIKE '%admin%'
       LIMIT 1`, [organizationId]);
        if (!roleRes.rows.length) {
            return req.error(400, "Admin role not found for this organization");
        }
        const roleId = roleRes.rows[0].id;
        await client.query(`INSERT INTO crm_user
      (id, name, email, phone, password, gender, dob, organization_id, role_id, state_id, country_id, is_active, must_change_password, createdat, createdby, modifiedat, modifiedby)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,true,NOW(),$12,NOW(),$12)`, [
            userId,
            name,
            email,
            phone,
            hashedPassword,
            gender,
            dob,
            organizationId,
            roleId,
            state,
            country,
            createdBy,
        ]);
        await client.query("COMMIT");
        (0, socket_1.emitToSystemAdmins)(events_1.SYSTEM_ADMIN_DASHBOARD_CHANGED, {
            reason: "organization-admin-created",
            orgId: organizationId,
            userId,
        });
        (0, socket_1.emitToSystemAdmins)(events_1.ORGANIZATION_DETAIL_CHANGED, {
            reason: "organization-admin-created",
            orgId: organizationId,
            userId,
        });
        await (0, sendUserCreationMail_1.sendUserCreationMail)({
            to: email,
            name,
            orgName,
            orgCode,
            email,
            password,
        });
        return {
            message: "User created successfully",
        };
    }
    catch (err) {
        await client.query("ROLLBACK");
        return req.error(500, "Failed to create user");
    }
    finally {
        client.release();
    }
};
exports.createUserHandler = createUserHandler;
