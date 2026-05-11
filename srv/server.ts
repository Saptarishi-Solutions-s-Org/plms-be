import dotenv from "dotenv";
dotenv.config();

import cds from "@sap/cds";
import type { Express } from "express";

import { bindAllServices } from "./bindings";
import { initSocket } from "./realtime/socket";

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

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
let servicesBound = false;

function bindServicesOnce() {
  if (servicesBound) return;
  bindAllServices();
  servicesBound = true;
}

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
  bindServicesOnce();
});

cds.on("listening", ({ server }: { server: any }) => {
  initSocket(server);
});

if (!cds.cli) {
  cds.server().then((server: any) => {
    initSocket(server);

    const address = server.address?.();
    const port =
      typeof address === "object" && address ? address.port : process.env.PORT;

    console.log(`Server running on http://localhost:${port || 4004}`);
  });
}
