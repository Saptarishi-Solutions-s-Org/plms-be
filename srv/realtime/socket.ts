import { Server, Socket } from "socket.io";
import cookie from "cookie";

import { verifyAccessToken } from "../lib/jwt";

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
      const cookies = cookie.parse(socket.handshake.headers.cookie || "");

      const token = cookies.accessToken;

      if (!token) {
        throw new Error("No access token");
      }

      const user = verifyAccessToken(token);

      socket.data.user = user;

      next();
    } catch (err) {
      console.error("SOCKET AUTH ERROR:", err);

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

    console.log("🔌 Socket connected:", user.sub);

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", user.sub);
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
