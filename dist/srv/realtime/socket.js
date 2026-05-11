"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.emitEvent = emitEvent;
const socket_io_1 = require("socket.io");
const jwt_1 = require("../lib/jwt");
let io;
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
function initSocket(server) {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: allowedOrigins,
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
        if (!user?.orgId) {
            socket.disconnect();
            return;
        }
        socket.join(user.orgId);
        console.log("Socket connected:", user.userId);
        socket.on("disconnect", () => {
            console.log("Socket disconnected:", user.userId);
        });
    });
}
function emitEvent(orgId, type, data) {
    if (!io)
        return;
    io.to(orgId).emit("event", {
        type,
        data,
        timestamp: Date.now(),
    });
}
