// SehatAI — Phase 1: Outcome capture (closed-loop follow-up)
// GET    /api/outcomes              -> pending follow-ups for the session user
// POST   /api/outcomes              -> capture outcome of a follow-up { outcomeEntryId, outcome, notes? }
// POST   /api/outcomes/schedule      -> schedule a new follow-up (called by pipeline after URGENT/ROUTINE responses)
//                                    { messageId?, conversationId?, scheduledFor }
//
// Outcomes: better | same | worse | saw_doctor | went_to_er | unresolved
// If "worse" or "went_to_er" → status=escalated (triggers re-triage prompt in UI).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

const VALID_OUTCOMES = new Set(['better', 'same', 'worse', 'saw_doctor', 'went_to_er', 'unresolved']);

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const pending = await db.outcomeEntry.findMany({
    where: { userId: user.id, status: 'pending' },
    orderBy: { scheduledFor: 'asc' },
    take: 20,
  });
  return NextResponse.json({ pending });
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: { outcomeEntryId?: unknown; outcome?: unknown; notes?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const id = typeof body.outcomeEntryId === 'string' ? body.outcomeEntryId : '';
  const outcome = typeof body.outcome === 'string' && VALID_OUTCOMES.has(body.outcome) ? body.outcome : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 500) : null;

  if (!id || !outcome) {
    return NextResponse.json({ error: 'outcomeEntryId and outcome are required.' }, { status: 400 });
  }

  const entry = await db.outcomeEntry.findUnique({ where: { id } });
  if (!entry || entry.userId !== user.id) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const escalated = outcome === 'worse' || outcome === 'went_to_er';
  const updated = await db.outcomeEntry.update({
    where: { id },
    data: {
      status: escalated ? 'escalated' : 'captured',
      outcome,
      notes,
      capturedAt: new Date(),
    },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: 'outcome.captured',
      resource: id,
      meta: JSON.stringify({ outcome, escalated }),
    },
  });

  return NextResponse.json({ ok: true, escalated, entry: updated });
}

// POST /api/outcomes?action=schedule  — schedule a new follow-up
export async function PUT(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: { messageId?: unknown; conversationId?: unknown; scheduledFor?: unknown; slot?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // slot = '24h' | '72h' | '7d' OR a specific ISO date
  const slot = typeof body.slot === 'string' ? body.slot : '24h';
  const scheduledFor =
    slot === '24h'
      ? new Date(Date.now() + 24 * 60 * 60 * 1000)
      : slot === '72h'
        ? new Date(Date.now() + 72 * 60 * 60 * 1000)
        : slot === '7d'
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          : typeof body.scheduledFor === 'string'
            ? new Date(body.scheduledFor)
            : new Date(Date.now() + 24 * 60 * 60 * 1000);

  const created = await db.outcomeEntry.create({
    data: {
      userId: user.id,
      messageId: typeof body.messageId === 'string' ? body.messageId : null,
      conversationId: typeof body.conversationId === 'string' ? body.conversationId : null,
      scheduledFor,
      status: 'pending',
    },
  });

  return NextResponse.json({ ok: true, outcomeEntryId: created.id, scheduledFor: scheduledFor.toISOString() });
}
