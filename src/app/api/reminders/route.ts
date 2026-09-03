import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { computeNextDue, mapReminder } from '@/server/reminders';

export const runtime = 'nodejs';

/** GET /api/reminders?sessionId → user's reminders sorted by nextDue */
export async function GET(req: NextRequest) {
  const sessionId = (req.nextUrl.searchParams.get('sessionId') ?? '').trim();
  if (!sessionId) {
    return NextResponse.json({ reminders: [], error: 'sessionId is required' }, { status: 400 });
  }
  try {
    const rows = await db.reminder.findMany({
      where: { sessionToken: sessionId },
      orderBy: { nextDue: 'asc' },
    });
    return NextResponse.json({ reminders: rows.map((r) => mapReminder(r)) });
  } catch {
    return NextResponse.json({ reminders: [], error: 'failed to load reminders' });
  }
}

/** POST /api/reminders {sessionId, type, title, notes?, timeOfDay, days[]} */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
  const type = typeof body.type === 'string' ? body.type : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const notes = typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : null;
  const timeOfDay = typeof body.timeOfDay === 'string' ? body.timeOfDay.trim() : '';
  const rawDays = Array.isArray(body.days) ? body.days : [];

  if (!sessionId) return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  if (!['med', 'vax', 'anc', 'other'].includes(type)) {
    return NextResponse.json({ error: 'type must be med | vax | anc | other' }, { status: 400 });
  }
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(timeOfDay)) {
    return NextResponse.json({ error: 'timeOfDay must be HH:MM (24h)' }, { status: 400 });
  }
  const days = [
    ...new Set(
      rawDays.filter((d): d is number => typeof d === 'number' && Number.isInteger(d) && d >= 0 && d <= 6),
    ),
  ].sort((a, b) => a - b);

  try {
    const created = await db.reminder.create({
      data: {
        sessionToken: sessionId,
        type,
        title,
        notes,
        timeOfDay,
        days: JSON.stringify(days),
        nextDue: computeNextDue(timeOfDay, days),
        status: 'active',
      },
    });
    return NextResponse.json({ reminder: mapReminder(created) });
  } catch {
    return NextResponse.json({ error: 'failed to create reminder' }, { status: 500 });
  }
}
