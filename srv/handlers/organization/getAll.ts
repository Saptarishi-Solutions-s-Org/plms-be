import cds from "@sap/cds";

export const getOrganizationsHandler = async (req: any) => {
  try {
    console.log("🔥 DB TEST");

    const db = await cds.connect.to("db");

    const result = await db.run(`
      SELECT id, name, code, is_active as status
      FROM crm_organization
      WHERE is_super_organization = false
      ORDER BY createdat DESC
    `);

    console.log("✅ DB RESULT:", result);

    return {
      value: result, // 🔥 THIS FIXES LOADING
    };
  } catch (err) {
    console.error("❌ GET ERROR:", err);
    return req.error(500, "Failed to fetch organizations");
  }
};