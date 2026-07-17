"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExecutiveHandler = void 0;
const crypto_1 = require("crypto");
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../../lib/db");
const generatePassword_1 = require("../../lib/generatePassword");
const sendUserCreationMail_1 = require("../../mail/sendUserCreationMail");
const socket_1 = require("../../realtime/socket");
const events_1 = require("../../realtime/events");
const createExecutiveHandler = async (req) => {
    const client = await db_1.pool.connect();
    try {
        const orgId = req.user?.orgId;
        const managerId = req.user?.id;
        const isManager = req.user?.roles?.includes("manager");
        if (!orgId || !managerId || !isManager) {
            return req.error(403, "Forbidden: only managers can create executives");
        }
        const { name, email, phone, gender, dob, country, state, city } = req.data;
        if (!name || !email || !phone || !gender || !dob || !country || !state || !city) {
            return req.error(400, "Missing required fields");
        }
        await client.query("BEGIN");
        const existingUser = await client.query("SELECT id FROM crm_user WHERE email = $1 LIMIT 1", [email]);
        if (existingUser.rows.length) {
            await client.query("ROLLBACK");
            return req.error(400, "Email already exists");
        }
        const executiveRole = await client.query(`SELECT orr.id
       FROM crm_organizationroles orr
       JOIN crm_roles r ON r.id = orr.role_id
       WHERE orr.organization_id = $1
         AND LOWER(TRIM(r.name)) = 'executive'
       LIMIT 1`, [orgId]);
        if (!executiveRole.rows.length) {
            await client.query("ROLLBACK");
            return req.error(400, "Executive role not found in this organization");
        }
        const password = (0, generatePassword_1.generatePassword)();
        const userId = (0, crypto_1.randomUUID)();
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        await client.query(`INSERT INTO crm_user
        (id, name, email, phone, password, gender, dob,
         organization_id, role_id, reporting_manager_id, country_id, state_id, city,
         is_active, must_change_password, createdat, createdby, modifiedat, modifiedby)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, TRUE, TRUE, NOW(), $14, NOW(), $14)`, [
            userId,
            name,
            email,
            phone,
            hashedPassword,
            gender,
            dob,
            orgId,
            executiveRole.rows[0].id,
            managerId,
            country,
            state,
            city,
            managerId,
        ]);
        await client.query("COMMIT");
        (0, socket_1.emitToOrg)(orgId, events_1.USER_LIST_CHANGED, { reason: "executive-created", userId });
        (0, socket_1.emitToOrg)(orgId, events_1.USER_DETAIL_CHANGED, { reason: "executive-created", userId });
        const organization = await db_1.pool.query("SELECT name, code FROM crm_organization WHERE id = $1 LIMIT 1", [orgId]);
        try {
            await (0, sendUserCreationMail_1.sendUserCreationMail)({
                to: email,
                name,
                orgName: organization.rows[0]?.name,
                orgCode: organization.rows[0]?.code,
                email,
                password,
            });
        }
        catch (mailError) {
            console.error("Executive creation email failed:", mailError);
        }
        return { message: "Executive created successfully", userId, tempPassword: password };
    }
    catch (error) {
        await client.query("ROLLBACK");
        console.error("createExecutive error:", error);
        return req.error(500, "Failed to create executive");
    }
    finally {
        client.release();
    }
};
exports.createExecutiveHandler = createExecutiveHandler;
