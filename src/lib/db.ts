import { PrismaClient } from '@prisma/client';
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
    if (host === 'localhost' || host === '127.0.0.1' || dbName === 'sehatai_test') {
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
          if (!existing || (isDbKey && (existing.includes('127.0.0.1') || existing.includes('localhost') || existing.includes('sehatai_test')))) {
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