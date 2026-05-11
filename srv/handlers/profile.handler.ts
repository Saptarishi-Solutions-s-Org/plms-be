import bcrypt from "bcrypt";
import { pool } from "../lib/db";
import { validatePasswordPolicy } from "../lib/passwordPolicy";
import { getRefreshTokenCookie } from "../lib/cookies";
import {
  findRefreshToken,
  revokeOtherRefreshTokens,
} from "../lib/refreshToken";
import { emitToUser } from "../realtime/socket";
import { PROFILE_CHANGED } from "../realtime/events";

function required(value: unknown) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

async function getProfileByUserId(userId: string) {
  const res = await pool.query(
    `
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
    `,
    [userId],
  );

  return res.rows[0] || null;
}

export const getProfileHandler = async (req: any) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return req.error(401, "Unauthorized");

    const profile = await getProfileByUserId(userId);
    if (!profile) return req.error(404, "Profile not found");

    return profile;
  } catch (err) {
    console.error("[profile.getProfile]", err);
    return req.error(500, "Failed to load profile");
  }
};

export const updateProfileHandler = async (req: any) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return req.error(401, "Unauthorized");

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

    await pool.query(
      `
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
      `,
      [name, phone, gender, dob, city, state, country, userId],
    );

    emitToUser(userId, PROFILE_CHANGED, {
      reason: "profile-updated",
      userId,
    });

    return { message: "Profile updated successfully" };
  } catch (err) {
    console.error("[profile.updateProfile]", err);
    return req.error(500, "Failed to update profile");
  }
};

export const changePasswordHandler = async (req: any) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return req.error(401, "Unauthorized");

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

    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      return req.error(400, policy.message);
    }

    const userRes = await pool.query(
      `SELECT password FROM crm_user WHERE id = $1 LIMIT 1`,
      [userId],
    );

    const currentHash = userRes.rows[0]?.password;
    if (!currentHash) return req.error(404, "Profile not found");

    const currentValid = await bcrypt.compare(currentPassword, currentHash);
    if (!currentValid) {
      return req.error(401, "Current password is incorrect");
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `
      UPDATE crm_user
      SET password = $1,
          must_change_password = false,
          modifiedat = NOW(),
          modifiedby = $2
      WHERE id = $2
      `,
      [newHash, userId],
    );

    const refreshToken = getRefreshTokenCookie(req);
    const currentRefreshRecord = refreshToken
      ? await findRefreshToken(refreshToken)
      : null;

    if (currentRefreshRecord?.id) {
      await revokeOtherRefreshTokens(userId, currentRefreshRecord.id);
    }

    emitToUser(userId, PROFILE_CHANGED, {
      reason: "password-changed",
      userId,
    });

    return { message: "Password updated successfully" };
  } catch (err) {
    console.error("[profile.changePassword]", err);
    return req.error(500, "Failed to update password");
  }
};
