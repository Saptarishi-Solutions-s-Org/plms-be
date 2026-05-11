import { Server, Socket } from "socket.io";
import { verifyToken } from "../lib/jwt";
import { AppUser } from "../types/appuser";

let io: Server | null = null;

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

export type RealtimeScope =
  | "global"
  | "system-admin"
  | `org:${string}`
  | `role:${string}`
  | `user:${string}`;

export type RealtimeEvent = {
  type: string;
  scope: RealtimeScope;
  data?: unknown;
  timestamp: number;
};

type AuthSocket = Socket & {
  data: {
    user?: AppUser;
  };
};

function normalizeRole(role?: string) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function emitToRoom(room: string, type: string, data: unknown, scope: RealtimeScope) {
  if (!io) return;

  const event: RealtimeEvent = {
    type,
    scope,
    data,
    timestamp: Date.now(),
  };

  io.to(room).emit("event", event);
}

export function initSocket(server: any) {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket: AuthSocket, next: (err?: Error) => void) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) throw new Error("No token");

      const user = verifyToken(token) as AppUser;
      socket.data.user = user;

      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: AuthSocket) => {
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

    console.log(
      `Socket connected: user=${user.userId} org=${user.orgId} role=${roleRoom}`,
    );

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: user=${user.userId}`);
    });
  });

  return io;
}

export function emitGlobal(type: string, data?: unknown) {
  if (!io) return;

  const event: RealtimeEvent = {
    type,
    scope: "global",
    data,
    timestamp: Date.now(),
  };

  io.emit("event", event);
}

export function emitToUser(userId: string, type: string, data?: unknown) {
  emitToRoom(`user:${userId}`, type, data, `user:${userId}`);
}

export function emitToOrg(orgId: string, type: string, data?: unknown) {
  emitToRoom(`org:${orgId}`, type, data, `org:${orgId}`);
}

export function emitToRole(role: string, type: string, data?: unknown) {
  const normalizedRole = normalizeRole(role);
  emitToRoom(`role:${normalizedRole}`, type, data, `role:${normalizedRole}`);
}

export function emitToSystemAdmins(type: string, data?: unknown) {
  emitToRoom("system-admin", type, data, "system-admin");
}

export function emitEvent(orgId: string, type: string, data?: unknown) {
  emitToOrg(orgId, type, data);
}
