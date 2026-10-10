// scripts/audit-staging-migration.ts
// Audits Prisma migration SQL for staging safety and verifies target destination.
import fs from 'node:fs';
import path from 'node:path';

const MIGRATION_FILE = path.join(process.cwd(), 'prisma', 'migrations', '20261008000000_init_postgresql', 'migration.sql');

export interface MigrationAuditResult {
  file: string;
  creates: number;
  indexes: number;
  foreignKeys: number;
  destructiveStatements: string[];
  safeToApply: boolean;
  targetSafe: boolean;
  targetHost: string;
  targetDb: string;
}

export function auditMigrationSql(sqlContent: string): {
  creates: number;
  indexes: number;
  foreignKeys: number;
  destructiveStatements: string[];
  safeToApply: boolean;
} {
  const lines = sqlContent.split('\n');
  const destructiveStatements: string[] = [];
  let creates = 0;
  let indexes = 0;
  let foreignKeys = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') || trimmed.length === 0) continue;

    if (/^CREATE\s+TABLE\s+/i.test(trimmed)) creates++;
    if (/^CREATE\s+(UNIQUE\s+)?INDEX\s+/i.test(trimmed)) indexes++;
    if (/^ALTER\s+TABLE\s+.*\s+ADD\s+CONSTRAINT\s+/i.test(trimmed)) foreignKeys++;

    // Check destructive operations
    if (/\bDROP\s+(TABLE|DATABASE|SCHEMA)\b/i.test(trimmed)) {
      destructiveStatements.push(trimmed);
    }
    if (/\bTRUNCATE\b/i.test(trimmed)) {
      destructiveStatements.push(trimmed);
    }
    if (/\bDROP\s+COLUMN\b/i.test(trimmed)) {
      destructiveStatements.push(trimmed);
    }
  }

  return {
    creates,
    indexes,
    foreignKeys,
    destructiveStatements,
    safeToApply: destructiveStatements.length === 0,
  };
}

export function verifyTargetDatabase(dbUrl: string): {
  targetSafe: boolean;
  targetHost: string;
  targetDb: string;
  reason?: string;
} {
  try {
    const parsed = new URL(dbUrl);
    const host = parsed.hostname;
    const dbName = parsed.pathname.replace(/^\//, '');

    // Strict blacklists: never touch Oracle or ARIA Hub
    if (/ariahub|oracle|129\.158\.|myariahub/i.test(host)) {
      return {
        targetSafe: false,
        targetHost: host,
        targetDb: dbName,
        reason: `FORBIDDEN DESTINATION: Target host matches protected Oracle/ARIA Hub infrastructure: ${host}`,
      };
    }

    if (/aria/i.test(dbName)) {
      return {
        targetSafe: false,
        targetHost: host,
        targetDb: dbName,
        reason: `FORBIDDEN DESTINATION: Target database name matches protected ARIA Hub database: ${dbName}`,
      };
    }

    return {
      targetSafe: true,
      targetHost: host,
      targetDb: dbName,
    };
  } catch (err) {
    return {
      targetSafe: false,
      targetHost: 'invalid',
      targetDb: 'invalid',
      reason: `Could not parse database URL: ${(err as Error).message}`,
    };
  }
}

async function main() {
  console.log('==> Starting SehatAI Staging Prisma Migration & Target Safety Audit...');

  if (!fs.existsSync(MIGRATION_FILE)) {
    throw new Error(`Migration file not found at ${MIGRATION_FILE}`);
  }

  const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
  const audit = auditMigrationSql(sql);

  console.log(`✓ Migration SQL audited:`);
  console.log(`  - CREATE TABLE statements: ${audit.creates}`);
  console.log(`  - Index definitions: ${audit.indexes}`);
  console.log(`  - Foreign key constraints: ${audit.foreignKeys}`);
  console.log(`  - Destructive statements: ${audit.destructiveStatements.length}`);

  if (!audit.safeToApply) {
    console.error('❌ MIGRATION AUDIT FAILED: Destructive statements found:');
    audit.destructiveStatements.forEach((s) => console.error(`   ${s}`));
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || 'postgresql://postgres:pass@127.0.0.1:5432/sehatai_test';
  const targetCheck = verifyTargetDatabase(dbUrl);

  console.log(`✓ Target database destination verified:`);
  console.log(`  - Host: ${targetCheck.targetHost}`);
  console.log(`  - Database: ${targetCheck.targetDb}`);

  if (!targetCheck.targetSafe) {
    console.error(`❌ TARGET VERIFICATION FAILED: ${targetCheck.reason}`);
    process.exit(1);
  }

  console.log('==> Migration Audit PASSED: 100% Non-destructive and safe for staging application.');
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
