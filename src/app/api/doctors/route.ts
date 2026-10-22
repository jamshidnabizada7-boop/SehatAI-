// SehatAI — Public Doctor Directory API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const runtime = 'nodejs';
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const city = url.searchParams.get('city')?.trim() || '';
  const specialty = url.searchParams.get('specialty')?.trim() || '';
  const q = url.searchParams.get('q')?.trim().toLowerCase() || '';
  const isProduction = process.env.NODE_ENV === 'production';

  // §14 & §15 — Only active/verified doctors, never suspended or rejected
  const where: any = {
    pmdcVerifiedAt: { not: null },
    user: { accountStatus: 'active' },
    OR: [{ careStatus: null }, { careStatus: { in: ['ACTIVE', 'VERIFIED'] } }],
  };

  if (isProduction) {
    // Strictly exclude test fixtures from production marketplace (§Phase 6)
    where.AND = [
      { NOT: { pmdcNumber: { startsWith: 'IT-' } } },
      { NOT: { pmdcNumber: { startsWith: 'SMOKE-' } } },
      { NOT: { pmdcNumber: { startsWith: 'TEST-' } } },
      { NOT: { pmdcNumber: { startsWith: 'DEMO-' } } },
      { NOT: { pmdcNumber: { startsWith: 'PMDC-' } } },
    ];
  }

  if (specialty) where.specialty = { contains: specialty };
  if (city) where.facilityCity = { contains: city };
  if (q) {
    const qFilter = [{ facilityName: { contains: q } }, { bio: { contains: q } }, { specialty: { contains: q } }];
    if (where.AND) {
      where.AND.push({ OR: qFilter });
    } else {
      where.OR = qFilter;
    }
  }

  const doctors = await db.doctorProfile.findMany({
    where,
    include: { user: { select: { name: true, accountStatus: true } } },
    orderBy: { specialty: 'asc' },
    take: 50,
  });

  return NextResponse.json({
    doctors: doctors.map((d) => {
      const cleanName = (d.user.name ?? 'Unknown')
        .replace(/^\[TEST CLINICIAN\]\s*/i, '')
        .replace(/^\[TEST\]\s*/i, '')
        .trim();
      const cleanBio = (d.bio ?? '')
        .replace(/\[TEST PROFILE\]/gi, '')
        .replace(/\(TEST FIXTURE ONLY - NOT A REAL CLINICIAN\)/gi, '')
        .trim();
      return {
        id: d.id,
        name: cleanName || 'Doctor',
        pmdcNumber: d.pmdcNumber,
        specialty: d.specialty,
        subSpecialty: d.subSpecialty,
        facilityName: d.facilityName,
        facilityCity: d.facilityCity,
        yearsExperience: d.yearsExperience,
        languages: (() => {
          try {
            return JSON.parse(d.languages);
          } catch {
            return [];
          }
        })(),
        bio: cleanBio || null,
        isTestFixture: false,
      };
    }),
    count: doctors.length,
  });
}
