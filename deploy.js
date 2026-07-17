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

const SYSTEM_COLUMNS = new Set([
  "id",
  "createdat",
  "createdby",
  "modifiedat",
  "modifiedby",
]);

// Maps CDS types to Postgres column types
const CDS_TO_PG = {
  "cds.UUID": "VARCHAR(36)",
  "cds.String": "VARCHAR",
  "cds.LargeString": "TEXT",
  "cds.Boolean": "BOOLEAN",
  "cds.Integer": "INTEGER",
  "cds.Integer64": "BIGINT",
  "cds.Decimal": "DECIMAL",
  "cds.Double": "DOUBLE PRECISION",
  "cds.Date": "DATE",
  "cds.Time": "TIME",
  "cds.DateTime": "TIMESTAMP",
  "cds.Timestamp": "TIMESTAMP",
  "cds.LargeBinary": "BYTEA",
};

const PRIMITIVE_TYPES = new Set(Object.keys(CDS_TO_PG));

async function getActualTables(client) {
  const { rows } = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `);
  return new Set(rows.map((r) => r.table_name));
}

async function getTableColumns(client, table) {
  const { rows } = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [table],
  );
  return new Set(rows.map((r) => r.column_name));
}

// Returns all columns an entity should have, with their PG types
function getEntityColumns(entity) {
  const cols = [];

  // Managed aspect system columns
  cols.push({ name: "ID", pgType: "VARCHAR(36)", isKey: true });
  cols.push({ name: "createdAt", pgType: "TIMESTAMP" });
  cols.push({ name: "createdBy", pgType: "VARCHAR(255)" });
  cols.push({ name: "modifiedAt", pgType: "TIMESTAMP" });
  cols.push({ name: "modifiedBy", pgType: "VARCHAR(255)" });

  for (const [colName, element] of Object.entries(entity.elements || {})) {
    if (element.virtual) continue;
    if (element.type === "cds.Composition") continue;

    // Skip system columns — already added above
    if (SYSTEM_COLUMNS.has(colName.toLowerCase())) continue;

    if (element.type === "cds.Association") {
      if (!element.keys) continue;
      const fkName = colName + "_ID";
      cols.push({ name: fkName, pgType: "VARCHAR(36)" });
      continue;
    }

    if (!element.type || !PRIMITIVE_TYPES.has(element.type)) continue;

    let pgType = CDS_TO_PG[element.type];
    if (element.type === "cds.String" && element.length) {
      pgType = `VARCHAR(${element.length})`;
    }
    if (element.type === "cds.Decimal" && element.precision) {
      pgType = `DECIMAL(${element.precision}${element.scale ? "," + element.scale : ""})`;
    }

    cols.push({ name: colName, pgType });
  }

  return cols;
}

// Build CREATE TABLE sql for a new entity
function buildCreateTable(tableName, columns) {
  const colDefs = columns.map((c) => {
    const pk = c.isKey ? " PRIMARY KEY" : "";
    return `  "${c.name}" ${c.pgType}${pk}`;
  });
  return `CREATE TABLE IF NOT EXISTS "${tableName}" (\n${colDefs.join(",\n")}\n)`;
}

async function deploySchema(client, model) {
  console.log("\nDeploying schema changes...");

  const actualTables = await getActualTables(client);
  let createdTables = 0;
  let addedColumns = 0;

  for (const [name, entity] of Object.entries(model.definitions)) {
    if (entity.kind !== "entity") continue;
    if (entity["@cds.persistence.skip"]) continue;

    const tableName = name.replace(/\./g, "_").toLowerCase();

    // Only manage our own tables — skip SAP built-ins (sap_*, cds_*)
    if (!tableName.startsWith("crm_")) continue;

    const columns = getEntityColumns(entity);

    if (!actualTables.has(tableName)) {
      // Create the whole table
      const sql = buildCreateTable(tableName, columns);
      await client.query(sql);
      console.log(`  ✅ Created table: ${tableName}`);
      createdTables++;
    } else {
      // Table exists — add any missing columns
      const actualCols = await getTableColumns(client, tableName);

      for (const col of columns) {
        const colLower = col.name.toLowerCase();
        if (actualCols.has(colLower)) continue;
        if (SYSTEM_COLUMNS.has(colLower)) continue;

        await client.query(
          `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.pgType}`,
        );
        console.log(
          `  ✅ Added column: ${tableName}.${col.name} (${col.pgType})`,
        );
        addedColumns++;
      }
    }
  }

  if (createdTables === 0 && addedColumns === 0) {
    console.log("  ✅ No schema changes needed.");
  } else {
    if (createdTables > 0)
      console.log(`\n  ✅ ${createdTables} table(s) created.`);
    if (addedColumns > 0) console.log(`  ✅ ${addedColumns} column(s) added.`);
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

  console.log("Loading model...");
  const model = await cds.load(["db/schema.cds", "srv/service.cds"]);

  // Pure SQL deploy — no cds.deploy(), no CSN cache fighting
  await deploySchema(client, model);

  // Unique constraints — skips if already applied
  await applyUniqueConstraints(client);

  await client.end();
  console.log("\n✅ Deploy complete!");
  process.exit(0);
}

main().catch((e) => {
  console.error("\nFAILED:", e.message);
  process.exit(1);
});
