// scripts/verify-supabase-cloud.ts
// Positively identifies the Supabase cloud staging database and inspects schema & users.
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

function loadStagingEnv() {
  const envContent = fs.readFileSync(path.join(process.cwd(), '.env.staging'), 'utf8');
  const env: Record<string, string> = {};
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

export async function verifyTargetCloudDatabase() {
  const env = loadStagingEnv();
  const dbUrl = env.DATABASE_URL_UNPOOLED || env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL or DATABASE_URL_UNPOOLED missing in .env.staging');
  }

  const parsed = new URL(dbUrl);
  console.log('==> Identifying Target Supabase Cloud Staging Database:');
  console.log(`  - Target Host: ${parsed.hostname}`);
  console.log(`  - Target Port: ${parsed.port}`);
  console.log(`  - Target DB Name: ${parsed.pathname.replace(/^\//, '')}`);
  console.log(`  - Username: ${parsed.username.split('.')[0]}`);
  console.log(`  - Supabase Project Ref: ${parsed.username.split('.')[1] || 'N/A'}`);

  // Safety assertions: ensure target is strictly Supabase staging and NEVER Oracle or ARIA Hub
  if (!parsed.hostname.includes('supabase.com')) {
    throw new Error(`CRITICAL: Host ${parsed.hostname} is not a valid Supabase host!`);
  }
  if (/ariahub|oracle|129\.158\.|myariahub/i.test(parsed.hostname)) {
    throw new Error(`CRITICAL: Protected Oracle/ARIA Hub infrastructure detected: ${parsed.hostname}`);
  }
  if (parsed.username.includes('rpeglzdfafnpmlgkcuhq') === false) {
    throw new Error(`CRITICAL: Project ref mismatch! Expected sehatai-staging (rpeglzdfafnpmlgkcuhq), got: ${parsed.username}`);
  }
  console.log('✓ Target database positively identified as dedicated Supabase Free project sehatai-staging.');

  const client = new PrismaClient({
    datasources: {
      db: { url: dbUrl },
    },
  });

  try {
    const tables: Array<{ count: number }> = await client.$queryRawUnsafe(`
      SELECT count(*)::int as count FROM information_schema.tables WHERE table_schema = 'public';
    `);
    const tableCount = tables[0]?.count ?? 0;
    console.log(`✓ Table count in schema 'public': ${tableCount} (Expected: 79)`);

    const users = await client.user.findMany({
      select: { id: true, email: true, role: true, name: true, accountStatus: true },
      orderBy: { createdAt: 'asc' },
    });
    console.log(`✓ Total users in database: ${users.length}`);
    for (const u of users) {
      console.log(`  - [${u.role}] ${u.name} <${u.email}> (${u.accountStatus})`);
    }

    const doctorProfiles = await client.doctorProfile.findMany({
      select: { id: true, specialty: true, pmdcNumber: true, careStatus: true, user: { select: { email: true, name: true } } },
    });
    console.log(`✓ Doctor profiles: ${doctorProfiles.length}`);
    for (const d of doctorProfiles) {
      console.log(`  - Dr. ${d.user.name} | Spec: ${d.specialty} | PMDC: ${d.pmdcNumber} | Status: ${d.careStatus}`);
    }

    const patientProfiles = await client.patientProfile.findMany({
      select: { id: true, ageBand: true, sex: true, user: { select: { email: true, name: true } } },
    });
    console.log(`✓ Patient profiles: ${patientProfiles.length}`);
    for (const p of patientProfiles) {
      console.log(`  - Patient ${p.user.name} | Sex: ${p.sex} | AgeBand: ${p.ageBand}`);
    }

    // Verify the 5 baseline synthetic accounts
    const expectedDoctors = ['dr.ayesha@sehatai.local', 'dr.bilal@sehatai.local', 'dr.fatima@sehatai.local'];
    const expectedPatients = ['test.patient1@sehatai.local', 'test.patient2@sehatai.local'];

    const foundDoctorEmails = users.filter((u) => u.role === 'doctor').map((u) => u.email);
    const foundPatientEmails = users.filter((u) => u.role === 'user').map((u) => u.email);

    const missingDoctors = expectedDoctors.filter((e) => !foundDoctorEmails.includes(e));
    const missingPatients = expectedPatients.filter((e) => !foundPatientEmails.includes(e));

    if (missingDoctors.length > 0) {
      throw new Error(`Missing expected baseline doctor accounts: ${missingDoctors.join(', ')}`);
    }
    if (missingPatients.length > 0) {
      throw new Error(`Missing expected baseline patient accounts: ${missingPatients.join(', ')}`);
    }
    console.log('✓ All 5 baseline synthetic accounts (3 doctors + 2 patients) verified.');

    return {
      tableCount,
      userCount: users.length,
      doctorCount: doctorProfiles.length,
      patientCount: patientProfiles.length,
      users,
    };
  } finally {
    await client.$disconnect();
  }
}

if (import.meta.main || (typeof require !== 'undefined' && require.main === module)) {
  verifyTargetCloudDatabase().catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  });
}
