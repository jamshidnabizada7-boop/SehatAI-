'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Apple,
  Droplets,
  Footprints,
  Plus,
  Minus,
  Scale,
  Activity,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Lang } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Nutrition + Lifestyle Tracker (Phase 2)
// BMI calculator, water intake tracker, physical activity log.
// Designed for Pakistan where:
//   - Diabetes prevalence ~26% (world's highest)
//   - Obesity rising rapidly in urban areas
//   - Dehydration common in summer (40°C+)
//
// Privacy: all data in localStorage (sehatai.lifestyle.v1).
// ============================================================

const STORAGE_KEY = 'sehatai.lifestyle.v1';

interface LifestyleData {
  /** ISO date (YYYY-MM-DD) → water glasses (1 glass = 250ml) */
  water: Record<string, number>;
  /** ISO date → steps */
  steps: Record<string, number>;
  /** height (cm) + weight (kg) for BMI */
  heightCm?: number;
  weightKg?: number;
  /** ISO timestamp of last BMI update */
  bmiUpdatedAt?: string;
}

function load(): LifestyleData {
  if (typeof window === 'undefined') return { water: {}, steps: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { water: {}, steps: {} };
    const parsed = JSON.parse(raw) as Partial<LifestyleData>;
    return {
      water: typeof parsed.water === 'object' && parsed.water ? parsed.water : {},
      steps: typeof parsed.steps === 'object' && parsed.steps ? parsed.steps : {},
      heightCm: typeof parsed.heightCm === 'number' ? parsed.heightCm : undefined,
      weightKg: typeof parsed.weightKg === 'number' ? parsed.weightKg : undefined,
      bmiUpdatedAt: typeof parsed.bmiUpdatedAt === 'string' ? parsed.bmiUpdatedAt : undefined,
    };
  } catch {
    return { water: {}, steps: {} };
  }
}

