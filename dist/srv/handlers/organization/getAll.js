"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganizationsHandler = void 0;
const db_1 = require("../../lib/db");
const getOrganizationsHandler = async (req) => {
    const res = await db_1.pool.query(`SELECT id, name, code, is_active
     FROM crm_organization
     WHERE is_super_organization = false
     ORDER BY createdat DESC`);
    return res.rows;
};
exports.getOrganizationsHandler = getOrganizationsHandler;
