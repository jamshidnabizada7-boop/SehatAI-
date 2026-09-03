// SehatAI — Public Doctor Directory API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const runtime = 'nodejs';
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const city = url.searchParams.get('city')?.trim() || '';
  const specialty = url.searchParams.get('specialty')?.trim() || '';
  const q = url.searchParams.get('q')?.trim().toLowerCase() || '';
  const where: any = { pmdcVerifiedAt: { not: null }, user: { accountStatus: 'active' } };
  if (specialty) where.specialty = { contains: specialty };
  if (city) where.facilityCity = { contains: city };
  if (q) where.OR = [{ facilityName: { contains: q } }, { bio: { contains: q } }, { specialty: { contains: q } }];
  const doctors = await db.doctorProfile.findMany({ where, include: { user: { select: { name: true, accountStatus: true } } }, orderBy: { specialty: 'asc' }, take: 50 });
  return NextResponse.json({ doctors: doctors.map(d => ({ id: d.id, name: d.user.name ?? 'Unknown', pmdcNumber: d.pmdcNumber, specialty: d.specialty, subSpecialty: d.subSpecialty, facilityName: d.facilityName, facilityCity: d.facilityCity, yearsExperience: d.yearsExperience, languages: (() => { try { return JSON.parse(d.languages); } catch { return []; } })(), bio: d.bio })), count: doctors.length });
}
