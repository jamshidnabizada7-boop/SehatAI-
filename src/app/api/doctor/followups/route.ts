// SehatAI — Doctor Portal: schedule follow-up for a patient
// POST /api/doctor/followups { patientId, conversationId?, scheduledFor (ISO), notes?, scope? }
// Requires existing patient-granted follow_up consent before creating an OutcomeEntry.
// GET  /api/doctor/followups → returns the doctor's pending follow-ups (consented patients).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireActiveDoctor } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  let user;
  try { user = await requireActiveDoctor(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: (e as { status?: number }).status ?? 401 });
  }
  const profile = await db.doctorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

  // Find all patients who have granted this doctor follow_up consent
  const consents = await db.patientConsentForDoctor.findMany({
    where: { doctorId: profile.id, scope: 'follow_up', revokedAt: null },
  });
  const patientIds = consents.map((c) => c.patientId);
  const outcomes = await db.outcomeEntry.findMany({
    where: { userId: { in: patientIds }, status: 'pending' },
    orderBy: { scheduledFor: 'asc' },
    take: 50,
  });
  const users = await db.user.findMany({
    where: { id: { in: outcomes.map((o) => o.userId) } },
    select: { id: true, name: true, email: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  return NextResponse.json({
    followups: outcomes.map((o) => ({
      id: o.id,
      patientId: o.userId,
      patientName: userMap.get(o.userId)?.name ?? 'Unknown',
      scheduledFor: o.scheduledFor.toISOString(),
      notes: o.notes,
      conversationId: o.conversationId,
      createdAt: o.createdAt.toISOString(),
    })),
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireActiveDoctor(); } catch (e: unknown) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: (e as { status?: number }).status ?? 401 });
  }
  let body: { patientId?: unknown; conversationId?: unknown; scheduledFor?: unknown; notes?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const patientId = typeof body.patientId === 'string' ? body.patientId : '';
  const scheduledForStr = typeof body.scheduledFor === 'string' ? body.scheduledFor : '';
  if (!patientId) return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
  const scheduledFor = new Date(scheduledForStr);
  if (Number.isNaN(scheduledFor.getTime())) {
    return NextResponse.json({ error: 'Invalid scheduledFor date' }, { status: 400 });
  }
  const profile = await db.doctorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

  // Only the patient can grant sharing. Scheduling must never manufacture consent.
  const consent = await db.patientConsentForDoctor.findFirst({ where: { patientId, doctorId: profile.id, scope: 'follow_up', revokedAt: null } });
  if (!consent) return NextResponse.json({ error: 'Patient follow-up consent required' }, { status: 403 });
  if (typeof body.conversationId === 'string') {
    const conversation = await db.conversation.findUnique({ where: { id: body.conversationId }, select: { userId: true } });
    if (!conversation || conversation.userId !== patientId) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const outcome = await db.outcomeEntry.create({
    data: {
      userId: patientId,
      conversationId: typeof body.conversationId === 'string' ? body.conversationId : null,
      scheduledFor,
      status: 'pending',
      notes: typeof body.notes === 'string' ? body.notes.slice(0, 500) : null,
    },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'doctor.followup.scheduled',
      resource: patientId,
      meta: JSON.stringify({ scheduledFor: scheduledFor.toISOString(), outcomeId: outcome.id }),
    },
  });

  return NextResponse.json({ ok: true, outcomeId: outcome.id });
}
