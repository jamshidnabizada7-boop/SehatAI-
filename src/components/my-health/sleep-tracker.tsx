'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Moon,
  Plus,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Bed,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Lang } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Sleep Quality Tracker (Phase 2)
// 7-day sleep log with hours slept + quality rating (1-5 stars)
// + trend chart. Sleep quality directly impacts mental health
// (integrates with PHQ-9 / GAD-7 scores conceptually).
//
// Privacy: localStorage (sehatai.sleep.v1).
// ============================================================

const STORAGE_KEY = 'sehatai.sleep.v1';
const SLEEP_GOAL_HOURS = 7.5;

interface SleepEntry {
  date: string; // YYYY-MM-DD
  hours: number;
  quality: 1 | 2 | 3 | 4 | 5; // 1=terrible, 5=excellent
  wokeUp: number; // times woke up
  notes?: string;
}

function loadSleep(): SleepEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e): e is SleepEntry => e && typeof e === 'object' && typeof e.date === 'string')
      .slice(-30); // keep last 30 days
  } catch {
    return [];
  }
}

function saveSleep(entries: SleepEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-30)));
  } catch {
    // ignore
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
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

const QUALITY_LABELS: Record<number, { en: string; ur: string; roman: string; color: string }> = {
  1: { en: 'Terrible', ur: 'بہت برا', roman: 'Bohat bura', color: 'text-red-600 dark:text-red-400' },
  2: { en: 'Poor', ur: 'برا', roman: 'Bura', color: 'text-orange-600 dark:text-orange-400' },
  3: { en: 'Fair', ur: 'درمیانہ', roman: 'Darmiyana', color: 'text-amber-600 dark:text-amber-400' },
  4: { en: 'Good', ur: 'اچھا', roman: 'Acha', color: 'text-lime-600 dark:text-lime-400' },
  5: { en: 'Excellent', ur: 'بہت اچھا', roman: 'Bohat acha', color: 'text-emerald-600 dark:text-emerald-400' },
};

interface SleepTrackerProps {
  lang: Lang;
  className?: string;
}

export function SleepTracker({ lang, className }: SleepTrackerProps) {
  const [entries, setEntries] = useState<SleepEntry[]>(() => loadSleep());
  const [showForm, setShowForm] = useState(false);
  const [hours, setHours] = useState('');
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [wokeUp, setWokeUp] = useState('0');
  const [notes, setNotes] = useState('');

  const today = todayKey();
  const todayEntry = entries.find((e) => e.date === today);

  // chart data: last 7 entries
  const chartData = useMemo(() => {
    return [...entries]
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(-7)
      .map((e) => ({
        date: dayLabel(e.date, lang),
        dayNum: dayNum(e.date, lang),
        hours: e.hours,
        quality: e.quality,
      }));
  }, [entries, lang]);

  // stats
  const avgHours = useMemo(() => {
    if (entries.length === 0) return 0;
    const recent = entries.slice(-7);
    return recent.reduce((s, e) => s + e.hours, 0) / recent.length;
  }, [entries]);

  const avgQuality = useMemo(() => {
    if (entries.length === 0) return 0;
    const recent = entries.slice(-7);
    return recent.reduce((s, e) => s + e.quality, 0) / recent.length;
  }, [entries]);

  const trend = useMemo(() => {
    if (entries.length < 4) return 'stable';
    const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : 1));
    const recent = sorted.slice(-3);
    const older = sorted.slice(-6, -3);
    if (recent.length === 0 || older.length === 0) return 'stable';
    const rAvg = recent.reduce((s, e) => s + e.hours, 0) / recent.length;
    const oAvg = older.reduce((s, e) => s + e.hours, 0) / older.length;
    const diff = rAvg - oAvg;
    if (diff > 0.5) return 'improving';
    if (diff < -0.5) return 'worsening';
    return 'stable';
  }, [entries]);

  const handleSave = () => {
    const h = parseFloat(hours);
    if (!h || h < 0 || h > 24) return;
    const w = parseInt(wokeUp, 10) || 0;
    const entry: SleepEntry = {
      date: today,
      hours: h,
      quality,
      wokeUp: w,
      notes: notes.trim().slice(0, 200) || undefined,
    };
    // Replace today's entry if exists
    const filtered = entries.filter((e) => e.date !== today);
    const updated = [...filtered, entry].sort((a, b) => (a.date < b.date ? -1 : 1));
    setEntries(updated);
    saveSleep(updated);
    setHours('');
    setQuality(3);
    setWokeUp('0');
    setNotes('');
    setShowForm(false);
  };

  const trendConfig = {
    improving: { icon: TrendingUp, label: { en: 'Improving', ur: 'بہتری', roman: 'Behtari' }, cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
    worsening: { icon: TrendingDown, label: { en: 'Worsening', ur: 'خرابی', roman: 'Kharabi' }, cls: 'bg-red-500/15 text-red-700 dark:text-red-400' },
    stable: { icon: Minus, label: { en: 'Stable', ur: 'مستحکم', roman: 'Mustaqil' }, cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('rounded-2xl border border-indigo-500/30 bg-indigo-50/30 p-4 shadow-sm dark:bg-indigo-950/10', className)}
      aria-label={lang === 'ur' ? 'نیند کا معیار' : lang === 'roman' ? 'Neend ka mayar' : 'Sleep quality tracker'}
    >
      {/* header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
          <Moon className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">
            {lang === 'ur' ? 'نیند کا معیار' : lang === 'roman' ? 'Neend ka mayar' : 'Sleep tracker'}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {lang === 'ur' ? '7 دن کا رجحان' : lang === 'roman' ? '7 din ka rujhan' : '7-day sleep log'}
          </p>
        </div>
        {entries.length >= 4 ? (
          (() => {
            const cfg = trendConfig[trend as keyof typeof trendConfig];
            const Icon = cfg.icon;
            return (
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold', cfg.cls)}>
                <Icon className="h-2.5 w-2.5" aria-hidden />
                {cfg.label[lang]}
              </span>
            );
          })()
        ) : null}
        <Button variant="ghost" size="sm" onClick={() => setShowForm((v) => !v)} className="h-7 gap-1 px-2 text-[11px] font-semibold text-primary">
          <Plus className="h-3 w-3" aria-hidden />
          {lang === 'ur' ? 'لاگ' : lang === 'roman' ? 'Log' : 'Log'}
        </Button>
      </div>

      {/* add form */}
      {showForm ? (
        <div className="mb-3 rounded-lg border border-border bg-card p-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="mb-1 block text-[10px] font-bold text-muted-foreground">
                {lang === 'ur' ? 'نیند کے گھنٹے' : lang === 'roman' ? 'Neend ke ghante' : 'Hours slept'}
              </Label>
              <Input type="number" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="7.5" className="h-9" />
            </div>
            <div>
              <Label className="mb-1 block text-[10px] font-bold text-muted-foreground">
                {lang === 'ur' ? 'جاگنے کی تعداد' : lang === 'roman' ? 'Jaagne ki tadaad' : 'Times woke up'}
              </Label>
              <Input type="number" value={wokeUp} onChange={(e) => setWokeUp(e.target.value)} placeholder="0" className="h-9" />
            </div>
          </div>

          {/* quality stars */}
          <div className="mt-2">
            <Label className="mb-1 block text-[10px] font-bold text-muted-foreground">
              {lang === 'ur' ? 'معیار' : lang === 'roman' ? 'Mayar' : 'Quality'}
            </Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setQuality(star as 1 | 2 | 3 | 4 | 5)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
                    quality >= star ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-border',
                  )}
                  aria-label={`Quality ${star}`}
                >
                  <Star className={cn('h-4 w-4', quality >= star ? 'fill-indigo-500 text-indigo-500' : 'text-muted-foreground/30')} aria-hidden />
                </button>
              ))}
              <span className={cn('ml-1 self-center text-[11px] font-bold', QUALITY_LABELS[quality]?.color)}>
                {QUALITY_LABELS[quality]?.[lang]}
              </span>
            </div>
          </div>

          {/* notes */}
          <div className="mt-2">
            <Label className="mb-1 block text-[10px] font-bold text-muted-foreground">
              {lang === 'ur' ? 'نوٹس' : lang === 'roman' ? 'Notes' : 'Notes'}
            </Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={lang === 'ur' ? 'خواب، پریشانی...' : lang === 'roman' ? 'Khuab, pareshani...' : 'Dreams, anxiety...'} className="h-9" />
          </div>

          <Button onClick={handleSave} className="mt-2 w-full gap-1.5 bg-indigo-600 hover:bg-indigo-700">
            {lang === 'ur' ? 'محفوظ کریں' : lang === 'roman' ? 'Mehfooz karein' : 'Save'}
          </Button>
        </div>
      ) : null}

      {/* today's summary */}
      {todayEntry ? (
        <div className="mb-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border bg-card p-2 text-center">
            <p className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
              {lang === 'ur' ? 'آج' : lang === 'roman' ? 'Aaj' : 'Today'}
            </p>
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{todayEntry.hours}h</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-2 text-center">
            <p className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
              {lang === 'ur' ? 'معیار' : lang === 'roman' ? 'Mayar' : 'Quality'}
            </p>
            <p className={cn('text-lg font-bold', QUALITY_LABELS[todayEntry.quality]?.color)}>
              {Array.from({ length: todayEntry.quality }).map((_, i) => '★').join('')}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-2 text-center">
            <p className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
              {lang === 'ur' ? 'جاگنا' : lang === 'roman' ? 'Jaagna' : 'Woke up'}
            </p>
            <p className="text-lg font-bold text-foreground">{todayEntry.wokeUp}x</p>
          </div>
        </div>
      ) : null}

      {/* 7-day average */}
      {entries.length >= 2 ? (
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border bg-card p-2 text-center">
            <p className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
              {lang === 'ur' ? 'اوسط نیند' : lang === 'roman' ? 'Osat neend' : 'Avg sleep'}
            </p>
            <p className={cn('text-lg font-bold', avgHours >= SLEEP_GOAL_HOURS ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
              {avgHours.toFixed(1)}h
            </p>
            <p className="text-[9px] text-muted-foreground">{lang === 'ur' ? `ہدف: ${SLEEP_GOAL_HOURS}h` : lang === 'roman' ? `Hadaf: ${SLEEP_GOAL_HOURS}h` : `Goal: ${SLEEP_GOAL_HOURS}h`}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-2 text-center">
            <p className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
              {lang === 'ur' ? 'اوسط معیار' : lang === 'roman' ? 'Osat mayar' : 'Avg quality'}
            </p>
            <p className={cn('text-lg font-bold', avgQuality >= 3.5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
              {avgQuality.toFixed(1)}/5
            </p>
          </div>
        </div>
      ) : null}

      {/* trend chart */}
      {chartData.length >= 2 ? (
        <div className="mb-3">
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted-foreground/20" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'currentColor' }} className="text-muted-foreground" interval="preserveStartEnd" />
              <YAxis domain={[0, 12]} tick={{ fontSize: 9, fill: 'currentColor' }} className="text-muted-foreground" width={28} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                formatter={(v: number) => [`${v}h`, 'Sleep']}
              />
              <Area type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2} fill="url(#sleepGrad)" dot={{ fill: '#6366f1', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-3 text-center text-[11px] text-muted-foreground">
          {lang === 'ur' ? 'رجحان دیکھنے کے لیے کم از کم 2 اندراج درکار ہیں' : lang === 'roman' ? 'Rujhan dekhne ke liye kam az kam 2 andaaraj darkaar hain' : 'Log at least 2 nights to see a trend'}
        </p>
      )}

      {/* recent entries */}
      {entries.length > 0 ? (
        <ul className="space-y-1">
          {[...entries].reverse().slice(0, 5).map((e, revIdx) => {
            const idx = entries.length - 1 - revIdx;
            return (
              <li key={idx} className="flex items-center gap-2 rounded-md border border-border/60 bg-background/40 p-1.5">
                <Moon className="h-3 w-3 shrink-0 text-indigo-500" aria-hidden />
                <span className="text-[11px] font-bold text-foreground">{e.hours}h</span>
                <span className="text-[10px] text-muted-foreground">{dayLabel(e.date, lang)} {dayNum(e.date, lang)}</span>
                <span className={cn('text-[10px] font-bold', QUALITY_LABELS[e.quality]?.color)}>
                  {Array.from({ length: e.quality }).map((_, i) => '★').join('')}
                </span>
                {e.wokeUp > 0 ? <span className="text-[9px] text-muted-foreground">↑{e.wokeUp}x</span> : null}
                {e.notes ? <span className="ml-auto truncate text-[9px] italic text-muted-foreground">"{e.notes}"</span> : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-3 text-center text-[11px] text-muted-foreground">
          {lang === 'ur'
            ? 'اپنی نیند لاگ کریں تاکہ رجحان دیکھ سکیں۔ نیند ذہنی صحت سے جڑی ہے۔'
            : lang === 'roman'
              ? 'Apni neend log karein taake rujhan dekh sakein. Neend zehni sehat se juri hai.'
              : 'Log your sleep to see trends. Sleep quality is closely linked to mental health.'}
        </p>
      )}

      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        {lang === 'ur' ? 'ڈیٹا صرف اس ڈیوائس پر محفوظ ہے۔' : lang === 'roman' ? 'Data sirf is device par mehfooz hai.' : 'Data stored only on this device.'}
      </p>
    </motion.section>
  );
}
