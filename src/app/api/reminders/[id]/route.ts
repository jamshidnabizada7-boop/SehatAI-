import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { computeNextDue, mapReminder } from '@/server/reminders';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

/** PUT /api/reminders/[id] — update fields/status, recompute nextDue if time/days changed */
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const existing = await db.reminder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'reminder not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (typeof body.type === 'string' && ['med', 'vax', 'anc', 'other'].includes(body.type)) {
      data.type = body.type;
    }
    if (typeof body.title === 'string' && body.title.trim()) {
      data.title = body.title.trim();
    }
    if (typeof body.notes === 'string') {
      data.notes = body.notes.trim() || null;
    }
    if (typeof body.status === 'string' && ['active', 'done', 'snoozed'].includes(body.status)) {
      data.status = body.status;
    }

    let timeChanged = false;
    let newTime = existing.timeOfDay;
    if (typeof body.timeOfDay === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(body.timeOfDay.trim())) {
      newTime = body.timeOfDay.trim();
      if (newTime !== existing.timeOfDay) {
        data.timeOfDay = newTime;
        timeChanged = true;
      }
    }

    let daysChanged = false;
    let newDays: number[] = [];
    if (Array.isArray(body.days)) {
      newDays = [
        ...new Set(
          body.days.filter(
            (d): d is number => typeof d === 'number' && Number.isInteger(d) && d >= 0 && d <= 6,
          ),
        ),
      ].sort((a, b) => a - b);
      let oldDays: number[] = [];
      try {
        const parsed = JSON.parse(existing.days);
        if (Array.isArray(parsed)) oldDays = parsed;
      } catch {
        oldDays = [];
      }
      if (JSON.stringify(newDays) !== JSON.stringify([...oldDays].sort((a, b) => a - b))) {
        data.days = JSON.stringify(newDays);
        daysChanged = true;
      }
    } else {
      // keep existing days for nextDue computation
      try {
        const parsed = JSON.parse(existing.days);
        if (Array.isArray(parsed)) newDays = parsed.filter((d): d is number => typeof d === 'number');
      } catch {
        newDays = [];
      }
    }

    const statusBecomingActive = typeof data.status === 'string' && data.status === 'active' && existing.status !== 'active';
    if (timeChanged || daysChanged || statusBecomingActive) {
      data.nextDue = computeNextDue(newTime, newDays);
    }

    const updated = await db.reminder.update({ where: { id }, data });
    return NextResponse.json({ reminder: mapReminder(updated) });
  } catch {
    return NextResponse.json({ error: 'failed to update reminder' }, { status: 500 });
  }
}

/** DELETE /api/reminders/[id] */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const existing = await db.reminder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'reminder not found' }, { status: 404 });
    }
    await db.reminder.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'failed to delete reminder' }, { status: 500 });
  }
}
