// Regular deploy — adds new tables/columns, never drops, safe to run anytime
require("dotenv").config();
const { Client } = require("pg");
const cds = require("@sap/cds");

cds.env.requires.db = {
  kind: "postgres",
  credentials: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  },
};

cds.env.sql = {
  native_hana_types: false,
  sql_mapping: "plain",
};

const UNIQUE_CONSTRAINTS = [
  { table: "crm_modules", name: "uq_modules_name", cols: "name" },
  { table: "crm_permissions", name: "uq_permissions_name", cols: "name" },
  { table: "crm_roles", name: "uq_roles_name", cols: "name" },
  { table: "crm_organization", name: "uq_organization_code", cols: "code" },
  { table: "crm_leads", name: "uq_leads_code", cols: "code" },
  { table: "crm_offer", name: "uq_offer_code", cols: "code" },
  {
    table: "crm_modulepermissions",
    name: "uq_module_permissions",
    cols: "module_ID, permission_ID",
  },
  {
    table: "crm_rolemodulpermissions",
    name: "uq_role_module_perms",
    cols: "role_ID, module_permission_ID",
  },
  {
    table: "crm_organizationroles",
    name: "uq_org_roles",
    cols: "organization_ID, role_ID",
  },
  {
    table: "crm_organizationmodules",
    name: "uq_org_modules",
    cols: "organization_ID, module_ID",
  },
  {
    table: "crm_organizationrolemodulpermissions",
    name: "uq_org_role_rmp",
    cols: "organizationRole_ID, rmp_ID",
  },
];

async function applyUniqueConstraints(client) {
  console.log("\nApplying unique constraints...");
  for (const { table, name, cols } of UNIQUE_CONSTRAINTS) {
    try {
      await client.query(
        `ALTER TABLE ${table} ADD CONSTRAINT ${name} UNIQUE (${cols})`,
      );
      console.log(`  ✅ ${name}`);
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log(`  ⏭️  ${name} already exists, skipping`);
      } else {
        console.warn(`  ⚠️  ${name} failed: ${e.message.trim()}`);
      }
    }
  }
}

async function main() {
  // Step 1: CDS deploy (non-destructive)
  console.log("Loading model...");
  const model = await cds.load(["db/schema.cds", "srv/service.cds"]);
  console.log("Connecting...");
  const db = await cds.connect.to("db");
  console.log("Deploying...");
  await cds.deploy(model).to(db);
  console.log("✅ CDS deploy done!");

  // Step 2: Unique constraints (skipped if already exist)
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  await applyUniqueConstraints(client);
  await client.end();

  console.log("\n✅ Deploy complete!");
  process.exit(0);
}

main().catch((e) => {
  console.error("\nFAILED:", e.message);
  process.exit(1);
});
