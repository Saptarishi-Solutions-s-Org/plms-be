"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrgUserHandler = void 0;
const db_1 = require("../../lib/db");
const refreshToken_1 = require("../../lib/refreshToken");
const socket_1 = require("../../realtime/socket");
const events_1 = require("../../realtime/events");
const updateOrgUserHandler = async (req) => {
    const client = await db_1.pool.connect();
    try {
        const orgId = req.user?.orgId;
        const modifiedBy = req.user?.userId || req.user?.id;
        const { id, name, email, phone, gender, dob, country, state, city, roleName, reportingManager, is_active, } = req.data;
        if (!orgId || !modifiedBy) {
            return req.error(401, "Unauthorized");
        }
        if (!id) {
            return req.error(400, "User id is required");
        }
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : undefined;
        if (email !== undefined &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail || "")) {
            return req.error(400, "Invalid email address");
        }
        if (reportingManager === id) {
            return req.error(400, "A user cannot be their own reporting manager");
        }
        await client.query("BEGIN");
        const existingRes = await client.query(`SELECT
         u.id,
         u.email,
         u.role_id,
         u.reporting_manager_id,
         u.is_active
       FROM crm_user u
       JOIN crm_organizationroles orr ON orr.id = u.role_id
       JOIN crm_roles r ON r.id = orr.role_id
       WHERE u.id = $1
         AND u.organization_id = $2
         AND LOWER(r.name) IN ('manager', 'executive')
       LIMIT 1`, [id, orgId]);
        const existing = existingRes.rows[0];
        if (!existing) {
            await client.query("ROLLBACK");
            return req.error(404, "User not found");
        }
        if (normalizedEmail) {
            const duplicateEmailRes = await client.query(`SELECT id
         FROM crm_user
         WHERE LOWER(email) = LOWER($1)
           AND id <> $2
         LIMIT 1`, [normalizedEmail, id]);
            if (duplicateEmailRes.rows.length) {
                await client.query("ROLLBACK");
                return req.error(409, "Email is already in use");
            }
        }
        let roleId = existing.role_id;
        if (roleName) {
            const roleRes = await client.query(`SELECT orr.id
         FROM crm_organizationroles orr
         JOIN crm_roles r ON r.id = orr.role_id
         WHERE orr.organization_id = $1
           AND LOWER(r.name) = LOWER($2)
           AND LOWER(r.name) IN ('manager', 'executive')
         LIMIT 1`, [orgId, roleName]);
            if (!roleRes.rows.length) {
                await client.query("ROLLBACK");
                return req.error(400, "Role not found in this organization");
            }
            roleId = roleRes.rows[0].id;
        }
        if (reportingManager) {
            const managerRes = await client.query(`SELECT u.id
         FROM crm_user u
         JOIN crm_organizationroles orr ON orr.id = u.role_id
         JOIN crm_roles r ON r.id = orr.role_id
         WHERE u.id = $1
           AND u.organization_id = $2
           AND u.is_active = true
           AND LOWER(r.name) = 'manager'
         LIMIT 1`, [reportingManager, orgId]);
            if (!managerRes.rows.length) {
                await client.query("ROLLBACK");
                return req.error(400, "Reporting manager not found or inactive");
            }
        }
        const nextIsActive = typeof is_active === "boolean" ? is_active : existing.is_active;
        const nextReportingManager = reportingManager === undefined
            ? existing.reporting_manager_id
            : reportingManager;
        const reportingManagerChanged = nextReportingManager !== existing.reporting_manager_id;
        const sessionAffectingChange = roleId !== existing.role_id ||
            reportingManagerChanged ||
            nextIsActive !== existing.is_active;
        await client.query(`UPDATE crm_user
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           gender = COALESCE($4, gender),
           dob = COALESCE($5, dob),
           country_id = COALESCE($6, country_id),
           state_id = COALESCE($7, state_id),
           city = COALESCE($8, city),
           role_id = $9::varchar,
           reporting_manager_id = $10::varchar,
           is_active = $11::boolean,
           session_version = CASE
             WHEN role_id IS DISTINCT FROM $9::varchar
               OR reporting_manager_id IS DISTINCT FROM $10::varchar
               OR is_active IS DISTINCT FROM $11::boolean
             THEN session_version + 1
             ELSE session_version
           END,
           modifiedat = NOW(),
           modifiedby = $12
       WHERE id = $13
         AND organization_id = $14`, [
            name || null,
            normalizedEmail || null,
            phone || null,
            gender || null,
            dob || null,
            country || null,
            state || null,
            city || null,
            roleId,
            nextReportingManager || null,
            nextIsActive,
            modifiedBy,
            id,
            orgId,
        ]);
        await client.query("COMMIT");
        if (sessionAffectingChange) {
            try {
                await (0, refreshToken_1.revokeOtherRefreshTokens)(id);
            }
            catch (error) {
                console.error("Failed to revoke refresh tokens after user update:", error);
            }
        }
        (0, socket_1.emitToOrg)(orgId, events_1.USER_LIST_CHANGED, {
            reason: "user-updated",
            userId: id,
        });
        (0, socket_1.emitToOrg)(orgId, events_1.USER_DETAIL_CHANGED, {
            reason: "user-updated",
            userId: id,
        });
        (0, socket_1.emitToUser)(id, events_1.PROFILE_CHANGED, {
            reason: "profile-updated",
            userId: id,
        });
        if (reportingManagerChanged) {
            (0, socket_1.emitToOrg)(orgId, events_1.LEAD_LIST_CHANGED, {
                reason: "executive-reporting-manager-changed",
                executiveId: id,
                previousManagerId: existing.reporting_manager_id,
                reportingManagerId: nextReportingManager,
            });
        }
        return { message: "User updated successfully" };
    }
    catch (err) {
        await client.query("ROLLBACK");
        console.error("Update org user error:", err);
        return req.error(500, "Failed to update user");
    }
    finally {
        client.release();
    }
};
exports.updateOrgUserHandler = updateOrgUserHandler;
