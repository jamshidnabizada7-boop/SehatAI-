'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Heart,
  AlertTriangle,
  Phone,
  CheckCircle2,
  Circle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Lang } from '@/lib/types';
import {
  PHQ9_QUESTIONS,
  PHQ9_OPTIONS,
  GAD7_QUESTIONS,
  GAD7_OPTIONS,
  phq9Result,
  gad7Result,
  MENTAL_HEALTH_DISCLAIMER,
  type ScreeningQuestion,
  type ScreeningOption,
  type ScreeningResult,
} from '@/data/mental-health-screening';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Mental Health Screening (Phase 2)
// PHQ-9 (depression) + GAD-7 (anxiety) validated screening tools.
//
// SAFETY:
//   - These are SCREENING tools, not diagnostic.
//   - The disclaimer is shown before + after.
//   - Question 9 of PHQ-9 screens for suicidal ideation — if
//     answered >0, a crisis-line callout appears immediately.
//   - Results always recommend seeing a clinician for moderate+.
// ============================================================

type Tool = 'phq9' | 'gad7';

interface MentalHealthScreeningProps {
  lang: Lang;
  className?: string;
}

export function MentalHealthScreening({ lang, className }: MentalHealthScreeningProps) {
  const [tool, setTool] = useState<Tool | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);

  const questions: ScreeningQuestion[] = tool === 'phq9' ? PHQ9_QUESTIONS : GAD7_QUESTIONS;
  const options: ScreeningOption[] = tool === 'phq9' ? PHQ9_OPTIONS : GAD7_OPTIONS;
  const totalScore = useMemo(() => Object.values(answers).reduce((s, v) => s + v, 0), [answers]);
  const result: ScreeningResult | null = tool === 'phq9' ? phq9Result(totalScore) : gad7Result(totalScore);
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  // PHQ-9 question 9 checks for suicidal ideation
  const suicidalIdeation = tool === 'phq9' && (answers[9] ?? 0) > 0;

  const reset = () => {
    setTool(null);
    setAnswers({});
    setShowResults(false);
    setCurrentQ(0);
  };

  const startTool = (t: Tool) => {
    setTool(t);
    setAnswers({});
    setShowResults(false);
    setCurrentQ(0);
  };

  // ---------- Tool picker ----------
  if (!tool) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('rounded-2xl border border-violet-500/30 bg-violet-50/30 p-4 shadow-sm dark:bg-violet-950/10', className)}
        aria-label={lang === 'ur' ? 'ذہنی صحت کی اسکریننگ' : lang === 'roman' ? 'Zehni sehat ki screening' : 'Mental health screening'}
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400">
            <Brain className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {lang === 'ur' ? 'ذہنی صحت کی اسکریننگ' : lang === 'roman' ? 'Zehni sehat ki screening' : 'Mental health screening'}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {lang === 'ur' ? 'PHQ-9 + GAD-7' : lang === 'roman' ? 'PHQ-9 + GAD-7' : 'PHQ-9 + GAD-7 validated tools'}
            </p>
          </div>
        </div>

        {/* disclaimer */}
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-50/50 p-2.5 dark:bg-amber-950/20">
          <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-amber-800 dark:text-amber-300">
            <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            <span>{MENTAL_HEALTH_DISCLAIMER[lang]}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => startTool('phq9')}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-start shadow-sm transition-all hover:border-violet-500/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400">
              <Heart className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-foreground">PHQ-9</span>
              <span className="block text-[11px] text-muted-foreground">
                {lang === 'ur' ? 'ڈپریشن کی اسکریننگ (9 سوالات)' : lang === 'roman' ? 'Depression ki screening (9 sawalat)' : 'Depression screening (9 questions)'}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => startTool('gad7')}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-start shadow-sm transition-all hover:border-violet-500/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400">
              <Brain className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-foreground">GAD-7</span>
              <span className="block text-[11px] text-muted-foreground">
                {lang === 'ur' ? 'گھبراہٹ کی اسکریننگ (7 سوالات)' : lang === 'roman' ? 'Ghabrahat ki screening (7 sawalat)' : 'Anxiety screening (7 questions)'}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" aria-hidden />
          </button>
        </div>

        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          {lang === 'ur' ? 'سرکاری لائن: 1166 (24/7)' : lang === 'roman' ? 'Sarkari line: 1166 (24/7)' : 'Helpline: 1166 (24/7 free)'}
        </p>
      </motion.section>
    );
  }

  // ---------- Results view ----------
  if (showResults && result) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('rounded-2xl border border-violet-500/30 bg-violet-50/30 p-4 shadow-sm dark:bg-violet-950/10', className)}
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400">
            <Brain className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {tool === 'phq9' ? 'PHQ-9' : 'GAD-7'} {lang === 'ur' ? 'نتائج' : lang === 'roman' ? 'Nataij' : 'results'}
            </h3>
          </div>
        </div>

        {/* score + severity */}
        <div className="mb-3 rounded-lg border border-border bg-card p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              {lang === 'ur' ? 'اسکور' : lang === 'roman' ? 'Score' : 'Score'}
            </span>
            <span className={cn('text-2xl font-bold', result.color)}>
              {result.score}
              <span className="text-sm text-muted-foreground">/{result.maxScore}</span>
            </span>
          </div>
          <div className="mt-1.5">
            <p className={cn('text-sm font-bold', result.color)}>{result.title[lang]}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{result.description[lang]}</p>
          </div>
        </div>

        {/* recommendation */}
        <div className="mb-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="text-xs leading-relaxed text-foreground">{result.recommendation[lang]}</p>
        </div>

        {/* crisis callout if suicidal ideation */}
        {suicidalIdeation ? (
          <div className="mb-3 rounded-lg border border-red-500/40 bg-red-50/60 p-3 dark:bg-red-950/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
              <div>
                <p className="text-xs font-bold text-red-700 dark:text-red-400">
                  {lang === 'ur' ? 'آپ نے خود کو نقصان پہنچانے کے خیالات کا ذکر کیا ہے' : lang === 'roman' ? 'Aap ne khud ko nuksan pahunchane ke khayalat ka zikr kiya hai' : 'You mentioned thoughts of self-harm'}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-red-800 dark:text-red-300">
                  {lang === 'ur' ? 'آپ اکیلے نہیں ہیں۔ براہ کرم ابھی مدد طلب کریں:' : lang === 'roman' ? 'Aap akele nahin hain. Barah-e-karam abhi madad talab karein:' : 'You are not alone. Please reach out for help now:'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a href="tel:1122" className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white">
                    <Phone className="h-3 w-3" aria-hidden /> 1122
                  </a>
                  <a href="tel:1166" className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white">
                    <Phone className="h-3 w-3" aria-hidden /> 1166
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* disclaimer */}
        <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-50/40 p-2 text-[10px] leading-relaxed text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
          {MENTAL_HEALTH_DISCLAIMER[lang]}
        </p>

        {/* actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset} className="flex-1 gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            {lang === 'ur' ? 'دوبارہ' : lang === 'roman' ? 'Dobara' : 'Restart'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowResults(false)} className="flex-1 gap-1.5">
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            {lang === 'ur' ? 'جوابات دیکھیں' : lang === 'roman' ? 'Jawabat dekhein' : 'Review'}
          </Button>
        </div>
      </motion.section>
    );
  }

  // ---------- Question view ----------
  const q = questions[currentQ];
  const isAnswered = answers[q.id] !== undefined;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-2xl border border-violet-500/30 bg-violet-50/30 p-4 shadow-sm dark:bg-violet-950/10', className)}
    >
      {/* header + progress */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400">
            <Brain className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-xs font-bold text-foreground">{tool === 'phq9' ? 'PHQ-9' : 'GAD-7'}</span>
        </div>
        <Badge variant="secondary" className="bg-violet-500/15 text-[10px] font-bold text-violet-700 dark:text-violet-400">
          {currentQ + 1} / {questions.length}
        </Badge>
      </div>

      {/* progress bar */}
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full bg-violet-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="mb-3"
        >
          <p className={cn('text-sm font-semibold leading-relaxed text-foreground', lang === 'ur' && 'font-urdu')} dir={lang === 'ur' ? 'rtl' : 'ltr'}>
            {q.text[lang]}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {lang === 'ur' ? 'گزشتہ 2 ہفتوں میں کتنی بار؟' : lang === 'roman' ? 'Guzishta 2 hafton mein kitni baar?' : 'Over the last 2 weeks, how often?'}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* options */}
      <div className="mb-3 space-y-1.5">
        {options.map((opt) => {
          const isSelected = answers[q.id] === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                const next = { ...answers, [q.id]: opt.value };
                setAnswers(next);
                // auto-advance after a short delay
                setTimeout(() => {
                  if (currentQ < questions.length - 1) {
                    setCurrentQ((c) => c + 1);
                  }
                }, 200);
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg border p-2.5 text-start transition-colors',
                isSelected
                  ? 'border-violet-500/50 bg-violet-500/10'
                  : 'border-border bg-card hover:bg-accent/30',
              )}
            >
              {isSelected ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" aria-hidden />
              )}
              <span className={cn('text-xs font-medium text-foreground', lang === 'ur' && 'font-urdu')} dir={lang === 'ur' ? 'rtl' : 'ltr'}>
                {opt.label[lang]}
              </span>
            </button>
          );
        })}
      </div>

      {/* nav */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => currentQ > 0 ? setCurrentQ((c) => c - 1) : reset()}
          className="gap-1.5"
          disabled={currentQ === 0 && !tool}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {currentQ === 0 ? (lang === 'ur' ? 'واپس' : lang === 'roman' ? 'Wapas' : 'Back') : (lang === 'ur' ? 'پچھلا' : lang === 'roman' ? 'Pichla' : 'Previous')}
        </Button>
        {currentQ < questions.length - 1 ? (
          <Button
            size="sm"
            onClick={() => setCurrentQ((c) => c + 1)}
            disabled={!isAnswered}
            className="gap-1.5"
          >
            {lang === 'ur' ? 'اگلا' : lang === 'roman' ? 'Agla' : 'Next'}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => setShowResults(true)}
            disabled={!allAnswered}
            className="gap-1.5"
          >
            {lang === 'ur' ? 'نتیجہ دیکھیں' : lang === 'roman' ? 'Nateeja dekhein' : 'See results'}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>

      {/* answered count */}
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        {answeredCount} / {questions.length} {lang === 'ur' ? 'جوابات' : lang === 'roman' ? 'jawabat' : 'answered'}
      </p>
    </motion.section>
  );
}
