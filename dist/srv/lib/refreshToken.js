"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRefreshToken = generateRefreshToken;
exports.hashRefreshToken = hashRefreshToken;
exports.refreshTokenExpiresAt = refreshTokenExpiresAt;
exports.createRefreshTokenSession = createRefreshTokenSession;
exports.findRefreshToken = findRefreshToken;
exports.revokeRefreshToken = revokeRefreshToken;
exports.revokeOtherRefreshTokens = revokeOtherRefreshTokens;
exports.rotateRefreshToken = rotateRefreshToken;
exports.isRefreshTokenUsable = isRefreshTokenUsable;
const crypto_1 = require("crypto");
const db_1 = require("./db");
const env_1 = require("../config/env");
const duration_1 = require("./duration");
const REFRESH_TOKEN_BYTES = 64;
let dbShape = null;
function quoteIdentifier(identifier) {
    return `"${identifier.replace(/"/g, '""')}"`;
}
function column(columns, ...candidates) {
    const normalizedColumns = new Map([...columns].map((columnName) => [columnName.toLowerCase(), columnName]));
    const found = candidates.find((candidate) => normalizedColumns.has(candidate.toLowerCase()));
    if (found)
        return normalizedColumns.get(found.toLowerCase()) || found;
    return found || candidates[0];
}
async function getDbShape() {
    if (dbShape)
        return dbShape;
    const tableRes = await db_1.pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('crm_refreshtoken', 'crm_refreshtoken')
    ORDER BY CASE WHEN table_name = 'crm_refreshtoken' THEN 0 ELSE 1 END
    LIMIT 1
    `);
    const table = tableRes.rows[0]?.table_name || "crm_refreshtoken";
    const columnRes = await db_1.pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    `, [table]);
    const columns = new Set(columnRes.rows.map((row) => row.column_name));
    dbShape = {
        table,
        id: column(columns, "id", "ID"),
        userId: column(columns, "user_id", "user_ID"),
        tokenHash: column(columns, "token_hash"),
        expiresAt: column(columns, "expires_at"),
        revokedAt: column(columns, "revoked_at"),
        replacedBy: column(columns, "replaced_by"),
        userAgent: column(columns, "user_agent"),
        ipAddress: column(columns, "ip_address"),
        createdAt: column(columns, "createdat", "createdAt"),
        modifiedAt: column(columns, "modifiedat", "modifiedAt"),
    };
    return dbShape;
}
function generateRefreshToken() {
    return (0, crypto_1.randomBytes)(REFRESH_TOKEN_BYTES).toString("base64url");
}
function hashRefreshToken(token) {
    return (0, crypto_1.createHash)("sha256").update(token).digest("hex");
}
function refreshTokenExpiresAt() {
    return new Date(Date.now() + (0, duration_1.parseDurationMs)(env_1.ENV.JWT_REFRESH_EXPIRES_IN, "7d"));
}
async function createRefreshTokenSession(input) {
    const shape = await getDbShape();
    const token = generateRefreshToken();
    const tokenHash = hashRefreshToken(token);
    const id = (0, crypto_1.randomUUID)();
    const expiresAt = refreshTokenExpiresAt();
    await db_1.pool.query(`
    INSERT INTO ${quoteIdentifier(shape.table)}
      (${quoteIdentifier(shape.id)}, ${quoteIdentifier(shape.userId)}, ${quoteIdentifier(shape.tokenHash)}, ${quoteIdentifier(shape.expiresAt)}, ${quoteIdentifier(shape.userAgent)}, ${quoteIdentifier(shape.ipAddress)}, ${quoteIdentifier(shape.createdAt)}, ${quoteIdentifier(shape.modifiedAt)})
    VALUES
      ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    `, [
        id,
        input.userId,
        tokenHash,
        expiresAt,
        input.userAgent || null,
        input.ipAddress || null,
    ]);
    return { id, token, expiresAt };
}
async function findRefreshToken(token) {
    const shape = await getDbShape();
    const tokenHash = hashRefreshToken(token);
    const res = await db_1.pool.query(`
    SELECT
      ${quoteIdentifier(shape.id)} as id,
      ${quoteIdentifier(shape.userId)} as user_id,
      ${quoteIdentifier(shape.expiresAt)} as expires_at,
      ${quoteIdentifier(shape.revokedAt)} as revoked_at
    FROM ${quoteIdentifier(shape.table)}
    WHERE ${quoteIdentifier(shape.tokenHash)} = $1
    LIMIT 1
    `, [tokenHash]);
    return res.rows[0] || null;
}
async function revokeRefreshToken(tokenId, replacementTokenId) {
    const shape = await getDbShape();
    await db_1.pool.query(`
    UPDATE ${quoteIdentifier(shape.table)}
    SET ${quoteIdentifier(shape.revokedAt)} = COALESCE(${quoteIdentifier(shape.revokedAt)}, NOW()),
        ${quoteIdentifier(shape.replacedBy)} = COALESCE($2, ${quoteIdentifier(shape.replacedBy)}),
        ${quoteIdentifier(shape.modifiedAt)} = NOW()
    WHERE ${quoteIdentifier(shape.id)} = $1
    `, [tokenId, replacementTokenId || null]);
}
async function revokeOtherRefreshTokens(userId, currentTokenId) {
    const shape = await getDbShape();
    const params = [userId];
    let excludeCurrent = "";
    if (currentTokenId) {
        params.push(currentTokenId);
        excludeCurrent = `AND ${quoteIdentifier(shape.id)} <> $2`;
    }
    await db_1.pool.query(`
    UPDATE ${quoteIdentifier(shape.table)}
    SET ${quoteIdentifier(shape.revokedAt)} = COALESCE(${quoteIdentifier(shape.revokedAt)}, NOW()),
        ${quoteIdentifier(shape.modifiedAt)} = NOW()
    WHERE ${quoteIdentifier(shape.userId)} = $1
      AND ${quoteIdentifier(shape.revokedAt)} IS NULL
      ${excludeCurrent}
    `, params);
}
async function rotateRefreshToken(input) {
    const replacement = await createRefreshTokenSession({
        userId: input.userId,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
    });
    await revokeRefreshToken(input.currentTokenId, replacement.id);
    return replacement;
}
function isRefreshTokenUsable(record) {
    return !record.revoked_at && new Date(record.expires_at).getTime() > Date.now();
}
