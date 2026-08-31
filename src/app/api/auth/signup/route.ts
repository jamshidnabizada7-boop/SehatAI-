// SehatAI — Phase 0: Signup endpoint (credentials provider)
// POST /api/auth/signup { email, password, name?, consent?: boolean }
// Creates a User with bcrypt-hashed password, records Urdu consent timestamp,
// creates an empty PatientProfile, logs the signup in AuditLog.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: unknown; password?: unknown; name?: unknown; consent?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 80) : null;
  const consent = body.consent !== false; // default true unless explicitly declined

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }
  if (password.length > 200) {
    return NextResponse.json({ error: 'Password too long.' }, { status: 400 });
  }

  // Check existing
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Do not leak existence — return generic
    return NextResponse.json({ error: 'Cannot create account with these details.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: {
      email,
      name,
      passwordHash,
      consentAt: consent ? new Date() : null,
    },
  });

  // Create empty PatientProfile
  await db.patientProfile.create({ data: { userId: user.id } });

  // Audit log
  await db.auditLog.create({
    data: { userId: user.id, action: 'auth.signup', resource: 'credentials', meta: JSON.stringify({ consent }) },
  });

  return NextResponse.json({ ok: true, userId: user.id });
}
