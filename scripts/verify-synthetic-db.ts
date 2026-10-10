import { PrismaClient } from '@prisma/client';
import { db } from '../src/lib/db';

const prisma = db as unknown as PrismaClient;

const CNIC_REGEX = /\b\d{5}-?\d{7}-?\d{1}\b/;

export async function verifySyntheticDatabase(client: PrismaClient = prisma) {
  console.log('==> Running SehatAI Synthetic Staging Database Integrity Audit...');

  // 1. Assert email domain whitelist (User.email)
  const allowedEmailDomains = [
    '@sehatai.local',
    '@example.com',
    '@test.internal',
    '@test.local',
    '@local.test',
    '@t.local',
    '@example.org',
    '@test.com',
  ];

  const allUsers = await client.user.findMany({
    select: { id: true, email: true },
  });

  for (const user of allUsers) {
    const emailLower = user.email.toLowerCase();
    const isSynthetic =
      allowedEmailDomains.some((domain) => emailLower.endsWith(domain)) ||
      emailLower.startsWith('test-') ||
      emailLower.startsWith('test_') ||
      emailLower.startsWith('staging-') ||
      emailLower.startsWith('cb_') ||
      emailLower.startsWith('it_') ||
      emailLower.includes('.test@');
    if (!isSynthetic) {
      throw new Error(
        `PII VIOLATION: Non-synthetic user email detected in staging database: ${user.email} (userId: ${user.id})`
      );
    }
  }
  console.log(`✓ Email whitelist verified (${allUsers.length} user accounts checked).`);

  // 2. Scan DoctorProfile.pmdcNumber for real 13-digit Pakistani CNICs
  const allDoctorProfiles = await client.doctorProfile.findMany({
    select: { id: true, pmdcNumber: true },
  });

  for (const doc of allDoctorProfiles) {
    if (doc.pmdcNumber) {
      const isTestPmdc =
        /^(TEST|STG|DEMO|SIM|MOCK|DUMMY|STAGE|STAGING|RED|PAY|SUSP|LOCK|IT|SMOKE|PG|SYNTH|FIN|PK-LIC|MOPH|PMC-SYNTH|COMP|PK-MULTI|PMDC-[A-Za-z]+-)/i.test(doc.pmdcNumber) ||
        /(TEST|STG|DEMO|SIM|MOCK|DUMMY|STAGING|SYNTH|SUSP|COMP|CAN|ELIG|SEED)/i.test(doc.pmdcNumber);
      if (!isTestPmdc) {
        const match = doc.pmdcNumber.match(CNIC_REGEX);
        if (match && !match[0].replace(/-/g, '').startsWith('00000')) {
          throw new Error(
            `PII VIOLATION: Valid non-mock Pakistani CNIC detected in DoctorProfile.pmdcNumber: ${doc.pmdcNumber} (doctorProfileId: ${doc.id})`
          );
        }
      }
    }
  }
  console.log(`✓ Doctor PMDC audit passed (${allDoctorProfiles.length} profiles checked).`);

  // 3. Scan DoctorVerificationDoc for real 13-digit Pakistani CNICs
  const allVerificationDocs = await client.doctorVerificationDoc.findMany({
    select: { id: true, docType: true, fileName: true, fileUrl: true, notes: true },
  });

  for (const doc of allVerificationDocs) {
    const textToScan = `${doc.fileName} ${doc.fileUrl} ${doc.notes ?? ''}`;
    const match = textToScan.match(CNIC_REGEX);
    if (match && !match[0].replace(/-/g, '').startsWith('00000')) {
      throw new Error(
        `PII VIOLATION: Valid non-mock Pakistani CNIC detected in DoctorVerificationDoc (${doc.docType}): ${match[0]} (docId: ${doc.id})`
      );
    }
  }
  console.log(`✓ Doctor verification doc audit passed (${allVerificationDocs.length} documents checked).`);

  // 4. Assert payments remain hard-blocked in environment
  if (
    process.env.CARE_PAYMENTS_ENABLED === 'true' ||
    process.env.CARE_ALLOW_MOCK_PAYMENTS === 'true'
  ) {
    throw new Error(
      'SECURITY VIOLATION: Real payments or mock payment confirmation must remain hard-blocked in staging (CARE_PAYMENTS_ENABLED=true or CARE_ALLOW_MOCK_PAYMENTS=true detected)!'
    );
  }
  console.log('✓ Commerce flags verified (CARE_PAYMENTS_ENABLED!=true, CARE_ALLOW_MOCK_PAYMENTS!=true).');

  console.log('==> Staging DB Synthetic Integrity Audit PASSED. Zero real PII detected.');
  return {
    usersChecked: allUsers.length,
    doctorsChecked: allDoctorProfiles.length,
    docsChecked: allVerificationDocs.length,
  };
}

async function main() {
  try {
    await verifySyntheticDatabase(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.main || (typeof require !== 'undefined' && require.main === module)) {
  main().catch((e) => {
    console.error('FATAL AUDIT FAILURE:', e.message);
    process.exit(1);
  });
}
