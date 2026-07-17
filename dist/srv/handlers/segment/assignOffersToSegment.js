"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignOffersToSegmentHandler = void 0;
const db_1 = require("../../lib/db");
const socket_1 = require("../../realtime/socket");
const assignOffersToSegmentHandler = async (req) => {
    const { segmentId, offerIds = [] } = req.data;
    const orgId = req.user.orgId;
    const userId = req.user.id;
    const userRole = req.user.role?.toLowerCase() || req.user.roles?.[0]?.toLowerCase() || "";
    try {
        // 1. Fetch Segment metadata
        const segRes = await db_1.pool.query(`SELECT createdby, name FROM crm_segment WHERE id = $1 AND organization_id = $2`, [segmentId, orgId]);
        if (segRes.rowCount === 0) {
            return req.error(404, "Segment not found");
        }
        const segment = segRes.rows[0];
        // 2. Visibility & Scoping Security Check
        if (userRole === "executive") {
            if (segment.createdby !== userId) {
                return req.error(403, "Forbidden: Executives can only assign offers to their own segments");
            }
        }
        else if (userRole === "manager") {
            if (segment.createdby !== userId) {
                // Verify if creator reports to this manager
                const reportRes = await db_1.pool.query(`SELECT reporting_manager_id FROM crm_user WHERE id = $1`, [segment.createdby]);
                if (reportRes.rowCount === 0 || reportRes.rows[0].reporting_manager_id !== userId) {
                    return req.error(403, "Forbidden: Managers can only assign offers to segments created by themselves or reporting team members");
                }
            }
        }
        // 3. Resolve Offer Titles for audit logging
        let offerTitles = "None";
        if (offerIds.length > 0) {
            const offerRes = await db_1.pool.query(`SELECT title FROM crm_offer WHERE id = ANY($1) AND organization_id = $2`, [offerIds, orgId]);
            if (offerRes.rows.length > 0) {
                offerTitles = offerRes.rows.map((row) => row.title).join(", ");
            }
        }
        // 4. Perform atomic update in a transaction
        const client = await db_1.pool.connect();
        try {
            await client.query("BEGIN");
            // Delete existing assignments
            await client.query(`DELETE FROM crm_segmentoffers WHERE segment_id = $1`, [segmentId]);
            // Insert new assignments
            if (offerIds.length > 0) {
                for (const offerId of offerIds) {
                    await client.query(`INSERT INTO crm_segmentoffers (id, segment_id, offer_id, assigned_by_id, assigned_at, createdat, createdby, modifiedat, modifiedby)
             VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW(), $3, NOW(), $3)`, [segmentId, offerId, userId]);
                }
            }
            // Log audit history entry
            await client.query(`INSERT INTO crm_segmentaudithistory (id, organization_id, segment_id, action_type, user_id, timestamp, details, createdat, createdby, modifiedat, modifiedby)
         VALUES (gen_random_uuid(), $1, $2, 'Assign Offers', $3, NOW(), $4, NOW(), $3, NOW(), $3)`, [orgId, segmentId, userId, `Assigned offers: [${offerTitles}] to Segment "${segment.name}".`]);
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
            reason: "segment-offers-updated",
            segmentId
        });
        (0, socket_1.emitToOrg)(orgId, "segment:detail:changed", {
            reason: "segment-offers-updated",
            segmentId
        });
        return {
            message: "Offers assigned to segment successfully",
            assignedCount: offerIds.length
        };
    }
    catch (err) {
        console.error("[assignOffersToSegmentHandler] Error:", err);
        return req.error(500, "Internal Server Error while assigning offers to segment");
    }
};
exports.assignOffersToSegmentHandler = assignOffersToSegmentHandler;