function save(data: LifestyleData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function bmiCategory(bmi: number): { label: string; color: string; advice: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-amber-600 dark:text-amber-400', advice: 'Eat more nutritious food. See a doctor if unintentional weight loss.' };
  if (bmi < 25) return { label: 'Normal', color: 'text-emerald-600 dark:text-emerald-400', advice: 'Healthy weight — maintain your lifestyle.' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-orange-600 dark:text-orange-400', advice: 'Increase physical activity + reduce sugary drinks. See a doctor for guidance.' };
  return { label: 'Obese', color: 'text-red-600 dark:text-red-400', advice: 'See a doctor for a weight management plan. Even small losses help.' };
}

const waterGoalGlasses = 8; // 8 glasses = 2L
const STEP_GOAL = 10000;

interface NutritionLifestyleTrackerProps {
  lang: Lang;
  className?: string;
}

export function NutritionLifestyleTracker({ lang, className }: NutritionLifestyleTrackerProps) {
  const [data, setData] = useState<LifestyleData>(() => load());
  const [heightInput, setHeightInput] = useState(data.heightCm?.toString() ?? '');
  const [weightInput, setWeightInput] = useState(data.weightKg?.toString() ?? '');

  const today = todayKey();
  const todayWater = data.water[today] ?? 0;
  const todaySteps = data.steps[today] ?? 0;

  const bmi = useMemo(() => {
    if (!data.heightCm || !data.weightKg || data.heightCm < 50 || data.weightKg < 20) return null;
    const m = data.heightCm / 100;
    return data.weightKg / (m * m);
  }, [data.heightCm, data.weightKg]);

  const bmiCat = bmi ? bmiCategory(bmi) : null;

  const addWater = (delta: number) => {
    const next = Math.max(0, Math.min(20, todayWater + delta));
    const updated = { ...data, water: { ...data.water, [today]: next } };
    setData(updated);
    save(updated);
  };

  const setSteps = (value: number) => {
    const updated = { ...data, steps: { ...data.steps, [today]: Math.max(0, value) } };
    setData(updated);
    save(updated);
  };

  const saveBmi = () => {
    const h = parseInt(heightInput, 10);
    const w = parseInt(weightInput, 10);
    if (!h || !w || h < 50 || h > 250 || w < 20 || w > 300) return;
    const updated = { ...data, heightCm: h, weightKg: w, bmiUpdatedAt: new Date().toISOString() };
    setData(updated);
    save(updated);
  };

  const waterPct = Math.min(100, (todayWater / waterGoalGlasses) * 100);
  const stepPct = Math.min(100, (todaySteps / STEP_GOAL) * 100);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('rounded-2xl border border-lime-500/30 bg-lime-50/30 p-4 shadow-sm dark:bg-lime-950/10', className)}
      aria-label={lang === 'ur' ? 'غذائیت اور طرز زندگی' : lang === 'roman' ? 'Ghazaiyat aur tarz-e-zindagi' : 'Nutrition + lifestyle'}
    >
      {/* header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-lime-500/15 text-lime-600 dark:text-lime-400">
          <Apple className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3 className="text-sm font-bold text-foreground">
            {lang === 'ur' ? 'غذائیت اور طرز زندگی' : lang === 'roman' ? 'Ghazaiyat aur tarz-e-zindagi' : 'Nutrition + lifestyle'}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {lang === 'ur' ? 'BMI + پانی + سرگرمی' : lang === 'roman' ? 'BMI + paani + sargarmi' : 'BMI + water + activity'}
          </p>
        </div>
      </div>

      {/* BMI calculator */}
      <div className="mb-3 rounded-xl border border-border bg-card p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <Scale className="h-4 w-4 text-lime-600 dark:text-lime-400" aria-hidden />
          <p className="text-xs font-bold text-foreground">
            {lang === 'ur' ? 'بی ایم آئی کیلکولیٹر' : lang === 'roman' ? 'BMI calculator' : 'BMI calculator'}
          </p>
          {bmi && bmiCat ? (
            <span className={cn('ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold', bmiCat.color, 'bg-muted')}>
              {bmi.toFixed(1)} · {bmiCat.label}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1">
            <Label className="mb-1 block text-[10px] font-bold text-muted-foreground">
              {lang === 'ur' ? 'قد (cm)' : lang === 'roman' ? 'Qad (cm)' : 'Height (cm)'}
            </Label>
            <Input type="number" value={heightInput} onChange={(e) => setHeightInput(e.target.value)} placeholder="170" className="h-9" />
          </div>
          <div className="flex-1">
            <Label className="mb-1 block text-[10px] font-bold text-muted-foreground">
              {lang === 'ur' ? 'وزن (kg)' : lang === 'roman' ? 'Wazan (kg)' : 'Weight (kg)'}
            </Label>
            <Input type="number" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} placeholder="70" className="h-9" />
          </div>
          <Button size="sm" onClick={saveBmi} className="h-9 gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            {lang === 'ur' ? 'محفوظ' : lang === 'roman' ? 'Mehfooz' : 'Save'}
          </Button>
        </div>

        {/* BMI scale */}
        {bmi ? (
          <div className="mt-2">
            <div className="relative h-2 overflow-hidden rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-red-400">
              <div
                className="absolute top-1/2 h-3.5 w-1 -translate-y-1/2 rounded-full border-2 border-background bg-foreground"
                style={{ left: `${Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100))}%` }}
                aria-hidden
              />
            </div>
            <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
              <span>15</span>
              <span>18.5</span>
              <span>25</span>
              <span>30</span>
              <span>40</span>
            </div>
            {bmiCat ? (
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{bmiCat.advice}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Water intake */}
      <div className="mb-3 rounded-xl border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Droplets className="h-4 w-4 text-cyan-600 dark:text-cyan-400" aria-hidden />
            <p className="text-xs font-bold text-foreground">
              {lang === 'ur' ? 'پانی' : lang === 'roman' ? 'Paani' : 'Water intake'}
            </p>
          </div>
          <span className={cn('text-xs font-bold', todayWater >= waterGoalGlasses ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
            {todayWater} / {waterGoalGlasses} {lang === 'ur' ? 'گلاس' : lang === 'roman' ? 'glass' : 'glasses'}
          </span>
        </div>

        {/* progress */}
        <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${waterPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* glasses visualization */}
        <div className="mb-2 flex flex-wrap gap-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex h-7 w-5 items-center justify-center rounded-md border text-[10px]',
                i < todayWater
                  ? 'border-cyan-500/40 bg-cyan-500/20 text-cyan-700 dark:text-cyan-400'
                  : 'border-border bg-muted/30 text-muted-foreground/30',
              )}
              aria-hidden
            >
              <Droplets className="h-3 w-3" />
            </div>
          ))}
        </div>

        {/* buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => addWater(-1)} disabled={todayWater === 0} className="h-8 flex-1 gap-1">
            <Minus className="h-3 w-3" aria-hidden />
            1
          </Button>
          <Button variant="default" size="sm" onClick={() => addWater(1)} className="h-8 flex-1 gap-1">
            <Plus className="h-3 w-3" aria-hidden />
            1 {lang === 'ur' ? 'گلاس' : lang === 'roman' ? 'glass' : 'glass'}
          </Button>
        </div>
        {todayWater >= waterGoalGlasses ? (
          <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            {lang === 'ur' ? 'آج کا ہدف مکمل!' : lang === 'roman' ? 'Aaj ka hadaf mukammal!' : 'Daily goal reached!'}
          </p>
        ) : null}
      </div>

      {/* Physical activity */}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Footprints className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden />
            <p className="text-xs font-bold text-foreground">
              {lang === 'ur' ? 'سرگرمی (قدم)' : lang === 'roman' ? 'Sargarmi (qadam)' : 'Activity (steps)'}
            </p>
          </div>
          <span className={cn('text-xs font-bold', todaySteps >= STEP_GOAL ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
            {todaySteps.toLocaleString()} / {STEP_GOAL.toLocaleString()}
          </span>
        </div>

        {/* progress ring */}
        <div className="mb-2 flex items-center gap-3">
          <div className="relative h-16 w-16 shrink-0">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/30" />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className="text-violet-500"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - stepPct / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.4s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Flame className={cn('h-5 w-5', todaySteps >= STEP_GOAL ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground/40')} aria-hidden />
            </div>
          </div>
          <div className="flex-1">
            <Input
              type="number"
              value={todaySteps || ''}
              onChange={(e) => setSteps(parseInt(e.target.value, 10) || 0)}
              placeholder="0"
              className="h-9"
              aria-label={lang === 'ur' ? 'آج کے قدم' : lang === 'roman' ? 'Aaj ke qadam' : 'Today\'s steps'}
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              {stepPct.toFixed(0)}% {lang === 'ur' ? 'ہدف مکمل' : lang === 'roman' ? 'hadaf mukammal' : 'of goal'}
            </p>
          </div>
        </div>

        {todaySteps >= STEP_GOAL ? (
          <p className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            {lang === 'ur' ? 'بہت خوب! آج 10,000 قدم مکمل ہوئے۔' : lang === 'roman' ? 'Bohat khoob! Aaj 10,000 qadam mukammal huey.' : 'Great! 10,000 steps completed today.'}
          </p>
        ) : null}
      </div>

      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        {lang === 'ur' ? 'ڈیٹا صرف اس ڈیوائس پر محفوظ ہے۔' : lang === 'roman' ? 'Data sirf is device par mehfooz hai.' : 'Data stored only on this device.'}
      </p>
    </motion.section>
  );
}
