// Structural changes — alter columns, rename, add indexes, without data loss
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
  { table: "crm_modules",                          name: "uq_modules_name",        cols: "name" },
  { table: "crm_permissions",                      name: "uq_permissions_name",    cols: "name" },
  { table: "crm_roles",                            name: "uq_roles_name",          cols: "name" },
  { table: "crm_organization",                     name: "uq_organization_code",   cols: "code" },
  { table: "crm_leads",                            name: "uq_leads_code",          cols: "code" },
  { table: "crm_offer",                            name: "uq_offer_code",          cols: "code" },
  { table: "crm_modulepermissions",                name: "uq_module_permissions",  cols: "module_ID, permission_ID" },
  { table: "crm_rolemodulpermissions",             name: "uq_role_module_perms",   cols: "role_ID, module_permission_ID" },
  { table: "crm_organizationroles",                name: "uq_org_roles",           cols: "organization_ID, role_ID" },
  { table: "crm_organizationmodules",              name: "uq_org_modules",         cols: "organization_ID, module_ID" },
  { table: "crm_organizationrolemodulpermissions", name: "uq_org_role_rmp",        cols: "organizationRole_ID, rmp_ID" },
];

// ─── ADD YOUR MIGRATIONS HERE ──────────────────────────────────────────────────
// Rules:
//   - Each entry needs a unique id (e.g. "001", "002")
//   - NEVER delete or reorder old entries — they are skipped if already applied
//   - NEVER reuse an id
//   - Each sql runs exactly once and is recorded in _migrations table
// ──────────────────────────────────────────────────────────────────────────────
const MIGRATIONS = [
  // Add new column example:
  // { id: "001", sql: `ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS priority VARCHAR(50)` },

  // Change column type example:
  // { id: "002", sql: `ALTER TABLE crm_leads ALTER COLUMN phone TYPE VARCHAR(20)` },

  // Rename column example:
  // { id: "003", sql: `ALTER TABLE crm_user RENAME COLUMN dob TO date_of_birth` },

  // Add index example:
  // { id: "004", sql: `CREATE INDEX IF NOT EXISTS idx_leads_status ON crm_leads(status)` },

  // Drop column example (only when safe):
  // { id: "005", sql: `ALTER TABLE crm_leads DROP COLUMN IF EXISTS old_field` },
];
// ──────────────────────────────────────────────────────────────────────────────

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         VARCHAR(50) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT NOW(),
      sql        TEXT
    )
  `);
}

async function runMigrations(client) {
  await ensureMigrationsTable(client);

  const pending = MIGRATIONS.filter((m) => m.id && m.sql);
  if (pending.length === 0) {
    console.log("\n  No migrations defined, skipping.");
    return;
  }

  console.log("\nRunning migrations...");
  for (const { id, sql } of pending) {
    const { rows } = await client.query(
      `SELECT id FROM _migrations WHERE id = $1`, [id]
    );

    if (rows.length > 0) {
      console.log(`  ⏭️  [${id}] already applied, skipping`);
      continue;
    }

    try {
      await client.query(sql);
      await client.query(
        `INSERT INTO _migrations (id, sql) VALUES ($1, $2)`, [id, sql]
      );
      console.log(`  ✅ [${id}] applied`);
    } catch (e) {
      console.error(`  ❌ [${id}] FAILED: ${e.message.trim()}`);
      throw e; // Stop on failure — fix the migration before continuing
    }
  }
}

async function applyUniqueConstraints(client) {
  console.log("\nApplying unique constraints...");
  for (const { table, name, cols } of UNIQUE_CONSTRAINTS) {
    try {
      await client.query(`ALTER TABLE ${table} ADD CONSTRAINT ${name} UNIQUE (${cols})`);
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

  // Step 1: CDS deploy (non-destructive — adds new tables/columns only)
  console.log("Loading model...");
  const model = await cds.load(["db/schema.cds", "srv/service.cds"]);
  console.log("Connecting...");
  const db = await cds.connect.to("db");
  console.log("Deploying...");
  await cds.deploy(model).to(db);
  console.log("✅ CDS deploy done!");

  // Step 2: Manual migrations (each runs exactly once)
  await runMigrations(client);

  // Step 3: Unique constraints (skipped if already exist)
  await applyUniqueConstraints(client);

  await client.end();
  console.log("\n✅ Migration complete!");
  process.exit(0);
}

main().catch((e) => {
  console.error("\nFAILED:", e.message);
  process.exit(1);
});