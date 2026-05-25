"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cds_1 = __importDefault(require("@sap/cds"));
const bindings_1 = require("./bindings");
const socket_1 = require("./realtime/socket");
cds_1.default.env.requires.auth = {
    kind: "dummy",
};
cds_1.default.env.requires.db = {
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
    if (servicesBound)
        return;
    (0, bindings_1.bindAllServices)();
    servicesBound = true;
}
cds_1.default.on("bootstrap", (app) => {
    app.use((req, res, next) => {
        const origin = req.headers.origin;
        if (origin && allowedOrigins.includes(origin)) {
            res.setHeader("Access-Control-Allow-Origin", origin);
            res.setHeader("Access-Control-Allow-Credentials", "true");
        }
        res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
        if (req.method === "OPTIONS") {
            return res.status(200).end();
        }
        next();
    });
});
cds_1.default.on("served", () => {
    bindServicesOnce();
});
cds_1.default.on("listening", ({ server }) => {
    (0, socket_1.initSocket)(server);
});
if (!cds_1.default.cli) {
    cds_1.default.server().then((server) => {
        (0, socket_1.initSocket)(server);
        const address = server.address?.();
        const port = typeof address === "object" && address ? address.port : process.env.PORT;
        console.log(`Server running on http://localhost:${port || 4004}`);
    });
}
