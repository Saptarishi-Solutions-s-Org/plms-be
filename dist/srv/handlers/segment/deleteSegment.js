"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSegmentHandler = void 0;
const db_1 = require("../../lib/db");
const socket_1 = require("../../realtime/socket");
const deleteSegmentHandler = async (req) => {
    const { id } = req.data;
    const orgId = req.user.orgId;
    const userId = req.user.id;
    const userRole = req.user.role?.toLowerCase() || req.user.roles?.[0]?.toLowerCase() || "";
    try {
        // 1. Fetch Segment metadata
        const segRes = await db_1.pool.query(`SELECT createdby, name FROM crm_segment WHERE id = $1 AND organization_id = $2`, [id, orgId]);
        if (segRes.rowCount === 0) {
            return req.error(404, "Segment not found");
        }
        const segment = segRes.rows[0];
        // 2. Visibility & Scoping Security Check
        if (userRole === "executive") {
            if (segment.createdby !== userId) {
                return req.error(403, "Forbidden: Executives can only delete their own segments");
            }
        }
        else if (userRole === "manager") {
            if (segment.createdby !== userId) {
                // Verify if creator reports to this manager
                const reportRes = await db_1.pool.query(`SELECT reporting_manager_id FROM crm_user WHERE id = $1`, [segment.createdby]);
                if (reportRes.rowCount === 0 || reportRes.rows[0].reporting_manager_id !== userId) {
                    return req.error(403, "Forbidden: Managers can only delete segments created by themselves or reporting team members");
                }
                // Write special override log before deletion
                const execRes = await db_1.pool.query(`SELECT name FROM crm_user WHERE id = $1`, [segment.createdby]);
                const execName = execRes.rows[0]?.name || "Executive";
                await db_1.pool.query(`INSERT INTO crm_segmentaudithistory (id, organization_id, segment_id, action_type, user_id, timestamp, details, createdat, createdby, modifiedat, modifiedby)
           VALUES (gen_random_uuid(), $1, $2, 'Delete Override', $3, NOW(), $4, NOW(), $3, NOW(), $3)`, [orgId, id, userId, `Manager deleted Segment "${segment.name}" originally created by Executive "${execName}".`]);
            }
        }
        // 3. Perform deletes in a Transaction
        const client = await db_1.pool.connect();
        try {
            await client.query("BEGIN");
            // Set segment_id to NULL in audit logs to prevent foreign key errors and preserve history
            await client.query(`UPDATE crm_segmentaudithistory SET segment_id = NULL WHERE segment_id = $1`, [id]);
            // Delete referencing configurations
            await client.query(`DELETE FROM crm_segmentfilters WHERE segment_id = $1`, [id]);
            await client.query(`DELETE FROM crm_segmentleads WHERE segment_id = $1`, [id]);
            await client.query(`DELETE FROM crm_segmentoffers WHERE segment_id = $1`, [id]);
            // Delete the segment
            await client.query(`DELETE FROM crm_segment WHERE id = $1 AND organization_id = $2`, [id, orgId]);
            await client.query("COMMIT");
        }
        catch (txErr) {
            await client.query("ROLLBACK");
            throw txErr;
        }
        finally {
            client.release();
        }
        (0, socket_1.emitToOrg)(orgId, "segment:list:changed", {
            reason: "segment-deleted",
            segmentId: id
        });
        (0, socket_1.emitToOrg)(orgId, "segment:detail:changed", {
            reason: "segment-deleted",
            segmentId: id
        });
        return {
            message: "Segment deleted successfully"
        };
    }
    catch (err) {
        console.error("[deleteSegmentHandler] Error:", err);
        return req.error(500, "Internal Server Error while deleting segment");
    }
};
exports.deleteSegmentHandler = deleteSegmentHandler;
