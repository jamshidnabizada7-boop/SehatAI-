// Care Connect §46 — Doctor availability management.
// Weekly schedule rows (weekday, startMinute, endMinute UTC, slot, buffer),
// exceptions (vacation days / custom windows), online-now toggle (§47).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCapability, CareAuthzError } from '@/lib/care/care-auth';
export const runtime = 'nodejs';

function err(e: unknown) {
  if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : 'ERROR' }, { status: 500 });
}

export async function GET() {
  try {
    const session = await requireCapability('consultation.view');
    if (!session.doctorProfileId) return NextResponse.json({ schedule: [], exceptions: [], onlineNow: false });
    const [schedule, exceptions, doctor] = await Promise.all([
      db.doctorAvailability.findMany({ where: { doctorProfileId: session.doctorProfileId }, orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }] }),
      db.doctorAvailabilityException.findMany({ where: { doctorProfileId: session.doctorProfileId }, orderBy: { date: 'asc' }, take: 100 }),
      db.doctorProfile.findUnique({ where: { id: session.doctorProfileId }, select: { onlineNow: true, onlineNowUntil: true } }),
    ]);
    return NextResponse.json({
      schedule,
      exceptions,
      onlineNow: doctor?.onlineNow === true && doctor.onlineNowUntil != null && doctor.onlineNowUntil > new Date(),
    });
  } catch (e) {
    return err(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireCapability('consultation.view');
    if (!session.doctorProfileId) return NextResponse.json({ error: 'DOCTOR_PROFILE_REQUIRED' }, { status: 400 });
    const body = await req.json();
    const action = String(body.action ?? '');

    if (action === 'addWindow') {
      const weekday = Number(body.weekday);
      const startMinute = Number(body.startMinute);
      const endMinute = Number(body.endMinute);
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return NextResponse.json({ error: 'INVALID_WEEKDAY' }, { status: 400 });
      if (!Number.isInteger(startMinute) || !Number.isInteger(endMinute) || startMinute < 0 || endMinute > 1440 || endMinute - startMinute < 15) {
        return NextResponse.json({ error: 'INVALID_WINDOW' }, { status: 400 });
      }
      const row = await db.doctorAvailability.create({
        data: {
          doctorProfileId: session.doctorProfileId,
          weekday,
          startMinute,
          endMinute,
          slotMinutes: Math.min(60, Math.max(5, Number(body.slotMinutes ?? 15))),
          bufferMinutes: Math.min(30, Math.max(0, Number(body.bufferMinutes ?? 0))),
        },
      });
      return NextResponse.json({ window: row });
    }

    if (action === 'removeWindow') {
      await db.doctorAvailability.deleteMany({
        where: { id: String(body.id ?? ''), doctorProfileId: session.doctorProfileId },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === 'addException') {
      const date = String(body.date ?? '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'INVALID_DATE' }, { status: 400 });
      const row = await db.doctorAvailabilityException.create({
        data: {
          doctorProfileId: session.doctorProfileId,
          date,
          kind: body.kind === 'CUSTOM' ? 'CUSTOM' : 'UNAVAILABLE',
          startMinute: body.kind === 'CUSTOM' ? Number(body.startMinute) : null,
          endMinute: body.kind === 'CUSTOM' ? Number(body.endMinute) : null,
          reason: body.reason ? String(body.reason).slice(0, 200) : null,
        },
      });
      return NextResponse.json({ exception: row });
    }

    if (action === 'removeException') {
      await db.doctorAvailabilityException.deleteMany({
        where: { id: String(body.id ?? ''), doctorProfileId: session.doctorProfileId },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === 'setOnlineNow') {
      const minutes = Math.min(480, Math.max(15, Number(body.minutes ?? 60)));
      const until = new Date(Date.now() + minutes * 60_000);
      await db.doctorProfile.update({
        where: { id: session.doctorProfileId },
        data: { onlineNow: body.online === true, onlineNowUntil: body.online === true ? until : null },
      });
      return NextResponse.json({ ok: true, onlineNowUntil: body.online === true ? until : null });
    }

    return NextResponse.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (e) {
    return err(e);
  }
}
