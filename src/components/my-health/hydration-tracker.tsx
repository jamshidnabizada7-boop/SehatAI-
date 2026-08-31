'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets,
  Plus,
  Minus,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Lang } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Hydration/Dehydration Tracker (Phase 2)
// Tracks daily water + ORS intake with a urine color chart
// for self-assessment. Critical for Pakistan's 40°C+ summers
// where dehydration is a major cause of child + elderly mortality.
//
// Privacy: localStorage (sehatai.hydration.v1).
// ============================================================

const STORAGE_KEY = 'sehatai.hydration.v1';
const DAILY_GOAL_ML = 2500; // 2.5L for adults in hot climate
const GLASS_ML = 250; // 1 glass = 250ml
const ORS_PACKET_ML = 1000; // 1 ORS packet = 1L

interface HydrationData {
  date: string; // YYYY-MM-DD
  waterGlasses: number;
  orsPackets: number;
  urineColor: 1 | 2 | 3 | 4 | 5 | 6 | null; // 1=hydrated, 6=severely dehydrated
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function load(): HydrationData {
  if (typeof window === 'undefined') return { date: todayKey(), waterGlasses: 0, orsPackets: 0, urineColor: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: todayKey(), waterGlasses: 0, orsPackets: 0, urineColor: null };
    const parsed = JSON.parse(raw) as Partial<HydrationData>;
    const today = todayKey();
    // Reset if new day
    if (parsed.date !== today) return { date: today, waterGlasses: 0, orsPackets: 0, urineColor: null };
    return {
      date: today,
      waterGlasses: typeof parsed.waterGlasses === 'number' ? parsed.waterGlasses : 0,
      orsPackets: typeof parsed.orsPackets === 'number' ? parsed.orsPackets : 0,
      urineColor: parsed.urineColor ?? null,
    };
  } catch {
    return { date: todayKey(), waterGlasses: 0, orsPackets: 0, urineColor: null };
  }
}

