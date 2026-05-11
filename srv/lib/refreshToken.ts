import { randomBytes, randomUUID, createHash } from "crypto";
import { pool } from "./db";
import { ENV } from "../config/env";
import { parseDurationMs } from "./duration";

const REFRESH_TOKEN_BYTES = 64;

export type RefreshTokenRecord = {
  id: string;
  user_id: string;
  expires_at: Date;
  revoked_at?: Date | null;
};

type RefreshTokenDbShape = {
  table: string;
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  revokedAt: string;
  replacedBy: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  modifiedAt: string;
};

let dbShape: RefreshTokenDbShape | null = null;

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function column(columns: Set<string>, ...candidates: string[]) {
  const found = candidates.find((candidate) => columns.has(candidate));
  return found || candidates[0];
}

async function getDbShape() {
  if (dbShape) return dbShape;

  const tableRes = await pool.query(
    `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('crm_refreshtoken', 'crm_RefreshToken')
    ORDER BY CASE WHEN table_name = 'crm_refreshtoken' THEN 0 ELSE 1 END
    LIMIT 1
    `,
  );
  const table = tableRes.rows[0]?.table_name || "crm_refreshtoken";

  const columnRes = await pool.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    `,
    [table],
  );
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

export function generateRefreshToken() {
  return randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
}

export function hashRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function refreshTokenExpiresAt() {
  return new Date(
    Date.now() + parseDurationMs(ENV.JWT_REFRESH_EXPIRES_IN, "7d"),
  );
}

export async function createRefreshTokenSession(input: {
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}) {
  const shape = await getDbShape();
  const token = generateRefreshToken();
  const tokenHash = hashRefreshToken(token);
  const id = randomUUID();
  const expiresAt = refreshTokenExpiresAt();

  await pool.query(
    `
    INSERT INTO ${quoteIdentifier(shape.table)}
      (${quoteIdentifier(shape.id)}, ${quoteIdentifier(shape.userId)}, ${quoteIdentifier(shape.tokenHash)}, ${quoteIdentifier(shape.expiresAt)}, ${quoteIdentifier(shape.userAgent)}, ${quoteIdentifier(shape.ipAddress)}, ${quoteIdentifier(shape.createdAt)}, ${quoteIdentifier(shape.modifiedAt)})
    VALUES
      ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    `,
    [
      id,
      input.userId,
      tokenHash,
      expiresAt,
      input.userAgent || null,
      input.ipAddress || null,
    ],
  );

  return { id, token, expiresAt };
}

export async function findRefreshToken(token: string) {
  const shape = await getDbShape();
  const tokenHash = hashRefreshToken(token);
  const res = await pool.query<RefreshTokenRecord>(
    `
    SELECT
      ${quoteIdentifier(shape.id)} as id,
      ${quoteIdentifier(shape.userId)} as user_id,
      ${quoteIdentifier(shape.expiresAt)} as expires_at,
      ${quoteIdentifier(shape.revokedAt)} as revoked_at
    FROM ${quoteIdentifier(shape.table)}
    WHERE ${quoteIdentifier(shape.tokenHash)} = $1
    LIMIT 1
    `,
    [tokenHash],
  );

  return res.rows[0] || null;
}

export async function revokeRefreshToken(
  tokenId: string,
  replacementTokenId?: string,
) {
  const shape = await getDbShape();
  await pool.query(
    `
    UPDATE ${quoteIdentifier(shape.table)}
    SET ${quoteIdentifier(shape.revokedAt)} = COALESCE(${quoteIdentifier(shape.revokedAt)}, NOW()),
        ${quoteIdentifier(shape.replacedBy)} = COALESCE($2, ${quoteIdentifier(shape.replacedBy)}),
        ${quoteIdentifier(shape.modifiedAt)} = NOW()
    WHERE ${quoteIdentifier(shape.id)} = $1
    `,
    [tokenId, replacementTokenId || null],
  );
}

export async function rotateRefreshToken(input: {
  currentTokenId: string;
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}) {
  const replacement = await createRefreshTokenSession({
    userId: input.userId,
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
  });

  await revokeRefreshToken(input.currentTokenId, replacement.id);

  return replacement;
}

export function isRefreshTokenUsable(record: RefreshTokenRecord) {
  return !record.revoked_at && new Date(record.expires_at).getTime() > Date.now();
}
