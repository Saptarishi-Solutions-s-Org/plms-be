"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordHandler = exports.updateProfileHandler = exports.getProfileHandler = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../lib/db");
const passwordPolicy_1 = require("../lib/passwordPolicy");
const cookies_1 = require("../lib/cookies");
const refreshToken_1 = require("../lib/refreshToken");
const socket_1 = require("../realtime/socket");
const events_1 = require("../realtime/events");
function required(value) {
    return value !== undefined && value !== null && String(value).trim() !== "";
}
async function getProfileByUserId(userId) {
    const res = await db_1.pool.query(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      u.gender,
      u.dob,
      u.city,
      u.is_active as "isActive",
      u.state_id as "stateId",
      s.name as state,
      u.country_id as "countryId",
      c.name as country,
      u.organization_id as "organizationId",
      o.name as organization,
      o.code as "orgCode",
      u.role_id as "roleId",
      r.name as role,
      rm.name as "reportingManager"
    FROM crm_user u
    JOIN crm_organization o ON o.id = u.organization_id
    JOIN crm_organizationroles orr ON orr.id = u.role_id
    JOIN crm_roles r ON r.id = orr.role_id
    JOIN crm_state s ON s.id = u.state_id
    JOIN crm_country c ON c.id = u.country_id
    LEFT JOIN crm_user rm ON rm.id = u.reporting_manager_id
    WHERE u.id = $1
    LIMIT 1
    `, [userId]);
    return res.rows[0] || null;
}
const getProfileHandler = async (req) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId)
            return req.error(401, "Unauthorized");
        const profile = await getProfileByUserId(userId);
        if (!profile)
            return req.error(404, "Profile not found");
        return profile;
    }
    catch (err) {
        console.error("[profile.getProfile]", err);
        return req.error(500, "Failed to load profile");
    }
};
exports.getProfileHandler = getProfileHandler;
const updateProfileHandler = async (req) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId)
            return req.error(401, "Unauthorized");
        const { name, phone, gender, dob, city, state, country } = req.data;
        const missing = [
            ["name", name],
            ["phone", phone],
            ["gender", gender],
            ["dob", dob],
            ["city", city],
            ["state", state],
            ["country", country],
        ].find(([, value]) => !required(value));
        if (missing) {
            return req.error(400, `${missing[0]} is required`);
        }
        await db_1.pool.query(`
      UPDATE crm_user
      SET name = $1,
          phone = $2,
          gender = $3,
          dob = $4,
          city = $5,
          state_id = $6,
          country_id = $7,
          modifiedat = NOW(),
          modifiedby = $8
      WHERE id = $8
      `, [name, phone, gender, dob, city, state, country, userId]);
        (0, socket_1.emitToUser)(userId, events_1.PROFILE_CHANGED, {
            reason: "profile-updated",
            userId,
        });
        return { message: "Profile updated successfully" };
    }
    catch (err) {
        console.error("[profile.updateProfile]", err);
        return req.error(500, "Failed to update profile");
    }
};
exports.updateProfileHandler = updateProfileHandler;
const changePasswordHandler = async (req) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId)
            return req.error(401, "Unauthorized");
        const { currentPassword, newPassword, confirmPassword } = req.data;
        if (!currentPassword || !newPassword || !confirmPassword) {
            return req.error(400, "All password fields are required");
        }
        if (newPassword !== confirmPassword) {
            return req.error(400, "Passwords do not match");
        }
        if (currentPassword === newPassword) {
            return req.error(400, "New password must be different from old password");
        }
        const policy = (0, passwordPolicy_1.validatePasswordPolicy)(newPassword);
        if (!policy.valid) {
            return req.error(400, policy.message);
        }
        const userRes = await db_1.pool.query(`SELECT password FROM crm_user WHERE id = $1 LIMIT 1`, [userId]);
        const currentHash = userRes.rows[0]?.password;
        if (!currentHash)
            return req.error(404, "Profile not found");
        const currentValid = await bcrypt_1.default.compare(currentPassword, currentHash);
        if (!currentValid) {
            return req.error(401, "Current password is incorrect");
        }
        const newHash = await bcrypt_1.default.hash(newPassword, 10);
        await db_1.pool.query(`
      UPDATE crm_user
      SET password = $1,
          must_change_password = false,
          modifiedat = NOW(),
          modifiedby = $2
      WHERE id = $2
      `, [newHash, userId]);
        const refreshToken = (0, cookies_1.getRefreshTokenCookie)(req);
        const currentRefreshRecord = refreshToken
            ? await (0, refreshToken_1.findRefreshToken)(refreshToken)
            : null;
        if (currentRefreshRecord?.id) {
            await (0, refreshToken_1.revokeOtherRefreshTokens)(userId, currentRefreshRecord.id);
        }
        (0, socket_1.emitToUser)(userId, events_1.PROFILE_CHANGED, {
            reason: "password-changed",
            userId,
        });
        return { message: "Password updated successfully" };
    }
    catch (err) {
        console.error("[profile.changePassword]", err);
        return req.error(500, "Failed to update password");
    }
};
exports.changePasswordHandler = changePasswordHandler;
