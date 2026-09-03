'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import { Activity, CalendarDays, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { JournalEntry, Severity } from '@/lib/profile';
import type { Lang } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Health Timeline (Phase 2)
// Visualizes the user's symptom journal over time:
//   - Severity trend (1-5) as an area chart
//   - Triage distribution (how many EMERGENCY/URGENT/ROUTINE/SELF_CARE)
//   - Recent entries list with severity color + triage badge
//   - Trend indicator (improving / worsening / stable)
//
// Data source: localStorage journal (sehatai.journal.v1).
// Privacy: all data stays client-side; no server calls.
// ============================================================

interface HealthTimelineProps {
  entries: JournalEntry[];
  lang: Lang;
  className?: string;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  1: '#10b981', // emerald
  2: '#84cc16', // lime
  3: '#f59e0b', // amber
  4: '#f97316', // orange
  5: '#ef4444', // red
};

const TRIAGE_COLORS: Record<string, string> = {
  EMERGENCY: '#ef4444',
  URGENT: '#f97316',
  ROUTINE: '#f59e0b',
  SELF_CARE: '#10b981',
};

function formatDate(iso: string, lang: Lang): string {
  try {
    const d = new Date(iso);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const locale = lang === 'ur' ? 'ur-PK' : 'en-PK';
    return new Intl.DateTimeFormat(locale, opts).format(d);
  } catch {
    return iso.slice(0, 10);
  }
}

function formatDateTime(iso: string, lang: Lang): string {
  try {
    const d = new Date(iso);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const locale = lang === 'ur' ? 'ur-PK' : 'en-PK';
    return new Intl.DateTimeFormat(locale, opts).format(d);
  } catch {
    return iso;
  }
}

interface ChartDatum {
  date: string;
  fullDate: string;
  severity: number;
  triage: string | undefined;
  label: string;
}

function CustomTooltip({ active, payload, lang }: TooltipProps<number, string> & { lang: Lang }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload as ChartDatum | undefined;
  if (!data) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-bold text-foreground">{data.fullDate}</p>
      <p className="mt-0.5 text-muted-foreground">
        {lang === 'ur' ? 'شدت' : lang === 'roman' ? 'Shiddat' : 'Severity'}: <span className="font-semibold text-foreground">{data.severity}/5</span>
      </p>
      {data.triage ? (
        <p className="text-muted-foreground">
          {lang === 'ur' ? 'ٹرایج' : lang === 'roman' ? 'Triage' : 'Triage'}:{' '}
          <span style={{ color: TRIAGE_COLORS[data.triage] }} className="font-semibold">{data.triage}</span>
        </p>
      ) : null}
      <p className="mt-0.5 max-w-[200px] truncate text-muted-foreground">{data.label}</p>
    </div>
  );
}

