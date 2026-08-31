import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const doctors = await db.doctorProfile.findMany({
    include: { user: { select: { email: true, name: true, role: true, accountStatus: true } } },
  });
  console.log(JSON.stringify(doctors, null, 2));
}
main().catch(console.error).finally(() => db.$disconnect());
