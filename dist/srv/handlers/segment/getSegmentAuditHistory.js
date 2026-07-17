"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSegmentAuditHistoryHandler = void 0;
const db_1 = require("../../lib/db");
const getSegmentAuditHistoryHandler = async (req) => {
    const { segmentId, page = 1, limit = 10 } = req.data;
    const orgId = req.user.orgId;
    const userId = req.user.id;
    const userRole = req.user.role?.toLowerCase() || req.user.roles?.[0]?.toLowerCase() || "";
    try {
        // 1. Fetch Segment metadata to verify ownership
        const segRes = await db_1.pool.query(`SELECT createdby FROM crm_segment WHERE id = $1 AND organization_id = $2`, [segmentId, orgId]);
        if (segRes.rowCount === 0) {
            return req.error(404, "Segment not found");
        }
        const segment = segRes.rows[0];
        // 2. Visibility & Scoping Security Check
        if (userRole === "executive") {
            if (segment.createdby !== userId) {
                return req.error(403, "Forbidden: Executives can only view audit logs of their own segments");
            }
        }
        else if (userRole === "manager") {
            if (segment.createdby !== userId) {
                // Verify if creator reports to this manager
                const reportRes = await db_1.pool.query(`SELECT reporting_manager_id FROM crm_user WHERE id = $1`, [segment.createdby]);
                if (reportRes.rowCount === 0 || reportRes.rows[0].reporting_manager_id !== userId) {
                    return req.error(403, "Forbidden: Managers can only view audit logs of segments created by themselves or reporting team members");
                }
            }
        }
        // 3. Count total logs for pagination
        const countRes = await db_1.pool.query(`SELECT COUNT(*) as total FROM crm_segmentaudithistory WHERE segment_id = $1 AND organization_id = $2`, [segmentId, orgId]);
        const total = parseInt(countRes.rows[0].total) || 0;
        // 4. Retrieve paginated audit logs
        const offset = (page - 1) * limit;
        const logsRes = await db_1.pool.query(`SELECT ah.action_type, ah.timestamp, ah.details, u.name as username
       FROM crm_segmentaudithistory ah
       JOIN crm_user u ON u.id = ah.user_id
       WHERE ah.segment_id = $1 AND ah.organization_id = $2
       ORDER BY ah.timestamp DESC
       LIMIT $3 OFFSET $4`, [segmentId, orgId, limit, offset]);
        const logs = logsRes.rows.map((row) => {
            const dbDate = row.timestamp instanceof Date ? row.timestamp : new Date(row.timestamp);
            const utcDate = new Date(Date.UTC(dbDate.getFullYear(), dbDate.getMonth(), dbDate.getDate(), dbDate.getHours(), dbDate.getMinutes(), dbDate.getSeconds(), dbDate.getMilliseconds()));
            return {
                action_type: row.action_type,
                username: row.username || "System",
                timestamp: utcDate,
                details: row.details || ""
            };
        });
        const totalPages = Math.ceil(total / limit);
        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        };
    }
    catch (err) {
        console.error("[getSegmentAuditHistoryHandler] Error:", err);
        return req.error(500, "Internal Server Error while retrieving segment audit logs");
    }
};
exports.getSegmentAuditHistoryHandler = getSegmentAuditHistoryHandler;
