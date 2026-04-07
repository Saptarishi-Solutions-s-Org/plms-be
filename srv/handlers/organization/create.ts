import cds from "@sap/cds";
const { INSERT, SELECT } = cds.ql;

import { generateOrgCode } from "../../lib/orgcode";
const sendOrganizationMail = require("../../mail/sendOrganizationMail");

export const createOrganizationHandler = async (req: any) => {
  try {
    console.log("🚀 CREATE START");

    const { name, email, phone, address, state, country, trial } = req.data;

    const code = generateOrgCode();
    console.log("✅ Generated Code:", code);

    console.log("📦 Inserting Organization...");
    const org = await cds.run(
      INSERT.into("crm.Organization").entries({
        name,
        code,
        email,
        phone,
        address,
        state_ID: state,
        country_ID: country,
        trial,
        is_active: true,
        is_super_organization: false,
      }),
    );

    console.log("✅ Org Insert Result:", org);

    const orgId = org?.ID || org?.[0]?.ID;
    console.log("🆔 Org ID:", orgId);

    if (!orgId) {
      console.log("❌ Org ID not generated");
      throw new Error("Org ID not generated");
    }

    console.log("📦 Fetching Default Modules...");
    const modules = await cds.run(
      SELECT.from("crm.Modules").where({ default: true }),
    );
    console.log("✅ Modules Count:", modules.length);

    for (const m of modules) {
      console.log("➡️ Inserting Org Module:", m.ID);

      await cds.run(
        INSERT.into("crm.OrganizationModules").entries({
          organization_ID: orgId,
          module_ID: m.ID,
        }),
      );
    }

    console.log("📦 Fetching Default Roles...");
    const roles = await cds.run(
      SELECT.from("crm.Roles").where({ default: true }),
    );
    console.log("✅ Roles Count:", roles.length);

    for (const role of roles) {
      console.log("➡️ Inserting Org Role:", role.ID);

      const orgRole = await cds.run(
        INSERT.into("crm.OrganizationRoles").entries({
          organization_ID: orgId,
          role_ID: role.ID,
        }),
      );

      const orgRoleId = orgRole?.ID || orgRole?.[0]?.ID;
      console.log("🆔 OrgRole ID:", orgRoleId);

      console.log("📦 Fetching RMP for Role:", role.ID);

      const rmps = await cds.run(
        SELECT.from("crm.RoleModulePermissions").where({
          role_ID: role.ID,
        }),
      );

      console.log("✅ RMP Count:", rmps.length);

      for (const rmp of rmps) {
        console.log("➡️ Inserting RMP:", rmp.ID);

        await cds.run(
          INSERT.into("crm.OrganizationRoleModulePermissions").entries({
            organization_ID: orgId,
            organizationRole_ID: orgRoleId,
            rmp_ID: rmp.ID,
            access: true,
          }),
        );
      }
    }

    if (email) {
      console.log("📧 Sending Email...");
      await sendOrganizationMail({
        to: email,
        orgName: name,
        orgCode: code,
      });
      console.log("✅ Email Sent");
    }

    console.log("🎉 CREATE SUCCESS");

    return {
      id: orgId,
      name,
      code,
    };
  } catch (err) {
    console.error("❌ CREATE ERROR:", err);
    return req.error(500, "Failed to create organization");
  }
};
