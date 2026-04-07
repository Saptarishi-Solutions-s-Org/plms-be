import { pool } from "../../lib/db";

export const getCountriesHandler = async (req: any) => {
  try {
    const res = await pool.query(`
      SELECT id, name
      FROM crm_country
      ORDER BY name ASC
    `);

    return res.rows;
  } catch (err) {
    console.error(err);
    return req.error(500, "Failed to fetch countries");
  }
};
