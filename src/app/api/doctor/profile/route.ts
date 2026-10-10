// SehatAI — Doctor Profile Endpoint (§Check 2)
// GET /api/doctor/profile -> current doctor's profile (Doctor-only RBAC)
// Positive test: Doctor role -> HTTP 200 OK
// Negative test: Patient role -> HTTP 403 FORBIDDEN
// Negative test: Unauthenticated -> HTTP 401 UNAUTHORIZED
import { NextResponse } from 'next/server';
import { db, isDatabaseDisconnectionError, databaseUnavailableResponse } from '@/lib/db';
import { requireDoctor } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  let user;
  try {
    user = await requireDoctor();
  } catch (e: any) {
    if (isDatabaseDisconnectionError(e) || e?.status === 503) {
      return databaseUnavailableResponse();
    }
    return NextResponse.json(
      { error: e.message || 'Forbidden — doctor role required' },
      { status: e.status ?? 403 }
    );
  }

  try {
    const profile = await db.doctorProfile.findUnique({
      where: { userId: user.id },
      include: { credentials: true },
    });
    if (!profile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      profile: {
        id: profile.id,
        pmdcNumber: profile.pmdcNumber,
        specialty: profile.specialty,
        subSpecialty: profile.subSpecialty,
        facilityCity: profile.facilityCity,
        yearsExperience: profile.yearsExperience,
        careStatus: profile.careStatus,
        pmdcVerifiedAt: profile.pmdcVerifiedAt,
      },
    });
  } catch (err: any) {
    if (isDatabaseDisconnectionError(err) || err?.status === 503) {
      return databaseUnavailableResponse();
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
