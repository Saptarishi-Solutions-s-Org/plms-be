"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultTemplatesHandler = void 0;
const db_1 = require("../../lib/db");
const formatlabel_1 = require("../../lib/formatlabel");
const getDefaultTemplatesHandler = async (req) => {
    try {
        const [modulesRes, rolesRes, rmpRes] = await Promise.all([
            db_1.pool.query(`SELECT id, name, "default" FROM crm_modules ORDER BY name ASC`),
            db_1.pool.query(`SELECT id, name, "default" FROM crm_roles ORDER BY name ASC`),
            db_1.pool.query(`
        SELECT r.name AS role, m.name AS module, p.name AS permission, rmp.access
        FROM crm_rolemodulepermissions rmp
        JOIN crm_modulepermissions mp ON mp.id = rmp.module_permission_id
        JOIN crm_modules m ON m.id = mp.module_id
        JOIN crm_permissions p ON p.id = mp.permission_id
        JOIN crm_roles r ON r.id = rmp.role_id
        ORDER BY r.name ASC, m.name ASC, p.name ASC
      `),
        ]);
        const formattedModules = modulesRes.rows.map((m) => ({
            id: m.id,
            name: (0, formatlabel_1.formatLabel)(m.name),
            default: m.default,
        }));
        const formattedRoles = rolesRes.rows.map((r) => ({
            id: r.id,
            name: (0, formatlabel_1.formatLabel)(r.name),
            default: r.default,
        }));
        const formattedRmp = rmpRes.rows.map((row) => ({
            role: (0, formatlabel_1.formatLabel)(row.role),
            module: (0, formatlabel_1.formatLabel)(row.module),
            permission: row.permission.toLowerCase(),
            access: row.access,
        }));
        return {
            modules: formattedModules,
            roles: formattedRoles,
            rmp: formattedRmp,
        };
    }
    catch (err) {
        console.error("Error fetching default templates:", err);
        return req.error(500, "Internal Server Error");
    }
};
exports.getDefaultTemplatesHandler = getDefaultTemplatesHandler;
