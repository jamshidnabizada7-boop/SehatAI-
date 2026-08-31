'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import {
  Activity,
  Droplet,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Lang } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Chronic Disease Management Module (Phase 2)
// Combined diabetes (blood glucose) + hypertension (BP) log
// with trend visualization. Designed for Pakistan where:
//   - Diabetes prevalence ~26% (world's highest, IDF)
//   - Hypertension affects ~1 in 3 adults
//
// Privacy: all data in localStorage (sehatai.chronic.v1).
// No server calls.
// ============================================================

const STORAGE_KEY = 'sehatai.chronic.v1';

interface GlucoseEntry {
  at: string; // ISO timestamp
  value: number; // mg/dL
  /** fasting or random */
  type: 'fasting' | 'random';
  notes?: string;
}

interface BpEntry {
  at: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  notes?: string;
}

interface ChronicData {
  glucose: GlucoseEntry[];
  bp: BpEntry[];
}

function load(): ChronicData {
  if (typeof window === 'undefined') return { glucose: [], bp: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { glucose: [], bp: [] };
    const parsed = JSON.parse(raw) as Partial<ChronicData>;
    return {
      glucose: Array.isArray(parsed.glucose) ? parsed.glucose : [],
      bp: Array.isArray(parsed.bp) ? parsed.bp : [],
    };
  } catch {
    return { glucose: [], bp: [] };
  }
}

