// ─── SAFE DEPLOY — adds new tables/columns, never drops, safe to run anytime ──
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
];

const SYSTEM_COLUMNS = new Set([
  "id",
  "createdat",
  "createdby",
  "modifiedat",
  "modifiedby",
]);

async function getActualTables(client) {
  const { rows } = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `);
  return new Set(rows.map((r) => r.table_name));
}

async function getTableColumns(client, table) {
  const { rows } = await client.query(
    `
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
  `,
    [table],
  );
  return new Set(rows.map((r) => r.column_name));
}

function getCdsTableNames(model) {
  const names = new Set();
  for (const [name, def] of Object.entries(model.definitions)) {
    if (def.kind !== "entity") continue;
    if (def["@cds.persistence.skip"]) continue;
    names.add(name.replace(/\./g, "_").toLowerCase());
  }
  return names;
}

function getExpectedColumns(entity) {
  const cols = new Set();
  for (const [colName, element] of Object.entries(entity.elements || {})) {
    if (element.virtual) continue;
    if (element.type === "cds.Composition") continue;
    if (element.type === "cds.Association") {
      if (element.keys) cols.add((colName + "_id").toLowerCase());
    } else if (element.type) {
      cols.add(colName.toLowerCase());
    }
  }
  return cols;
}

async function clearCdsModelCache(client) {
  console.log("\nClearing CDS model cache...");
  try {
    await client.query(`DELETE FROM cds_model`);
    console.log("  ✅ CDS model cache cleared.");
  } catch (e) {
    console.log("  ✅ No CDS model cache found, skipping.");
  }
}

async function detectChanges(client, model) {
  console.log("\nDetecting changes...");

  const cdsTableNames = getCdsTableNames(model);
  const actualTables = await getActualTables(client);

  let newTables = 0;
  let newColumns = 0;

  // Detect new tables
  for (const table of cdsTableNames) {
    if (!table.startsWith("crm_")) continue;
    if (!actualTables.has(table)) {
      console.log(`  ➕ New table will be created: ${table}`);
      newTables++;
    }
  }

  // Detect new columns in existing tables
  for (const [name, entity] of Object.entries(model.definitions)) {
    if (entity.kind !== "entity") continue;
    if (entity["@cds.persistence.skip"]) continue;

    const table = name.replace(/\./g, "_").toLowerCase();
    if (!actualTables.has(table)) continue; // new table — already logged above

    const actualCols = await getTableColumns(client, table);
    const expectedCols = getExpectedColumns(entity);

    for (const col of expectedCols) {
      if (SYSTEM_COLUMNS.has(col)) continue;
      if (!actualCols.has(col)) {
        console.log(`  ➕ New column will be added: ${table}.${col}`);
        newColumns++;
      }
    }
  }

  if (newTables === 0 && newColumns === 0) {
    console.log("  ✅ No new tables or columns detected.");
  } else {
    if (newTables > 0)
      console.log(`  ✅ ${newTables} new table(s) will be created.`);
    if (newColumns > 0)
      console.log(`  ✅ ${newColumns} new column(s) will be added.`);
  }
}

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

  // Step 1: Load model
  console.log("Loading model...");
  const model = await cds.load(["db/schema.cds", "srv/service.cds"]);

  await clearCdsModelCache(client);
  // Step 2: Detect and log what will change
  await detectChanges(client, model);

  // Step 3: CDS deploy — creates new tables, adds new columns, never drops
  console.log("\nDeploying...");
  const db = await cds.connect.to("db");
  await cds.deploy(model).to(db);
  console.log("✅ CDS deploy done!");

  // Step 4: Unique constraints — skips if already applied
  await applyUniqueConstraints(client);

  await client.end();
  console.log("\n✅ Deploy complete!");
  process.exit(0);
}

main().catch((e) => {
  console.error("\nFAILED:", e.message);
  process.exit(1);
});
