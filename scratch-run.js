require("dotenv").config();
const { Client } = require("pg");

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
  
  const { rows } = await client.query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public'
    ORDER BY table_name, column_name;
  `);

  const tables = {};
  for (const r of rows) {
    if (!tables[r.table_name]) tables[r.table_name] = [];
    tables[r.table_name].push(r.column_name);
  }

  console.log(JSON.stringify(tables, null, 2));

  await client.end();
}

main().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
