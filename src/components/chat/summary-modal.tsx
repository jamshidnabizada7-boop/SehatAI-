'use client';

import { useCallback, useEffect, useState } from 'react';
import { ClipboardCopy, Download, FileText, Loader2, MessageCircle, Printer, QrCode, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store/app-store';
import { t } from '@/lib/i18n';
import type { DoctorSummary, Lang } from '@/lib/types';
import { TriageBadge } from './triage-badge';
import { ConfidenceBadge } from './confidence-badge';
import { DrugWarningCard } from './drug-warning-card';
import { DifferentialCard } from './differential-card';
import { QrCodeSvg } from './qr-code-svg';

interface SummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: Lang;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 print:border-gray-300 print:bg-transparent print:p-2">
      <p className="mb-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase print:text-gray-600">
        {label}
      </p>
      <div className="text-sm leading-relaxed text-foreground print:text-black">{children}</div>
    </div>
  );
}

export function SummaryModal({ open, onOpenChange, lang }: SummaryModalProps) {
  const { toast } = useToast();
  const conversationId = useAppStore((s) => s.conversationId);
  const [summary, setSummary] = useState<DoctorSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  const generate = useCallback(async () => {
    if (!conversationId) {
      setError(t(lang, 'summary.failed'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, language: lang }),
      });
      if (!res.ok) throw new Error(`summary ${res.status}`);
      const data = (await res.json()) as DoctorSummary | { summary: DoctorSummary };
      // the API wraps the payload as { summary: {...} } — accept both shapes
      const s = 'summary' in data && data.summary ? data.summary : (data as DoctorSummary);
      setSummary(s);
    } catch {
      setError(t(lang, 'summary.failed'));
    } finally {
      setLoading(false);
    }
  }, [conversationId, lang]);

  const shareText = useCallback(() => {
    if (!summary) return '';
    const list = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
    const lines = [
      `SehatAI — ${t(lang, 'summary.title')}`,
      `${t(lang, 'summary.chiefComplaint')}: ${summary.chiefComplaint ?? '—'}`,
      `${t(lang, 'summary.duration')}: ${summary.duration ?? '—'}`,
      `${t(lang, 'summary.symptoms')}: ${list(summary.symptoms).join(', ') || '—'}`,
      `${t(lang, 'summary.redFlags')}: ${list(summary.redFlagsObserved).join(', ') || '—'}`,
      `${t(lang, 'summary.triage')}: ${summary.triageLevel ?? '—'}`,
    ];
    // Phase 2 — extended fields
    if (summary.differential) {
      const diff = summary.differential;
      if (diff.established.length) lines.push(`Established: ${diff.established.map((e) => e.name).join(', ')}`);
      if (diff.suspected.length) lines.push(`Suspected: ${diff.suspected.map((e) => e.name).join(', ')}`);
      if (diff.cantMiss.length) lines.push(`Can't-miss: ${diff.cantMiss.map((e) => e.name).join(', ')}`);
    }
    if (summary.drugCheck && summary.drugCheck.severity !== 'NONE') {
      lines.push(`Drug safety: ${summary.drugCheck.severity} — ${summary.drugCheck.recommendation}`);
    }
    if (summary.patientProfile) {
      const p = summary.patientProfile;
      const parts: string[] = [];
      if (p.ageBand && p.ageBand !== 'undisclosed') parts.push(`age: ${p.ageBand}`);
      if (p.sex && p.sex !== 'undisclosed') parts.push(`sex: ${p.sex}`);
      if (p.conditions?.length) parts.push(`conditions: ${p.conditions.join(', ')}`);
      if (p.allergies?.length) parts.push(`allergies: ${p.allergies.join(', ')}`);
      if (p.medications?.length) parts.push(`meds: ${p.medications.join(', ')}`);
      if (p.pregnant) parts.push('pregnant: yes');
      if (parts.length) lines.push(`Patient: ${parts.join('; ')}`);
    }
    lines.push(`${t(lang, 'summary.guidance')}: ${list(summary.guidanceGiven).join(' | ')}`);
    if (summary.citations?.length) {
      lines.push(`Sources: ${summary.citations.map((c) => `${c.publisher} — ${c.title}`).join('; ')}`);
    }
    lines.push(`${t(lang, 'summary.disclaimer')}: ${summary.disclaimer ?? ''}`);
    return lines.join('\n');
  }, [summary, lang]);

  /** Phase 2 — FHIR-style JSON export (downloadable .json file for EHR systems). */
  const exportFhirJson = useCallback(() => {
    if (!summary) return;
    const fhirBundle = {
      resourceType: 'Bundle',
      type: 'document',
      timestamp: summary.generatedAt ?? new Date().toISOString(),
      entry: [
        {
          resource: {
            resourceType: 'Composition',
            status: 'final',
            type: { text: 'SehatAI Clinical Triage Summary' },
            date: summary.generatedAt ?? new Date().toISOString(),
            title: 'SehatAI Doctor Summary',
            section: [
              { title: 'Chief Complaint', text: { status: 'generated', div: `<div>${summary.chiefComplaint}</div>` } },
              { title: 'Duration', text: { status: 'generated', div: `<div>${summary.duration}</div>` } },
              { title: 'Symptoms', text: { status: 'generated', div: `<div>${(summary.symptoms ?? []).join(', ')}</div>` } },
              { title: 'Red Flags Observed', text: { status: 'generated', div: `<div>${(summary.redFlagsObserved ?? []).join(', ')}</div>` } },
              { title: 'Triage Level', text: { status: 'generated', div: `<div>${summary.triageLevel}</div>` } },
              { title: 'Guidance Given', text: { status: 'generated', div: `<div>${(summary.guidanceGiven ?? []).join('; ')}</div>` } },
            ],
          },
        },
        ...(summary.patientProfile
          ? [{
              resource: {
                resourceType: 'Patient',
                gender: summary.patientProfile.sex === 'female' ? 'female' : summary.patientProfile.sex === 'male' ? 'male' : 'unknown',
                extension: [
                  ...(summary.patientProfile.ageBand && summary.patientProfile.ageBand !== 'undisclosed'
                    ? [{ url: 'http://sehatai.pk/fhir/StructureDefinition/age-band', valueString: summary.patientProfile.ageBand }] : []),
                  ...(summary.patientProfile.conditions?.length
                    ? [{ url: 'http://sehatai.pk/fhir/StructureDefinition/conditions', valueString: summary.patientProfile.conditions.join(', ') }] : []),
                  ...(summary.patientProfile.allergies?.length
                    ? [{ url: 'http://sehatai.pk/fhir/StructureDefinition/allergies', valueString: summary.patientProfile.allergies.join(', ') }] : []),
                  ...(summary.patientProfile.medications?.length
                    ? [{ url: 'http://sehatai.pk/fhir/StructureDefinition/medications', valueString: summary.patientProfile.medications.join(', ') }] : []),
                  ...(summary.patientProfile.pregnant
                    ? [{ url: 'http://sehatai.pk/fhir/StructureDefinition/pregnant', valueBoolean: true }] : []),
                ],
              },
            }]
          : []),
        ...(summary.differential
          ? [{
              resource: {
                resourceType: 'Observation',
                status: 'final',
                code: { text: 'Differential Diagnosis (AI-assisted, not diagnostic)' },
                component: [
                  ...(summary.differential.established.length ? [{ code: { text: 'Established' }, valueString: summary.differential.established.map((e) => e.name).join(', ') }] : []),
                  ...(summary.differential.suspected.length ? [{ code: { text: 'Suspected' }, valueString: summary.differential.suspected.map((e) => e.name).join(', ') }] : []),
                  ...(summary.differential.cantMiss.length ? [{ code: { text: 'Cannot Miss' }, valueString: summary.differential.cantMiss.map((e) => e.name).join(', ') }] : []),
                ],
              },
            }]
          : []),
        ...(summary.drugCheck && summary.drugCheck.severity !== 'NONE'
          ? [{
              resource: {
                resourceType: 'Flag',
                status: 'active',
                code: { text: `Drug-interaction alert (${summary.drugCheck.severity})` },
                detail: summary.drugCheck.recommendation,
              },
            }]
          : []),
        ...(summary.citations?.length
          ? summary.citations.map((c) => ({
              resource: {
                resourceType: 'DocumentReference',
                status: 'current',
                type: { text: c.title },
                author: [{ display: c.publisher }],
                description: c.url,
              },
            }))
          : []),
      ],
      meta: {
        tag: [
          { system: 'http://sehatai.pk/fhir/CodeSystem/summary-source', code: 'ai-assisted', display: 'AI-assisted summary — not a diagnosis' },
        ],
        lastUpdated: summary.generatedAt ?? new Date().toISOString(),
      },
    };
    const blob = new Blob([JSON.stringify(fhirBundle, null, 2)], { type: 'application/fhir+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sehatai-summary-${summary.conversationId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ description: 'FHIR JSON downloaded' });
  }, [summary, toast]);

  const copy = useCallback(async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(shareText());
      toast({ description: t(lang, 'summary.copied') });
    } catch {
      toast({ description: t(lang, 'chat.feedbackFailed'), variant: 'destructive' });
    }
  }, [summary, lang, toast, shareText]);

  const handlePrint = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }, []);

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText())}`;

  // generate on open (Radix onOpenChange doesn't fire for controlled opens)
  const [openedOnce, setOpenedOnce] = useState(false);
  useEffect(() => {
    if (open && !openedOnce) {
      setOpenedOnce(true);
      void generate();
    }
    if (!open) setOpenedOnce(false);
  }, [open, openedOnce, generate]);

  const summaryText = shareText();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="custom-scrollbar max-h-[85vh] overflow-y-auto sm:max-w-lg print:max-h-none print:overflow-visible">
        <DialogHeader className="no-print">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" aria-hidden />
            {t(lang, 'summary.title')}
          </DialogTitle>
          <DialogDescription>{t(lang, 'summary.subtitle')}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground no-print">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            {t(lang, 'summary.generating')}
          </div>
        ) : error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300 no-print">
            {error}
          </p>
        ) : summary ? (
          <div id="doctor-summary-printable" className="space-y-3">
            {/* Print-only clinical header */}
            <div className="hidden border-b border-gray-300 pb-3 print:block">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-bold text-gray-900">SehatAI — Clinical Triage Summary</h1>
                  <p className="text-xs text-gray-500">
                    Generated for Doctor & OPD Review · {new Date().toLocaleDateString()}
                  </p>
                </div>
                {summaryText ? <QrCodeSvg value={summaryText} size={64} className="h-16 w-16" /> : null}
              </div>
            </div>

            <Field label={t(lang, 'summary.chiefComplaint')}>{summary.chiefComplaint ?? '—'}</Field>
            <Field label={t(lang, 'summary.duration')}>{summary.duration ?? '—'}</Field>
            <Field label={t(lang, 'summary.symptoms')}>
              {Array.isArray(summary.symptoms) && summary.symptoms.length > 0 ? (
                <span className="flex flex-wrap gap-1.5">
                  {summary.symptoms.map((s, i) => (
                    <span key={i} className="rounded-full bg-secondary px-2 py-0.5 text-xs print:border print:border-gray-300 print:bg-gray-100 print:text-black">
                      {s}
                    </span>
                  ))}
                </span>
              ) : (
                t(lang, 'summary.none')
              )}
            </Field>
            <Field label={t(lang, 'summary.redFlags')}>
              {Array.isArray(summary.redFlagsObserved) && summary.redFlagsObserved.length > 0 ? (
                <span className="flex flex-wrap gap-1.5">
                  {summary.redFlagsObserved.map((s, i) => (
                    <span key={i} className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/60 dark:text-red-300 print:border print:border-red-300 print:bg-red-50 print:text-red-800">
                      {s}
                    </span>
                  ))}
                </span>
              ) : (
                t(lang, 'summary.none')
              )}
            </Field>
            {summary.triageLevel ? (
              <div className="rounded-xl border border-border bg-card p-3 print:border-gray-300 print:bg-transparent print:p-2">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase print:text-gray-600">
                    {t(lang, 'summary.triage')}
                  </p>
                  {summary.confidence ? (
                    <ConfidenceBadge confidence={summary.confidence} lang={lang} />
                  ) : null}
                </div>
                <TriageBadge level={summary.triageLevel} lang={lang} />
              </div>
            ) : null}

            {/* Phase 2 — patient profile snapshot */}
            {summary.patientProfile ? (
              <div className="rounded-xl border border-border bg-card p-3 print:border-gray-300 print:bg-transparent print:p-2">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase print:text-gray-600">
                  <User className="h-3 w-3" aria-hidden />
                  {lang === 'ur' ? 'مریض کی پروفائل' : lang === 'roman' ? 'Mareez ka profile' : 'Patient profile'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {summary.patientProfile.ageBand && summary.patientProfile.ageBand !== 'undisclosed' ? (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs print:border print:border-gray-300 print:bg-gray-100">{summary.patientProfile.ageBand}</span>
                  ) : null}
                  {summary.patientProfile.sex && summary.patientProfile.sex !== 'undisclosed' ? (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs print:border print:border-gray-300 print:bg-gray-100">{summary.patientProfile.sex}</span>
                  ) : null}
                  {summary.patientProfile.pregnant ? (
                    <span className="rounded-full bg-pink-500/15 px-2 py-0.5 text-xs font-medium text-pink-700 dark:text-pink-400">pregnant</span>
                  ) : null}
                  {summary.patientProfile.conditions?.map((c) => (
                    <span key={`cond-${c}`} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">{c}</span>
                  ))}
                  {summary.patientProfile.allergies?.map((a) => (
                    <span key={`alg-${a}`} className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">⚠ {a}</span>
                  ))}
                  {summary.patientProfile.medications?.map((m) => (
                    <span key={`med-${m}`} className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">💊 {m}</span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Phase 2 — drug-interaction alert */}
            {summary.drugCheck && summary.drugCheck.severity !== 'NONE' ? (
              <DrugWarningCard drugCheck={summary.drugCheck} lang={lang} />
            ) : null}

            {/* Phase 2 — 3-tier differential */}
            {summary.differential ? (
              <DifferentialCard differential={summary.differential} lang={lang} />
            ) : null}

            <Field label={t(lang, 'summary.guidance')}>
              <ul className="list-disc space-y-1 ps-4">
                {(Array.isArray(summary.guidanceGiven) ? summary.guidanceGiven : []).map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </Field>

            {/* Phase 2 — citations / evidence sources */}
            {summary.citations && summary.citations.length > 0 ? (
              <div className="rounded-xl border border-border bg-card p-3 print:border-gray-300 print:bg-transparent print:p-2">
                <p className="mb-1.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase print:text-gray-600">
                  {lang === 'ur' ? 'حوالہ جات' : lang === 'roman' ? 'Hawalat' : 'Evidence sources'}
                </p>
                <ul className="space-y-1">
                  {summary.citations.map((c, i) => (
                    <li key={c.id ?? i} className="text-xs leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-foreground">{c.publisher}</span> — {c.title}
                      {c.url ? (
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="ms-1 text-primary hover:underline print:text-blue-700 print:no-underline">
                          ↗
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* QR Code section (toggleable on screen, scannable by clinicians) */}
            {showQr && summaryText ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/30 p-4 text-center no-print">
                <p className="text-xs font-bold text-foreground">{t(lang, 'summary.qrTitle')}</p>
                <QrCodeSvg value={summaryText} size={160} />
                <p className="text-[11px] text-muted-foreground">{t(lang, 'summary.qrDesc')}</p>
              </div>
            ) : null}

            <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 print:border print:border-amber-200 print:bg-amber-50/50 print:text-gray-700">
              {summary.disclaimer ?? ''}
            </p>

            {/* Action buttons: Print, WhatsApp, Copy, FHIR JSON, QR */}
            <div className="space-y-2 no-print">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button
                  onClick={handlePrint}
                  className="min-h-11 gap-2 rounded-xl bg-slate-900 font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                  aria-label={t(lang, 'summary.print')}
                >
                  <Printer className="h-4 w-4" aria-hidden />
                  {t(lang, 'summary.print')}
                </Button>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                  aria-label={t(lang, 'summary.whatsapp')}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  {t(lang, 'summary.whatsapp')}
                </a>
                <Button
                  onClick={() => void copy()}
                  variant="outline"
                  className="min-h-11 gap-2 rounded-xl border-primary/40 font-semibold text-primary hover:bg-primary/10"
                >
                  <ClipboardCopy className="h-4 w-4" aria-hidden />
                  {t(lang, 'summary.copy')}
                </Button>
              </div>
              {/* Phase 2 — FHIR-style JSON export for EHR systems */}
              <Button
                onClick={() => void exportFhirJson()}
                variant="outline"
                className="min-h-11 w-full gap-2 rounded-xl border-emerald-500/40 font-semibold text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
                aria-label={lang === 'ur' ? 'FHIR JSON ایکسپورٹ' : lang === 'roman' ? 'FHIR JSON export' : 'Export FHIR JSON'}
              >
                <Download className="h-4 w-4" aria-hidden />
                {lang === 'ur' ? 'FHIR JSON ایکسپورٹ (EHR کے لیے)' : lang === 'roman' ? 'FHIR JSON export (EHR ke liye)' : 'Export FHIR JSON (for EHR)'}
              </Button>
              <Button
                onClick={() => setShowQr((v) => !v)}
                variant="ghost"
                size="sm"
                className="w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <QrCode className="h-3.5 w-3.5" aria-hidden />
                {showQr ? t(lang, 'summary.hideQr') : t(lang, 'summary.showQr')}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
