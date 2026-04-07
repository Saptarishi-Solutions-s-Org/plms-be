import dotenv from "dotenv";
dotenv.config();

import cds from "@sap/cds";
import http from "http";
import { Server } from "socket.io";
import { verifyToken } from "./lib/jwt";

// ✅ DB CONFIG FROM ENV
cds.env.requires.db = {
  kind: "postgres",
  impl: "@cap-js/postgres",
  credentials: {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  },
  pool: {
    min: 0,
    max: 5,
  },
};

let io: Server;

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

cds.on("bootstrap", (app: any) => {
  app.use((req: any, res: any, next: any) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    next();
  });
});

cds.on("served", () => {
  const app = cds.server;
  const server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
    },
  });

  io.use((socket: any, next: any) => {
    try {
      const token = socket.handshake.auth?.token;
      const user = verifyToken(token);
      socket.data.user = user;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: any) => {
    const user = socket.data.user;
    if (user?.orgId) socket.join(user.orgId);
  });
});
