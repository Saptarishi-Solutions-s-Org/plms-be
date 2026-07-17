// First time only — drops everything and creates fresh schema
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
    table: "crm_rolemodulepermissions",
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
    table: "crm_organizationrolemodulepermissions",
    name: "uq_org_role_rmp",
    cols: "organizationRole_ID, rmp_ID",
  },
  {
    table: "crm_refreshtoken",
    name: "uq_refresh_token_hash",
    cols: "token_hash",
  },
  {
    table: "crm_refreshtoken",
    name: "uq_refresh_token_hash_mixed",
    cols: "token_hash",
  },
  {
    table: "crm_segment",
    name: "uq_segment_code",
    cols: "code",
  },
  {
    table: "crm_segmentfiltertypes",
    name: "uq_segment_filter_types_name",
    cols: "name",
  },
  {
    table: "crm_organizationsegmentfiltertypes",
    name: "uq_org_segment_filter_types",
    cols: '"organization_ID", "filter_type_ID"',
  },
  {
    table: "crm_segmentleads",
    name: "uq_segment_leads",
    cols: '"segment_ID", "lead_ID"',
  },
  {
    table: "crm_segmentoffers",
    name: "uq_segment_offers",
    cols: '"segment_ID", "offer_ID"',
  },
];

async function applyUniqueConstraints(client) {
  console.log("\nApplying unique constraints...");
  for (const { table, name, cols } of UNIQUE_CONSTRAINTS) {
    try {
      await client.query(
        `ALTER TABLE "${table}" ADD CONSTRAINT ${name} UNIQUE (${cols})`,
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
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  // Step 1: Wipe and recreate schema (also clears cds_model automatically)
  console.log("Dropping schema...");
  await client.query("DROP SCHEMA public CASCADE");
  await client.query("CREATE SCHEMA public");
  await client.query(`GRANT ALL ON SCHEMA public TO ${process.env.DB_USER}`);
  await client.query("GRANT ALL ON SCHEMA public TO public");
  console.log("✅ Schema reset!");

  // Step 2: CDS fresh deploy
  console.log("\nDeploying CDS model...");
  const model = await cds.load(["db/schema.cds", "srv/service.cds"]);
  const db = await cds.connect.to("db");
  await cds.deploy(model).to(db);
  console.log("✅ CDS deploy done!");

  // Step 3: Unique constraints
  await applyUniqueConstraints(client);

  await client.end();
  console.log("\n✅ Fresh deploy complete!");
  process.exit(0);
}

main().catch((e) => {
  console.error("\nFAILED:", e.message);
  process.exit(1);
});
