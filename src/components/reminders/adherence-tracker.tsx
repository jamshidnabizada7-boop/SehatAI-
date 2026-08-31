'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, TrendingUp, Pill } from 'lucide-react';
import type { Reminder, Lang } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Medication Adherence Tracker (Phase 2)
// Tracks reminder completion over the last 7 days in localStorage
// (sehatai.adherence.v1) and visualizes adherence rate per reminder.
//
// Privacy: all data stays client-side. No server calls.
// Designed for low-literacy: visual circles (✓/○) + color-coded
// adherence rate (green ≥80%, amber 50-79%, red <50%).
// ============================================================

interface AdherenceEntry {
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** ISO timestamp when marked done */
  at: string;
}

interface AdherenceRecord {
  [reminderId: string]: AdherenceEntry[];
}

const STORAGE_KEY = 'sehatai.adherence.v1';

function loadAdherence(): AdherenceRecord {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as AdherenceRecord) : {};
  } catch {
    return {};
  }
}

function saveAdherence(record: AdherenceRecord): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // storage full / disabled
  }
}

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function dayLabel(dateStr: string, lang: Lang): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const locale = lang === 'ur' ? 'ur-PK' : 'en-PK';
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d);
  } catch {
    return dateStr.slice(5);
  }
}

function dayNum(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return String(d.getDate());
  } catch {
    return '?';
  }
}

interface AdherenceTrackerProps {
  reminders: Reminder[];
  lang: Lang;
  /** signal re-render after a reminder is toggled */
  refreshKey: number;
  className?: string;
}

export function AdherenceTracker({ reminders, lang, refreshKey, className }: AdherenceTrackerProps) {
  // Re-read from localStorage whenever refreshKey changes (lazy init + key-driven re-read).
  // Using a keyed `useMemo` avoids the `setState-in-effect` anti-pattern.
  const record = useMemo<AdherenceRecord>(() => loadAdherence(), [refreshKey]);
  const last7 = useMemo(() => getLast7Days(), []);

  const medReminders = reminders.filter((r) => r.type === 'med' || r.type === 'vax');

  if (medReminders.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn('rounded-2xl border border-border bg-card p-4 shadow-sm', className)}
        aria-label={lang === 'ur' ? 'دوائی کا adherence' : lang === 'roman' ? 'Dawai ka adherence' : 'Medication adherence'}
      >
        <div className="flex items-center gap-2">
          <Pill className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-bold text-foreground">
            {lang === 'ur' ? 'دوائی کا adherence' : lang === 'roman' ? 'Dawai ka adherence' : 'Medication adherence'}
          </h3>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {lang === 'ur'
            ? 'کوئی یاد دہانی نہیں۔ شامل کریں تاکہ adherence ٹریک ہو۔'
            : lang === 'roman'
              ? 'Koi yaad dahani nahin. Shamil karein taake adherence track ho.'
              : 'No reminders yet. Add one to track adherence.'}
        </p>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('rounded-2xl border border-border bg-card p-4 shadow-sm', className)}
      aria-label={lang === 'ur' ? 'دوائی کا adherence' : lang === 'roman' ? 'Dawai ka adherence' : 'Medication adherence'}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-bold text-foreground">
            {lang === 'ur' ? 'دوائی کا adherence (7 دن)' : lang === 'roman' ? 'Dawai ka adherence (7 din)' : 'Medication adherence (7 days)'}
          </h3>
        </div>
      </div>

      {/* day header row */}
      <div className="mb-2 grid grid-cols-[1fr_auto] items-center gap-2">
        <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          {lang === 'ur' ? 'یاد دہانی' : lang === 'roman' ? 'Yaad dahani' : 'Reminder'}
        </span>
        <div className="flex gap-1">
          {last7.map((d) => (
            <div key={d} className="flex w-7 flex-col items-center">
              <span className="text-[9px] font-medium text-muted-foreground">{dayLabel(d, lang)}</span>
              <span className="text-[10px] font-bold text-foreground">{dayNum(d)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* per-reminder rows */}
      <ul className="space-y-2">
        {medReminders.map((r) => {
          const entries = record[r.id] ?? [];
          const doneDates = new Set(entries.map((e) => e.date));
          const doneCount = last7.filter((d) => doneDates.has(d)).length;
          const adherenceRate = Math.round((doneCount / 7) * 100);
          const rateColor =
            adherenceRate >= 80
              ? 'text-emerald-600 dark:text-emerald-400'
              : adherenceRate >= 50
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400';

          return (
            <li key={r.id} className="grid grid-cols-[1fr_auto] items-center gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">{r.title}</p>
                <p className="mt-0.5 flex items-center gap-2">
                  <span className={cn('text-sm font-bold', rateColor)}>{adherenceRate}%</span>
                  <span className="text-[10px] text-muted-foreground">
                    {doneCount}/7 {lang === 'ur' ? 'دن' : lang === 'roman' ? 'din' : 'days'}
                  </span>
                </p>
              </div>
              <div className="flex gap-1">
                {last7.map((d) => {
                  const done = doneDates.has(d);
                  const isToday = d === new Date().toISOString().slice(0, 10);
                  return (
                    <div
                      key={d}
                      title={`${d}${done ? ' ✓' : ''}`}
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-md border transition-colors',
                        done
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'border-border bg-muted/30 text-muted-foreground/40',
                        isToday && !done && 'ring-1 ring-primary/40',
                      )}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-center text-[10px] text-muted-foreground">
        {lang === 'ur'
          ? 'adherence صرف اس ڈیوائس پر محفوظ ہے۔'
          : lang === 'roman'
            ? 'Adherence sirf is device par mehfooz hai.'
            : 'Adherence is stored only on this device.'}
      </p>
    </motion.section>
  );
}

// ---------- Helper: mark a reminder as done for today ----------
export function markReminderDone(reminderId: string): void {
  const record = loadAdherence();
  const today = new Date().toISOString().slice(0, 10);
  const entries = record[reminderId] ?? [];
  // Don't double-mark today
  if (entries.some((e) => e.date === today)) return;
  entries.push({ date: today, at: new Date().toISOString() });
  // Keep last 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const filtered = entries.filter((e) => new Date(e.date) >= cutoff);
  record[reminderId] = filtered;
  saveAdherence(record);
}

// ---------- Helper: unmark today ----------
export function unmarkReminderDone(reminderId: string): void {
  const record = loadAdherence();
  const today = new Date().toISOString().slice(0, 10);
  const entries = record[reminderId] ?? [];
  record[reminderId] = entries.filter((e) => e.date !== today);
  saveAdherence(record);
}

// ---------- Helper: check if done today ----------
export function isDoneToday(reminderId: string): boolean {
  const record = loadAdherence();
  const today = new Date().toISOString().slice(0, 10);
  const entries = record[reminderId] ?? [];
  return entries.some((e) => e.date === today);
}
