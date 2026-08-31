'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  Baby,
  Activity,
  Pill,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Lang } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Medical Calculator Suite (Phase 2)
// Common clinical calculators used in Pakistani OPD clinics:
//   1. Pregnancy due date (Naegele's rule + gestational age)
//   2. GFR estimate (Cockcroft-Gault for drug dosing)
//   3. Insulin sensitivity factor (for Type 1 diabetes)
//
// Safety: these are INFORMATIONAL calculators, NOT prescriptions.
// Results always say "consult your doctor".
// ============================================================

type CalcType = 'edd' | 'gfr' | 'insulin';

interface MedicalCalculatorSuiteProps {
  lang: Lang;
  className?: string;
}

export function MedicalCalculatorSuite({ lang, className }: MedicalCalculatorSuiteProps) {
  const [activeCalc, setActiveCalc] = useState<CalcType | null>(null);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('rounded-2xl border border-slate-500/30 bg-slate-50/30 p-4 shadow-sm dark:bg-slate-950/10', className)}
      aria-label={lang === 'ur' ? 'طبی کیلکولیٹر' : lang === 'roman' ? 'Tibbi calculator' : 'Medical calculators'}
    >
      {/* header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-500/15 text-slate-600 dark:text-slate-400">
          <Calculator className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3 className="text-sm font-bold text-foreground">
            {lang === 'ur' ? 'طبی کیلکولیٹر' : lang === 'roman' ? 'Tibbi calculator' : 'Medical calculators'}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {lang === 'ur' ? 'EDD + GFR + انسولین' : lang === 'roman' ? 'EDD + GFR + insulin' : 'EDD + GFR + insulin factor'}
          </p>
        </div>
      </div>

      {/* calc selector */}
      <div className="grid grid-cols-1 gap-2">
        <CalcButton id="edd" icon={Baby} label={lang === 'ur' ? 'حمل کی تاریخ (EDD)' : lang === 'roman' ? 'Hamal ki tareekh (EDD)' : 'Pregnancy due date (EDD)'} desc={lang === 'ur' ? 'Naegele قاعدہ' : lang === 'roman' ? 'Naegele qaida' : 'Naegele\'s rule'} isActive={activeCalc === 'edd'} onClick={() => setActiveCalc(activeCalc === 'edd' ? null : 'edd')} lang={lang} />
        <CalcButton id="gfr" icon={Activity} label={lang === 'ur' ? 'گردے کی کارکردگی (GFR)' : lang === 'roman' ? 'Gurde ki karkardagi (GFR)' : 'Kidney function (GFR)'} desc={lang === 'ur' ? 'Cockcroft-Gault' : 'Cockcroft-Gault'} isActive={activeCalc === 'gfr'} onClick={() => setActiveCalc(activeCalc === 'gfr' ? null : 'gfr')} lang={lang} />
        <CalcButton id="insulin" icon={Pill} label={lang === 'ur' ? 'انسولین فیکٹر' : lang === 'roman' ? 'Insulin factor' : 'Insulin sensitivity'} desc={lang === 'ur' ? 'خوراک کا اندازہ' : lang === 'roman' ? 'Khoraak ka andaza' : 'Dosage estimate'} isActive={activeCalc === 'insulin'} onClick={() => setActiveCalc(activeCalc === 'insulin' ? null : 'insulin')} lang={lang} />
      </div>

      {/* active calc */}
      <AnimatePresence>
        {activeCalc === 'edd' ? <EddCalculator lang={lang} /> : null}
        {activeCalc === 'gfr' ? <GfrCalculator lang={lang} /> : null}
        {activeCalc === 'insulin' ? <InsulinCalculator lang={lang} /> : null}
      </AnimatePresence>

      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        {lang === 'ur' ? 'یہ معلوماتی کیلکولیٹر ہیں — تشخیص نہیں۔' : lang === 'roman' ? 'Yeh maloomati calculator hain — tashkhees nahin.' : 'These are informational calculators — not a diagnosis.'}
      </p>
    </motion.section>
  );
}

function CalcButton({ id, icon: Icon, label, desc, isActive, onClick, lang }: { id: string; icon: typeof Baby; label: string; desc: string; isActive: boolean; onClick: () => void; lang: Lang }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl border p-3 text-start transition-all',
        isActive ? 'border-slate-500/50 bg-slate-500/10' : 'border-border bg-card hover:bg-accent/30',
      )}
    >
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', isActive ? 'bg-slate-500/20 text-slate-600 dark:text-slate-400' : 'bg-muted text-muted-foreground')}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold text-foreground">{label}</span>
        <span className="block text-[10px] text-muted-foreground">{desc}</span>
      </span>
      {isActive ? <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden /> : <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />}
    </button>
  );
}

// ---------- EDD Calculator ----------

