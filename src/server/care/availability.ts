// ============================================================
// Care Connect §46 — availability engine.
// Weekly schedule (per-weekday windows, UTC) + exceptions
// (vacations/unavailable days/custom windows) → concrete slots.
// All storage is UTC; rendering in the user's timezone happens
// client-side. Double-booking is prevented at booking time with a
// transaction + overlapping-slot query (see consultation service).
// ============================================================
import { db } from '@/lib/db';

export interface Slot {
  startUtc: string; // ISO
  endUtc: string;
}

export interface AvailabilityResult {
  slots: Slot[];
  offlineDays: string[]; // YYYY-MM-DD fully unavailable (vacation etc.)
}

const DAY_MS = 24 * 3600 * 1000;

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getAvailableSlots(opts: {
  doctorProfileId: string;
  serviceType: 'TEXT' | 'AUDIO' | 'VIDEO';
  durationMinutes: number;
  fromUtc: Date;
  days: number; // horizon
  slotMinutes?: number; // override from schedule granularity
}): Promise<AvailabilityResult> {
  const schedules = await db.doctorAvailability.findMany({
    where: { doctorProfileId: opts.doctorProfileId },
  });
  const exceptions = await db.doctorAvailabilityException.findMany({
    where: { doctorProfileId: opts.doctorProfileId },
  });
  const exceptionByDate = new Map(exceptions.map((e) => [e.date, e]));

  // Existing busy slots: active consultations holding a scheduledAt window.
  const busy = await db.consultation.findMany({
    where: {
      doctorProfileId: opts.doctorProfileId,
      scheduledAt: { not: null },
      status: { in: ['PAYMENT_PENDING', 'PAID', 'REQUESTED', 'DOCTOR_ACCEPTED', 'SCHEDULED', 'WAITING', 'IN_PROGRESS'] },
      service: { type: { not: 'TEXT' } }, // TEXT windows don't consume clock slots
    },
    select: { scheduledAt: true, service: { select: { durationMinutes: true } } },
  });

  const slots: Slot[] = [];
  const offlineDays: string[] = [];

  for (let dayOffset = 0; dayOffset < opts.days; dayOffset++) {
    const dayStart = new Date(opts.fromUtc.getTime() + dayOffset * DAY_MS);
    dayStart.setUTCHours(0, 0, 0, 0);
    const key = dateKey(dayStart);
    const weekday = dayStart.getUTCDay();

    const exception = exceptionByDate.get(key);
    if (exception && exception.kind === 'UNAVAILABLE') {
      offlineDays.push(key);
      continue;
    }

    const windows = exception && exception.kind === 'CUSTOM' && exception.startMinute != null && exception.endMinute != null
      ? [{ startMinute: exception.startMinute, endMinute: exception.endMinute, slotMinutes: opts.slotMinutes ?? 15, bufferMinutes: 0 }]
      : schedules.filter((s) => s.weekday === weekday).map((s) => ({
          startMinute: s.startMinute,
          endMinute: s.endMinute,
          slotMinutes: opts.slotMinutes ?? s.slotMinutes,
          bufferMinutes: s.bufferMinutes,
        }));

    for (const w of windows) {
      const step = Math.max(5, w.slotMinutes + w.bufferMinutes);
      for (let m = w.startMinute; m + opts.durationMinutes <= w.endMinute; m += step) {
        const start = new Date(dayStart.getTime() + m * 60_000);
        const end = new Date(start.getTime() + opts.durationMinutes * 60_000);
        if (start.getTime() < opts.fromUtc.getTime()) continue;
        // must be bookable at least 30 min ahead
        if (start.getTime() < Date.now() + 30 * 60_000) continue;
        const conflicts = busy.some((b) => {
          if (!b.scheduledAt) return false;
          const bs = new Date(b.scheduledAt).getTime();
          const be = bs + (b.service?.durationMinutes ?? 15) * 60_000;
          return start.getTime() < be && end.getTime() > bs;
        });
        if (!conflicts) slots.push({ startUtc: start.toISOString(), endUtc: end.toISOString() });
        if (slots.length >= 200) break; // hard cap per request
      }
    }
  }

  slots.sort((a, b) => a.startUtc.localeCompare(b.startUtc));
  return { slots, offlineDays };
}

/**
 * Assert a concrete start time falls inside an open schedule window
 * and does not collide with an existing booking. Used by the booking
 * transaction as the second layer of double-booking protection
 * (the first is the overlapping-slot query inside the transaction).
 */
export async function assertSlotBookable(opts: {
  doctorProfileId: string;
  startUtc: Date;
  durationMinutes: number;
  excludeConsultationId?: string;
}): Promise<void> {
  const start = opts.startUtc;
  const weekday = start.getUTCDay();
  const minute = start.getUTCHours() * 60 + start.getUTCMinutes();
  const endMinute = minute + opts.durationMinutes;

  const schedules = await db.doctorAvailability.findMany({
    where: { doctorProfileId: opts.doctorProfileId, weekday },
  });
  const inWindow = schedules.some((s) => minute >= s.startMinute && endMinute <= s.endMinute);
  if (!inWindow) throw new Error('SLOT_OUTSIDE_SCHEDULE');

  const key = dateKey(start);
  const exception = await db.doctorAvailabilityException.findFirst({
    where: { doctorProfileId: opts.doctorProfileId, date: key },
  });
  if (exception?.kind === 'UNAVAILABLE') throw new Error('SLOT_UNAVAILABLE_DATE');
  if (exception?.kind === 'CUSTOM' && exception.startMinute != null && exception.endMinute != null) {
    if (!(minute >= exception.startMinute && endMinute <= exception.endMinute)) {
      throw new Error('SLOT_OUTSIDE_SCHEDULE');
    }
  }

  const overlaps = await db.consultation.count({
    where: {
      doctorProfileId: opts.doctorProfileId,
      id: opts.excludeConsultationId ? { not: opts.excludeConsultationId } : undefined,
      scheduledAt: {
        // coarse pre-filter; exact overlap checked below
        gte: new Date(start.getTime() - 60 * 60_000),
        lte: new Date(start.getTime() + (opts.durationMinutes + 60) * 60_000),
      },
      status: { in: ['PAYMENT_PENDING', 'PAID', 'REQUESTED', 'DOCTOR_ACCEPTED', 'SCHEDULED', 'WAITING', 'IN_PROGRESS'] },
      service: { type: { not: 'TEXT' } },
    },
  });
  if (overlaps > 0) {
    const booked = await db.consultation.findMany({
      where: {
        doctorProfileId: opts.doctorProfileId,
        scheduledAt: { not: null },
        status: { in: ['PAYMENT_PENDING', 'PAID', 'REQUESTED', 'DOCTOR_ACCEPTED', 'SCHEDULED', 'WAITING', 'IN_PROGRESS'] },
        service: { type: { not: 'TEXT' } },
      },
      select: { scheduledAt: true, service: { select: { durationMinutes: true } } },
    });
    const conflict = booked.some((b) => {
      if (!b.scheduledAt) return false;
      const bs = new Date(b.scheduledAt).getTime();
      const be = bs + (b.service?.durationMinutes ?? 15) * 60_000;
      return start.getTime() < be && start.getTime() + opts.durationMinutes * 60_000 > bs;
    });
    if (conflict) throw new Error('SLOT_ALREADY_BOOKED');
  }
}
