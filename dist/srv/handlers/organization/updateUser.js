"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserHandler = void 0;
const db_1 = require("../../lib/db");
const socket_1 = require("../../realtime/socket");
const events_1 = require("../../realtime/events");
const updateUserHandler = async (req) => {
    try {
        const { id, name, phone, is_active, state, country, gender, dob } = req.data;
        const existing = await db_1.pool.query(`SELECT id, organization_id, is_active FROM crm_user WHERE id=$1`, [id]);
        if (!existing.rows.length) {
            return req.error(404, "User not found");
        }
        await db_1.pool.query(`UPDATE crm_user
       SET name=$1,
           phone=$2,
           is_active=$3,
           state_id=$4,
           country_id=$5,
           gender=$6,
           dob=$7,
           session_version = CASE
             WHEN is_active IS DISTINCT FROM $3 THEN session_version + 1
             ELSE session_version
           END,
           modifiedat=NOW(),
           modifiedby=$8
       WHERE id=$9`, [name, phone, is_active, state, country, gender, dob, req.user.id, id]);
        (0, socket_1.emitToSystemAdmins)(events_1.ORGANIZATION_DETAIL_CHANGED, {
            reason: "organization-admin-updated",
            orgId: existing.rows[0].organization_id,
            userId: id,
            isActive: is_active,
        });
        (0, socket_1.emitToUser)(id, events_1.PROFILE_CHANGED, {
            reason: "profile-updated",
            userId: id,
        });
        return {
            message: "User updated successfully",
        };
    }
    catch (err) {
        console.error(err);
        return req.error(500, "Failed to update user");
    }
};
exports.updateUserHandler = updateUserHandler;
