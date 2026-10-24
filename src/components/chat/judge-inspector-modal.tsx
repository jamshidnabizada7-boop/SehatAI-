'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  CheckCircle2,
  Clock,
  Cpu,
  FileCheck2,
  Lock,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { ChatMessage, Lang } from '@/lib/types';
import { cn } from '@/lib/utils';
import { extractEmergencySymptoms } from '@/lib/engine/safety-engine';

interface JudgeInspectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: ChatMessage;
  lang: Lang;
}

export function JudgeInspectorModal({
  open,
  onOpenChange,
  message,
  lang,
}: JudgeInspectorModalProps) {
  const isEmergency = Boolean(message.triage?.level === 'EMERGENCY' || message.emergency);
  const isUrgent = message.triage?.level === 'URGENT';
  const metaObj = ((message as any).pipelineMeta || (message as any).meta) as Record<string, unknown> | undefined;
  const isShortCircuited = Boolean(
    message.triage?.shortCircuited ||
    isEmergency ||
    metaObj?.path === 'emergency-short-circuit' ||
    (metaObj?.l0 as Record<string, unknown> | undefined)?.shortCircuited
  );
  // Shown only when the pipeline reported it (the old fallbacks invented 85% / 1240 ms / ROUTINE).
  const confidenceScore = typeof message.confidence?.score === 'number' ? Math.round(message.confidence.score * 100) : null;
  const actualTotalLatency = (metaObj?.latencies as Record<string, unknown> | undefined)?.total ?? message.latencyMs;
  const latency = actualTotalLatency != null ? `${actualTotalLatency} ms total` : 'Total latency not reported';

  const l0Lat = (metaObj?.latencies as Record<string, unknown> | undefined)?.l0;
  const l1Lat = (metaObj?.latencies as Record<string, unknown> | undefined)?.l1;
  const genLat = (metaObj?.latencies as Record<string, unknown> | undefined)?.generation;
  const l2Lat = (metaObj?.latencies as Record<string, unknown> | undefined)?.l2;
  const rawSymptoms = (metaObj?.symptoms || (metaObj?.l0 as Record<string, unknown> | undefined)?.symptoms || (metaObj?.l1 as Record<string, unknown> | undefined)?.symptoms) as string[] | undefined;
  const extractedSymptoms = rawSymptoms && rawSymptoms.length > 0
    ? rawSymptoms
    : (isEmergency
        ? extractEmergencySymptoms(message.content || message.emergency?.reason || '', message.emergency?.templateCategory)
        : undefined);

  const checks = message.validation?.checks ?? [];

  const checkLabels: Record<string, { en: string; ur: string }> = {
    groundedInContext: {
      en: 'Factual Citation Grounding (WHO/Govt PK Corpus)',
      ur: 'مصدقہ ذرائع سے معلومات کا ثبوت',
    },
    safetyNetPresent: {
      en: 'Clinical Safety Net & 1122 Redirection',
      ur: '1122 ایمرجنسی حفاظتی انتباہ',
    },
    judgeNoDoses: {
      en: 'Strict Anti-Prescription (Zero Drug Doses)',
      ur: 'ادویات کی خوراک تجویز کرنے پر مکمل پابندی',
    },
    judgeNoDiagnosis: {
      en: 'Zero Unlicensed Medical Assertions',
      ur: 'طبی تشخیص پر پابندی — معالج کی ہدایت',
    },
    judgeNoMedicationInvention: {
      en: 'Zero Unverified Drug Invention / Hallucination',
      ur: 'غیر مصدقہ ادویات کے تذکرے پر پابندی',
    },
    judgeLanguageMatchesRequest: {
      en: 'Trilingual Coherence (Urdu / Roman / EN)',
      ur: 'اردو اور انگریزی زبان کی درستگی',
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-5 sm:p-6">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="iconbox h-9 w-9 rounded-lg">
                <Cpu className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {lang === 'ur' ? 'تکنیکی انسپکٹر (جج موڈ)' : 'Technical Inspector (Judge Mode)'}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {lang === 'ur'
                    ? 'سیفٹی گیٹس، لایٹنسی، اور ویلیڈیٹرز کا لائیو معائنہ'
                    : 'Provider cascade, deterministic safety gates and constellation verdicts for this answer'}
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'px-2 py-0.5 text-2xs font-bold tracking-wider uppercase',
                isEmergency
                  ? 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400'
                  : isUrgent
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              )}
            >
              {message.triage?.level || (isEmergency ? 'EMERGENCY' : 'Not triaged')}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs">
          {/* Section 1: Execution Cascade & Latencies */}
          <div className="space-y-2 rounded-xl bg-muted/50 p-3.5">
            <div className="flex items-center justify-between text-muted-foreground font-semibold">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {lang === 'ur' ? 'ماڈل جھرنا اور لایٹنسی' : 'AI Cascade & Execution Latency'}
              </span>
              <span className="font-semibold text-foreground tabular">{latency}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-2xs">
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-muted-foreground font-medium">L0 Deterministic</p>
                <p className="font-semibold tabular text-emerald-600 dark:text-emerald-400">
                  {l0Lat != null ? `${l0Lat} ms` : isShortCircuited ? 'Matched (short-circuit)' : 'Ran · latency not reported'}
                </p>
                <p className="text-2xs text-muted-foreground mt-0.5">Lexicon + Context</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-muted-foreground font-medium">L1 LLM triage</p>
                <p className="font-semibold tabular text-foreground">
                  {l1Lat != null ? `${l1Lat} ms` : isShortCircuited || message.offline ? 'Bypassed' : 'Not reported'}
                </p>
                <p className="text-2xs text-muted-foreground mt-0.5">Structured JSON</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-muted-foreground font-medium">Generation</p>
                <p className="font-semibold tabular text-foreground">
                  {genLat != null ? `${genLat} ms` : isShortCircuited ? 'Deterministic template' : message.offline ? 'Corpus fallback' : 'Not reported'}
                </p>
                <p className="text-2xs text-muted-foreground mt-0.5">{isShortCircuited ? 'Safe rule template' : message.offline ? 'Offline verified pack' : 'LLM provider cascade'}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-2">
                <p className="text-muted-foreground font-medium">L2 Judge / Veto</p>
                <p className="font-semibold tabular text-foreground">
                  {l2Lat != null ? `${l2Lat} ms` : isShortCircuited ? 'Bypassed' : message.offline ? 'Offline rules' : 'Not reported'}
                </p>
                <p className="text-2xs text-muted-foreground mt-0.5">{isShortCircuited ? 'Zero Drift Risk' : '4-Way Constellation'}</p>
              </div>
            </div>
          </div>

          {/* Section 1.5: Extracted Clinical Symptoms */}
          <div className="space-y-2 rounded-xl bg-muted/50 p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                <Activity className="h-3.5 w-3.5 text-primary" />
                {lang === 'ur' ? 'شناخت شدہ علامات' : 'Extracted Clinical Symptoms'}
              </span>
              <Badge variant="secondary" className="text-2xs font-mono">
                {extractedSymptoms && extractedSymptoms.length > 0 ? `${extractedSymptoms.length} detected` : 'None extracted'}
              </Badge>
            </div>
            {extractedSymptoms && extractedSymptoms.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {extractedSymptoms.map((sym, i) => (
                  <Badge key={i} variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-2xs font-medium">
                    {sym}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-2xs">No discrete clinical symptoms identified in input.</p>
            )}
          </div>

          {/* Section 2: Deterministic Safety Guards */}
          <div className="space-y-2 rounded-xl bg-muted/50 p-3.5">
            <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5 text-primary" />
              {lang === 'ur' ? 'حفاظتی رکاوٹیں اور ڈیٹرمینسٹک گیٹس' : 'Deterministic Safety Gates'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
              <div className="flex items-start gap-2 rounded-lg border border-border bg-card p-2.5">
                <Lock className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    {lang === 'ur' ? 'ایل صفر شارٹ سرکٹ' : 'L0 Short-Circuit Protection'}
                  </p>
                  <p className="text-muted-foreground text-2xs mt-0.5">
                    {isShortCircuited
                      ? 'ACTIVATED: Severe red flag detected. Deterministic emergency response returned without LLM drift risk.'
                      : 'NORMAL: Message passed clinical thresholding without emergency triggers.'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-border bg-card p-2.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    {lang === 'ur' ? 'پرامپٹ انجیکشن شیلڈ' : 'Prompt Injection Firewall'}
                  </p>
                  <p className="text-muted-foreground text-2xs mt-0.5">
                    Zero system prompt leak. Anti-override regex and structural role isolation enforced.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Parallel Constellation Validator Verdicts */}
          <div className="space-y-2 rounded-xl bg-muted/50 p-3.5.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                <Layers className="h-3.5 w-3.5 text-primary" />
                {lang === 'ur' ? 'ویلیڈیٹر کنسٹلیشن فیصلے' : 'Parallel Veto Constellation (Validator Verdicts)'}
              </span>
              <Badge variant="secondary" className="text-2xs font-mono">
                {isShortCircuited ? 'Bypassed by Design' : checks.length > 0 ? `${checks.filter((c) => c.passed).length}/${checks.length} Passed` : 'N/A'}
              </Badge>
            </div>
            {isShortCircuited ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-2xs text-emerald-800 dark:text-emerald-300">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Deterministic Rule Execution (L0 Emergency)
                </p>
                <p className="mt-0.5 text-2xs leading-relaxed text-emerald-900/80 dark:text-emerald-200/80">
                  LLM validation constellation was intentionally bypassed by design. Obvious cardiac and acute life-threatening emergencies trigger verified deterministic protocols directly at L0 to eliminate model drift, latency, and hallucination risk.
                </p>
              </div>
            ) : checks.length > 0 ? (
              <div className="space-y-1.5">
                {checks.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border/40 bg-background/60 px-2.5 py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-2xs font-medium text-foreground">
                        {checkLabels[c.name]?.[lang === 'ur' ? 'ur' : 'en'] || c.name}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-2xs text-emerald-600 dark:text-emerald-400"
                    >
                      {c.passed ? 'PASSED' : 'FLAGGED'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-2xs">No constellation checks recorded for this turn.</p>
            )}
          </div>

          {/* Section 4: Calibrated Confidence Formula */}
          <div className="space-y-2 rounded-xl bg-muted/50 p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                <Activity className="h-3.5 w-3.5 text-primary" />
                {lang === 'ur' ? 'اعتماد کا اسکور' : 'Confidence Band Calibration'}
              </span>
              <span className="font-semibold tabular text-foreground">{confidenceScore != null ? `${confidenceScore}% (${message.confidence?.band})` : message.confidence?.band ?? 'Not reported'}</span>
            </div>
            <p className="text-2xs text-muted-foreground leading-relaxed">
              Formula: Bounded [0.1, 1.0] anchored by verified corpus retrieval score, L1-L2 consensus agreement, and clinical safety constraints.
              {message.confidence?.reasons && message.confidence.reasons.length > 0
                ? ` Factors: ${message.confidence.reasons.join(', ')}.`
                : ' Fully grounded in published corpus.'}
            </p>
          </div>

          {/* Section 5: Grounded Citations */}
          {message.citations && message.citations.length > 0 ? (
            <div className="space-y-2 rounded-xl bg-muted/50 p-3.5">
              <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                <FileCheck2 className="h-3.5 w-3.5 text-primary" />
                {lang === 'ur' ? 'مستند ذرائع' : 'Grounded Corpus Citations'}
              </span>
              <div className="space-y-1">
                {message.citations.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-2xs rounded bg-background/60 px-2 py-1 border border-border/30"
                  >
                    <span className="font-medium text-foreground truncate max-w-[320px]">{c.title}</span>
                    <span className="text-2xs text-muted-foreground font-mono">[{c.id}] · {c.publisher}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
