// SehatAI — Phase 1: Patient profile CRUD (server-stored, mirrors localStorage HealthProfile)
// GET  /api/profile       -> { profile } (or 404 if not set)
// PUT  /api/profile       -> upsert profile fields
// DELETE /api/profile    -> clear profile (keep account)
//
// All reads/writes authorized to the session user only; audit-logged.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { sanitizeProfileServer, type ServerHealthProfile } from '@/lib/profile-server';

export const runtime = 'nodejs';

const ALLOWED_CONDITIONS = new Set([
  'diabetes',
  'hypertension',
  'asthma',
  'heart',
  'kidney',
  'epilepsy',
  'tb',
  'thalassemia',
]);

const ALLOWED_AGE_BANDS = new Set([
  'undisclosed',
  'child',
  'adolescent',
  'young-adult',
  'middle-adult',
  'elderly',
]);

const ALLOWED_SEX = new Set(['undisclosed', 'female', 'male']);

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const row = await db.patientProfile.findUnique({ where: { userId: user.id } });
  if (!row) {
    return NextResponse.json({ profile: null });
  }
  const profile = sanitizeProfileServer({
    ageBand: row.ageBand as any,
    sex: row.sex as any,
    conditions: safeParseArr(row.conditions),
    allergies: safeParseArr(row.allergies),
    medications: safeParseArr(row.medications),
    pregnant: row.pregnant,
    iceContacts: safeParseArr(row.iceContacts),
    updatedAt: row.updatedAt.getTime(),
  });
  await db.auditLog.create({
    data: { userId: user.id, action: 'profile.read' },
  });
  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const ageBand = ALLOWED_AGE_BANDS.has(body.ageBand as string) ? (body.ageBand as string) : 'undisclosed';
  const sex = ALLOWED_SEX.has(body.sex as string) ? (body.sex as string) : 'undisclosed';
  const conditions = Array.isArray(body.conditions)
    ? (body.conditions as unknown[]).filter((c) => typeof c === 'string' && ALLOWED_CONDITIONS.has(c as string))
    : [];
  const allergies = Array.isArray(body.allergies)
    ? (body.allergies as unknown[]).map((a) => String(a).trim().slice(0, 80)).filter(Boolean)
    : [];
  const medications = Array.isArray(body.medications)
    ? (body.medications as unknown[]).map((m) => String(m).trim().slice(0, 80)).filter(Boolean)
    : [];
  const pregnant = sex === 'female' ? Boolean(body.pregnant) : false;
  const iceContacts = Array.isArray(body.iceContacts)
    ? (body.iceContacts as unknown[])
        .slice(0, 3)
        .map((c) => {
          if (!c || typeof c !== 'object') return null;
          const r = c as Record<string, unknown>;
          const name = typeof r.name === 'string' ? r.name.trim().slice(0, 80) : '';
          const phone = typeof r.phone === 'string' ? r.phone.trim().slice(0, 24) : '';
          if (!name && !phone) return null;
          return { name, phone, relation: typeof r.relation === 'string' ? r.relation.trim().slice(0, 40) : undefined };
        })
        .filter(Boolean)
    : [];

  const row = await db.patientProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ageBand,
      sex,
      conditions: JSON.stringify(conditions),
      allergies: JSON.stringify(allergies),
      medications: JSON.stringify(medications),
      pregnant,
      iceContacts: JSON.stringify(iceContacts),
    },
    update: {
      ageBand,
      sex,
      conditions: JSON.stringify(conditions),
      allergies: JSON.stringify(allergies),
      medications: JSON.stringify(medications),
      pregnant,
      iceContacts: JSON.stringify(iceContacts),
    },
  });

  await db.auditLog.create({
    data: { userId: user.id, action: 'profile.update', meta: JSON.stringify({ fields: Object.keys(body) }) },
  });

  return NextResponse.json({ ok: true, updatedAt: row.updatedAt.toISOString() });
}

function safeParseArr(s: string | null | undefined): unknown[] {
  if (!s) return [];
  try {
    const p = JSON.parse(s);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

// Re-export for the profile-server module type
export type { ServerHealthProfile };
