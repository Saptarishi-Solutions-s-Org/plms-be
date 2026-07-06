"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrganizationHandler = void 0;
const db_1 = require("../../lib/db");
const socket_1 = require("../../realtime/socket");
const events_1 = require("../../realtime/events");
const updateOrganizationHandler = async (req) => {
    const client = await db_1.pool.connect();
    try {
        const { id, name, is_active, email, phone, address, state, country, trial, trailtype, } = req.data;
        const userId = req.user?.id || null;
        const trialType = trial ?? trailtype;
        await client.query("BEGIN");
        await client.query(`UPDATE crm_organization
       SET name = $1,
           is_active = $2,
           email = $3,
           phone = $4,
           address = $5,
           state_id = $6,
           country_id = $7,
           trial = $8,
           modifiedat = NOW(),
           modifiedby = $9
       WHERE id = $10`, [
            name,
            is_active,
            email,
            phone,
            address,
            state,
            country,
            trialType,
            userId,
            id,
        ]);
        if (is_active === false) {
            await client.query(`UPDATE crm_user
         SET is_active = false,
             session_version = session_version + 1,
             modifiedat = NOW(),
             modifiedby = $1
         WHERE organization_id = $2`, [userId, id]);
        }
        await client.query("COMMIT");
        (0, socket_1.emitToSystemAdmins)(events_1.SYSTEM_ADMIN_DASHBOARD_CHANGED, {
            reason: "organization-updated",
            orgId: id,
            isActive: is_active,
        });
        (0, socket_1.emitToSystemAdmins)(events_1.ORGANIZATION_LIST_CHANGED, {
            reason: "organization-updated",
            orgId: id,
            isActive: is_active,
        });
        (0, socket_1.emitToSystemAdmins)(events_1.ORGANIZATION_DETAIL_CHANGED, {
            reason: "organization-updated",
            orgId: id,
            isActive: is_active,
        });
        return {
            message: "Organization updated successfully",
        };
    }
    catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        return req.error(500, "Failed to update organization");
    }
    finally {
        client.release();
    }
};
exports.updateOrganizationHandler = updateOrganizationHandler;
