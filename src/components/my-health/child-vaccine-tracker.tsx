'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Syringe,
  CheckCircle2,
  Circle,
  Shield,
  Calendar,
  ChevronRight,
  Baby,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Lang } from '@/lib/types';
import { EPI_SCHEDULE, EPI_AGE_GROUPS, dosesForAge } from '@/data/child-immunization';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Child Vaccine Schedule Tracker (Phase 2)
// Pakistan EPI (Expanded Programme on Immunization) schedule.
// Parents track their child's vaccination progress from birth
// to 18 months. Shows which doses are due, overdue, or done.
//
// Privacy: child DOB + completed doses stored in localStorage
// (sehatai.child-vax.v1). No server calls.
// ============================================================

const VAX_KEY = 'sehatai.child-vax.v1';

interface ChildVaxData {
  dob: string; // ISO date
  completed: string[]; // vaccine ids marked done
}

function loadVax(): ChildVaxData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(VAX_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ChildVaxData>;
    return {
      dob: typeof parsed.dob === 'string' ? parsed.dob : '',
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
    };
  } catch {
    return null;
  }
}

function saveVax(data: ChildVaxData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(VAX_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/** Calculate child age in months. */
function childAgeMonths(dob: string): number {
  const d = new Date(dob);
  if (isNaN(d.getTime())) return 0;
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

/** Is this age milestone due? (child is old enough) */
function isAgeDue(ageStr: string, ageMonths: number): boolean {
  if (ageStr === 'Birth') return ageMonths >= 0;
  if (ageStr === '6 weeks') return ageMonths >= 1.5;
  if (ageStr === '10 weeks') return ageMonths >= 2.5;
  if (ageStr === '14 weeks') return ageMonths >= 3.5;
  if (ageStr === '9 months') return ageMonths >= 9;
  if (ageStr === '15-18 months') return ageMonths >= 15;
  return false;
}

interface ChildVaccineTrackerProps {
  lang: Lang;
  className?: string;
}

export function ChildVaccineTracker({ lang, className }: ChildVaccineTrackerProps) {
  const [data, setData] = useState<ChildVaxData>(() => loadVax() ?? { dob: '', completed: [] });

  const ageMonths = useMemo(() => (data.dob ? childAgeMonths(data.dob) : 0), [data.dob]);

  const updateDob = (value: string) => {
    const updated = { ...data, dob: value };
    setData(updated);
    saveVax(updated);
  };

  const toggleDose = (id: string) => {
    const completed = data.completed.includes(id)
      ? data.completed.filter((x) => x !== id)
      : [...data.completed, id];
    const updated = { ...data, completed };
    setData(updated);
    saveVax(updated);
  };

  // stats
  const totalDoses = EPI_SCHEDULE.length;
  const completedCount = data.completed.length;
  const completionPct = Math.round((completedCount / totalDoses) * 100);
  const dueCount = EPI_SCHEDULE.filter((d) => !data.completed.includes(d.id) && isAgeDue(d.age.en, ageMonths)).length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('rounded-2xl border border-orange-500/30 bg-orange-50/30 p-4 shadow-sm dark:bg-orange-950/10', className)}
      aria-label={lang === 'ur' ? 'بچوں کی ویکسینیشن' : lang === 'roman' ? 'Bachon ki vaccination' : 'Child vaccine schedule'}
    >
      {/* header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400">
          <Syringe className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">
            {lang === 'ur' ? 'بچوں کی ویکسینیشن' : lang === 'roman' ? 'Bachon ki vaccination' : 'Child vaccine schedule'}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {lang === 'ur' ? 'پاکستان EPI شیڈول' : lang === 'roman' ? 'Pakistan EPI schedule' : 'Pakistan EPI (Expanded Programme on Immunization)'}
          </p>
        </div>
        {data.dob ? (
          <Badge variant="secondary" className="bg-orange-500/15 text-[10px] font-bold text-orange-700 dark:text-orange-400">
            {ageMonths < 1
              ? (lang === 'ur' ? 'نومولود' : lang === 'roman' ? 'Nou-moloud' : 'Newborn')
              : `${ageMonths}m`}
          </Badge>
        ) : null}
      </div>

      {/* DOB input */}
      <div className="mb-3 rounded-lg border border-border bg-card p-3">
        <Label htmlFor="child-dob" className="mb-1.5 block text-xs font-semibold text-foreground">
          {lang === 'ur' ? 'بچے کی پیدائش کی تاریخ' : lang === 'roman' ? 'Bachay ki paidaish ki tareekh' : 'Child date of birth'}
        </Label>
        <Input
          id="child-dob"
          type="date"
          value={data.dob}
          onChange={(e) => updateDob(e.target.value)}
          className="h-10 rounded-lg"
          max={new Date().toISOString().slice(0, 10)}
        />
      </div>

      {/* progress stats */}
      {data.dob ? (
        <div className="mb-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border bg-card p-2 text-center">
            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {lang === 'ur' ? 'مکمل' : lang === 'roman' ? 'Mukammal' : 'Done'}
            </p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{completedCount}<span className="text-xs">/{totalDoses}</span></p>
          </div>
          <div className="rounded-lg border border-border bg-card p-2 text-center">
            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {lang === 'ur' ? 'واجب الادا' : lang === 'roman' ? 'Wajib-ul-ada' : 'Due'}
            </p>
            <p className={cn('text-lg font-bold', dueCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground')}>{dueCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-2 text-center">
            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {lang === 'ur' ? 'فیصد' : lang === 'roman' ? 'Feelsad' : 'Progress'}
            </p>
            <p className="text-lg font-bold text-foreground">{completionPct}%</p>
          </div>
        </div>
      ) : null}

      {/* schedule grouped by age */}
      <div className="space-y-2">
        {EPI_AGE_GROUPS.map((ageGroup) => {
          const doses = dosesForAge(ageGroup);
          if (doses.length === 0) return null;
          const isDue = data.dob ? isAgeDue(ageGroup, ageMonths) : false;
          const allDone = doses.every((d) => data.completed.includes(d.id));
          return (
            <div key={ageGroup} className={cn('rounded-lg border p-2', allDone ? 'border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/10' : isDue ? 'border-orange-500/40 bg-orange-50/30 dark:bg-orange-950/10' : 'border-border bg-card')}>
              <div className="mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" aria-hidden />
                <p className="text-xs font-bold text-foreground">{ageGroup}</p>
                {allDone ? (
                  <Badge variant="secondary" className="ml-auto bg-emerald-500/15 text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                    {lang === 'ur' ? 'مکمل' : lang === 'roman' ? 'Mukammal' : 'Done'}
                  </Badge>
                ) : isDue ? (
                  <Badge variant="secondary" className="ml-auto bg-orange-500/15 text-[9px] font-bold text-orange-700 dark:text-orange-400">
                    {lang === 'ur' ? 'واجب الادا' : lang === 'roman' ? 'Wajib-ul-ada' : 'Due'}
                  </Badge>
                ) : null
                }
              </div>
              <ul className="space-y-1">
                {doses.map((dose) => {
                  const isDone = data.completed.includes(dose.id);
                  return (
                    <li key={dose.id}>
                      <button
                        type="button"
                        onClick={() => toggleDose(dose.id)}
                        className="flex w-full items-center gap-2 rounded-md border border-border/60 bg-background/40 p-1.5 text-start transition-colors hover:bg-accent/30 focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" aria-hidden />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block text-[11px] font-bold text-foreground">{dose.name[lang]}</span>
                          <span className="block text-[10px] text-muted-foreground">{dose.disease[lang]}</span>
                        </span>
                        <Shield className="h-3 w-3 shrink-0 text-muted-foreground/30" aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        {lang === 'ur' ? 'معلومات پاکستان EPI سے' : lang === 'roman' ? 'Maloomat Pakistan EPI se' : 'Information from Pakistan EPI (Expanded Programme on Immunization)'}
      </p>
    </motion.section>
  );
}
