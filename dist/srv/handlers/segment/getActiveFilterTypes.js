"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveFilterTypesHandler = void 0;
const db_1 = require("../../lib/db");
const getActiveFilterTypesHandler = async (req) => {
    const orgId = req.user.orgId;
    try {
        const query = `
      SELECT ft.id, ft.name, ft.label, ft.category, ft.operator_type
      FROM crm_organizationsegmentfiltertypes oft
      JOIN crm_segmentfiltertypes ft ON ft.id = oft.filter_type_id
      WHERE oft.organization_id = $1 AND oft."default" = true
      ORDER BY ft.category ASC, ft.label ASC;
    `;
        const { rows } = await db_1.pool.query(query, [orgId]);
        return rows;
    }
    catch (err) {
        console.error("[getActiveFilterTypesHandler] Error:", err);
        return req.error(500, "Internal Server Error while fetching active filter types");
    }
};
exports.getActiveFilterTypesHandler = getActiveFilterTypesHandler;
