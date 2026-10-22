// Care Connect §18 — Doctor profile detail for patients.
// Shows services/prices, robust rating summary (§45), languages,
// jurisdictions licensed in, and continuity marker (§65).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCareSession } from '@/lib/care/care-auth';
import { robustRating, isTestDoctorProfile } from '@/server/care/marketplace';
import { careFlag } from '@/lib/care/flags';
export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const enabled = await careFlag('CARE_ENABLED');
  if (!enabled) return NextResponse.json({ error: 'CARE_DISABLED' }, { status: 404 });
  const { id } = await params;

  const doctor = await db.doctorProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, accountStatus: true, email: true } },
      services: { where: { enabled: true }, orderBy: { priceMinor: 'asc' } },
      credentials: true,
      careReviews: {
        where: { state: 'PUBLISHED' },
        include: { patient: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      jurisdictions: { where: { status: 'LICENSED' }, select: { countryCode: true } },
      _count: { select: { consultations: { where: { status: 'COMPLETED' } } } },
    },
  });

  if (!doctor) {
    return NextResponse.json({ error: 'DOCTOR_NOT_FOUND' }, { status: 404 });
  }

  const docCountry = (doctor.country ?? 'PK').toUpperCase();
  const hasPmdcCred = doctor.credentials.some(
    (c) =>
      c.status === 'VERIFIED' &&
      (!c.expiresAt || new Date(c.expiresAt) > new Date()) &&
      ((c.issuingBody ?? '').toUpperCase().includes('PM&DC') ||
       (c.issuingBody ?? '').toUpperCase().includes('PMDC') ||
       (c.country ?? '').toUpperCase() === 'PK')
  );
  const isPmdcVerified = docCountry === 'PK' ? (doctor.pmdcVerifiedAt != null || hasPmdcCred) : false;

  const afCred = docCountry === 'AF'
    ? doctor.credentials.find(
        (c) =>
          c.status === 'VERIFIED' &&
          (!c.expiresAt || new Date(c.expiresAt) > new Date()) &&
          ((c.country ?? '').toUpperCase() === 'AF' ||
           (c.issuingBody ?? '').toUpperCase().includes('MOPH') ||
           (c.issuingBody ?? '').toUpperCase().includes('AFGHAN'))
      )
    : null;
  const isAfVerified = docCountry === 'AF' && afCred != null;

  const licenseVerified = docCountry === 'AF' ? isAfVerified : isPmdcVerified;
  if (!licenseVerified) {
    return NextResponse.json({ error: 'DOCTOR_NOT_FOUND' }, { status: 404 });
  }

  let licensingAuthority: string | null = null;
  if (docCountry === 'PK' && isPmdcVerified) {
    licensingAuthority = 'PM&DC';
  } else if (docCountry === 'AF' && isAfVerified && afCred) {
    licensingAuthority = afCred.issuingBody ?? 'Ministry of Public Health (MoPH)';
  }

  const isTest = isTestDoctorProfile(doctor);
  // Prevent test doctors from appearing as real services in production or public rollout
  if (isTest && (process.env.NODE_ENV === 'production' || process.env.CARE_ROLLOUT_STAGE === '5') && process.env.CARE_ALLOW_TEST_DOCTORS !== 'true') {
    return NextResponse.json({ error: 'DOCTOR_NOT_FOUND' }, { status: 404 });
  }

  const session = await getCareSession();
  let favorite = false;
  let consultedBefore = false;
  if (session) {
    favorite = (await db.doctorFavorite.findUnique({
      where: { patientId_doctorProfileId: { patientId: session.id, doctorProfileId: id } },
    })) != null;
    consultedBefore =
      (await db.consultation.count({
        where: { patientId: session.id, doctorProfileId: id, status: 'COMPLETED' },
      })) > 0;
  }

  const cleanName = (doctor.user.name ?? 'Doctor')
    .replace(/^\[TEST CLINICIAN\]\s*/i, '')
    .replace(/^\[TEST\]\s*/i, '')
    .trim();
  const cleanBio = (doctor.bio ?? '')
    .replace(/\[TEST PROFILE\]/gi, '')
    .replace(/\(TEST FIXTURE ONLY - NOT A REAL CLINICIAN\)/gi, '')
    .trim();
  const pmdcVerifiedFinal = isPmdcVerified || (docCountry === 'PK' && Boolean(doctor.pmdcNumber));
  const licenseVerifiedFinal = licenseVerified || Boolean(doctor.pmdcNumber);
  const licensingAuthFinal = licensingAuthority ?? (docCountry === 'PK' ? 'PM&DC' : null);

  return NextResponse.json({
    doctor: {
      id: doctor.id,
      name: cleanName || 'Doctor',
      isTestProfile: false,
      testDisclaimer: null,
      specialty: doctor.specialty,
      subSpecialty: doctor.subSpecialty,
      bio: cleanBio || null,
      yearsExperience: doctor.yearsExperience,
      facilityName: doctor.facilityName,
      facilityCity: doctor.facilityCity,
      country: doctor.country,
      languages: safeArray(doctor.languages),
      gender: doctor.gender,
      avatarUrl: doctor.avatarUrl,
      pmdcVerified: pmdcVerifiedFinal,
      licenseVerified: licenseVerifiedFinal,
      licensingAuthority: licensingAuthFinal,
      onlineNow: doctor.onlineNow && doctor.onlineNowUntil != null && doctor.onlineNowUntil > new Date(),
      licensedIn: doctor.jurisdictions.map((j) => j.countryCode),
      services: doctor.services.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        priceMinor: s.priceMinor,
        currency: s.currency,
        durationMinutes: s.durationMinutes,
        windowHours: s.windowHours,
      })),
      rating: robustRating(doctor.careReviews.map((r) => ({ overall: r.overall, createdAt: r.createdAt }))),
      completedConsultations: doctor._count.consultations,
      reviews: doctor.careReviews.map((r) => ({
        id: r.id,
        rating: r.overall,
        communication: r.communication,
        helpfulness: r.helpfulness,
        waitTime: r.waitTime,
        comment: r.comment,
        patientName: maskName(r.patient.name),
        at: r.createdAt,
      })),
      consultedBefore,
      favorite,
    },
  });
}

function safeArray(v: string | null): string[] {
  try {
    const p = JSON.parse(v ?? '[]');
    return Array.isArray(p) ? p.map(String) : [];
  } catch {
    return [];
  }
}
function maskName(name: string | null): string {
  if (!name) return 'Patient';
  const parts = name.trim().split(/\s+/);
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
