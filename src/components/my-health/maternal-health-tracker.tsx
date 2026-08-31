'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Baby,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Heart,
  Clock,
  Phone,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Lang, TriText } from '@/lib/types';
import {
  ANC_SCHEDULE,
  MATERNAL_DANGER_SIGNS,
  POSTNATAL_MILESTONES,
  gestationalAge,
  estimatedDueDate,
  nextAncContact,
  trimester,
} from '@/data/maternal-health';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Maternal Health Tracker (Phase 2)
// WHO 8-visit antenatal care (ANC) schedule tracker.
// Gestational-age-aware: shows current week, trimester, next
// contact due, and maternal danger signs.
//
// Privacy: LMP date stored in localStorage (sehatai.maternal.v1).
// No server calls.
// ============================================================

const LMP_KEY = 'sehatai.maternal.v1';

interface MaternalData {
  lmp: string; // ISO date of last menstrual period
  contactsCompleted: number[]; // contact numbers marked done
}

function loadMaternal(): MaternalData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LMP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MaternalData>;
    return {
      lmp: typeof parsed.lmp === 'string' ? parsed.lmp : '',
      contactsCompleted: Array.isArray(parsed.contactsCompleted) ? parsed.contactsCompleted : [],
    };
  } catch {
    return null;
  }
}

