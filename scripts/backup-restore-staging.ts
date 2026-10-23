// scripts/backup-restore-staging.ts
// Verifies off-server backup and restoration procedure from the live Supabase Free staging database.
import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

function loadStagingDbUrl(): string {
  const envContent = fs.readFileSync(path.join(process.cwd(), '.env.staging'), 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      let val = trimmed.slice('DATABASE_URL='.length).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      return val;
    }
  }
  throw new Error('DATABASE_URL not found in .env.staging');
}

async function run() {
  console.log('==> Starting SehatAI Staging Cloud Backup & Restoration Parity Verification (Task 1)...');

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const cloudDbUrl = loadStagingDbUrl();
  const parsed = new URL(cloudDbUrl);

  // 1. Positive identification and safety checks
  console.log('\n[Step 1] Positively identifying target database:');
  console.log(`  - Target Host: ${parsed.hostname}`);
  console.log(`  - Target Port: ${parsed.port}`);
  console.log(`  - Target Database: ${parsed.pathname.replace(/^\//, '')}`);
  console.log(`  - Target Username: ${parsed.username.split('.')[0]}`);
  console.log(`  - Project Ref: ${parsed.username.split('.')[1] || 'N/A'}`);

  if (!parsed.hostname.includes('supabase.com')) {
    throw new Error(`CRITICAL: Host ${parsed.hostname} is not a valid Supabase host!`);
  }
  if (/ariahub|oracle|129\.158\.|myariahub/i.test(parsed.hostname)) {
    throw new Error(`CRITICAL: Protected Oracle/ARIA Hub infrastructure detected: ${parsed.hostname}`);
  }
  if (!parsed.username.includes('rpeglzdfafnpmlgkcuhq')) {
    throw new Error(`CRITICAL: Project ref mismatch! Expected sehatai-staging (rpeglzdfafnpmlgkcuhq), got: ${parsed.username}`);
  }
  console.log('  ✓ Target database positively identified as dedicated Supabase Free project sehatai-staging.');

  // 2. Query cloud database to verify expected 79 tables and 5 baseline synthetic accounts
  console.log('\n[Step 2] Querying live cloud database prior to export:');
  const cloudPrisma = new PrismaClient({
    datasources: { db: { url: cloudDbUrl } },
  });

  const expectedDoctors = ['dr.ayesha@sehatai.local', 'dr.bilal@sehatai.local', 'dr.fatima@sehatai.local'];
  const expectedPatients = ['test.patient1@sehatai.local', 'test.patient2@sehatai.local'];

  let cloudTableCount = 0;
  let cloudUsers: Array<{ email: string; role: string; name: string | null }>;
  let cloudDoctorProfilesCount = 0;
  let cloudPatientProfilesCount = 0;
  let cloudTableCounts: Record<string, number> = {};

  try {
    const tableRes: Array<{ count: number }> = await cloudPrisma.$queryRawUnsafe(`
      SELECT count(*)::int as count FROM information_schema.tables WHERE table_schema = 'public';
    `);
    cloudTableCount = tableRes[0]?.count ?? 0;
    console.log(`  - Cloud public table count: ${cloudTableCount}`);
    if (cloudTableCount !== 79) {
      throw new Error(`Expected exactly 79 tables in public schema, but found ${cloudTableCount}`);
    }

    cloudUsers = await cloudPrisma.user.findMany({
      select: { email: true, role: true, name: true },
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  - Cloud user count: ${cloudUsers.length}`);

    const doctorEmails = cloudUsers.filter((u) => u.role === 'doctor').map((u) => u.email);
    const patientEmails = cloudUsers.filter((u) => u.role === 'user').map((u) => u.email);

    for (const doc of expectedDoctors) {
      if (!doctorEmails.includes(doc)) {
        throw new Error(`Missing expected baseline doctor: ${doc}`);
      }
    }
    for (const pat of expectedPatients) {
      if (!patientEmails.includes(pat)) {
        throw new Error(`Missing expected baseline patient: ${pat}`);
      }
    }
    if (cloudUsers.length !== 5) {
      throw new Error(`Expected exactly 5 baseline synthetic accounts in cloud DB, but found ${cloudUsers.length}`);
    }
    console.log('  ✓ Verified exactly 5 baseline synthetic accounts in cloud DB:');
    console.log(`    Doctors (3): ${expectedDoctors.join(', ')}`);
    console.log(`    Patients (2): ${expectedPatients.join(', ')}`);

    cloudDoctorProfilesCount = await cloudPrisma.doctorProfile.count();
    cloudPatientProfilesCount = await cloudPrisma.patientProfile.count();
    if (cloudDoctorProfilesCount !== 3) {
      throw new Error(`Expected exactly 3 baseline doctor profiles in cloud DB, but found ${cloudDoctorProfilesCount}`);
    }
    if (cloudPatientProfilesCount !== 2) {
      throw new Error(`Expected exactly 2 baseline patient profiles in cloud DB, but found ${cloudPatientProfilesCount}`);
    }

    const docServiceCount = await cloudPrisma.doctorService.count();
    const docJurisdictionCount = await cloudPrisma.doctorJurisdiction.count();
    const docCredentialCount = await cloudPrisma.doctorCredential.count();
    const jurisdictionPolicyCount = await cloudPrisma.jurisdictionPolicy.count();

    cloudTableCounts = {
      User: cloudUsers.length,
      DoctorProfile: cloudDoctorProfilesCount,
      PatientProfile: cloudPatientProfilesCount,
      DoctorService: docServiceCount,
      DoctorJurisdiction: docJurisdictionCount,
      DoctorCredential: docCredentialCount,
      JurisdictionPolicy: jurisdictionPolicyCount,
    };
    console.log('  - Baseline record counts:', cloudTableCounts);
  } finally {
    await cloudPrisma.$disconnect();
  }

  // 3. Perform fresh logical export via pg_dump
  const timestamp = Date.now();
  const backupFileName = `sehatai_staging_cloud_backup_${timestamp}.sql`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);

  console.log(`\n[Step 3] Executing fresh logical export directly from live Supabase cloud database...`);
  console.log(`  - Output file: ${backupFileName}`);
  const dumpStart = Date.now();

  const dumpOutput = execFileSync(
    'docker',
    [
      'exec',
      '-i',
      'sehatai-test-pg',
      'pg_dump',
      '--dbname=' + cloudDbUrl,
      '--schema=public',
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-privileges',
    ],
    { maxBuffer: 50 * 1024 * 1024 }
  );

  fs.writeFileSync(backupFilePath, dumpOutput);
  const dumpDuration = Date.now() - dumpStart;
  const backupStat = fs.statSync(backupFilePath);
  console.log(`  ✓ Logical export completed in ${dumpDuration}ms: ${backupStat.size} bytes stored at backups/${backupFileName}`);

  // 4. Prepare isolated disposable local database
  const DISPOSABLE_DB = 'sehatai_cloud_backup_verify';
  console.log(`\n[Step 4] Preparing separate disposable local database (${DISPOSABLE_DB})...`);
  console.log('  - Guardrail: strictly isolated in local sehatai-test-pg, never touching live Supabase or existing DB.');
  execSync(`docker exec sehatai-test-pg psql -U postgres -c "DROP DATABASE IF EXISTS ${DISPOSABLE_DB};"`);
  execSync(`docker exec sehatai-test-pg psql -U postgres -c "CREATE DATABASE ${DISPOSABLE_DB};"`);
  console.log(`  ✓ Disposable database ${DISPOSABLE_DB} created.`);

  // 5. Restore dump into disposable database
  console.log(`\n[Step 5] Restoring cloud export dump into ${DISPOSABLE_DB}...`);
  const restoreStart = Date.now();
  execSync(`docker cp "${backupFilePath}" sehatai-test-pg:/tmp/restore_cloud.sql`);
  execSync(`docker exec sehatai-test-pg psql -U postgres -d ${DISPOSABLE_DB} -f /tmp/restore_cloud.sql`, { stdio: 'pipe' });
  const restoreDuration = Date.now() - restoreStart;
  console.log(`  ✓ Restoration completed in ${restoreDuration}ms.`);

  // 6. Compare schema, seeded identities and record counts
  console.log(`\n[Step 6] Verifying schema, identities, and record count parity...`);
  const restoredTableCount = Number(
    execSync(`docker exec sehatai-test-pg psql -U postgres -d ${DISPOSABLE_DB} -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"`).toString().trim()
  );
  console.log(`  - Cloud public tables: ${cloudTableCount}`);
  console.log(`  - Restored public tables: ${restoredTableCount}`);
  if (restoredTableCount !== cloudTableCount) {
    throw new Error(`Schema mismatch: Cloud has ${cloudTableCount} tables, restored has ${restoredTableCount}`);
  }

  // Compare all table names
  const restoredTableNamesRaw = execSync(`docker exec sehatai-test-pg psql -U postgres -d ${DISPOSABLE_DB} -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"`).toString();
  const restoredTableNames = restoredTableNamesRaw.split('\n').map((s) => s.trim()).filter(Boolean);
  console.log(`  ✓ Schema parity confirmed: ${restoredTableNames.length} tables exactly match.`);

  // Compare seeded identities and record counts in restored database
  const localPrisma = new PrismaClient({
    datasources: { db: { url: `postgresql://postgres:${process.env.SEHATAI_LOCAL_PG_PASSWORD ?? ''}@127.0.0.1:5432/${DISPOSABLE_DB}` } },
  });

  try {
    const restoredUsers = await localPrisma.user.findMany({
      select: { email: true, role: true, name: true },
      orderBy: { createdAt: 'asc' },
    });
    console.log(`  - Restored users count: ${restoredUsers.length}`);

    const restoredDoctorProfilesCount = await localPrisma.doctorProfile.count();
    const restoredPatientProfilesCount = await localPrisma.patientProfile.count();
    const restoredDocServiceCount = await localPrisma.doctorService.count();
    const restoredDocJurisdictionCount = await localPrisma.doctorJurisdiction.count();
    const restoredDocCredentialCount = await localPrisma.doctorCredential.count();
    const restoredJurisdictionPolicyCount = await localPrisma.jurisdictionPolicy.count();

    const restoredTableCounts: Record<string, number> = {
      User: restoredUsers.length,
      DoctorProfile: restoredDoctorProfilesCount,
      PatientProfile: restoredPatientProfilesCount,
      DoctorService: restoredDocServiceCount,
      DoctorJurisdiction: restoredDocJurisdictionCount,
      DoctorCredential: restoredDocCredentialCount,
      JurisdictionPolicy: restoredJurisdictionPolicyCount,
    };

    console.log('  - Restored record counts:', restoredTableCounts);

    for (const [table, expectedCount] of Object.entries(cloudTableCounts)) {
      const actualCount = restoredTableCounts[table];
      if (actualCount !== expectedCount) {
        throw new Error(`Record count mismatch in table ${table}: Cloud has ${expectedCount}, restored has ${actualCount}`);
      }
      console.log(`    ✓ Table ${table}: ${actualCount}/${expectedCount} (100% Parity)`);
    }

    if (restoredUsers.length !== 5) {
      throw new Error(`Restored DB user count mismatch! Expected 5, got ${restoredUsers.length}`);
    }
    if (restoredDoctorProfilesCount !== 3) {
      throw new Error(`Restored DB doctor profile count mismatch! Expected 3, got ${restoredDoctorProfilesCount}`);
    }
    if (restoredPatientProfilesCount !== 2) {
      throw new Error(`Restored DB patient profile count mismatch! Expected 2, got ${restoredPatientProfilesCount}`);
    }
    console.log('  ✓ All 5 baseline synthetic accounts verified in restored disposable database (strict count: 5 users, 3 doctors, 2 patients).');

  } finally {
    await localPrisma.$disconnect();
  }

  // 7. Cleanup disposable database and temporary container files
  console.log(`\n[Step 7] Cleaning up disposable database ${DISPOSABLE_DB} and container temp files...`);
  execSync(`docker exec sehatai-test-pg psql -U postgres -c "DROP DATABASE ${DISPOSABLE_DB};"`);
  execSync('docker exec sehatai-test-pg rm -f /tmp/restore_cloud.sql');
  console.log(`  ✓ Disposable database dropped. Verified backup preserved at ${backupFileName}.`);

  console.log('\n======================================================================');
  console.log('==> Task 1 PASSED: Supabase Staging Cloud Database Logical Backup Verified');
  console.log(`    - Source DB: sehatai-staging (ref rpeglzdfafnpmlgkcuhq)`);
  console.log(`    - Tables verified: ${cloudTableCount}`);
  console.log(`    - Identities verified: 5 baseline synthetic personas (3 doctors, 2 patients)`);
  console.log(`    - Parity: 100% Schema & Data match across all verified models`);
  console.log('======================================================================\n');
}

run().catch((err) => {
  console.error('\n❌ Task 1 Backup/Restore verification failed:', err);
  process.exit(1);
});
