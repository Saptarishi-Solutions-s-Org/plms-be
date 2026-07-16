import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

import { pool } from "../../lib/db";
import { generatePassword } from "../../lib/generatePassword";
import { sendUserCreationMail } from "../../mail/sendUserCreationMail";
import { emitToOrg } from "../../realtime/socket";
import { USER_DETAIL_CHANGED, USER_LIST_CHANGED } from "../../realtime/events";

export const createExecutiveHandler = async (req: any) => {
  const client = await pool.connect();

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

    const existingUser = await client.query(
      "SELECT id FROM crm_user WHERE email = $1 LIMIT 1",
      [email],
    );

    if (existingUser.rows.length) {
      await client.query("ROLLBACK");
      return req.error(400, "Email already exists");
    }

    const executiveRole = await client.query(
      `SELECT orr.id
       FROM crm_organizationroles orr
       JOIN crm_roles r ON r.id = orr.role_id
       WHERE orr.organization_id = $1
         AND LOWER(TRIM(r.name)) = 'executive'
       LIMIT 1`,
      [orgId],
    );

    if (!executiveRole.rows.length) {
      await client.query("ROLLBACK");
      return req.error(400, "Executive role not found in this organization");
    }

    const password = generatePassword();
    const userId = randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query(
      `INSERT INTO crm_user
        (id, name, email, phone, password, gender, dob,
         organization_id, role_id, reporting_manager_id, country_id, state_id, city,
         is_active, must_change_password, createdat, createdby, modifiedat, modifiedby)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, TRUE, TRUE, NOW(), $14, NOW(), $14)`,
      [
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
      ],
    );

    await client.query("COMMIT");

    emitToOrg(orgId, USER_LIST_CHANGED, { reason: "executive-created", userId });
    emitToOrg(orgId, USER_DETAIL_CHANGED, { reason: "executive-created", userId });

    const organization = await pool.query(
      "SELECT name, code FROM crm_organization WHERE id = $1 LIMIT 1",
      [orgId],
    );

    try {
      await sendUserCreationMail({
        to: email,
        name,
        orgName: organization.rows[0]?.name,
        orgCode: organization.rows[0]?.code,
        email,
        password,
      });
    } catch (mailError) {
      console.error("Executive creation email failed:", mailError);
    }

    return { message: "Executive created successfully", userId, tempPassword: password };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("createExecutive error:", error);
    return req.error(500, "Failed to create executive");
  } finally {
    client.release();
  }
};
