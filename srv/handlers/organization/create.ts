import { pool } from "../../lib/db";
import { generateOrgCode } from "../../lib/orgcode";
import { sendOrganizationCreationMail } from "../../mail/sendOrganizationCreationMail";
import { randomUUID } from "crypto";
import { verifyToken } from "../../lib/jwt";

export const createOrganizationHandler = async (req: any) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      name,
      email,
      phone,
      address,
      state,
      country,
      start_date,
      end_date,
      trial,
    } = req.data;
    const authHeader =
      req.headers?.authorization ||
      req._?.req?.headers?.authorization ||
      req.req?.headers?.authorization;

    let userId = null;

    if (authHeader) {
      const token = authHeader.split(" ")[1];
      const decoded: any = verifyToken(token);
      userId = decoded?.userId || null;
    }

    const code = generateOrgCode();
    const orgId = randomUUID();

    await client.query(
      `INSERT INTO crm_organization 
      (id, name, code, is_active, email, phone, address, state_id, country_id, start_date, end_date, trial, is_super_organization, createdat, createdby, modifiedat, modifiedby)
      VALUES ($1,$2,$3,true,$4,$5,$6,$7,$8,$9,$10,$11,false,NOW(),$12,NOW(),$12)`,
      [
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
      ],
    );

    const modules = await client.query(
      `SELECT id FROM crm_modules WHERE "default" = true`,
    );

    for (const m of modules.rows) {
      await client.query(
        `INSERT INTO crm_organizationmodules 
        (id, organization_id, module_id, createdat, createdby, modifiedat, modifiedby)
        VALUES ($1,$2,$3,NOW(),$4,NOW(),$4)`,
        [randomUUID(), orgId, m.id, userId],
      );
    }

    const roles = await client.query(
      `SELECT id FROM crm_roles WHERE "default" = true`,
    );

    const orgRoleMap: Record<string, string> = {};

    for (const r of roles.rows) {
      const newId = randomUUID();

      await client.query(
        `INSERT INTO crm_organizationroles 
        (id, organization_id, role_id, createdat, createdby, modifiedat, modifiedby)
        VALUES ($1,$2,$3,NOW(),$4,NOW(),$4)`,
        [newId, orgId, r.id, userId],
      );

      orgRoleMap[r.id] = newId;
    }

    const rmps = await client.query(
      `SELECT id, role_id FROM crm_rolemodulepermissions`,
    );

    for (const rmp of rmps.rows) {
      const orgRoleId = orgRoleMap[rmp.role_id];
      if (!orgRoleId) continue;

      await client.query(
        `INSERT INTO crm_organizationrolemodulepermissions
        (id, organization_id, organizationrole_id, rmp_id, access, createdat, createdby, modifiedat, modifiedby)
        VALUES ($1,$2,$3,$4,true,NOW(),$5,NOW(),$5)`,
        [randomUUID(), orgId, orgRoleId, rmp.id, userId],
      );
    }

    await client.query("COMMIT");

    if (email) {
      await sendOrganizationCreationMail({
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
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("CREATE ERROR:", err);
    return req.error(500, "Failed to create organization");
  } finally {
    client.release();
  }
};
