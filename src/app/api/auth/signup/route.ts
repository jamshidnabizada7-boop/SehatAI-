// SehatAI — Phase 0: Signup endpoint (credentials provider)
// POST /api/auth/signup { email, password, name?, consent?, intendedRole?, doctor? }
// - intendedRole === 'user' (default): creates a regular patient account.
// - intendedRole === 'doctor': creates a User with role=doctor, accountStatus=pending_verification,
//   plus a DoctorProfile row + audit event. The doctor cannot sign in to the doctor portal
//   until an admin verifies their PMDC number.
// The role is decided by the SERVER based on the route the client used + the intendedRole hint —
// never trust a client-supplied role field directly.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// PMDC registration numbers — typical formats: PMC-12345, SMC-1234, PMC-123456
const PMDC_RE = /^[A-Z]{2,4}-\d{4,6}$/;

const ALLOWED_SPECIALTIES = [
  'Family Medicine', 'Internal Medicine', 'Cardiology', 'Pediatrics', 'Obstetrics & Gynecology',
  'Dermatology', 'Psychiatry', 'Orthopedics', 'ENT', 'Ophthalmology', 'General Surgery',
  'Pulmonology', 'Gastroenterology', 'Neurology', 'Urology', 'Nephrology', 'Endocrinology',
  'Oncology', 'Emergency Medicine', 'Anesthesiology', 'Radiology', 'Pathology',
];

// In-memory per-IP rate limit (Phase F hardening). 5 doctor signups/hour/IP.
const doctorSignupCounts = new Map<string, { count: number; resetAt: number }>();
const DOCTOR_SIGNUP_LIMIT = 5;
const DOCTOR_SIGNUP_WINDOW_MS = 60 * 60 * 1000;

function rateLimitOk(ip: string): boolean {
  const now = Date.now();
  const entry = doctorSignupCounts.get(ip);
  if (!entry || entry.resetAt < now) {
    doctorSignupCounts.set(ip, { count: 1, resetAt: now + DOCTOR_SIGNUP_WINDOW_MS });
    return true;
  }
  if (entry.count >= DOCTOR_SIGNUP_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  let body: {
    email?: unknown;
    password?: unknown;
    name?: unknown;
    consent?: unknown;
    intendedRole?: unknown;
    doctor?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 80) : null;
  const consent = body.consent !== false;
  const intendedRole = body.intendedRole === 'doctor' ? 'doctor' : 'user';
  const doctor = intendedRole === 'doctor' && typeof body.doctor === 'object' && body.doctor ? body.doctor as Record<string, unknown> : null;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }
  if (password.length > 200) {
    return NextResponse.json({ error: 'Password too long.' }, { status: 400 });
  }

  // Doctor signup validation
  if (intendedRole === 'doctor') {
    // rate limit
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (!rateLimitOk(ip)) {
      return NextResponse.json({ error: 'Too many doctor signups from this IP. Try again later.' }, { status: 429 });
    }
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile fields required.' }, { status: 400 });
    }
    const pmdcNumber = typeof doctor.pmdcNumber === 'string' ? doctor.pmdcNumber.trim().toUpperCase() : '';
    if (!PMDC_RE.test(pmdcNumber)) {
      return NextResponse.json({ error: 'Invalid PMDC number. Expected format: PMC-12345' }, { status: 400 });
    }
    const specialty = typeof doctor.specialty === 'string' ? doctor.specialty.trim() : '';
    if (!ALLOWED_SPECIALTIES.includes(specialty)) {
      return NextResponse.json({ error: 'Invalid specialty.' }, { status: 400 });
    }
    // check PMDC uniqueness
    const existingPmdc = await db.doctorProfile.findUnique({ where: { pmdcNumber } });
    if (existingPmdc) {
      return NextResponse.json({ error: 'A doctor with this PMDC number is already registered.' }, { status: 409 });
    }
  }

  // Check existing user
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Do not leak existence — return generic
    return NextResponse.json({ error: 'Cannot create account with these details.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  if (intendedRole === 'doctor') {
    const doctorData = doctor as Record<string, unknown>;
    const pmdcNumber = String(doctorData.pmdcNumber).trim().toUpperCase();
    const specialty = String(doctorData.specialty).trim();
    const subSpecialty = typeof doctorData.subSpecialty === 'string' && doctorData.subSpecialty.trim() ? doctorData.subSpecialty.trim().slice(0, 80) : null;
    const facilityName = typeof doctorData.facilityName === 'string' && doctorData.facilityName.trim() ? doctorData.facilityName.trim().slice(0, 120) : null;
    const facilityCity = typeof doctorData.facilityCity === 'string' && doctorData.facilityCity.trim() ? doctorData.facilityCity.trim().slice(0, 80) : null;
    const yearsExperienceRaw = typeof doctorData.yearsExperience === 'number' ? doctorData.yearsExperience : Number(doctorData.yearsExperience);
    const yearsExperience = Number.isFinite(yearsExperienceRaw) && yearsExperienceRaw >= 0 && yearsExperienceRaw <= 70 ? Math.floor(yearsExperienceRaw) : null;
    const languagesArr = Array.isArray(doctorData.languages) ? doctorData.languages.filter((x): x is string => typeof x === 'string') : [];
    const bio = typeof doctorData.bio === 'string' && doctorData.bio.trim() ? doctorData.bio.trim().slice(0, 500) : null;

    // Create the user with role=doctor, accountStatus=pending_verification
    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
        consentAt: consent ? new Date() : null,
        role: 'doctor',
        accountStatus: 'pending_verification',
        doctorProfile: {
          create: {
            pmdcNumber,
            specialty,
            subSpecialty,
            facilityName,
            facilityCity,
            yearsExperience,
            languages: JSON.stringify(languagesArr),
            bio,
          },
        },
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'doctor.signup',
        resource: 'credentials',
        meta: JSON.stringify({ pmdcNumber, specialty, facilityCity }),
      },
    });

    return NextResponse.json({ ok: true, userId: user.id, role: 'doctor', accountStatus: 'pending_verification' });
  }

  // Patient signup path (existing behavior)
  const user = await db.user.create({
    data: {
      email,
      name,
      passwordHash,
      consentAt: consent ? new Date() : null,
      role: 'user',
      accountStatus: 'active',
    },
  });

  // Create empty PatientProfile
  await db.patientProfile.create({ data: { userId: user.id } });

  // Audit log
  await db.auditLog.create({
    data: { userId: user.id, action: 'auth.signup', resource: 'credentials', meta: JSON.stringify({ consent, role: 'user' }) },
  });

  return NextResponse.json({ ok: true, userId: user.id, role: 'user', accountStatus: 'active' });
}
