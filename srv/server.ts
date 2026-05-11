import dotenv from "dotenv";
dotenv.config();

import cds from "@sap/cds";
import http from "http";
import { Server } from "socket.io";
import type { Express } from "express";

import { verifyToken } from "./lib/jwt";
import { bindAllServices } from "./bindings";

cds.env.requires.auth = {
  kind: "dummy",
};

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

cds.on("bootstrap", (app: Express) => {
  app.use((req, res, next) => {
    const origin = req.headers.origin as string | undefined;

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    res.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type, Accept",
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    next();
  });
});

cds.on("served", () => {
  const app = cds.server as Express;
  const server = http.createServer(app);

  bindAllServices();

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket: any, next: (err?: Error) => void) => {
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

  io.on("connection", (socket: any) => {
    const user = socket.data.user;

    if (user?.orgId) {
      socket.join(user.orgId);
    }

    console.log("🔌 Socket connected:", user?.userId);
  });

  if (!cds.cli) {
    const port = process.env.PORT || 4004;

    server.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  }
});

cds.server();
