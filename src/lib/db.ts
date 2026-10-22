import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export interface DatabaseEnvInfo {
  sourceFile: string;
  host: string;
  database: string;
  isStaging: boolean;
  ref?: string;
}

/**
 * Validates database isolation invariants (§94 Database Isolation).
 * Guarantees that local development credentials cannot silently override staging settings
 * and strictly prevents any connection to protected Oracle/ARIA Hub infrastructure.
 */
export function assertDatabaseIsolation(dbUrl: string, isStaging: boolean): void {
  if (!dbUrl) {
    throw new Error('FATAL DATABASE CONFIGURATION: DATABASE_URL environment variable is missing.');
  }

  let parsed: URL;
  try {
    parsed = new URL(dbUrl);
  } catch (err) {
    throw new Error(`FATAL DATABASE CONFIGURATION: Invalid DATABASE_URL: ${(err as Error).message}`);
  }

  const host = parsed.hostname;
  const dbName = parsed.pathname.replace(/^\//, '');

  // Strict Blacklist Check: ARIA Hub / Oracle VM (§3 Infrastructure Protection)
  if (/ariahub|oracle|129\.158\.|myariahub/i.test(host)) {
    throw new Error(
      `CRITICAL SECURITY VIOLATION: Database host matches protected ARIA Hub/Oracle infrastructure: ${host}`
    );
  }
  if (/aria/i.test(dbName)) {
    throw new Error(
      `CRITICAL SECURITY VIOLATION: Database name matches protected ARIA Hub database: ${dbName}`
    );
  }

  // Staging Mode Safeguard: Local credentials cannot silently override staging
  if (isStaging) {
    const isStagingDb = dbName === 'sehatai_staging';
    if (!isStagingDb && (host === 'localhost' || host === '127.0.0.1' || dbName === 'sehatai_test')) {
      throw new Error(
        `FATAL CONFIGURATION ERROR: Local development credentials (${host}/${dbName}) detected while running in staging mode! Local development credentials cannot silently override staging settings.`
      );
    }
  }
}

/**
 * Validates and enforces database environment isolation (§94 Database Isolation).
 * Guarantees that local development credentials cannot silently override staging settings.
 */
export function verifyAndLoadDatabaseEnv(): DatabaseEnvInfo {
  const isStagingMode = Boolean(
    process.env.APP_ENV === 'staging' ||
    process.env.SEHATAI_STAGING === '1' ||
    process.env.STAGING_MODE === 'true' ||
    process.env.NEXT_PUBLIC_APP_URL?.includes('staging')
  );


  let sourceFile = '.env';

  if (isStagingMode) {
    // If in staging mode, explicitly load .env.staging to ensure staging settings override local .env
    const stagingPath = path.resolve(process.cwd(), '.env.staging');
    if (fs.existsSync(stagingPath)) {
      const content = fs.readFileSync(stagingPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          // Enforce that staging env overrides any local dev database values, but preserve explicitly passed valid staging URLs
          const existing = process.env[key];
          const isDbKey = key === 'DATABASE_URL' || key === 'DIRECT_URL' || key === 'DATABASE_URL_POOLED' || key === 'DATABASE_URL_UNPOOLED';
          const isDevDb = Boolean(existing && (existing.includes('127.0.0.1') || existing.includes('localhost') || existing.includes('sehatai_test')) && !existing.includes('sehatai_staging'));
          if (!existing || (isDbKey && isDevDb)) {
            process.env[key] = val;
          }
        }
      }
      sourceFile = '.env.staging';
    }
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('FATAL DATABASE CONFIGURATION: DATABASE_URL environment variable is missing.');
  }

  assertDatabaseIsolation(dbUrl, isStagingMode);

  const parsed = new URL(dbUrl);
  const host = parsed.hostname;
  const dbName = parsed.pathname.replace(/^\//, '');

  if (isStagingMode && !process.env.DIRECT_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL_UNPOOLED || dbUrl;
  }

  const ref = parsed.username.includes('.') ? parsed.username.split('.')[1] : undefined;

  return {
    sourceFile,
    host,
    database: dbName,
    isStaging: isStagingMode,
    ref,
  };
}

export const activeDbConfig = verifyAndLoadDatabaseEnv();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: process.env.DATABASE_URL },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

/**
 * Detects whether an error represents a database connectivity failure or initialization error (§Check 1).
 * Prevents leaking connection strings, credentials, or internal stack traces to clients.
 */
export function isDatabaseDisconnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as Record<string, any>;
  const name = String(err.name || '');
  const message = String(err.message || '');
  const code = String(err.code || '');

  // Prisma Client initialization or rust engine panic
  if (name === 'PrismaClientInitializationError' || name === 'PrismaClientRustPanicError') {
    return true;
  }

  // Prisma Client known request connection errors (P1000..P1017)
  if (name === 'PrismaClientKnownRequestError') {
    if (code === 'P1000' || code === 'P1001' || code === 'P1002' || code === 'P1003' || code === 'P1008' || code === 'P1017') {
      return true;
    }
  }

  // Underlying OS/network socket errors
  if (['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH', 'ECONNRESET', 'EPIPE'].includes(code)) {
    return true;
  }

  // Explicit database unavailable status attached
  if (err.status === 503 || err.isDatabaseUnavailable === true) {
    return true;
  }

  // Common connection failure substrings
  if (
    message.includes("Can't reach database server") ||
    message.includes('Connection refused') ||
    message.includes('connection timed out') ||
    message.includes('database is not running') ||
    message.includes('timed out waiting for a connection') ||
    message.includes('Server has closed the connection') ||
    message.includes('connect_timeout')
  ) {
    return true;
  }

  return false;
}

/**
 * Standard controlled HTTP 503 Service Unavailable response for database connectivity issues.
 * Sanitizes all output to ensure internal connection strings, credentials, or stack traces are never leaked.
 */
export function databaseUnavailableResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Database service currently unavailable. Please retry shortly.' },
    {
      status: 503,
      headers: {
        'Retry-After': '30',
      },
    }
  );
}