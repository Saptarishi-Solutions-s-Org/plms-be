"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrgUserHandler = void 0;
const db_1 = require("../../lib/db");
const crypto_1 = require("crypto");
const bcrypt_1 = __importDefault(require("bcrypt"));
const generatePassword_1 = require("../../lib/generatePassword");
const sendUserCreationMail_1 = require("../../mail/sendUserCreationMail");
const socket_1 = require("../../realtime/socket");
const events_1 = require("../../realtime/events");
const createOrgUserHandler = async (req) => {
    const client = await db_1.pool.connect();
    try {
        await client.query("BEGIN");
        const orgId = req.user?.orgId;
        const createdBy = req.user?.userId || req.user?.id;
        if (!orgId) {
            return req.error(401, "Unauthorized");
        }
        const { name, email, phone, gender, dob, country, state, city, roleName, reportingManager, } = req.data;
        if (!name || !email || !roleName) {
            return req.error(400, "Missing required fields");
        }
        const existingUser = await client.query(`SELECT id FROM crm_user WHERE email = $1`, [email]);
        if (existingUser.rows.length) {
            return req.error(400, "Email already exists");
        }
        const roleRes = await client.query(`SELECT r.id
       FROM crm_organizationroles r
       JOIN crm_roles rl ON rl.id = r.role_id
       WHERE r.organization_id = $1
       AND rl.name = $2
       LIMIT 1`, [orgId, roleName]);
        if (!roleRes.rows.length) {
            return req.error(400, "Role not found in this organization");
        }
        const roleId = roleRes.rows[0].id;
        const password = (0, generatePassword_1.generatePassword)();
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const userId = (0, crypto_1.randomUUID)();
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
            roleId,
            reportingManager,
            country,
            state,
            city,
            createdBy,
        ]);
        await client.query("COMMIT");
        (0, socket_1.emitToOrg)(orgId, events_1.USER_LIST_CHANGED, {
            reason: "user-created",
            userId,
        });
        (0, socket_1.emitToOrg)(orgId, events_1.USER_DETAIL_CHANGED, {
            reason: "user-created",
            userId,
        });
        const orgRes = await client.query(`SELECT name, code FROM crm_organization WHERE id = $1`, [orgId]);
        const orgName = orgRes.rows[0]?.name;
        const orgCode = orgRes.rows[0]?.code;
        try {
            await (0, sendUserCreationMail_1.sendUserCreationMail)({
                to: email,
                name,
                orgName,
                orgCode,
                email,
                password,
            });
            console.log("Sending mail to:", email);
        }
        catch (mailErr) {
            console.error("Email failed but user created:", mailErr);
        }
        return {
            message: "User created successfully",
            userId,
            tempPassword: password,
        };
    }
    catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        return req.error(500, "Failed to create user");
    }
    finally {
        client.release();
    }
};
exports.createOrgUserHandler = createOrgUserHandler;
