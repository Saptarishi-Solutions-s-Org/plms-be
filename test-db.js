// This script tests the raw PostgreSQL connection using the `pg` library and environment variables.
require("dotenv").config();
const { Client } = require("pg");

async function main() {
  console.log("Connecting with:", {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ? "***set***" : "NOT SET",
  });

  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    //ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Raw pg connection works!");
  await client.end();
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
