"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLeadActivityHandler = void 0;
const db_1 = require("../../lib/db");
const socket_1 = require("../../realtime/socket");
const events_1 = require("../../realtime/events");
const updateLeadActivityHandler = async (req) => {
    const orgId = req.user?.orgId;
    const modifiedBy = req.user?.id;
    if (!orgId)
        return req.error(401, "Unauthorized");
    const { id, notes } = req.data;
    if (!id)
        return req.error(400, "Activity id is required");
    if (notes === undefined || notes === null)
        return req.error(400, "Notes are required");
    const client = await db_1.pool.connect();
    try {
        await client.query("BEGIN");
        // Verify activity exists and belongs to a lead in the current organization
        const verifyRes = await client.query(`SELECT la.lead_id 
       FROM crm_leadactivity la
       JOIN crm_leads l ON l.id = la.lead_id
       WHERE la.id = $1 AND l.organization_id = $2`, [id, orgId]);
        if (verifyRes.rows.length === 0) {
            await client.query("ROLLBACK");
            return req.error(404, "Activity not found");
        }
        const leadId = verifyRes.rows[0].lead_id;
        const result = await client.query(`UPDATE crm_leadactivity
       SET notes = $1, modifiedat = NOW(), modifiedby = $2
       WHERE id = $3
       RETURNING id, notes`, [notes, modifiedBy, id]);
        await client.query("COMMIT");
        (0, socket_1.emitToOrg)(orgId, events_1.LEAD_DETAIL_CHANGED, {
            reason: "lead-activity-updated",
            leadId,
            activityId: id,
        });
        return { message: "Activity updated", activity: result.rows[0] };
    }
    catch (error) {
        await client.query("ROLLBACK");
        console.error("updateLeadActivity error:", error?.message ?? error);
        return req.error(500, "Failed to update activity");
    }
    finally {
        client.release();
    }
};
exports.updateLeadActivityHandler = updateLeadActivityHandler;