export function HealthTimeline({ entries, lang, className }: HealthTimelineProps) {
  const [showAll, setShowAll] = useState(false);

  const chartData: ChartDatum[] = useMemo(() => {
    return [...entries]
      .sort((a, b) => (a.at < b.at ? -1 : 1))
      .map((e) => ({
        date: formatDate(e.at, lang),
        fullDate: formatDateTime(e.at, lang),
        severity: e.severity,
        triage: e.triage,
        label: e.symptom,
      }));
  }, [entries, lang]);

  const triageStats = useMemo(() => {
    const stats: Record<string, number> = { EMERGENCY: 0, URGENT: 0, ROUTINE: 0, SELF_CARE: 0 };
    for (const e of entries) {
      if (e.triage && e.triage in stats) stats[e.triage]++;
    }
    return stats;
  }, [entries]);

  const trend = useMemo(() => {
    if (entries.length < 2) return 'stable' as 'improving' | 'worsening' | 'stable';
    const sorted = [...entries].sort((a, b) => (a.at < b.at ? -1 : 1));
    const recent = sorted.slice(-3);
    const older = sorted.slice(-6, -3);
    if (recent.length === 0 || older.length === 0) return 'stable';
    const recentAvg = recent.reduce((s, e) => s + e.severity, 0) / recent.length;
    const olderAvg = older.reduce((s, e) => s + e.severity, 0) / older.length;
    const diff = recentAvg - olderAvg;
    if (diff < -0.5) return 'improving';
    if (diff > 0.5) return 'worsening';
    return 'stable';
  }, [entries]);

  const recentEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => (a.at < b.at ? 1 : -1));
    return showAll ? sorted : sorted.slice(0, 5);
  }, [entries, showAll]);

  if (entries.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn('rounded-2xl border border-border bg-card p-6 shadow-sm', className)}
        aria-label={lang === 'ur' ? 'صحت کی ٹائم لائن' : lang === 'roman' ? 'Sehat ki timeline' : 'Health timeline'}
      >
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" aria-hidden />
          <h3 className="text-sm font-bold text-foreground">
            {lang === 'ur' ? 'صحت کی ٹائم لائن' : lang === 'roman' ? 'Sehat ki timeline' : 'Health timeline'}
          </h3>
        </div>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          {lang === 'ur'
            ? 'ابھی کوئی داخلہ نہیں۔ اپنی علامات جونل میں لاگ کریں تاکہ ٹائم لائن دیکھ سکیں۔'
            : lang === 'roman'
              ? 'Abhi koi daakhla nahin. Apni alamaat journal mein log karein taake timeline dekh sakein.'
              : 'No entries yet. Log your symptoms in the journal to see your health trend over time.'}
        </p>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('space-y-4', className)}
      aria-label={lang === 'ur' ? 'صحت کی ٹائم لائن' : lang === 'roman' ? 'Sehat ki timeline' : 'Health timeline'}
    >
      {/* header + trend indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" aria-hidden />
          <h3 className="text-sm font-bold text-foreground">
            {lang === 'ur' ? 'صحت کی ٹائم لائن' : lang === 'roman' ? 'Sehat ki timeline' : 'Health timeline'}
          </h3>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
            {entries.length}
          </span>
        </div>
        <TrendBadge trend={trend} lang={lang} />
      </div>

      {/* severity trend chart */}
      {chartData.length >= 2 ? (
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <p className="mb-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            {lang === 'ur' ? 'شدت کا رجحان' : lang === 'roman' ? 'Shiddat ka rujhan' : 'Severity trend'}
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="severityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted-foreground/30" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" interval="preserveStartEnd" />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" width={28} />
              <Tooltip content={(props) => <CustomTooltip {...props} lang={lang} />} />
              <Area
                type="monotone"
                dataKey="severity"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#severityGradient)"
                dot={{ fill: '#f59e0b', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-3 text-center text-xs text-muted-foreground">
          {lang === 'ur' ? 'رجحان دیکھنے کے لیے کم از کم 2 اندراج درکار ہیں' : lang === 'roman' ? 'Rujhan dekhne ke liye kam az kam 2 andaaraj darkaar hain' : 'At least 2 entries needed to show a trend'}
        </div>
      )}

      {/* triage distribution */}
      <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
        <p className="mb-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
          {lang === 'ur' ? 'ٹرایج کی تقسیم' : lang === 'roman' ? 'Triage ki taqseem' : 'Triage distribution'}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {(['EMERGENCY', 'URGENT', 'ROUTINE', 'SELF_CARE'] as const).map((level) => (
            <div key={level} className="text-center">
              <div
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
                style={{ backgroundColor: `${TRIAGE_COLORS[level]}20`, color: TRIAGE_COLORS[level] }}
              >
                {triageStats[level]}
              </div>
              <p className="mt-1 text-[10px] font-medium leading-tight text-muted-foreground">{level}</p>
            </div>
          ))}
        </div>
      </div>

      {/* recent entries list */}
      <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            {lang === 'ur' ? 'حالیہ اندراج' : lang === 'roman' ? 'Haliya andaaraj' : 'Recent entries'}
          </p>
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        </div>
        <ul className="space-y-2">
          {recentEntries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/40 p-2"
            >
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: SEVERITY_COLORS[entry.severity] }}
                aria-label={`Severity ${entry.severity} of 5`}
              >
                {entry.severity}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{entry.symptom}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">{formatDateTime(entry.at, lang)}</span>
                  {entry.triage ? (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                      style={{ backgroundColor: `${TRIAGE_COLORS[entry.triage]}20`, color: TRIAGE_COLORS[entry.triage] }}
                    >
                      {entry.triage}
                    </span>
                  ) : null}
                </div>
                {entry.notes ? (
                  <p className="mt-0.5 truncate text-[10px] italic text-muted-foreground">“{entry.notes}”</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        {entries.length > 5 ? (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="mt-2 w-full rounded-lg border border-border/60 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-foreground/[0.02] hover:text-foreground"
          >
            {showAll
              ? lang === 'ur' ? 'کم دکھائیں' : lang === 'roman' ? 'Kam dikhayein' : 'Show less'
              : lang === 'ur' ? `تمام دیکھیں (${entries.length})` : lang === 'roman' ? `Tamam dekhein (${entries.length})` : `Show all (${entries.length})`}
          </button>
        ) : null}
      </div>
    </motion.section>
  );
}

function TrendBadge({ trend, lang }: { trend: 'improving' | 'worsening' | 'stable'; lang: Lang }) {
  const config = {
    improving: {
      icon: TrendingDown,
      label: { en: 'Improving', ur: 'بہتری', roman: 'Behtari' },
      cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    },
    worsening: {
      icon: TrendingUp,
      label: { en: 'Worsening', ur: 'خرابی', roman: 'Kharabi' },
      cls: 'bg-red-500/15 text-red-700 dark:text-red-400',
    },
    stable: {
      icon: Minus,
      label: { en: 'Stable', ur: 'مستحکم', roman: 'Mustaqil' },
      cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    },
  }[trend];
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold', config.cls)}>
      <Icon className="h-3 w-3" aria-hidden />
      {config.label[lang]}
    </span>
  );
}
