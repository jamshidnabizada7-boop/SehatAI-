import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';

const env = fs.readFileSync('.env.staging', 'utf8');
const match = env.match(/^DATABASE_URL_POOLED="?([^"\r\n]+)"?/m);
if (!match) throw new Error('DATABASE_URL_POOLED not found');

const url = match[1];
console.log('Testing pooled URL:', url.replace(/:[^:@]+@/, ':***@'));

const prisma = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  const start = Date.now();
  console.log('Dispatching 30 concurrent queries through Transaction Pooler (port 6543)...');
  const queries = Array.from({ length: 30 }, (_, i) =>
    prisma.facility.count()
  );
  const results = await Promise.all(queries);
  const elapsed = Date.now() - start;
  console.log(`✓ All 30 concurrent queries completed in ${elapsed}ms. Sample count: ${results[0]}`);

  // Test prepared statement / transaction with pgbouncer
  console.log('Testing interactive transaction through Transaction Pooler...');
  const txResult = await prisma.$transaction(async (tx) => {
    const docCount = await tx.document.count();
    const facCount = await tx.facility.count();
    return { docCount, facCount };
  });
  console.log('✓ Transaction succeeded:', txResult);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Pooler concurrency test failed:', err);
  process.exit(1);
});
