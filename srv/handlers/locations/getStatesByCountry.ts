import { pool } from "../../lib/db";

export const getStatesByCountryHandler = async (req: any) => {
  try {
    const { countryId } = req.data;

    const res = await pool.query(
      `
      SELECT id, name
      FROM crm_state
      WHERE country_id = $1
      ORDER BY name ASC
      `,
      [countryId],
    );

    return res.rows;
  } catch (err) {
    console.error(err);
    return req.error(500, "Failed to fetch states");
  }
};