function save(data: ChronicData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function formatDate(iso: string, lang: Lang): string {
  try {
    const d = new Date(iso);
    const locale = lang === 'ur' ? 'ur-PK' : 'en-PK';
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(d);
  } catch {
    return iso.slice(5, 10);
  }
}

function formatDateTime(iso: string, lang: Lang): string {
  try {
    const d = new Date(iso);
    const locale = lang === 'ur' ? 'ur-PK' : 'en-PK';
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
  } catch {
    return iso;
  }
}

// ---------- Glucose helpers ----------

function glucoseStatus(value: number, type: 'fasting' | 'random'): { label: string; color: string } {
  if (type === 'fasting') {
    if (value < 100) return { label: 'Normal', color: 'text-emerald-600 dark:text-emerald-400' };
    if (value < 126) return { label: 'Pre-diabetes', color: 'text-amber-600 dark:text-amber-400' };
    return { label: 'Diabetes range', color: 'text-red-600 dark:text-red-400' };
  }
  // random
  if (value < 140) return { label: 'Normal', color: 'text-emerald-600 dark:text-emerald-400' };
  if (value < 200) return { label: 'Pre-diabetes', color: 'text-amber-600 dark:text-amber-400' };
  return { label: 'Diabetes range', color: 'text-red-600 dark:text-red-400' };
}

// ---------- BP helpers ----------

function bpStatus(sys: number, dia: number): { label: string; color: string; stage: string } {
  if (sys >= 180 || dia >= 120) return { label: 'Hypertensive crisis', color: 'text-red-700 dark:text-red-400', stage: 'crisis' };
  if (sys >= 140 || dia >= 90) return { label: 'Stage 2 hypertension', color: 'text-red-600 dark:text-red-400', stage: 'stage2' };
  if (sys >= 130 || dia >= 80) return { label: 'Stage 1 hypertension', color: 'text-orange-600 dark:text-orange-400', stage: 'stage1' };
  if (sys >= 120) return { label: 'Elevated', color: 'text-amber-600 dark:text-amber-400', stage: 'elevated' };
  return { label: 'Normal', color: 'text-emerald-600 dark:text-emerald-400', stage: 'normal' };
}

interface ChronicDiseaseModuleProps {
  lang: Lang;
  /** which chronic conditions the user has (from profile) */
  conditions: string[];
  className?: string;
}

export function ChronicDiseaseModule({ lang, conditions, className }: ChronicDiseaseModuleProps) {
  const [data, setData] = useState<ChronicData>(() => load());
  const [showGlucoseForm, setShowGlucoseForm] = useState(false);
  const [showBpForm, setShowBpForm] = useState(false);

  // form state
  const [glucoseValue, setGlucoseValue] = useState('');
  const [glucoseType, setGlucoseType] = useState<'fasting' | 'random'>('fasting');
  const [bpSys, setBpSys] = useState('');
  const [bpDia, setBpDia] = useState('');
  const [bpPulse, setBpPulse] = useState('');

  const hasDiabetes = conditions.includes('diabetes');
  const hasHtn = conditions.includes('hypertension');
  const showModule = hasDiabetes || hasHtn;

  const addGlucose = () => {
    const v = parseInt(glucoseValue, 10);
    if (!v || v < 20 || v > 600) return;
    const entry: GlucoseEntry = { at: new Date().toISOString(), value: v, type: glucoseType };
    const updated = { ...data, glucose: [...data.glucose, entry].slice(-30) };
    setData(updated);
    save(updated);
    setGlucoseValue('');
    setShowGlucoseForm(false);
  };

  const addBp = () => {
    const s = parseInt(bpSys, 10);
    const d = parseInt(bpDia, 10);
    if (!s || !d || s < 50 || s > 250 || d < 30 || d > 150) return;
    const p = bpPulse ? parseInt(bpPulse, 10) : undefined;
    const entry: BpEntry = { at: new Date().toISOString(), systolic: s, diastolic: d, pulse: p };
    const updated = { ...data, bp: [...data.bp, entry].slice(-30) };
    setData(updated);
    save(updated);
    setBpSys('');
    setBpDia('');
    setBpPulse('');
    setShowBpForm(false);
  };

  const deleteGlucose = (idx: number) => {
    const updated = { ...data, glucose: data.glucose.filter((_, i) => i !== idx) };
    setData(updated);
    save(updated);
  };

  const deleteBp = (idx: number) => {
    const updated = { ...data, bp: data.bp.filter((_, i) => i !== idx) };
    setData(updated);
    save(updated);
  };

  // trend calculation
  const glucoseTrend = useMemo(() => {
    if (data.glucose.length < 2) return 'stable';
    const recent = data.glucose.slice(-3);
    const older = data.glucose.slice(-6, -3);
    if (recent.length === 0 || older.length === 0) return 'stable';
    const rAvg = recent.reduce((s, e) => s + e.value, 0) / recent.length;
    const oAvg = older.reduce((s, e) => s + e.value, 0) / older.length;
    const diff = rAvg - oAvg;
    if (diff < -10) return 'improving';
    if (diff > 10) return 'worsening';
    return 'stable';
  }, [data.glucose]);

  const bpTrend = useMemo(() => {
    if (data.bp.length < 2) return 'stable';
    const recent = data.bp.slice(-3);
    const older = data.bp.slice(-6, -3);
    if (recent.length === 0 || older.length === 0) return 'stable';
    const rAvg = recent.reduce((s, e) => s + e.systolic, 0) / recent.length;
    const oAvg = older.reduce((s, e) => s + e.systolic, 0) / older.length;
    const diff = rAvg - oAvg;
    if (diff < -5) return 'improving';
    if (diff > 5) return 'worsening';
    return 'stable';
  }, [data.bp]);

  if (!showModule) return null;

  const trendConfig = {
    improving: { icon: TrendingDown, label: { en: 'Improving', ur: 'بہتری', roman: 'Behtari' }, cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
    worsening: { icon: TrendingUp, label: { en: 'Worsening', ur: 'خرابی', roman: 'Kharabi' }, cls: 'bg-red-500/15 text-red-700 dark:text-red-400' },
    stable: { icon: Minus, label: { en: 'Stable', ur: 'مستحکم', roman: 'Mustaqil' }, cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('space-y-4', className)}
      aria-label={lang === 'ur' ? 'دماغی بیماری کا انتظام' : lang === 'roman' ? 'Dimaghi bimari ka intezam' : 'Chronic disease management'}
    >
      {/* header */}
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400">
          <Activity className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3 className="text-sm font-bold text-foreground">
            {lang === 'ur' ? 'دماغی بیماری کا انتظام' : lang === 'roman' ? 'Damaghi bimari ka intezam' : 'Chronic disease management'}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {lang === 'ur' ? 'شوگر + بلڈ پریشر لاگ' : lang === 'roman' ? 'Sugar + BP log' : 'Blood glucose + BP log'}
          </p>
        </div>
      </div>

      {/* Diabetes / Glucose section */}
      {hasDiabetes ? (
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Droplet className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden />
              <p className="text-xs font-bold text-foreground">
                {lang === 'ur' ? 'بلڈ شوگر' : lang === 'roman' ? 'Blood sugar' : 'Blood glucose'}
              </p>
              {data.glucose.length >= 2 ? (
                (() => {
                  const cfg = trendConfig[glucoseTrend as keyof typeof trendConfig];
                  const Icon = cfg.icon;
                  return (
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold', cfg.cls)}>
                      <Icon className="h-2.5 w-2.5" aria-hidden />
                      {cfg.label[lang]}
                    </span>
                  );
                })()
              ) : null}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowGlucoseForm((v) => !v)} className="h-7 gap-1 px-2 text-[11px] font-semibold text-primary">
              <Plus className="h-3 w-3" aria-hidden />
              {lang === 'ur' ? 'شامل کریں' : lang === 'roman' ? 'Shamil karein' : 'Add'}
            </Button>
          </div>

          {/* add form */}
          <AnimatePresence>
            {showGlucoseForm ? (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mb-2 rounded-lg border border-border bg-muted/30 p-2.5">
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="flex-1">
                      <Label className="mb-1 block text-[10px] font-bold text-muted-foreground">
                        {lang === 'ur' ? 'شوگر (mg/dL)' : lang === 'roman' ? 'Sugar (mg/dL)' : 'Glucose (mg/dL)'}
                      </Label>
                      <Input type="number" value={glucoseValue} onChange={(e) => setGlucoseValue(e.target.value)} placeholder="120" className="h-9" />
                    </div>
                    <div>
                      <Label className="mb-1 block text-[10px] font-bold text-muted-foreground">
                        {lang === 'ur' ? 'قسم' : lang === 'roman' ? 'Qisam' : 'Type'}
                      </Label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setGlucoseType('fasting')}
                          className={cn('rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-colors', glucoseType === 'fasting' ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border text-muted-foreground')}
                        >
                          {lang === 'ur' ? 'فاسٹنگ' : lang === 'roman' ? 'Fasting' : 'Fasting'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setGlucoseType('random')}
                          className={cn('rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-colors', glucoseType === 'random' ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border text-muted-foreground')}
                        >
                          {lang === 'ur' ? 'رینڈم' : lang === 'roman' ? 'Random' : 'Random'}
                        </button>
                      </div>
                    </div>
                    <Button size="sm" onClick={addGlucose} className="h-9 gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      {lang === 'ur' ? 'محفوظ' : lang === 'roman' ? 'Mehfooz' : 'Save'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* chart */}
          {data.glucose.length >= 2 ? (
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={data.glucose.map((e) => ({ date: formatDate(e.at, lang), value: e.value }))} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="glucoseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted-foreground/20" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'currentColor' }} className="text-muted-foreground" interval="preserveStartEnd" />
                <YAxis domain={[50, 300]} tick={{ fontSize: 9, fill: 'currentColor' }} className="text-muted-foreground" width={30} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                  formatter={(v: number) => [`${v} mg/dL`, 'Glucose']}
                />
                <Area type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={2} fill="url(#glucoseGrad)" dot={{ fill: '#14b8a6', r: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-3 text-center text-[11px] text-muted-foreground">
              {lang === 'ur' ? 'رجحان دیکھنے کے لیے کم از کم 2 ریڈنگز درکار ہیں' : lang === 'roman' ? 'Rujhan dekhne ke liye kam az kam 2 readings darkaar hain' : 'Add at least 2 readings to see a trend'}
            </p>
          )}

          {/* recent entries */}
          {data.glucose.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {[...data.glucose].reverse().slice(0, 5).map((e, revIdx) => {
                const idx = data.glucose.length - 1 - revIdx;
                const status = glucoseStatus(e.value, e.type);
                return (
                  <li key={idx} className="flex items-center gap-2 rounded-md border border-border/60 bg-background/40 p-1.5">
                    <span className={cn('text-xs font-bold', status.color)}>{e.value}</span>
                    <span className="text-[10px] text-muted-foreground">mg/dL</span>
                    <Badge2 label={e.type} />
                    <Badge2 label={status.label} className={status.color} />
                    <span className="ml-auto text-[10px] text-muted-foreground">{formatDateTime(e.at, lang)}</span>
                    <button type="button" onClick={() => deleteGlucose(idx)} className="text-muted-foreground/40 hover:text-red-600" aria-label="Delete">
                      <Trash2 className="h-3 w-3" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}

      {/* Hypertension / BP section */}
      {hasHtn ? (
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-rose-600 dark:text-rose-400" aria-hidden />
              <p className="text-xs font-bold text-foreground">
                {lang === 'ur' ? 'بلڈ پریشر' : lang === 'roman' ? 'Blood pressure' : 'Blood pressure'}
              </p>
              {data.bp.length >= 2 ? (
                (() => {
                  const cfg = trendConfig[bpTrend as keyof typeof trendConfig];
                  const Icon = cfg.icon;
                  return (
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold', cfg.cls)}>
                      <Icon className="h-2.5 w-2.5" aria-hidden />
                      {cfg.label[lang]}
                    </span>
                  );
                })()
              ) : null}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowBpForm((v) => !v)} className="h-7 gap-1 px-2 text-[11px] font-semibold text-primary">
              <Plus className="h-3 w-3" aria-hidden />
              {lang === 'ur' ? 'شامل کریں' : lang === 'roman' ? 'Shamil karein' : 'Add'}
            </Button>
          </div>

          {/* add form */}
          <AnimatePresence>
            {showBpForm ? (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mb-2 rounded-lg border border-border bg-muted/30 p-2.5">
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="flex-1">
                      <Label className="mb-1 block text-[10px] font-bold text-muted-foreground">
                        {lang === 'ur' ? 'سسٹولک' : lang === 'roman' ? 'Systolic' : 'Systolic'}
                      </Label>
                      <Input type="number" value={bpSys} onChange={(e) => setBpSys(e.target.value)} placeholder="120" className="h-9" />
                    </div>
                    <div className="flex-1">
                      <Label className="mb-1 block text-[10px] font-bold text-muted-foreground">
                        {lang === 'ur' ? 'ڈایاسٹولک' : lang === 'roman' ? 'Diastolic' : 'Diastolic'}
                      </Label>
                      <Input type="number" value={bpDia} onChange={(e) => setBpDia(e.target.value)} placeholder="80" className="h-9" />
                    </div>
                    <div className="flex-1">
                      <Label className="mb-1 block text-[10px] font-bold text-muted-foreground">
                        {lang === 'ur' ? 'نبض' : lang === 'roman' ? 'Nabz' : 'Pulse'}
                      </Label>
                      <Input type="number" value={bpPulse} onChange={(e) => setBpPulse(e.target.value)} placeholder="72" className="h-9" />
                    </div>
                    <Button size="sm" onClick={addBp} className="h-9 gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      {lang === 'ur' ? 'محفوظ' : lang === 'roman' ? 'Mehfooz' : 'Save'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* chart */}
          {data.bp.length >= 2 ? (
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={data.bp.map((e) => ({ date: formatDate(e.at, lang), sys: e.systolic, dia: e.diastolic }))} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="bpSysGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted-foreground/20" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'currentColor' }} className="text-muted-foreground" interval="preserveStartEnd" />
                <YAxis domain={[60, 200]} tick={{ fontSize: 9, fill: 'currentColor' }} className="text-muted-foreground" width={30} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                  formatter={(v: number, n: string) => [`${v} mmHg`, n === 'sys' ? 'Systolic' : 'Diastolic']}
                />
                <Area type="monotone" dataKey="sys" stroke="#f43f5e" strokeWidth={2} fill="url(#bpSysGrad)" dot={{ fill: '#f43f5e', r: 2 }} />
                <Area type="monotone" dataKey="dia" stroke="#fb7185" strokeWidth={1.5} fill="none" dot={{ fill: '#fb7185', r: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-3 text-center text-[11px] text-muted-foreground">
              {lang === 'ur' ? 'رجحان دیکھنے کے لیے کم از کم 2 ریڈنگز درکار ہیں' : lang === 'roman' ? 'Rujhan dekhne ke liye kam az kam 2 readings darkaar hain' : 'Add at least 2 readings to see a trend'}
            </p>
          )}

          {/* recent entries */}
          {data.bp.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {[...data.bp].reverse().slice(0, 5).map((e, revIdx) => {
                const idx = data.bp.length - 1 - revIdx;
                const status = bpStatus(e.systolic, e.diastolic);
                return (
                  <li key={idx} className="flex items-center gap-2 rounded-md border border-border/60 bg-background/40 p-1.5">
                    <span className={cn('text-xs font-bold', status.color)}>{e.systolic}/{e.diastolic}</span>
                    <span className="text-[10px] text-muted-foreground">mmHg</span>
                    {e.pulse ? (
                      <>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{lang === 'ur' ? 'نبض' : lang === 'roman' ? 'Nabz' : 'Pulse'}: {e.pulse}</span>
                      </>
                    ) : null}
                    <Badge2 label={status.label} className={status.color} />
                    <span className="ml-auto text-[10px] text-muted-foreground">{formatDateTime(e.at, lang)}</span>
                    <button type="button" onClick={() => deleteBp(idx)} className="text-muted-foreground/40 hover:text-red-600" aria-label="Delete">
                      <Trash2 className="h-3 w-3" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {/* high BP warning */}
          {data.bp.length > 0 ? (
            (() => {
              const last = data.bp[data.bp.length - 1];
              const status = bpStatus(last.systolic, last.diastolic);
              if (status.stage === 'crisis' || status.stage === 'stage2') {
                return (
                  <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-red-500/30 bg-red-50/40 p-2 dark:bg-red-950/20">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
                    <span className="text-[10px] leading-relaxed text-red-700 dark:text-red-400">
                      {lang === 'ur'
                        ? 'آپ کی بلڈ پریشر بہت زیادہ ہے۔ اپنے ڈاکٹر سے رابطہ کریں۔ اگر سینے میں درد، سانس کی تکلیف، یا الجھن ہو تو 1122 پر کال کریں۔'
                        : lang === 'roman'
                          ? 'Aap ki blood pressure bohat zyada hai. Apne doctor se rabta karein. Agar seene mein dard, saans ki takleef, ya uljhan ho to 1122 par call karein.'
                          : 'Your blood pressure is very high. Contact your doctor. Call 1122 if you have chest pain, breathing difficulty, or confusion.'}
                    </span>
                  </div>
                );
              }
              return null;
            })()
          ) : null}
        </div>
      ) : null}

      <p className="text-center text-[10px] text-muted-foreground">
        {lang === 'ur' ? 'ڈیٹا صرف اس ڈیوائس پر محفوظ ہے۔' : lang === 'roman' ? 'Data sirf is device par mehfooz hai.' : 'Data stored only on this device.'}
      </p>
    </motion.section>
  );
}

function Badge2({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn('rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-bold capitalize', className)}>{label}</span>
  );
}