function saveMaternal(data: MaternalData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LMP_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function formatDate(iso: string, lang: Lang): string {
  try {
    const d = new Date(iso);
    const locale = lang === 'ur' ? 'ur-PK' : 'en-PK';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  } catch {
    return iso;
  }
}

interface MaternalHealthTrackerProps {
  lang: Lang;
  isPregnant: boolean;
  className?: string;
}

export function MaternalHealthTracker({ lang, isPregnant, className }: MaternalHealthTrackerProps) {
  const [data, setData] = useState<MaternalData>(() => loadMaternal() ?? { lmp: '', contactsCompleted: [] });
  const [showDangerSigns, setShowDangerSigns] = useState(false);
  const [showPostnatal, setShowPostnatal] = useState(false);

  const ga = useMemo(() => (data.lmp ? gestationalAge(data.lmp) : null), [data.lmp]);
  const edd = useMemo(() => (data.lmp ? estimatedDueDate(data.lmp) : null), [data.lmp]);
  const nextContact = useMemo(() => (ga ? nextAncContact(ga.weeks) : null), [ga]);
  const tri = useMemo(() => (ga ? trimester(ga.weeks) : null), [ga]);

  const updateLmp = (value: string) => {
    const updated = { ...data, lmp: value };
    setData(updated);
    saveMaternal(updated);
  };

  const toggleContact = (contact: number) => {
    const completed = data.contactsCompleted.includes(contact)
      ? data.contactsCompleted.filter((c) => c !== contact)
      : [...data.contactsCompleted, contact];
    const updated = { ...data, contactsCompleted: completed };
    setData(updated);
    saveMaternal(updated);
  };

  if (!isPregnant) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('rounded-2xl border border-pink-500/30 bg-pink-50/30 p-4 shadow-sm dark:bg-pink-950/10', className)}
      aria-label={lang === 'ur' ? 'حمل کا ٹریکر' : lang === 'roman' ? 'Hamal ka tracker' : 'Maternal health tracker'}
    >
      {/* header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-500/15 text-pink-600 dark:text-pink-400">
          <Baby className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">
            {lang === 'ur' ? 'حمل کا ٹریکر' : lang === 'roman' ? 'Hamal ka tracker' : 'Maternal health tracker'}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {lang === 'ur' ? 'عالمی ادارہ صحت 8 ملاقاتیں' : lang === 'roman' ? 'WHO 8 mulaqatein' : 'WHO 8-visit antenatal schedule'}
          </p>
        </div>
        {ga ? (
          <Badge variant="secondary" className="bg-pink-500/15 text-[10px] font-bold text-pink-700 dark:text-pink-400">
            {lang === 'ur' ? `ہفتہ ${ga.weeks}` : lang === 'roman' ? `Hafta ${ga.weeks}` : `Week ${ga.weeks}`}
          </Badge>
        ) : null}
      </div>

      {/* LMP input */}
      <div className="mb-3 rounded-lg border border-border bg-card p-3">
        <Label htmlFor="lmp-date" className="mb-1.5 block text-xs font-semibold text-foreground">
          {lang === 'ur' ? 'آخری ماہواری کی تاریخ' : lang === 'roman' ? 'Aakhri mahwari ki tareekh' : 'Last menstrual period (LMP)'}
        </Label>
        <Input
          id="lmp-date"
          type="date"
          value={data.lmp}
          onChange={(e) => updateLmp(e.target.value)}
          className="h-10 rounded-lg"
          max={new Date().toISOString().slice(0, 10)}
        />
        {data.lmp ? (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {edd ? (
              <>
                {lang === 'ur' ? 'توقع کی تاریخ:' : lang === 'roman' ? 'Tawaqa ki tareekh:' : 'Due date:'}{' '}
                <span className="font-semibold text-foreground">{formatDate(edd, lang)}</span>
              </>
            ) : null}
          </p>
        ) : (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {lang === 'ur'
              ? 'اپنی آخری ماہواری کی تاریخ درج کریں تاکہ حمل کی مدت کا اندازہ ہو سکے۔'
              : lang === 'roman'
                ? 'Apni aakhri mahwari ki tareekh darj karein taake hamal ki muddat ka andaza ho sake.'
                : 'Enter your last period date to track your pregnancy week.'}
          </p>
        )}
      </div>

      {/* gestational age + trimester */}
      {ga && tri ? (
        <div className="mb-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border bg-card p-2 text-center">
            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {lang === 'ur' ? 'ہفتہ' : lang === 'roman' ? 'Hafta' : 'Week'}
            </p>
            <p className="text-lg font-bold text-pink-600 dark:text-pink-400">{ga.weeks}<span className="text-xs">+{ga.days}</span></p>
          </div>
          <div className="rounded-lg border border-border bg-card p-2 text-center">
            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {lang === 'ur' ? 'ٹرائمسٹر' : lang === 'roman' ? 'Trimester' : 'Trimester'}
            </p>
            <p className="text-lg font-bold text-foreground">{tri === 1 ? '1st' : tri === 2 ? '2nd' : '3rd'}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-2 text-center">
            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {lang === 'ur' ? 'باقی' : lang === 'roman' ? 'Baaki' : 'Remaining'}
            </p>
            <p className="text-lg font-bold text-foreground">{Math.max(0, 40 - ga.weeks)}<span className="text-xs">w</span></p>
          </div>
        </div>
      ) : null}

      {/* next contact due */}
      {nextContact ? (
        <div className="mb-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" aria-hidden />
            <p className="text-xs font-bold text-foreground">
              {lang === 'ur' ? `اگلی ملاقات: ہفتہ ${nextContact.week}` : lang === 'roman' ? `Agli mulaqat: hafta ${nextContact.week}` : `Next contact: week ${nextContact.week}`}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{nextContact.title[lang]}</p>
        </div>
      ) : ga && ga.weeks >= 40 ? (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-50/40 p-3 dark:bg-red-950/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden />
            <p className="text-xs font-bold text-red-700 dark:text-red-400">
              {lang === 'ur' ? 'تاریخ گزر گئی — ڈاکٹر سے رابطہ کریں' : lang === 'roman' ? 'Tareekh guzar gayi — doctor se rabta karein' : 'Overdue — contact your doctor'}
            </p>
          </div>
        </div>
      ) : null}

      {/* ANC schedule checklist */}
      <div className="mb-3">
        <p className="mb-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          {lang === 'ur' ? '8 ملاقاتیں' : lang === 'roman' ? '8 mulaqatein' : '8-visit schedule'}
        </p>
        <ul className="space-y-1.5">
          {ANC_SCHEDULE.map((c) => {
            const isDone = data.contactsCompleted.includes(c.contact);
            const isDue = ga ? ga.weeks >= c.week && !isDone : false;
            return (
              <li key={c.contact}>
                <button
                  type="button"
                  onClick={() => toggleContact(c.contact)}
                  className={cn(
                    'flex w-full items-start gap-2 rounded-lg border p-2 text-start transition-colors',
                    isDone
                      ? 'border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/15'
                      : isDue
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border bg-card hover:bg-accent/30',
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground">{c.contact}.</span>
                      <span className="text-xs font-semibold text-foreground">{c.title[lang]}</span>
                      <Badge variant="secondary" className={cn('ml-auto text-[9px] font-bold', isDue ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                        {lang === 'ur' ? `ہفتہ ${c.week}` : lang === 'roman' ? `Hafta ${c.week}` : `Week ${c.week}`}
                      </Badge>
                    </span>
                    {isDue ? (
                      <span className="mt-0.5 block text-[10px] text-primary">
                        {lang === 'ur' ? 'ابھی واجب الادا' : lang === 'roman' ? 'Abhi wajib-ul-ada' : 'Due now'}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* danger signs button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDangerSigns((v) => !v)}
        className="mb-2 w-full gap-1.5 rounded-lg border-red-500/40 text-xs font-semibold text-red-700 hover:bg-red-500/10 dark:text-red-400"
      >
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
        {lang === 'ur' ? 'خطرے کی علامات' : lang === 'roman' ? 'Khatre ki alamaat' : 'Maternal danger signs'}
        <ChevronRight className={cn('ml-auto h-3 w-3 transition-transform', showDangerSigns && 'rotate-90')} aria-hidden />
      </Button>

      <AnimatePresence>
        {showDangerSigns ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-2 rounded-lg border border-red-500/30 bg-red-50/30 p-2 dark:bg-red-950/15">
              <ul className="space-y-1">
                {MATERNAL_DANGER_SIGNS.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                    <span className="flex-1">
                      <span className="font-semibold text-red-700 dark:text-red-400">{d.symptom[lang]}</span>
                      <span className="text-muted-foreground"> — {d.action[lang]}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href="tel:1122"
                className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-red-600 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
              >
                <Phone className="h-3 w-3" aria-hidden />
                1122
              </a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* postnatal button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowPostnatal((v) => !v)}
        className="w-full gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <Heart className="h-3.5 w-3.5" aria-hidden />
        {lang === 'ur' ? 'پیدائش کے بعد کی دیکھ بھال' : lang === 'roman' ? 'Paidaish ke baad ki dekh bhaal' : 'Postnatal care milestones'}
        <ChevronRight className={cn('ml-auto h-3 w-3 transition-transform', showPostnatal && 'rotate-90')} aria-hidden />
      </Button>

      <AnimatePresence>
        {showPostnatal ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2 rounded-lg border border-border bg-card p-2">
              {POSTNATAL_MILESTONES.map((m, i) => (
                <div key={i} className="rounded-md border border-border/60 bg-background/40 p-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-pink-600 dark:text-pink-400" aria-hidden />
                    <p className="text-[11px] font-bold text-foreground">
                      {m.day === 42 ? '6 weeks' : m.day === 1 ? '24h' : `Day ${m.day}`} — {m.title[lang]}
                    </p>
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {m.checks.map((c, j) => (
                      <li key={j} className="flex items-start gap-1 text-[10px] leading-relaxed text-muted-foreground">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" aria-hidden />
                        {c[lang]}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        {lang === 'ur' ? 'معلومات عالمی ادارہ صحت (WHO) سے' : lang === 'roman' ? 'Maloomat WHO se' : 'Information from WHO (2016 ANC guidelines)'}
      </p>
    </motion.section>
  );
}
