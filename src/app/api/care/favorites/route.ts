// Care Connect §66 — Favorite doctors ("My Doctors": book again,
// message via new paid consultation, view previous consultations).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCareSession, CareAuthzError } from '@/lib/care/care-auth';
import { careFlag } from '@/lib/care/flags';
export const runtime = 'nodejs';

function err(e: unknown) {
  if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : 'ERROR' }, { status: 500 });
}

export async function GET() {
  try {
    if (!(await careFlag('CARE_FAVORITES_ENABLED'))) return NextResponse.json({ doctors: [] });
    const session = await requireCareSession();
    const favorites = await db.doctorFavorite.findMany({
      where: { patientId: session.id },
      include: {
        doctorProfile: {
          include: {
            user: { select: { name: true } },
            services: { where: { enabled: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({
      doctors: favorites.map((f) => ({
        doctorProfileId: f.doctorProfileId,
        name: f.doctorProfile.user.name,
        specialty: f.doctorProfile.specialty,
        facilityCity: f.doctorProfile.facilityCity,
        avatarUrl: f.doctorProfile.avatarUrl,
        services: f.doctorProfile.services.map((s) => ({ type: s.type, priceMinor: s.priceMinor, currency: s.currency })),
        savedAt: f.createdAt,
      })),
    });
  } catch (e) {
    return err(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await careFlag('CARE_FAVORITES_ENABLED'))) return NextResponse.json({ error: 'CARE_DISABLED' }, { status: 404 });
    const session = await requireCareSession();
    const { doctorProfileId } = await req.json();
    const doctor = await db.doctorProfile.findUnique({ where: { id: String(doctorProfileId ?? '') }, select: { id: true } });
    if (!doctor) return NextResponse.json({ error: 'DOCTOR_NOT_FOUND' }, { status: 404 });
    await db.doctorFavorite.upsert({
      where: { patientId_doctorProfileId: { patientId: session.id, doctorProfileId: doctor.id } },
      create: { patientId: session.id, doctorProfileId: doctor.id },
      update: {},
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return err(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireCareSession();
    const doctorProfileId = new URL(req.url).searchParams.get('doctorProfileId') ?? '';
    await db.doctorFavorite.deleteMany({ where: { patientId: session.id, doctorProfileId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return err(e);
  }
}
