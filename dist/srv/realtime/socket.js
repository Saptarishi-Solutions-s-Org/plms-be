"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.emitGlobal = emitGlobal;
exports.emitToUser = emitToUser;
exports.emitToOrg = emitToOrg;
exports.emitToRole = emitToRole;
exports.emitToSystemAdmins = emitToSystemAdmins;
exports.emitEvent = emitEvent;
const socket_io_1 = require("socket.io");
const jwt_1 = require("../lib/jwt");
let io = null;
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
function normalizeRole(role) {
    return String(role || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
}
function emitToRoom(room, type, data, scope) {
    if (!io)
        return;
    const event = {
        type,
        scope,
        data,
        timestamp: Date.now(),
    };
    io.to(room).emit("event", event);
}
function initSocket(server) {
    if (io)
        return io;
    io = new socket_io_1.Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token)
                throw new Error("No token");
            const user = (0, jwt_1.verifyToken)(token);
            socket.data.user = user;
            next();
        }
        catch {
            next(new Error("Unauthorized"));
        }
    });
    io.on("connection", (socket) => {
        const user = socket.data.user;
        if (!user?.userId || !user?.orgId) {
            socket.disconnect();
            return;
        }
        const roleRoom = `role:${normalizeRole(user.role)}`;
        socket.join(`user:${user.userId}`);
        socket.join(`org:${user.orgId}`);
        socket.join(roleRoom);
        if (normalizeRole(user.role) === "system-admin") {
            socket.join("system-admin");
        }
        console.log(`Socket connected: user=${user.userId} org=${user.orgId} role=${roleRoom}`);
        socket.on("disconnect", () => {
            console.log(`Socket disconnected: user=${user.userId}`);
        });
    });
    return io;
}
function emitGlobal(type, data) {
    if (!io)
        return;
    const event = {
        type,
        scope: "global",
        data,
        timestamp: Date.now(),
    };
    io.emit("event", event);
}
function emitToUser(userId, type, data) {
    emitToRoom(`user:${userId}`, type, data, `user:${userId}`);
}
function emitToOrg(orgId, type, data) {
    emitToRoom(`org:${orgId}`, type, data, `org:${orgId}`);
}
function emitToRole(role, type, data) {
    const normalizedRole = normalizeRole(role);
    emitToRoom(`role:${normalizedRole}`, type, data, `role:${normalizedRole}`);
}
function emitToSystemAdmins(type, data) {
    emitToRoom("system-admin", type, data, "system-admin");
}
function emitEvent(orgId, type, data) {
    emitToOrg(orgId, type, data);
}
