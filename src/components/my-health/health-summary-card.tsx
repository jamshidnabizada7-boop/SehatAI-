'use client';

import { useState, useEffect } from 'react';
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
  Brain,
} from 'lucide-react';
import type { Lang } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Health Dashboard Summary Card (Phase 2)
// Self-contained: reads from ALL tracker localStorage keys.
// ============================================================

interface HealthSummaryCardProps {
  lang: Lang;
  conditionsCount: number;
  allergiesCount: number;
  medicationsCount: number;
  className?: string;
}

interface TrackerData {
  sleepAvgHours?: number;
  sleepAvgQuality?: number;
  hydrationMl?: number;
  stepsToday?: number;
  glucoseLatest?: number;
  bpLatest?: { sys: number; dia: number };
  bmiValue?: number;
  phq9Score?: number;
  gad7Score?: number;
}

function readTrackers(): TrackerData {
  if (typeof window === 'undefined') return {};
  const data: TrackerData = {};

  // Sleep
  try {
    const sleep = JSON.parse(localStorage.getItem('sehatai.sleep.v1') || '[]');
    if (Array.isArray(sleep) && sleep.length >= 1) {
      const recent = sleep.slice(-7);
      data.sleepAvgHours = recent.reduce((s: number, e: any) => s + (e.hours || 0), 0) / recent.length;
      data.sleepAvgQuality = recent.reduce((s: number, e: any) => s + (e.quality || 0), 0) / recent.length;
    }
  } catch {}

  // Hydration
  try {
    const today = new Date().toISOString().slice(0, 10);
    const hydration = JSON.parse(localStorage.getItem('sehatai.hydration.v1') || '{}');
    if (hydration.date === today) {
      data.hydrationMl = (hydration.waterGlasses || 0) * 250 + (hydration.orsPackets || 0) * 1000;
    }
  } catch {}

  // Lifestyle (steps + BMI)
  try {
    const lifestyle = JSON.parse(localStorage.getItem('sehatai.lifestyle.v1') || '{}');
    if (lifestyle.steps && lifestyle.steps[today]) data.stepsToday = lifestyle.steps[today];
    if (lifestyle.heightCm && lifestyle.weightKg) {
      const m = lifestyle.heightCm / 100;
      data.bmiValue = lifestyle.weightKg / (m * m);
    }
  } catch {}

  // Chronic (glucose + BP)
  try {
    const chronic = JSON.parse(localStorage.getItem('sehatai.chronic.v1') || '{}');
    if (chronic.glucose && Array.isArray(chronic.glucose) && chronic.glucose.length > 0) {
      data.glucoseLatest = chronic.glucose[chronic.glucose.length - 1].value;
    }
    if (chronic.bp && Array.isArray(chronic.bp) && chronic.bp.length > 0) {
      const last = chronic.bp[chronic.bp.length - 1];
      data.bpLatest = { sys: last.systolic, dia: last.diastolic };
    }
  } catch {}

  // PHQ-9/GAD-7 results
  try {
    const mh = JSON.parse(localStorage.getItem('sehatai.mental-health.v1') || '{}');
    if (mh.phq9Score !== undefined) data.phq9Score = mh.phq9Score;
    if (mh.gad7Score !== undefined) data.gad7Score = mh.gad7Score;
  } catch {}

  return data;
}

