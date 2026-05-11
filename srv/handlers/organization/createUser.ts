import { pool } from "../../lib/db";
import { randomUUID } from "crypto";
import { sendUserCreationMail } from "../../mail/sendUserCreationMail";
import { generatePassword } from "../../lib/generatePassword";
import bcrypt from "bcrypt";
import { emitToSystemAdmins } from "../../realtime/socket";
import {
  ORGANIZATION_DETAIL_CHANGED,
  SYSTEM_ADMIN_DASHBOARD_CHANGED,
} from "../../realtime/events";

export const createUserHandler = async (req: any) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { name, email, phone, gender, dob, state, country, organizationId } =
      req.data;

    const createdBy = req.user?.userId || req.user?.id || null;

    if (!organizationId) {
      return req.error(400, "Organization is required");
    }

    const orgRes = await client.query(
      `SELECT name, code FROM crm_organization WHERE id = $1`,
      [organizationId],
    );

    if (!orgRes.rows.length) {
      return req.error(404, "Organization not found");
    }

    const orgName = orgRes.rows[0].name;
    const orgCode = orgRes.rows[0].code;

    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    const roleRes = await client.query(
      `SELECT orr.id
       FROM crm_organizationroles orr
       JOIN crm_roles r ON r.id = orr.role_id
       WHERE orr.organization_id = $1 
       AND LOWER(r.name) LIKE '%admin%'
       LIMIT 1`,
      [organizationId],
    );

    if (!roleRes.rows.length) {
      return req.error(400, "Admin role not found for this organization");
    }

    const roleId = roleRes.rows[0].id;

    await client.query(
      `INSERT INTO crm_user
      (id, name, email, phone, password, gender, dob, organization_id, role_id, state_id, country_id, is_active, createdat, createdby, modifiedat, modifiedby)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,NOW(),$12,NOW(),$12)`,
      [
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
      ],
    );

    await client.query("COMMIT");

    emitToSystemAdmins(SYSTEM_ADMIN_DASHBOARD_CHANGED, {
      reason: "organization-admin-created",
      orgId: organizationId,
      userId,
    });
    emitToSystemAdmins(ORGANIZATION_DETAIL_CHANGED, {
      reason: "organization-admin-created",
      orgId: organizationId,
      userId,
    });

    await sendUserCreationMail({
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
  } catch (err) {
    await client.query("ROLLBACK");
    return req.error(500, "Failed to create user");
  } finally {
    client.release();
  }
};
