import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  // Make the test-patient user an admin so we can test the doctor-verifications flow
  const u = await db.user.update({
    where: { email: 'test-patient@example.com' },
    data: { role: 'admin', accountStatus: 'active' },
  });
  console.log('Promoted:', u.email, '->', u.role);
}
main().catch(console.error).finally(() => db.$disconnect());
