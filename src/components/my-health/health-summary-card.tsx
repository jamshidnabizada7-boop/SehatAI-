'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  HeartPulse,
  Droplet,
  Activity,
  Moon,
  Footprints,
  Pill,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import type { Lang } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Health Dashboard Summary Card (Phase 2)
// Aggregate summary of all trackers on the My Health view header.
// Shows: overall health score, key metrics from each tracker,
// and any active alerts (high BP, poor sleep, dehydration).
// ============================================================

interface HealthSummary {
  sleepAvgHours?: number;
  sleepAvgQuality?: number;
  hydrationMl?: number;
  hydrationGoal?: number;
  stepsToday?: number;
  glucoseLatest?: number;
  bpLatest?: { sys: number; dia: number };
  bmiValue?: number;
  conditionsCount: number;
  allergiesCount: number;
  medicationsCount: number;
}

interface HealthSummaryCardProps {
  lang: Lang;
  summary: HealthSummary;
  className?: string;
}

export function HealthSummaryCard({ lang, summary, className }: HealthSummaryCardProps) {
  const alerts: { icon: typeof AlertTriangle; label: string; color: string }[] = [];

  // Generate alerts
  if (summary.bpLatest && (summary.bpLatest.sys >= 140 || summary.bpLatest.dia >= 90)) {
    alerts.push({
      icon: AlertTriangle,
      label: lang === 'ur' ? 'بلڈ پریشر زیادہ' : 'High BP',
      color: 'text-red-600 dark:text-red-400 bg-red-500/10',
    });
  }
  if (summary.sleepAvgHours !== undefined && summary.sleepAvgHours < 6) {
    alerts.push({
      icon: Moon,
      label: lang === 'ur' ? 'نیند کم' : 'Poor sleep',
      color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
    });
  }
  if (summary.hydrationMl !== undefined && summary.hydrationGoal && summary.hydrationMl < summary.hydrationGoal * 0.4) {
    alerts.push({
      icon: Droplet,
      label: lang === 'ur' ? 'پانی کم' : 'Dehydrated',
      color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
    });
  }
  if (summary.glucoseLatest !== undefined && summary.glucoseLatest >= 200) {
    alerts.push({
      icon: Pill,
      label: lang === 'ur' ? 'شوگر زیادہ' : 'High glucose',
      color: 'text-red-600 dark:text-red-400 bg-red-500/10',
    });
  }

  const metrics: { icon: typeof HeartPulse; label: string; value: string; color: string }[] = [];

  if (summary.sleepAvgHours !== undefined) {
    metrics.push({
      icon: Moon,
      label: lang === 'ur' ? 'نیند' : 'Sleep',
      value: `${summary.sleepAvgHours.toFixed(1)}h`,
      color: summary.sleepAvgHours >= 7 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
    });
  }
  if (summary.hydrationMl !== undefined) {
    metrics.push({
      icon: Droplet,
      label: lang === 'ur' ? 'پانی' : 'Water',
      value: `${Math.round((summary.hydrationMl ?? 0) / 250)}/${Math.round((summary.hydrationGoal ?? 2500) / 250)}`,
      color: (summary.hydrationMl ?? 0) >= (summary.hydrationGoal ?? 2500) * 0.8 ? 'text-emerald-600 dark:text-emerald-400' : 'text-cyan-600 dark:text-cyan-400',
    });
  }
  if (summary.stepsToday !== undefined) {
    metrics.push({
      icon: Footprints,
      label: lang === 'ur' ? 'قدم' : 'Steps',
      value: summary.stepsToday > 1000 ? `${(summary.stepsToday / 1000).toFixed(1)}k` : `${summary.stepsToday}`,
      color: summary.stepsToday >= 10000 ? 'text-emerald-600 dark:text-emerald-400' : 'text-violet-600 dark:text-violet-400',
    });
  }
  if (summary.bpLatest) {
    metrics.push({
      icon: Activity,
      label: lang === 'ur' ? 'بی پی' : 'BP',
      value: `${summary.bpLatest.sys}/${summary.bpLatest.dia}`,
      color: summary.bpLatest.sys < 120 && summary.bpLatest.dia < 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
    });
  }
  if (summary.glucoseLatest !== undefined) {
    metrics.push({
      icon: Pill,
      label: lang === 'ur' ? 'شوگر' : 'Sugar',
      value: `${summary.glucoseLatest}`,
      color: summary.glucoseLatest < 140 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
    });
  }
  if (summary.bmiValue !== undefined) {
    metrics.push({
      icon: HeartPulse,
      label: 'BMI',
      value: summary.bmiValue.toFixed(1),
      color: summary.bmiValue >= 18.5 && summary.bmiValue < 25 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
    });
  }

  // Overall health score (simple heuristic)
  let score = 100;
  if (alerts.length > 0) score -= alerts.length * 15;
  if (summary.conditionsCount > 0) score -= summary.conditionsCount * 5;
  score = Math.max(20, score);
  const scoreColor = score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
  const scoreLabel = score >= 80 ? (lang === 'ur' ? 'اچھا' : 'Good') : score >= 60 ? (lang === 'ur' ? 'درمیانہ' : 'Fair') : (lang === 'ur' ? 'توجہ درکار' : 'Needs attention');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-4 shadow-sm', className)}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HeartPulse className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {lang === 'ur' ? 'صحت کا خلاصہ' : lang === 'roman' ? 'Sehat ka khulasa' : 'Health summary'}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {lang === 'ur' ? 'آج کا جائزہ' : lang === 'roman' ? 'Aaj ka jaiza' : "Today's overview"}
            </p>
          </div>
        </div>
        {/* score */}
        <div className="text-right">
          <p className={cn('text-2xl font-bold', scoreColor)}>{score}</p>
          <p className={cn('text-[10px] font-bold', scoreColor)}>{scoreLabel}</p>
        </div>
      </div>

      {/* alerts */}
      {alerts.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {alerts.map((alert, i) => {
            const Icon = alert.icon;
            return (
              <span key={i} className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold', alert.color)}>
                <Icon className="h-2.5 w-2.5" aria-hidden />
                {alert.label}
              </span>
            );
          })}
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2 py-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
          <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
            {lang === 'ur' ? 'کوئی الرٹ نہیں' : lang === 'roman' ? 'Koi alert nahin' : 'No active alerts'}
          </span>
        </div>
      )}

      {/* metrics grid */}
      {metrics.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {metrics.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <div key={i} className="rounded-lg border border-border/60 bg-card/50 p-2 text-center">
                <Icon className={cn('mx-auto h-3.5 w-3.5', metric.color)} aria-hidden />
                <p className={cn('mt-0.5 text-sm font-bold', metric.color)}>{metric.value}</p>
                <p className="text-[9px] font-medium text-muted-foreground">{metric.label}</p>
              </div>
            );
          })}
        </div>
      ) : null}
    </motion.div>
  );
}
