"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveSegmentHandler = void 0;
const db_1 = require("../../lib/db");
const segmentcode_1 = require("../../lib/segmentcode");
const socket_1 = require("../../realtime/socket");
const saveSegmentHandler = async (req) => {
    const { id, name, description, type, color, notes, is_active = true, filters = [], static_lead_ids = [] } = req.data;
    const orgId = req.user.orgId;
    const userId = req.user.id;
    const userRole = req.user.role?.toLowerCase() || req.user.roles?.[0]?.toLowerCase() || "";
    // Granular check: Executives can only save if they have view/create/update permissions
    // which is handled by bindSegment middleware.
    try {
        const isNew = !id;
        let segmentId = id;
        let segmentCode = "";
        // Audit log helper
        const writeAuditLog = async (segId, actionType, details) => {
            await db_1.pool.query(`INSERT INTO crm_segmentaudithistory (id, organization_id, segment_id, action_type, user_id, timestamp, details, createdat, createdby, modifiedat, modifiedby)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), $5, NOW(), $4, NOW(), $4)`, [orgId, segId, actionType, userId, details]);
        };
        if (isNew) {
            segmentId = gen_random_uuid_local();
            segmentCode = (0, segmentcode_1.generateSegmentCode)();
            // Insert new Segment record
            await db_1.pool.query(`INSERT INTO crm_segment (id, organization_id, name, code, description, type, is_active, color, notes, createdat, createdby, modifiedat, modifiedby)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, NOW(), $10)`, [segmentId, orgId, name, segmentCode, description, type, is_active, color, notes, userId]);
            await writeAuditLog(segmentId, "Create", `Segment "${name}" created by ${req.user.role}.`);
        }
        else {
            // Fetch segment metadata
            const segRes = await db_1.pool.query(`SELECT createdby, name, code, is_active, description, color, notes, type FROM crm_segment WHERE id = $1 AND organization_id = $2`, [segmentId, orgId]);
            if (segRes.rowCount === 0) {
                return req.error(404, "Segment not found");
            }
            const existingSeg = segRes.rows[0];
            segmentCode = existingSeg.code;
            // Security Constraint & Scoping Validation
            if (userRole === "executive") {
                if (existingSeg.createdby !== userId) {
                    return req.error(403, "Forbidden: Executives can only update their own segments");
                }
            }
            else if (userRole === "manager") {
                if (existingSeg.createdby !== userId) {
                    // Verify if the creator reports to this Manager
                    const reportRes = await db_1.pool.query(`SELECT reporting_manager_id FROM crm_user WHERE id = $1`, [existingSeg.createdby]);
                    if (reportRes.rowCount === 0 || reportRes.rows[0].reporting_manager_id !== userId) {
                        return req.error(403, "Forbidden: Managers can only update segments created by themselves or reporting team members");
                    }
                    // Log specific audit trail for manager updates to executive segments
                    const execRes = await db_1.pool.query(`SELECT name FROM crm_user WHERE id = $1`, [existingSeg.createdby]);
                    const execName = execRes.rows[0]?.name || "Executive";
                    await writeAuditLog(segmentId, "Update Override", `Manager modified Segment "${existingSeg.name}" originally created by Executive "${execName}".`);
                }
            }
            // Update Segment details
            await db_1.pool.query(`UPDATE crm_segment 
         SET name = $1, description = $2, type = $3, is_active = $4, color = $5, notes = $6, modifiedat = NOW(), modifiedby = $7
         WHERE id = $8 AND organization_id = $9`, [name, description, type, is_active, color, notes, userId, segmentId, orgId]);
            const changes = [];
            if (existingSeg.name !== name) {
                changes.push(`Name changed from "${existingSeg.name}" to "${name}"`);
            }
            if ((existingSeg.description || "") !== (description || "")) {
                changes.push(`Description changed from "${existingSeg.description || "none"}" to "${description || "none"}"`);
            }
            if ((existingSeg.color || "") !== (color || "")) {
                changes.push(`Color changed from "${existingSeg.color || "none"}" to "${color || "none"}"`);
            }
            if ((existingSeg.notes || "") !== (notes || "")) {
                changes.push(`Notes changed from "${existingSeg.notes || "none"}" to "${notes || "none"}"`);
            }
            if (existingSeg.type !== type) {
                changes.push(`Type changed from "${existingSeg.type}" to "${type}"`);
            }
            if (existingSeg.is_active !== is_active) {
                changes.push(`Status changed from "${existingSeg.is_active ? "Active" : "Inactive"}" to "${is_active ? "Active" : "Inactive"}"`);
            }
            if (req.data.filters !== undefined) {
                const oldFiltersRes = await db_1.pool.query(`SELECT sf.id, sf.filter_type_id, sf.operator, sf.value, sf.group_id, sf.logical_op, ft.name as filter_type_name
           FROM crm_segmentfilters sf
           JOIN crm_segmentfiltertypes ft ON ft.id = sf.filter_type_id
           WHERE sf.segment_id = $1`, [segmentId]);
                const oldFilters = oldFiltersRes.rows;
                const filterTypesRes = await db_1.pool.query(`SELECT id, name FROM crm_segmentfiltertypes`);
                const filterTypeMap = new Map();
                for (const row of filterTypesRes.rows) {
                    filterTypeMap.set(row.id, row.name);
                }
                // Track added and modified
                for (const newF of filters) {
                    const typeName = filterTypeMap.get(newF.filter_type_id) || "Filter";
                    const cleanTypeName = typeName.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                    const match = oldFilters.find(oldF => oldF.id === newF.id || oldF.filter_type_id === newF.filter_type_id);
                    if (match) {
                        if (match.operator !== newF.operator || match.value !== newF.value) {
                            changes.push(`Filter "${cleanTypeName}" changed from [${match.operator} "${match.value}"] to [${newF.operator} "${newF.value}"]`);
                        }
                    }
                    else {
                        changes.push(`Added filter "${cleanTypeName}" [${newF.operator} "${newF.value || ""}"]`);
                    }
                }
                // Track removed
                for (const oldF of oldFilters) {
                    const typeName = oldF.filter_type_name || "Filter";
                    const cleanTypeName = typeName.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                    const match = filters.find((newF) => newF.id === oldF.id || newF.filter_type_id === oldF.filter_type_id);
                    if (!match) {
                        changes.push(`Removed filter "${cleanTypeName}" [${oldF.operator} "${oldF.value || ""}"]`);
                    }
                }
            }
            let auditMsg = `Segment details updated.`;
            if (changes.length > 0) {
                auditMsg = `Segment updated: ${changes.join(". ")}.`;
            }
            else if (existingSeg.is_active !== is_active) {
                auditMsg = `Segment "${name}" ${is_active ? "activated" : "deactivated"}.`;
            }
            await writeAuditLog(segmentId, is_active !== existingSeg.is_active ? (is_active ? "Activate" : "Deactivate") : "Update", auditMsg);
        }
        // --- RE-INSERT DYNAMIC FILTERS ---
        if (req.data.filters !== undefined) {
            await db_1.pool.query(`DELETE FROM crm_segmentfilters WHERE segment_id = $1`, [segmentId]);
            if (type === "Dynamic" && filters.length > 0) {
                for (const filter of filters) {
                    await db_1.pool.query(`INSERT INTO crm_segmentfilters (id, segment_id, filter_type_id, operator, value, group_id, logical_op, createdat, createdby, modifiedat, modifiedby)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), $7, NOW(), $7)`, [segmentId, filter.filter_type_id, filter.operator, filter.value, filter.group_id || null, filter.logical_op || "AND", userId]);
                }
            }
        }
        // --- RE-INSERT STATIC LEADS ---
        if (req.data.static_lead_ids !== undefined) {
            await db_1.pool.query(`DELETE FROM crm_segmentleads WHERE segment_id = $1`, [segmentId]);
            if (type === "Static" && static_lead_ids.length > 0) {
                for (const leadId of static_lead_ids) {
                    await db_1.pool.query(`INSERT INTO crm_segmentleads (id, segment_id, lead_id, createdat, createdby, modifiedat, modifiedby)
             VALUES (gen_random_uuid(), $1, $2, NOW(), $3, NOW(), $3)`, [segmentId, leadId, userId]);
                }
            }
        }
        (0, socket_1.emitToOrg)(orgId, "segment:list:changed", {
            reason: isNew ? "segment-created" : "segment-updated",
            segmentId
        });
        if (!isNew) {
            (0, socket_1.emitToOrg)(orgId, "segment:detail:changed", {
                reason: "segment-updated",
                segmentId
            });
        }
        return {
            segmentId,
            code: segmentCode,
            message: isNew ? "Segment created successfully" : "Segment updated successfully"
        };
    }
    catch (err) {
        console.error("[saveSegmentHandler] Error:", err);
        return req.error(500, "Internal Server Error while saving segment settings");
    }
};
exports.saveSegmentHandler = saveSegmentHandler;
// Local fallback to generate a crypto UUID if postgres gen_random_uuid isn't invoked locally
const gen_random_uuid_local = () => {
    return require("crypto").randomUUID();
};
