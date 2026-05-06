import dotenv from "dotenv";
dotenv.config();

import cds from "@sap/cds";

import http from "http";

import { Server } from "socket.io";

import type { Express } from "express";

import cookieParser from "cookie-parser";

import cookie from "cookie";

import { verifyAccessToken } from "./lib/jwt";

import { bindAllServices } from "./bindings";

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
  app.use(cookieParser());

  app.use((req, res, next) => {
    res.removeHeader("WWW-Authenticate");

    const origin = req.headers.origin as string | undefined;

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Access-Control-Allow-Credentials", "true");

    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    next();
  });
});

cds.on("served", () => {
  bindAllServices();

  const app = cds.server as Express;

  const httpServer = http.createServer(app);

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,

      credentials: true,

      methods: ["GET", "POST"],
    },
  });

  io.use((socket: any, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || "");

      const token = cookies.accessToken;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const user = verifyAccessToken(token);

      socket.data.user = user;

      next();
    } catch (err) {
      console.error("SOCKET AUTH ERROR:", err);

      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: any) => {
    const user = socket.data.user;

    if (user?.orgId) {
      socket.join(user.orgId);
    }

    console.log("Socket connected:", user?.sub);

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", user?.sub);
    });
  });
});

module.exports = cds.server;
