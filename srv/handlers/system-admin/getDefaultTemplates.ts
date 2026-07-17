import { pool } from "../../lib/db";
import { formatLabel } from "../../lib/formatlabel";

export const getDefaultTemplatesHandler = async (req: any) => {
  try {
    const [modulesRes, rolesRes, rmpRes, segmentFiltersRes] = await Promise.all([
      pool.query(`SELECT id, name, "default" FROM crm_modules ORDER BY name ASC`),
      pool.query(`
        SELECT id, name, "default" 
        FROM crm_roles 
        WHERE LOWER(REGEXP_REPLACE(TRIM(name), '\\s+', ' ', 'g')) != 'system admin'
        ORDER BY name ASC
      `),
      pool.query(`
        SELECT r.name AS role, m.name AS module, p.name AS permission, rmp.access
        FROM crm_rolemodulepermissions rmp
        JOIN crm_modulepermissions mp ON mp.id = rmp.module_permission_id
        JOIN crm_modules m ON m.id = mp.module_id
        JOIN crm_permissions p ON p.id = mp.permission_id
        JOIN crm_roles r ON r.id = rmp.role_id
        WHERE LOWER(REGEXP_REPLACE(TRIM(r.name), '\\s+', ' ', 'g')) != 'system admin'
        ORDER BY r.name ASC, m.name ASC, p.name ASC
      `),
      pool.query(`
        SELECT id, name, label, category, operator_type, "default"
        FROM crm_segmentfiltertypes
        ORDER BY category ASC, label ASC
      `)
    ]);

    const formattedModules = modulesRes.rows.map((m) => ({
      id: m.id,
      name: formatLabel(m.name),
      default: m.default,
    }));

    const formattedRoles = rolesRes.rows.map((r) => ({
      id: r.id,
      name: formatLabel(r.name),
      default: r.default,
    }));

    const formattedRmp = rmpRes.rows.map((row) => ({
      role: formatLabel(row.role),
      module: formatLabel(row.module),
      permission: row.permission.toLowerCase(),
      access: row.access,
    }));

    const formattedSegmentFilters = segmentFiltersRes.rows.map((f) => ({
      id: f.id,
      name: f.name,
      label: f.label,
      category: formatLabel(f.category),
      operator_type: f.operator_type,
      default: f.default
    }));

    return {
      modules: formattedModules,
      roles: formattedRoles,
      rmp: formattedRmp,
      segmentFilters: formattedSegmentFilters
    };
  } catch (err: any) {
    console.error("Error fetching default templates:", err);
    return req.error(500, "Internal Server Error");
  }
};
