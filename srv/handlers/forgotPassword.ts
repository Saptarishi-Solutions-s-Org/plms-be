import bcrypt from "bcrypt";
import { randomBytes, randomUUID } from "crypto";
import { pool } from "../lib/db";
import { validatePasswordPolicy } from "../lib/passwordPolicy";
import { sendPasswordResetMail } from "../mail/sendPasswordResetMail";
import { revokeOtherRefreshTokens } from "../lib/refreshToken";

const RESET_TOKEN_VALIDITY_MINUTES = 30;
const GENERIC_FORGOT_PASSWORD_MESSAGE =
  "If the email exists, reset link sent";

const getResetUrl = (token: string) => {
  const frontendUrl =process.env.ALLOWED_ORIGINS?.split(",")[0]?.trim();
  const resetPageUrl =
    process.env.APP_URL ||
    (frontendUrl ? `${frontendUrl}/reset-password` : "");

  if (!resetPageUrl) {
    throw new Error("APP_URL or ALLOWED_ORIGINS is missing");
  }

  const separator = resetPageUrl.includes("?") ? "&" : "?";

  return `${resetPageUrl.replace(/\/$/, "")}${separator}token=${encodeURIComponent(token)}`;
};

export const forgotPasswordHandler = async (req: any) => {
  try {
    const email = String(req.data?.email ?? "").trim().toLowerCase();

    if (!email) {
      return req.error(400, "Email is required");
    }

    const userResult = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM crm_user u
       JOIN crm_organization o ON o.id = u.organization_id
       WHERE LOWER(u.email) = $1
         AND u.is_active = true
         AND o.is_active = true
       LIMIT 1`,
      [email],
    );

    const user = userResult.rows[0];
    if (!user) {
      return { message: GENERIC_FORGOT_PASSWORD_MESSAGE };
    }

    const token = randomBytes(32).toString("hex");
    const tokenId = randomUUID();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE crm_passwordresettoken
         SET is_used = true, modifiedat = NOW()
         WHERE user_id = $1 AND is_used = false`,
        [user.id],
      );
      await client.query(
        `INSERT INTO crm_passwordresettoken
           (id, user_id, token, expires_at, is_used, createdat, modifiedat)
         VALUES
           ($1, $2, $3, NOW() + ($4 * INTERVAL '1 minute'), false, NOW(), NOW())`,
        [tokenId, user.id, token, RESET_TOKEN_VALIDITY_MINUTES],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const resetUrl = getResetUrl(token);

    try {
      console.log("[auth.forgotPassword] sending reset mail:", user.email);
      await sendPasswordResetMail({
        to: user.email,
        name: user.name,
        resetUrl,
      });
    } catch (error) {
      console.error("[auth.forgotPassword.mail]", error);
      await pool.query(
        `UPDATE crm_passwordresettoken
         SET is_used = true, modifiedat = NOW()
         WHERE id = $1`,
        [tokenId],
      );
      return req.error(500, "Failed to send password reset email");
    }

    return { message: GENERIC_FORGOT_PASSWORD_MESSAGE };
  } catch (error) {
    console.error("[auth.forgotPassword]", error);
    return req.error(500, "Failed to process password reset request");
  }
};

export const resetPasswordHandler = async (req: any) => {
  const client = await pool.connect();

  try {
    const token = String(req.data?.token ?? "").trim();
    const newPassword = String(
      req.data?.newPassword ?? req.data?.password ?? "",
    );
    const confirmPassword = String(req.data?.confirmPassword ?? "");

    if (!token || !newPassword || !confirmPassword) {
      return req.error(400, "Token and all password fields are required");
    }

    if (newPassword !== confirmPassword) {
      return req.error(400, "Passwords do not match");
    }

    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      return req.error(400, policy.message);
    }

    await client.query("BEGIN");

    const tokenResult = await client.query(
      `SELECT prt.id, prt.user_id, prt.expires_at, prt.is_used, u.password
       FROM crm_passwordresettoken prt
       JOIN crm_user u ON u.id = prt.user_id
       JOIN crm_organization o ON o.id = u.organization_id
       WHERE prt.token = $1
         AND u.is_active = true
         AND o.is_active = true
       LIMIT 1
       FOR UPDATE OF prt`,
      [token],
    );

    const resetRecord = tokenResult.rows[0];
    if (!resetRecord) {
      await client.query("ROLLBACK");
      return req.error(400, "Invalid token");
    }

    if (resetRecord.is_used) {
      await client.query("ROLLBACK");
      return req.error(400, "Token already used");
    }

    if (new Date(resetRecord.expires_at) < new Date()) {
      await client.query("ROLLBACK");
      return req.error(400, "Token expired");
    }

    if (await bcrypt.compare(newPassword, resetRecord.password)) {
      await client.query("ROLLBACK");
      return req.error(
        400,
        "New password must be different from current password",
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await client.query(
      `UPDATE crm_user
       SET password = $1,
           must_change_password = false,
           modifiedat = NOW(),
           modifiedby = $2
       WHERE id = $2`,
      [passwordHash, resetRecord.user_id],
    );

    await client.query(
      `UPDATE crm_passwordresettoken
       SET is_used = true, modifiedat = NOW()
       WHERE id = $1`,
      [resetRecord.id],
    );

    await client.query("COMMIT");

    try {
      await revokeOtherRefreshTokens(resetRecord.user_id);
    } catch (error) {
      console.error("[auth.resetPassword.revokeRefreshTokens]", error);
    }

    return { message: "Password reset successfully" };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[auth.resetPassword]", error);
    return req.error(500, "Failed to reset password");
  } finally {
    client.release();
  }
};
