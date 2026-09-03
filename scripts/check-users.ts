import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const u = await db.user.findUnique({ where: { email: 'dr.ayesha@example.com' } });
  console.log('dr.ayesha:', u);
  const all = await db.user.findMany({ select: { id: true, email: true, name: true, role: true, accountStatus: true } });
  console.log('All users:');
  console.table(all);
}
main().catch(console.error).finally(() => db.$disconnect());
