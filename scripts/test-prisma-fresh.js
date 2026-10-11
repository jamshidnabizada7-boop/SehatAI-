const fs = require('fs');
const path = require('path');

console.log('=== PRISMA ARM64 VERIFICATION IN FRESH EXTRACTION ===');
console.log('Node:', process.version, 'Platform:', process.platform, 'Arch:', process.arch);

const pStandard = '/tmp/fresh-prisma-test/node_modules/@prisma/client';
const pHashed = '/tmp/fresh-prisma-test/node_modules/@prisma/client-2c3a283f134fdcb6';

const lstat1 = fs.lstatSync(pStandard);
const lstat2 = fs.lstatSync(pHashed);

console.log('@prisma/client: isDir =', lstat1.isDirectory(), 'isSymlink =', lstat1.isSymbolicLink());
console.log('@prisma/client-2c3a283f134fdcb6: isDir =', lstat2.isDirectory(), 'isSymlink =', lstat2.isSymbolicLink());

if (lstat1.isSymbolicLink() || lstat2.isSymbolicLink()) {
  console.error('FAILURE: Manual symlinks detected!');
  process.exit(1);
}

// 1. Explicitly test the failure case when hashed client is missing
console.log('\n--- Demonstrating failure case for missing hash-suffixed client ---');
try {
  require('/tmp/fresh-prisma-test/node_modules/@prisma/client-missing-hash');
  console.error('Expected failure but module loaded!');
  process.exit(1);
} catch (err) {
  console.log('CONFIRMED EXPECTED FAILURE:', err.code, '-', err.message.split('\n')[0]);
}

// 2. Test requiring both modules natively
console.log('\n--- Loading @prisma/client directly ---');
const { PrismaClient: PrismaClient1 } = require(pStandard);
console.log('PrismaClient from @prisma/client loaded successfully.');

console.log('\n--- Loading @prisma/client-2c3a283f134fdcb6 directly ---');
const { PrismaClient: PrismaClient2 } = require(pHashed);
console.log('PrismaClient from @prisma/client-2c3a283f134fdcb6 loaded successfully.');

// 3. Load staging env to get DATABASE_URL (without printing it)
const envText = fs.readFileSync('/etc/sehatai/staging.env', 'utf8');
let dbUrl = '';
for (const line of envText.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.split('=').slice(1).join('=').replace(/["']/g, '').trim();
  }
}

if (!dbUrl) {
  console.error('DATABASE_URL not found in /etc/sehatai/staging.env');
  process.exit(1);
}

process.env.DATABASE_URL = dbUrl;

async function runReadOnlyQuery() {
  console.log('\n--- Executing read-only database query via PrismaClient ---');
  const prisma = new PrismaClient2({
    datasources: { db: { url: dbUrl } }
  });

  try {
    const userCount = await prisma.user.count();
    console.log('Query succeeded! User count:', userCount);

    const doctors = await prisma.doctorProfile.findMany({
      select: {
        id: true,
        user: { select: { name: true } },
        specialty: true,
        careStatus: true,
      },
      take: 5
    });
    console.log('Query succeeded! Found', doctors.length, 'doctors.');
    for (const d of doctors) {
      console.log(' - Doctor:', d.fullName, '|', d.specialty, '|', d.verificationStatus);
    }
    
    // Also test raw query
    const res = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('Raw query SELECT 1 result:', res);

    await prisma.$disconnect();
    console.log('\n>>> PRISMA VERIFICATION SUCCESSFUL <<<');
  } catch (err) {
    console.error('Database query failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runReadOnlyQuery();