export function HealthSummaryCard({ lang, conditionsCount, allergiesCount, medicationsCount, className }: HealthSummaryCardProps) {
  const [trackers, setTrackers] = useState<TrackerData>({});

  useEffect(() => {
    // Read tracker data on mount + on window focus
    const update = () => setTrackers(readTrackers());
    update();
    window.addEventListener('focus', update);
    return () => window.removeEventListener('focus', update);
  }, []);

  const alerts: { icon: typeof AlertTriangle; label: string; color: string }[] = [];

  if (trackers.bpLatest && (trackers.bpLatest.sys >= 140 || trackers.bpLatest.dia >= 90)) {
    alerts.push({ icon: AlertTriangle, label: lang === 'ur' ? 'بلڈ پریشر زیادہ' : 'High BP', color: 'text-red-600 dark:text-red-400 bg-red-500/10' });
  }
  if (trackers.sleepAvgHours !== undefined && trackers.sleepAvgHours < 6) {
    alerts.push({ icon: Moon, label: lang === 'ur' ? 'نیند کم' : 'Poor sleep', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' });
  }
  if (trackers.hydrationMl !== undefined && trackers.hydrationMl < 1000) {
    alerts.push({ icon: Droplet, label: lang === 'ur' ? 'پانی کم' : 'Low water', color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10' });
  }
  if (trackers.glucoseLatest !== undefined && trackers.glucoseLatest >= 200) {
    alerts.push({ icon: Pill, label: lang === 'ur' ? 'شوگر زیادہ' : 'High glucose', color: 'text-red-600 dark:text-red-400 bg-red-500/10' });
  }
  if (trackers.phq9Score !== undefined && trackers.phq9Score >= 15) {
    alerts.push({ icon: Brain, label: lang === 'ur' ? 'ذہنی صحت' : 'Depression risk', color: 'text-violet-600 dark:text-violet-400 bg-violet-500/10' });
  }

  const metrics: { icon: typeof HeartPulse; label: string; value: string; color: string }[] = [];

  if (trackers.sleepAvgHours !== undefined) {
    metrics.push({ icon: Moon, label: lang === 'ur' ? 'نیند' : 'Sleep', value: `${trackers.sleepAvgHours.toFixed(1)}h`, color: trackers.sleepAvgHours >= 7 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400' });
  }
  if (trackers.hydrationMl !== undefined) {
    metrics.push({ icon: Droplet, label: lang === 'ur' ? 'پانی' : 'Water', value: `${Math.round((trackers.hydrationMl ?? 0) / 250)}/10`, color: (trackers.hydrationMl ?? 0) >= 2000 ? 'text-emerald-600 dark:text-emerald-400' : 'text-cyan-600 dark:text-cyan-400' });
  }
  if (trackers.stepsToday !== undefined) {
    metrics.push({ icon: Footprints, label: lang === 'ur' ? 'قدم' : 'Steps', value: trackers.stepsToday > 1000 ? `${(trackers.stepsToday / 1000).toFixed(1)}k` : `${trackers.stepsToday}`, color: trackers.stepsToday >= 10000 ? 'text-emerald-600 dark:text-emerald-400' : 'text-violet-600 dark:text-violet-400' });
  }
  if (trackers.bpLatest) {
    metrics.push({ icon: Activity, label: 'BP', value: `${trackers.bpLatest.sys}/${trackers.bpLatest.dia}`, color: trackers.bpLatest.sys < 120 && trackers.bpLatest.dia < 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400' });
  }
  if (trackers.glucoseLatest !== undefined) {
    metrics.push({ icon: Pill, label: lang === 'ur' ? 'شوگر' : 'Sugar', value: `${trackers.glucoseLatest}`, color: trackers.glucoseLatest < 140 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400' });
  }
  if (trackers.bmiValue !== undefined) {
    metrics.push({ icon: HeartPulse, label: 'BMI', value: trackers.bmiValue.toFixed(1), color: trackers.bmiValue >= 18.5 && trackers.bmiValue < 25 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400' });
  }
  if (trackers.phq9Score !== undefined) {
    metrics.push({ icon: Brain, label: 'PHQ-9', value: `${trackers.phq9Score}`, color: trackers.phq9Score < 10 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400' });
  }

  let score = 100;
  if (alerts.length > 0) score -= alerts.length * 15;
  if (conditionsCount > 0) score -= conditionsCount * 5;
  score = Math.max(20, score);
  const scoreColor = score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
  const scoreLabel = score >= 80 ? (lang === 'ur' ? 'اچھا' : 'Good') : score >= 60 ? (lang === 'ur' ? 'درمیانہ' : 'Fair') : (lang === 'ur' ? 'توجہ درکار' : 'Needs attention');

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={cn('rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-4 shadow-sm', className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><HeartPulse className="h-5 w-5" aria-hidden /></span>
          <div><h3 className="text-sm font-bold text-foreground">{lang === 'ur' ? 'صحت کا خلاصہ' : 'Health summary'}</h3><p className="text-[11px] text-muted-foreground">{lang === 'ur' ? 'آج کا جائزہ' : "Today's overview"}</p></div>
        </div>
        <div className="text-right"><p className={cn('text-2xl font-bold', scoreColor)}>{score}</p><p className={cn('text-[10px] font-bold', scoreColor)}>{scoreLabel}</p></div>
      </div>
      {alerts.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {alerts.map((alert, i) => { const Icon = alert.icon; return <span key={i} className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold', alert.color)}><Icon className="h-2.5 w-2.5" aria-hidden />{alert.label}</span>; })}
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2 py-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden /><span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">{lang === 'ur' ? 'کوئی الرٹ نہیں' : 'No active alerts'}</span></div>
      )}
      {metrics.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {metrics.map((metric, i) => { const Icon = metric.icon; return <div key={i} className="rounded-lg border border-border/60 bg-card/50 p-2 text-center"><Icon className={cn('mx-auto h-3.5 w-3.5', metric.color)} aria-hidden /><p className={cn('mt-0.5 text-sm font-bold', metric.color)}>{metric.value}</p><p className="text-[9px] font-medium text-muted-foreground">{metric.label}</p></div>; })}
        </div>
      ) : (
        <p className="py-2 text-center text-xs text-muted-foreground">{lang === 'ur' ? 'ڈیٹا ٹریک کرنے کے لیے نیچے دیکھیں' : 'Use the trackers below to see your metrics here'}</p>
      )}
    </motion.div>
  );
}