function save(data: HydrationData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

const URINE_COLORS: { level: 1 | 2 | 3 | 4 | 5 | 6; color: string; label: { en: string; ur: string; roman: string }; status: { en: string; ur: string; roman: string }; severity: 'good' | 'ok' | 'warn' | 'danger' }[] = [
  { level: 1, color: '#f3f4f6', label: { en: 'Pale yellow', ur: 'ہلکا پیلا', roman: 'Halka peela' }, status: { en: 'Well hydrated', ur: 'پانی کافی ہے', roman: 'Paani kaafi hai' }, severity: 'good' },
  { level: 2, color: '#fef3c7', label: { en: 'Light yellow', ur: 'ہلکا پیلا', roman: 'Halka peela' }, status: { en: 'Good hydration', ur: 'اچھا', roman: 'Acha' }, severity: 'good' },
  { level: 3, color: '#fde68a', label: { en: 'Yellow', ur: 'پیلا', roman: 'Peela' }, status: { en: 'Drink more water', ur: 'زیادہ پانی لیں', roman: 'Zyada paani lein' }, severity: 'ok' },
  { level: 4, color: '#fcd34d', label: { en: 'Dark yellow', ur: 'گہرا پیلا', roman: 'Gehra peela' }, status: { en: 'Mild dehydration', ur: 'ہلکی کم پانی', roman: 'Halki kam paani' }, severity: 'warn' },
  { level: 5, color: '#fbbf24', label: { en: 'Amber', ur: 'امبر', roman: 'Amber' }, status: { en: 'Dehydrated — drink now', ur: 'پانی کی کمی — ابھی پیئیں', roman: 'Paani ki kami — abhi piyein' }, severity: 'danger' },
  { level: 6, color: '#d97706', label: { en: 'Brown/dark', ur: 'براؤن/گہرا', roman: 'Brown/gehra' }, status: { en: 'Severely dehydrated — seek help', ur: 'شدید کم پانی — مدد لیں', roman: 'Shadeed kam paani — madad lein' }, severity: 'danger' },
];

interface HydrationTrackerProps {
  lang: Lang;
  className?: string;
}

export function HydrationTracker({ lang, className }: HydrationTrackerProps) {
  const [data, setData] = useState<HydrationData>(() => load());

  const totalMl = data.waterGlasses * GLASS_ML + data.orsPackets * ORS_PACKET_ML;
  const pct = Math.min(100, (totalMl / DAILY_GOAL_ML) * 100);
  const isGoalMet = totalMl >= DAILY_GOAL_ML;

  const urineStatus = data.urineColor ? URINE_COLORS.find((c) => c.level === data.urineColor) : null;
  const isDehydrated = data.urineColor && data.urineColor >= 5;

  const updateWater = (delta: number) => {
    const next = Math.max(0, Math.min(20, data.waterGlasses + delta));
    const updated = { ...data, waterGlasses: next };
    setData(updated);
    save(updated);
  };

  const updateOrs = (delta: number) => {
    const next = Math.max(0, Math.min(10, data.orsPackets + delta));
    const updated = { ...data, orsPackets: next };
    setData(updated);
    save(updated);
  };

  const setUrineColor = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
    const updated = { ...data, urineColor: level };
    setData(updated);
    save(updated);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('rounded-2xl border border-cyan-500/30 bg-cyan-50/30 p-4 shadow-sm dark:bg-cyan-950/10', className)}
      aria-label={lang === 'ur' ? 'پانی کی سطح' : lang === 'roman' ? 'Paani ki satah' : 'Hydration tracker'}
    >
      {/* header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
          <Droplets className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">
            {lang === 'ur' ? 'پانی کی سطح' : lang === 'roman' ? 'Paani ki satah' : 'Hydration tracker'}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {lang === 'ur' ? 'ORS + پانی + پیشاب کا رنگ' : lang === 'roman' ? 'ORS + paani + peshab ka rang' : 'Water + ORS + urine color'}
          </p>
        </div>
        {isGoalMet ? (
          <Badge variant="secondary" className="bg-emerald-500/15 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="mr-1 h-2.5 w-2.5" aria-hidden />
            {lang === 'ur' ? 'ہدف مکمل' : lang === 'roman' ? 'Hadaf mukammal' : 'Goal met'}
          </Badge>
        ) : null}
      </div>

      {/* progress ring + total */}
      <div className="mb-3 flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/20" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              className={isGoalMet ? 'text-emerald-500' : 'text-cyan-500'}
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-foreground">{totalMl}</span>
            <span className="text-[9px] text-muted-foreground">ml</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">
            {lang === 'ur' ? 'روزانہ کا ہدف' : lang === 'roman' ? 'Rozana ka hadaf' : 'Daily goal'}: <span className="font-bold text-foreground">{DAILY_GOAL_ML} ml</span>
          </p>
          <p className="text-[11px] text-muted-foreground">
            {pct.toFixed(0)}% · {lang === 'ur' ? 'باقی' : lang === 'roman' ? 'Baaki' : 'remaining'}: {Math.max(0, DAILY_GOAL_ML - totalMl)} ml
          </p>
          {isGoalMet ? (
            <p className="mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ {lang === 'ur' ? 'آج کا ہدف مکمل!' : lang === 'roman' ? 'Aaj ka hadaf mukammal!' : 'Daily goal reached!'}
            </p>
          ) : null}
        </div>
      </div>

      {/* water glasses */}
      <div className="mb-3 rounded-lg border border-border bg-card p-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[11px] font-bold text-foreground">
            {lang === 'ur' ? 'پانی (گلاس)' : lang === 'roman' ? 'Paani (glass)' : 'Water (glasses)'}
          </p>
          <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">{data.waterGlasses} × {GLASS_ML}ml</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => updateWater(-1)} disabled={data.waterGlasses === 0} className="h-8 w-8 p-0">
            <Minus className="h-3.5 w-3.5" aria-hidden />
          </Button>
          <div className="flex flex-1 flex-wrap gap-0.5">
            {Array.from({ length: Math.max(8, data.waterGlasses) }).slice(0, 12).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'flex h-7 w-4 items-center justify-center rounded-sm border text-[8px]',
                  i < data.waterGlasses
                    ? 'border-cyan-500/40 bg-cyan-500/20 text-cyan-700 dark:text-cyan-400'
                    : 'border-border bg-muted/30 text-muted-foreground/20',
                )}
                aria-hidden
              >
                <Droplets className="h-2.5 w-2.5" />
              </div>
            ))}
          </div>
          <Button variant="default" size="sm" onClick={() => updateWater(1)} className="h-8 w-8 gap-0 p-0 bg-cyan-600 hover:bg-cyan-700">
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      </div>

      {/* ORS packets */}
      <div className="mb-3 rounded-lg border border-orange-500/20 bg-orange-50/30 p-2.5 dark:bg-orange-950/10">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[11px] font-bold text-foreground">
            {lang === 'ur' ? 'ORS پیکیٹ' : lang === 'roman' ? 'ORS packet' : 'ORS packets'}
          </p>
          <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{data.orsPackets} × {ORS_PACKET_ML}ml</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => updateOrs(-1)} disabled={data.orsPackets === 0} className="h-8 w-8 p-0 border-orange-500/30">
            <Minus className="h-3.5 w-3.5" aria-hidden />
          </Button>
          <p className="flex-1 text-[10px] text-muted-foreground">
            {lang === 'ur'
              ? 'ORS پیچش یا الٹی کے بعد ضروری ہے۔ ایک پیکیٹ ایک لیٹر پانی میں ملا کر استعمال کریں۔'
              : lang === 'roman'
                ? 'ORS pechish ya ulti ke baad zaroori hai. Ek packet ek litre paani mein mila kar istemal karein.'
                : 'Use ORS after diarrhea or vomiting. Mix 1 packet in 1 liter clean water.'}
          </p>
          <Button variant="default" size="sm" onClick={() => updateOrs(1)} className="h-8 w-8 gap-0 p-0 bg-orange-600 hover:bg-orange-700">
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      </div>

      {/* urine color chart */}
      <div className="rounded-lg border border-border bg-card p-2.5">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-foreground">
          <Activity className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" aria-hidden />
          {lang === 'ur' ? 'پیشاب کا رنگ (خود جائزہ)' : lang === 'roman' ? 'Peshab ka rang (khud jaiza)' : 'Urine color (self-check)'}
        </p>
        <div className="grid grid-cols-6 gap-1">
          {URINE_COLORS.map((uc) => (
            <button
              key={uc.level}
              type="button"
              onClick={() => setUrineColor(uc.level)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg border p-1 transition-colors',
                data.urineColor === uc.level ? 'border-primary/50 ring-1 ring-primary/30' : 'border-border hover:bg-accent/30',
              )}
              title={uc.label[lang]}
            >
              <span className="h-6 w-full rounded" style={{ backgroundColor: uc.color }} aria-hidden />
              <span className="text-[8px] font-bold text-muted-foreground">{uc.level}</span>
            </button>
          ))}
        </div>
        {urineStatus ? (
          <div className={cn(
            'mt-2 rounded-md p-2 text-[10px] leading-relaxed',
            urineStatus.severity === 'good' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
            urineStatus.severity === 'ok' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' :
            'bg-red-500/10 text-red-700 dark:text-red-400',
          )}>
            <span className="font-bold">{urineStatus.label[lang]}</span> — {urineStatus.status[lang]}
          </div>
        ) : (
          <p className="mt-2 text-center text-[9px] text-muted-foreground">
            {lang === 'ur' ? 'اپنے پیشاب کا رنگ منتخب کریں' : lang === 'roman' ? 'Apne peshab ka rang muntakhib karein' : 'Select your urine color for hydration check'}
          </p>
        )}
      </div>

      {/* dehydration warning */}
      {isDehydrated ? (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-50/40 p-2.5 dark:bg-red-950/20">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
          <div>
            <p className="text-[10px] font-bold text-red-700 dark:text-red-400">
              {lang === 'ur' ? 'پانی کی شدید کمی' : lang === 'roman' ? 'Paani ki shadeed kami' : 'Severe dehydration'}
            </p>
            <p className="text-[10px] leading-relaxed text-red-700 dark:text-red-400">
              {lang === 'ur'
                ? 'فوراً زیادہ پانی یا ORS لیں۔ اگر سانس لینے میں مشکل، الجھن، یا پیشاب نہ آنا ہو تو 1122 پر کال کریں۔'
                : lang === 'roman'
                  ? 'Fori zyada paani ya ORS lein. Agar saans lene mein mushkil, uljhan, ya peshab na aana ho to 1122 par call karein.'
                  : 'Drink water or ORS immediately. Call 1122 if breathing difficulty, confusion, or no urine.'}
            </p>
          </div>
        </div>
      ) : null}

      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        {lang === 'ur' ? 'گرم موسم میں 3+ لیٹر پانی ضروری ہے' : lang === 'roman' ? 'Garm mausam mein 3+ litre paani zaroori hai' : 'In hot weather, 3+ liters daily is essential'}
      </p>
    </motion.section>
  );
}
