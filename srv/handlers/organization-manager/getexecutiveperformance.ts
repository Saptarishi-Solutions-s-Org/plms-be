import { pool } from "../../lib/db";

export const executivePerformanceHandler = async (req: any) => {
  try {
    const orgId = req.user?.orgId;

    if (!orgId) {
      return req.error(400, "Organization ID missing");
    }

    const res = await pool.query(
  `
  SELECT 
    u.name AS executive_name,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE l.status = 'Qualified') AS qualified
  FROM crm_leads l
  LEFT JOIN crm_user u
    ON l.assigned_to_id = u.id
  WHERE l.organization_id = $1
    AND l.assigned_to_id IS NOT NULL
  GROUP BY u.name
  `,
  [orgId]
);


      return res.rows.map((row) => ({
      executiveName: row.executive_name,
      total: Number(row.total),
      qualified: Number(row.qualified),
    }));

  } catch (error) {
    console.error(error);
    return req.error(500, "Failed to fetch executive performance");
  }
};