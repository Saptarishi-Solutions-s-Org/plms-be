"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cds_1 = __importDefault(require("@sap/cds"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const jwt_1 = require("./lib/jwt");
const bindings_1 = require("./bindings");
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
let io;
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
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
    const app = cds_1.default.server;
    const server = http_1.default.createServer(app);
    (0, bindings_1.bindAllServices)();
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
        if (user?.orgId) {
            socket.join(user.orgId);
        }
        console.log("🔌 Socket connected:", user?.userId);
    });
    if (!cds_1.default.cli) {
        const port = process.env.PORT || 4004;
        server.listen(port, () => {
            console.log(`🚀 Server running on http://localhost:${port}`);
        });
    }
});
cds_1.default.server();
