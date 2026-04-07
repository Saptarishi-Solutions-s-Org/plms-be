import { pool } from "../../lib/db";

export const getOrganizationsHandler = async (req: any) => {
  const res = await pool.query(
    `SELECT id, name, code, is_active
     FROM crm_organization
     WHERE is_super_organization = false
     ORDER BY createdat DESC`,
  );

  return res.rows;
};