function EddCalculator({ lang }: { lang: Lang }) {
  const [lmp, setLmp] = useState('');
  const result = useMemo(() => {
    if (!lmp) return null;
    const lmpDate = new Date(lmp);
    if (isNaN(lmpDate.getTime())) return null;
    const edd = new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000); // +280 days
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    return { edd, weeks, days };
  }, [lmp]);

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
      <div className="mt-2 rounded-lg border border-border bg-card p-3">
        <Label className="mb-1 block text-[11px] font-bold text-muted-foreground">
          {lang === 'ur' ? 'آخری ماہواری (LMP)' : lang === 'roman' ? 'Aakhri mahwari (LMP)' : 'Last menstrual period (LMP)'}
        </Label>
        <Input type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} max={new Date().toISOString().slice(0, 10)} className="h-9" />

        {result ? (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <Stat label={lang === 'ur' ? 'ہفتے' : lang === 'roman' ? 'Haftay' : 'Weeks'} value={`${result.weeks}`} />
              <Stat label={lang === 'ur' ? 'دن' : lang === 'roman' ? 'Din' : 'Days'} value={`${result.days}`} />
              <Stat label={lang === 'ur' ? 'ٹرائمسٹر' : lang === 'roman' ? 'Trimester' : 'Trimester'} value={result.weeks < 14 ? '1' : result.weeks < 28 ? '2' : '3'} />
            </div>
            <div className="rounded-lg border border-pink-500/20 bg-pink-50/30 p-2 dark:bg-pink-950/10">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">{lang === 'ur' ? 'توقع کی تاریخ (EDD)' : lang === 'roman' ? 'Tawaqa ki tareekh (EDD)' : 'Estimated due date (EDD)'}</p>
              <p className="text-sm font-bold text-pink-700 dark:text-pink-400">{result.edd.toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

// ---------- GFR Calculator (Cockcroft-Gault) ----------

function GfrCalculator({ lang }: { lang: Lang }) {
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [creatinine, setCreatinine] = useState('');

  const result = useMemo(() => {
    const a = parseInt(age, 10);
    const w = parseFloat(weight);
    const cr = parseFloat(creatinine);
    if (!a || !w || !cr || cr <= 0) return null;
    const base = ((140 - a) * w) / (72 * cr);
    const gfr = sex === 'female' ? base * 0.85 : base;
    const stage = gfr >= 90 ? 'normal' : gfr >= 60 ? 'mild' : gfr >= 30 ? 'moderate' : gfr >= 15 ? 'severe' : 'failure';
    return { gfr: Math.round(gfr), stage };
  }, [age, weight, sex, creatinine]);

  const stageConfig = {
    normal: { label: { en: 'Normal (G1)', ur: 'نارمل', roman: 'Normal' }, color: 'text-emerald-600 dark:text-emerald-400' },
    mild: { label: { en: 'Mildly decreased (G2)', ur: 'ہلکا کم', roman: 'Halka kam' }, color: 'text-amber-600 dark:text-amber-400' },
    moderate: { label: { en: 'Moderate (G3)', ur: 'درمیانی', roman: 'Darmiyani' }, color: 'text-orange-600 dark:text-orange-400' },
    severe: { label: { en: 'Severe (G4)', ur: 'شدید', roman: 'Shadeed' }, color: 'text-red-600 dark:text-red-400' },
    failure: { label: { en: 'Kidney failure (G5)', ur: 'گردے فیل', roman: 'Gurde fail' }, color: 'text-red-700 dark:text-red-400' },
  };

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
      <div className="mt-2 rounded-lg border border-border bg-card p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="mb-1 block text-[10px] font-bold text-muted-foreground">{lang === 'ur' ? 'عمر' : lang === 'roman' ? 'Umar' : 'Age'}</Label>
            <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="45" className="h-9" />
          </div>
          <div>
            <Label className="mb-1 block text-[10px] font-bold text-muted-foreground">{lang === 'ur' ? 'وزن (kg)' : lang === 'roman' ? 'Wazan (kg)' : 'Weight (kg)'}</Label>
            <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" className="h-9" />
          </div>
        </div>
        <div>
          <Label className="mb-1 block text-[10px] font-bold text-muted-foreground">{lang === 'ur' ? 'جنس' : lang === 'roman' ? 'Jins' : 'Sex'}</Label>
          <div className="flex gap-1">
            <button type="button" onClick={() => setSex('male')} className={cn('rounded-lg border px-3 py-1 text-[11px] font-semibold', sex === 'male' ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>{lang === 'ur' ? 'مرد' : 'Male'}</button>
            <button type="button" onClick={() => setSex('female')} className={cn('rounded-lg border px-3 py-1 text-[11px] font-semibold', sex === 'female' ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>{lang === 'ur' ? 'عورت' : 'Female'}</button>
          </div>
        </div>
        <div>
          <Label className="mb-1 block text-[10px] font-bold text-muted-foreground">{lang === 'ur' ? 'سیرم کریٹینائن (mg/dL)' : lang === 'roman' ? 'Serum creatinine (mg/dL)' : 'Serum creatinine (mg/dL)'}</Label>
          <Input type="number" step="0.1" value={creatinine} onChange={(e) => setCreatinine(e.target.value)} placeholder="1.0" className="h-9" />
        </div>
        {result ? (
          <div className="rounded-lg border border-border bg-muted/30 p-2 text-center">
            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{lang === 'ur' ? 'GFR تخمینہ' : lang === 'roman' ? 'GFR andaza' : 'Estimated GFR'}</p>
            <p className={cn('text-2xl font-bold', stageConfig[result.stage as keyof typeof stageConfig].color)}>{result.gfr} <span className="text-xs text-muted-foreground">mL/min</span></p>
            <p className={cn('text-[11px] font-semibold', stageConfig[result.stage as keyof typeof stageConfig].color)}>{stageConfig[result.stage as keyof typeof stageConfig].label[lang]}</p>
            {result.stage !== 'normal' ? (
              <p className="mt-1 text-[9px] text-muted-foreground">
                {lang === 'ur' ? 'دوا کی خوراک تبدیل کرنے سے پہلے ڈاکٹر سے مشورہ کریں' : lang === 'roman' ? 'Dawa ki khoraak badalne se pehle doctor se mashwara karein' : 'Consult your doctor before adjusting medication doses'}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

// ---------- Insulin Sensitivity Factor ----------

function InsulinCalculator({ lang }: { lang: Lang }) {
  const [tdi, setTdi] = useState(''); // total daily insulin
  const [currentGlucose, setCurrentGlucose] = useState('');
  const [targetGlucose, setTargetGlucose] = useState('120');

  const result = useMemo(() => {
    const t = parseInt(tdi, 10);
    const cg = parseInt(currentGlucose, 10);
    const tg = parseInt(targetGlucose, 10);
    if (!t || !cg || !tg || t <= 0) return null;
    const isf = 1800 / t; // insulin sensitivity factor
    const correction = (cg - tg) / isf;
    return { isf: Math.round(isf), correction: Math.round(correction * 10) / 10 };
  }, [tdi, currentGlucose, targetGlucose]);

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
      <div className="mt-2 rounded-lg border border-border bg-card p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="mb-1 block text-[10px] font-bold text-muted-foreground">{lang === 'ur' ? 'روزانہ انسولین (units)' : lang === 'roman' ? 'Rozana insulin (units)' : 'Daily insulin (units)'}</Label>
            <Input type="number" value={tdi} onChange={(e) => setTdi(e.target.value)} placeholder="40" className="h-9" />
          </div>
          <div>
            <Label className="mb-1 block text-[10px] font-bold text-muted-foreground">{lang === 'ur' ? 'موجودہ شوگر' : lang === 'roman' ? 'Mojooda sugar' : 'Current glucose'}</Label>
            <Input type="number" value={currentGlucose} onChange={(e) => setCurrentGlucose(e.target.value)} placeholder="200" className="h-9" />
          </div>
        </div>
        <div>
          <Label className="mb-1 block text-[10px] font-bold text-muted-foreground">{lang === 'ur' ? 'ہدف شوگر' : lang === 'roman' ? 'Hadaf sugar' : 'Target glucose (mg/dL)'}</Label>
          <Input type="number" value={targetGlucose} onChange={(e) => setTargetGlucose(e.target.value)} placeholder="120" className="h-9" />
        </div>
        {result ? (
          <div className="rounded-lg border border-amber-500/20 bg-amber-50/30 p-2 dark:bg-amber-950/10">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">ISF</p>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-400">1:{result.isf}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{lang === 'ur' ? 'درستگی' : lang === 'roman' ? 'Durustgi' : 'Correction'}</p>
                <p className={cn('text-lg font-bold', result.correction > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
                  {result.correction > 0 ? '+' : ''}{result.correction}u
                </p>
              </div>
            </div>
            <p className="mt-1.5 text-[9px] leading-relaxed text-amber-700 dark:text-amber-400">
              ⚠️ {lang === 'ur'
                ? 'یہ صرف ایک تخمینہ ہے — اپنے ڈاکٹر کی ہدایات پر عمل کریں۔ ہائپو کے خطرے سے بچیں۔'
                : lang === 'roman'
                  ? 'Yeh sirf ek andaza hai — apne doctor ki hidayat par amal karein. Hypo ke khatre se bachein.'
                  : 'This is an estimate only — follow your doctor\'s instructions. Beware of hypoglycemia risk.'}
            </p>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2 text-center">
      <p className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">{label}</p>
      <p className="text-base font-bold text-foreground">{value}</p>
    </div>
  );
}
