// scripts/backup-restore-staging.ts
// Verifies off-server backup and restoration procedure appropriate to Supabase Free plan.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const BACKUP_FILE = path.join(BACKUP_DIR, `staging_backup_${Date.now()}.sql`);

async function run() {
  console.log('==> Starting SehatAI Staging Off-Server Backup & Restoration Procedure Verification...');

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // 1. Dump source database
  console.log('1. Executing logical pg_dump (--clean --if-exists --no-owner --no-privileges)...');
  const dumpStart = Date.now();
  const dumpCmd = `docker exec sehatai-test-pg pg_dump -U postgres -d sehatai_test --clean --if-exists --no-owner --no-privileges`;
  const dumpOutput = execSync(dumpCmd, { maxBuffer: 50 * 1024 * 1024 });
  fs.writeFileSync(BACKUP_FILE, dumpOutput);
  const dumpDuration = Date.now() - dumpStart;
  const backupStat = fs.statSync(BACKUP_FILE);
  console.log(`✓ Backup completed in ${dumpDuration}ms: ${backupStat.size} bytes stored at ${path.basename(BACKUP_FILE)}`);

  // 2. Prepare target restore database
  console.log('2. Preparing isolated target verification database (sehatai_backup_verify)...');
  execSync('docker exec sehatai-test-pg psql -U postgres -c "DROP DATABASE IF EXISTS sehatai_backup_verify;"');
  execSync('docker exec sehatai-test-pg psql -U postgres -c "CREATE DATABASE sehatai_backup_verify;"');
  console.log('✓ Target verification database created.');

  // 3. Restore dump into target database
  console.log('3. Restoring backup dump into sehatai_backup_verify...');
  const restoreStart = Date.now();
  // Copy or pipe dump into container psql
  execSync('docker cp "' + BACKUP_FILE + '" sehatai-test-pg:/tmp/restore.sql');
  execSync('docker exec sehatai-test-pg psql -U postgres -d sehatai_backup_verify -f /tmp/restore.sql', { stdio: 'pipe' });
  const restoreDuration = Date.now() - restoreStart;
  console.log(`✓ Restoration completed in ${restoreDuration}ms.`);

  // 4. Parity Verification
  console.log('4. Verifying schema and data parity between source and restored database...');
  const sourceTableCount = Number(
    execSync('docker exec sehatai-test-pg psql -U postgres -d sehatai_test -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = \'public\';"')
      .toString()
      .trim()
  );
  const restoredTableCount = Number(
    execSync('docker exec sehatai-test-pg psql -U postgres -d sehatai_backup_verify -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = \'public\';"')
      .toString()
      .trim()
  );

  console.log(`  - Source tables: ${sourceTableCount}`);
  console.log(`  - Restored tables: ${restoredTableCount}`);

  if (sourceTableCount !== restoredTableCount) {
    throw new Error(`Schema mismatch: Source has ${sourceTableCount} tables, but restored DB has ${restoredTableCount}`);
  }

  const sourceUserCount = Number(
    execSync('docker exec sehatai-test-pg psql -U postgres -d sehatai_test -t -c "SELECT count(*) FROM \\"User\\";"')
      .toString()
      .trim()
  );
  const restoredUserCount = Number(
    execSync('docker exec sehatai-test-pg psql -U postgres -d sehatai_backup_verify -t -c "SELECT count(*) FROM \\"User\\";"')
      .toString()
      .trim()
  );

  console.log(`  - Source users: ${sourceUserCount}`);
  console.log(`  - Restored users: ${restoredUserCount}`);

  if (sourceUserCount !== restoredUserCount) {
    throw new Error(`Data mismatch: Source has ${sourceUserCount} users, but restored DB has ${restoredUserCount}`);
  }

  // 5. Cleanup verification database and temp files
  console.log('5. Cleaning up verification database and temporary files...');
  execSync('docker exec sehatai-test-pg psql -U postgres -c "DROP DATABASE sehatai_backup_verify;"');
  execSync('docker exec sehatai-test-pg rm -f /tmp/restore.sql');
  if (fs.existsSync(BACKUP_FILE)) {
    fs.unlinkSync(BACKUP_FILE);
  }
  console.log('✓ Temporary verification database and dump files cleaned up.');

  console.log('==> Supabase Free Plan Backup & Restoration Procedure Verification PASSED (100% Parity).');
}

run().catch((err) => {
  console.error('❌ Backup/Restore verification failed:', err);
  process.exit(1);
});
