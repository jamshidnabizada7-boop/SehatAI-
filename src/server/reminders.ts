import { db } from '@/lib/db';

// ============================================================
// SehatAI — Reminder helpers shared by /api/reminders routes
// ============================================================

export interface ReminderDto {
  id: string;
  sessionToken: string;
  type: 'med' | 'vax' | 'anc' | 'other';
  title: string;
  notes?: string;
  timeOfDay: string;
  days: number[];
  nextDue: string;
  status: 'active' | 'done' | 'snoozed';
  createdAt: string;
}

/** Parse a DB reminder row into the API DTO (days JSON string → number[]). */
export function mapReminder(row: {
  id: string;
  sessionToken: string;
  type: string;
  title: string;
  notes: string | null;
  timeOfDay: string;
  days: string;
  nextDue: Date;
  status: string;
  createdAt: Date;
}): ReminderDto {
  let days: number[] = [];
  try {
    const parsed = JSON.parse(row.days);
    if (Array.isArray(parsed)) days = parsed.filter((d): d is number => typeof d === 'number' && d >= 0 && d <= 6);
  } catch {
    days = [];
  }
  return {
    id: row.id,
    sessionToken: row.sessionToken,
    type: row.type as ReminderDto['type'],
    title: row.title,
    notes: row.notes ?? undefined,
    timeOfDay: row.timeOfDay,
    days,
    nextDue: row.nextDue.toISOString(),
    status: row.status as ReminderDto['status'],
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Next occurrence of timeOfDay on one of `days` (0=Sun..6=Sat).
 * Empty days = every day. Correct across midnight and week boundaries:
 * strictly future occurrences only.
 */
export function computeNextDue(timeOfDay: string, days: number[]): Date {
  const [h, m] = timeOfDay.split(':').map((x) => parseInt(x, 10));
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
  const allowed = [...new Set(days.filter((d) => d >= 0 && d <= 6))];

  if (allowed.length === 0) {
    // daily: today if still in the future, else tomorrow
    return today.getTime() > now.getTime() ? today : new Date(today.getTime() + 24 * 60 * 60 * 1000);
  }

  for (let offset = 0; offset < 14; offset++) {
    const candidate = new Date(today.getTime() + offset * 24 * 60 * 60 * 1000);
    if (allowed.includes(candidate.getDay()) && candidate.getTime() > now.getTime()) {
      return candidate;
    }
  }
  // unreachable in practice (14-day window covers any weekday set), but keep safe
  return new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
}

export { db };
