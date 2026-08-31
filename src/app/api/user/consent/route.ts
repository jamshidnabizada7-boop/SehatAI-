// SehatAI — Phase 0: Urdu consent recording
// POST /api/user/consent { consent: boolean, retentionDays?: number }
// Records the Urdu consent timestamp on the User row. Required before first
// chat message is processed for an authenticated user (enforced client-side
// in onboarding; server-side guard can be added to /api/chat).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

const ALLOWED_RETENTION = new Set([30, 90, 365, 1825, 0]); // 0 = indefinite

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: { consent?: unknown; retentionDays?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const consent = body.consent !== false;
  const retentionDays =
    typeof body.retentionDays === 'number' && ALLOWED_RETENTION.has(body.retentionDays)
      ? body.retentionDays === 0
        ? null
        : body.retentionDays
      : undefined;

  await db.user.update({
    where: { id: user.id },
    data: {
      consentAt: consent ? new Date() : null,
      ...(retentionDays !== undefined ? { retentionDays } : {}),
    },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'consent.record',
      meta: JSON.stringify({ consent, retentionDays }),
    },
  });

  return NextResponse.json({ ok: true, consented: consent });
}
