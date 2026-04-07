import { Server, Socket } from "socket.io";
import { verifyToken } from "../lib/jwt";

let io: Server;

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

type AuthSocket = Socket & {
  data: {
    user?: any;
  };
};

export function initSocket(server: any) {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.use((socket: AuthSocket, next: (err?: Error) => void) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) throw new Error("No token");

      const user = verifyToken(token);
      socket.data.user = user;

      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: AuthSocket) => {
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

export function emitEvent(orgId: string, type: string, data: any) {
  if (!io) return;

  io.to(orgId).emit("event", {
    type,
    data,
    timestamp: Date.now(),
  });
}
