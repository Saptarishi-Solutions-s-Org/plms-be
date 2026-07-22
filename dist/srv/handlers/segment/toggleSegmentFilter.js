"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleSegmentFilterHandler = void 0;
const db_1 = require("../../lib/db");
const toggleSegmentFilterHandler = async (req) => {
    const { orgFilterId, is_enabled } = req.data;
    const orgId = req.user.orgId;
    const userRole = req.user.role?.toLowerCase() || req.user.roles?.[0]?.toLowerCase() || "";
    try {
        let query;
        let params;
        if (userRole === "system admin") {
            query = `
        UPDATE crm_organizationsegmentfiltertypes 
        SET "default" = $1, modifiedat = NOW(), modifiedby = $2
        WHERE id = $3
        RETURNING id, organization_id;
      `;
            params = [is_enabled, req.user.id, orgFilterId];
        }
        else {
            query = `
        UPDATE crm_organizationsegmentfiltertypes 
        SET "default" = $1, modifiedat = NOW(), modifiedby = $2
        WHERE id = $3 AND organization_id = $4
        RETURNING id, organization_id;
      `;
            params = [is_enabled, req.user.id, orgFilterId, orgId];
        }
        const result = await db_1.pool.query(query, params);
        if (result.rows.length === 0) {
            return req.error(404, "Organization segment filter mapping not found.");
        }
        const affectedOrgId = result.rows[0].organization_id;
        // Emit event to notify the frontend
        const { emitToOrg } = require("../../realtime/socket");
        const { ORGANIZATION_DETAIL_CHANGED } = require("../../realtime/events");
        emitToOrg(affectedOrgId, ORGANIZATION_DETAIL_CHANGED, {
            reason: "segment-filter-updated",
            orgId: affectedOrgId,
        });
        return {
            message: `Filter status updated to ${is_enabled ? "enabled" : "disabled"}`
        };
    }
    catch (err) {
        console.error("[toggleSegmentFilterHandler] Error:", err);
        return req.error(500, "Internal Server Error while toggling segment filter");
    }
};
exports.toggleSegmentFilterHandler = toggleSegmentFilterHandler;
