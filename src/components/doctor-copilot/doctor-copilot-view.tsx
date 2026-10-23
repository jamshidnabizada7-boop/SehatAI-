'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Stethoscope, FileText, ClipboardCheck, Pill, AlertTriangle, Activity, Users, Clock,
  ShieldCheck, Lock, Sparkles, ArrowRight, Loader2, Download, CalendarPlus, BookOpen,
  FlaskConical, ScrollText, CheckCircle2, XCircle, BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DoctorAnalytics } from './doctor-analytics';

type Tab = 'patients' | 'drug-checker' | 'followups' | 'analytics' | 'who-dak' | 'audit';

// ============================================================
// SehatAI — Doctor Portal (Phase D expansion)
// Sub-nav: Patients / Drug Checker / Follow-ups / WHO DAK / Audit
// ============================================================

interface RealPatient {
  conversationId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  chiefComplaint: string;
  triageLevel: 'EMERGENCY' | 'URGENT' | 'ROUTINE' | 'SELF_CARE';
  updatedAt: string;
  isGuest: boolean;
  profile: {
    ageBand: string;
    sex: string;
    conditions: string[];
    allergies: string[];
    medications: string[];
    pregnant: boolean;
  } | null;
}

interface DrugCheckerResult {
  hits: { drugA: string; drugB: string; severity: 'HIGH' | 'MODERATE' | 'LOW'; effect: string; action: string }[];
  allergies: { allergy: string; trigger: string; drugClass: string; severity: 'HIGH' | 'MODERATE' | 'LOW'; action: string }[];
  flags: { type: string; drug: string; message: string; severity: 'HIGH' | 'MODERATE' | 'LOW' }[];
  overallSeverity: 'HIGH' | 'MODERATE' | 'LOW' | 'NONE';
  recommendation: string;
}

interface FollowUp {
  id: string;
  patientId: string;
  patientName: string;
  scheduledFor: string;
  notes: string | null;
  conversationId: string | null;
  createdAt: string;
}

export function DoctorCopilotView() {
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const [tab, setTab] = useState<Tab>('patients');
  const { status } = useSession();
  const router = useRouter();

  // If unauthenticated, show a sign-in CTA
  if (status === 'unauthenticated') {
    return (
      <div className="custom-scrollbar h-full overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-4 py-12 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15">
            <Stethoscope className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </span>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Doctor Portal</h1>
          <p className="text-sm text-muted-foreground">
            The Doctor Portal is for verified doctors only. Please sign in with your doctor account.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild className="min-h-11 gap-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
              <a href="/auth/doctor/signin"><Stethoscope className="h-4 w-4" /> Doctor sign in</a>
            </Button>
            <Button asChild variant="outline" className="min-h-11 gap-1.5 rounded-xl">
              <a href="/auth/doctor/signup">Register as a doctor</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="custom-scrollbar h-full overflow-y-auto px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Lavender Hero Banner (§ references/06_Doctor_Copilot.png) */}
        <section className="hero-banner hero-copilot relative min-h-[175px] overflow-hidden rounded-[20px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between shadow-xs">
          <div className="relative z-10 flex items-start gap-5 max-w-xl">
            <span className="iconbox purple flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-[#6554E8] shadow-sm">
              <Stethoscope className="h-8 w-8 text-[#6554E8]" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#16156f]">
                Doctor Copilot
              </h1>
              <h2 className="text-base sm:text-lg font-bold text-[#20159a] mt-0.5">
                Your AI Clinical Assistant
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#4c4a85] leading-relaxed">
                Evidence-based guidance, drug interaction checking, follow-ups and clinical support.
              </p>
            </div>
          </div>

          <img
            src="/assets/doctor_copilot.png"
            alt="Doctor Copilot illustration"
            className="hero-art pointer-events-none absolute right-[280px] top-0 hidden h-[175px] w-[285px] object-cover xl:block"
          />

          <div className="relative z-10 mt-4 md:mt-0 flex flex-col gap-1.5 rounded-2xl border border-white/40 bg-white/70 p-4 backdrop-blur-sm text-xs font-semibold text-[#16156f] shadow-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 font-bold">✓</span>
              <span>Clinician-reviewed guidance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 font-bold">✓</span>
              <span>Drug interaction safety</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 font-bold">✓</span>
              <span>WHO SMART resources</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 font-bold">✓</span>
              <span>Clinical documentation aid</span>
            </div>
          </div>
        </section>

        {/* Patient Profile Header Strip */}
        <div className="surface pad p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-full bg-[#edeaff] text-[#5538ee] font-extrabold flex items-center justify-center text-base border border-[#d8d2ff]">
              FA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#112342]">
                  Fatima Ali (28F)
                </h3>
                <span className="chip chip-blue text-[10px]">Active Encounter</span>
              </div>
              <p className="text-xs text-[#547099] mt-0.5">
                Female · 28 years · Lahore, Punjab · Blood Group: B+
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Displaying synthetic clinical history for Fatima Ali (28F)')}
              className="h-9 px-3.5 rounded-xl border-border text-xs font-semibold text-[#112342]"
            >
              Patient History
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/my-health')}
              className="h-9 px-3.5 rounded-xl bg-[#009b78] text-white text-xs font-bold gap-1.5 hover:bg-[#007f62]"
            >
              Open Full PHR →
            </Button>
          </div>
        </div>

        {/* 4 Prominent Switchable Tabs (§ references/06_Doctor_Copilot.png) */}
        <div className="tabrow" role="tablist">
          {[
            { id: 'patients', icon: Sparkles, num: 1, label: 'Pre-Visit Intakes (3)' },
            { id: 'drug-checker', icon: Pill, num: 2, label: 'Drug Interaction Checker' },
            { id: 'followups', icon: Clock, num: 3, label: 'Automated Follow-ups' },
            { id: 'who-dak', icon: BookOpen, num: 4, label: 'WHO SMART Guidelines' },
            { id: 'analytics', icon: BarChart3, num: 5, label: 'Practice Analytics' },
            { id: 'audit', icon: ScrollText, num: 6, label: 'Audit Trail' },
          ].map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id as Tab)}
              className={cn('tab-custom', tab === t.id && 'active')}
            >
              <t.icon className="h-4 w-4" />
              <span>{t.num}. {t.label}</span>
            </button>
          ))}
        </div>

        {/* tab content */}
        {tab === 'patients' ? <PatientsTab lang={uiLang} onOpenWorkspace={() => router.push('/care')} /> : null}
        {tab === 'drug-checker' ? <DrugCheckerTab lang={uiLang} /> : null}
        {tab === 'followups' ? <FollowupsTab lang={uiLang} /> : null}
        {tab === 'who-dak' ? <WhoDakTab lang={uiLang} /> : null}
        {tab === 'analytics' ? <DoctorAnalytics /> : null}
        {tab === 'audit' ? <AuditTab lang={uiLang} /> : null}
      </div>
    </div>
  );
}

// ============================================================
// Tab: Patients
// ============================================================
function PatientsTab({ lang, onOpenWorkspace }: { lang: 'en' | 'ur' | 'roman'; onOpenWorkspace?: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [patients, setPatients] = useState<RealPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [soapLoading, setSoapLoading] = useState(false);
  const [soapResult, setSoapResult] = useState<{ subjective: any; objective: any; assessment: any; plan: any; disclaimer?: string } | null>(null);
  const [viewConvOpen, setViewConvOpen] = useState(false);
  const [convLoading, setConvLoading] = useState(false);
  const [loadedConv, setLoadedConv] = useState<{ id: string; messages: Array<{ id: string; role: string; content: string; triageLevel?: string; createdAt: number }> } | null>(null);

  const openConversation = async (convId: string) => {
    setViewConvOpen(true);
    setConvLoading(true);
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(convId)}`);
      const data = await res.json();
      if (res.ok && data.conversation) {
        setLoadedConv(data.conversation);
      } else {
        setLoadedConv(null);
        toast.error(data.error || 'Failed to load conversation');
      }
    } catch {
      setLoadedConv(null);
      toast.error('Network error loading conversation');
    } finally {
      setConvLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/doctor/patients', { cache: 'no-store' });
        if (!res.ok) {
          if (res.status === 403) { setError('Forbidden — doctor role required.'); return; }
          setError(`Failed to load patients (${res.status})`);
          return;
        }
        const data = await res.json();
        if (!cancelled) setPatients(data.patients ?? []);
      } catch {
        if (!cancelled) setError('Network error loading patients.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const selected = patients.find((p) => p.conversationId === selectedId);

  const generateSoap = useCallback(async () => {
    if (!selected) return;
    setSoapLoading(true);
    setSoapResult(null);
    try {
      const res = await fetch('/api/doctor/soap-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selected.conversationId }),
      });
      if (!res.ok) {
        toast.error('SOAP note generation failed.');
        return;
      }
      const data = await res.json();
      setSoapResult(data.soapNote);
      toast.success('SOAP note generated — verify all findings.');
    } catch {
      toast.error('SOAP note generation failed.');
    } finally {
      setSoapLoading(false);
    }
  }, [selected]);

  const exportFhir = useCallback(async () => {
    if (!selected?.patientId) return;
    try {
      const res = await fetch(`/api/doctor/fhir-export?patientId=${encodeURIComponent(selected.patientId)}`);
      if (!res.ok) { toast.error('FHIR export failed.'); return; }
      const bundle = await res.json();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/fhir+json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patient-${selected.patientId}-fhir-bundle.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('FHIR Bundle exported.');
    } catch {
      toast.error('FHIR export failed.');
    }
  }, [selected]);

  if (selected) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedId(null); setSoapResult(null); }} className="gap-1.5">
          <ArrowRight className="h-4 w-4 rotate-180" /> Back to patients
        </Button>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <span className={cn(
                'mt-1 h-3 w-3 shrink-0 rounded-full',
                selected.triageLevel === 'URGENT' ? 'bg-orange-500' : selected.triageLevel === 'ROUTINE' ? 'bg-amber-500' : selected.triageLevel === 'EMERGENCY' ? 'bg-red-500' : 'bg-emerald-500',
              )} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <h2 className="text-lg font-bold text-foreground">{selected.patientName}</h2>
                  <span className="text-xs text-muted-foreground">{selected.patientEmail}</span>
                  <Badge className={cn('text-[10px] font-bold',
                    selected.triageLevel === 'URGENT' ? 'bg-orange-500/15 text-orange-700 dark:text-orange-400' :
                    selected.triageLevel === 'ROUTINE' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' :
                    selected.triageLevel === 'EMERGENCY' ? 'bg-red-500/15 text-red-700 dark:text-red-400' :
                    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400')}>
                    {selected.triageLevel}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{selected.chiefComplaint}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Last activity: {new Date(selected.updatedAt).toLocaleString()}</p>
              </div>
            </div>
            {selected.profile ? (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-border/40 p-2">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Conditions</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.profile.conditions.length > 0 ? selected.profile.conditions.map((c) => (
                      <span key={c} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">{c}</span>
                    )) : <span className="text-[10px] text-muted-foreground">None</span>}
                  </div>
                </div>
                <div className="rounded-lg border border-border/40 p-2">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Allergies</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.profile.allergies.length > 0 ? selected.profile.allergies.map((a) => (
                      <span key={a} className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:text-red-400">⚠ {a}</span>
                    )) : <span className="text-[10px] text-muted-foreground">None</span>}
                  </div>
                </div>
                <div className="rounded-lg border border-border/40 p-2">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Medications</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.profile.medications.length > 0 ? selected.profile.medications.map((m) => (
                      <span key={m} className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">💊 {m}</span>
                    )) : <span className="text-[10px] text-muted-foreground">None</span>}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={generateSoap} disabled={soapLoading} size="sm" className="min-h-9 gap-1.5">
                {soapLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</> : <><Sparkles className="h-3.5 w-3.5" /> Generate SOAP note</>}
              </Button>
              <Button onClick={exportFhir} size="sm" variant="outline" className="min-h-9 gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export FHIR
              </Button>
              <Button onClick={() => void openConversation(selected.conversationId)} size="sm" variant="ghost" className="min-h-9 gap-1.5">
                <FileText className="h-3.5 w-3.5" /> View conversation
              </Button>
            </div>
          </CardContent>
        </Card>

        {soapResult ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" /> AI-drafted SOAP note
                </h3>
                <Badge className="bg-primary/10 text-[9px] font-bold text-primary">OVERRIDABLE</Badge>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-bold text-foreground">S — Subjective</p>
                  <p className="mt-0.5 text-foreground/85">CC: {soapResult.subjective?.chiefComplaint ?? '—'}</p>
                  <p className="text-foreground/85">HPI: {soapResult.subjective?.historyPresentIllness ?? '—'}</p>
                </div>
                <div>
                  <p className="font-bold text-foreground">O — Objective</p>
                  <p className="mt-0.5 text-foreground/85">{soapResult.objective?.physicalExam ?? '—'}</p>
                </div>
                <div>
                  <p className="font-bold text-foreground">A — Assessment</p>
                  <p className="mt-0.5 text-foreground/85">Working: {soapResult.assessment?.workingDiagnosis ?? '—'}</p>
                  {soapResult.assessment?.differentials?.length > 0 ? (
                    <p className="text-foreground/85">DDx: {soapResult.assessment.differentials.join(' · ')}</p>
                  ) : null}
                </div>
                <div>
                  <p className="font-bold text-foreground">P — Plan</p>
                  <p className="mt-0.5 text-foreground/85">Follow-up: {soapResult.plan?.followUp ?? '—'}</p>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground">
                {soapResult.disclaimer ?? 'AI-generated SOAP note — NOT a diagnosis. Doctor must verify all clinical findings.'}
              </p>
            </CardContent>
          </Card>
        ) : null}

        <Dialog open={viewConvOpen} onOpenChange={setViewConvOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                Patient Conversation History
              </DialogTitle>
              <DialogDescription className="text-xs">
                Direct triage exchange and clinical guidance transcript
              </DialogDescription>
            </DialogHeader>
            {convLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading transcript…
              </div>
            ) : loadedConv && loadedConv.messages?.length > 0 ? (
              <div className="space-y-3 pt-2 text-xs">
                {loadedConv.messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      'rounded-xl p-3 border',
                      m.role === 'user'
                        ? 'border-blue-500/30 bg-blue-500/5 ms-6'
                        : 'border-border/80 bg-muted/40 me-6'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1 text-[10px] text-muted-foreground">
                      <span className="font-bold uppercase tracking-wider">
                        {m.role === 'user' ? 'Patient' : 'SehatAI Assistant'}
                      </span>
                      {m.triageLevel ? (
                        <Badge variant="outline" className="text-[9px] py-0">{m.triageLevel}</Badge>
                      ) : null}
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed text-foreground">{m.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No conversation transcript records found for this encounter.
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Main Clinical Stage (Left 8 Cols) */}
      <div className="space-y-5 lg:col-span-8">
        {/* High Severity Drug Interaction Alert (§ references/06_Doctor_Copilot.png) */}
        <div className="alert-red">
          <AlertTriangle className="h-6 w-6 shrink-0 text-[#d82233] mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="chip chip-red text-[10px] font-bold">
              HIGH SEVERITY DRUG INTERACTION · DEMO
            </span>
            <h3 className="mt-1.5 text-base font-bold text-[#c51d2a]">
              Warfarin + Ciprofloxacin (Patient Zahid Mock)
            </h3>
            <p className="mt-1 text-xs text-[#547099] leading-relaxed">
              Potential clinically significant interaction: ciprofloxacin may increase anticoagulation and bleeding risk.
            </p>
            <div className="mt-2.5 rounded-lg border border-red-200 bg-red-100/60 p-2.5 text-xs font-bold text-[#a51522]">
              Action: Prompt clinician review, evaluate alternatives and appropriate INR monitoring. No automatic dose changes.
            </div>
          </div>
        </div>

        {/* Patient Intake Card */}
        <div className="doctor-intake shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[#112342]">
                Patient Intake: Fatima Ali (28F)
              </h3>
              <p className="mt-0.5 text-xs text-[#637795]">
                Chief complaint: Mild cough and low-grade fever for 48 hours
              </p>
            </div>
            <span className="chip rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              ROUTINE ENCOUNTER
            </span>
          </div>

          <div className="intake-grid mt-4">
            <div className="intake-mini">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <Activity className="h-4 w-4" />
              </span>
              <div>
                <b>Vitals</b>
                <p>120/80 mmHg · 99.1°F</p>
              </div>
            </div>
            <div className="intake-mini">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div>
                <b>Allergies</b>
                <p>None reported (NKA)</p>
              </div>
            </div>
            <div className="intake-mini">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Pill className="h-4 w-4" />
              </span>
              <div>
                <b>Current Medications</b>
                <p>Metformin 500mg, Lisinopril 10mg</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <span className="chip rounded-full bg-[#edeaff] text-[11px] font-bold text-[#5538ee]">
              AI ASSISTANCE · CLINICIAN REVIEW REQUIRED
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('Loading complete electronic health record')}
                className="h-8 rounded-lg border-border text-xs font-bold text-[#547099]"
              >
                Review Full PHR
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (onOpenWorkspace) onOpenWorkspace();
                  else toast.info('Navigating to consultation workspace');
                }}
                className="h-8 rounded-lg bg-[#6554e8] px-3.5 text-xs font-bold text-white hover:bg-[#5241d6]"
              >
                Open Consultation Workspace →
              </Button>
            </div>
          </div>
        </div>

        {/* 2-Column Trend & Medications */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Vitals Trend SVG */}
          <div className="rounded-[16px] border border-border bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#112342]">Recent Vitals Trend</h4>
              <button
                type="button"
                onClick={() => toast.info('Illustrative sample trend graph')}
                className="text-xs font-bold text-[#6554e8] hover:underline"
              >
                View All
              </button>
            </div>
            <div className="mt-3">
              <svg viewBox="0 0 430 135" className="h-32 w-full" role="img" aria-label="Illustrative recent vitals trend">
                <path d="M35 20H420M35 50H420M35 80H420M35 110H420" stroke="#e5edf6" />
                <polyline points="38,63 110,66 184,62 256,56 330,60 413,56" fill="none" stroke="#2a79ee" strokeWidth="3" />
                <polyline points="38,93 110,94 184,92 256,94 330,92 413,92" fill="none" stroke="#8a55ef" strokeWidth="3" />
                {[38,110,184,256,330,413].map((x) => (
                  <circle key={x} cx={x} cy="62" r="4" fill="#2a79ee" />
                ))}
                <text x="36" y="130" fontSize="10" fill="#7991ac">5 Nov</text>
                <text x="201" y="130" fontSize="10" fill="#7991ac">11 Nov</text>
                <text x="380" y="130" fontSize="10" fill="#7991ac">Today</text>
              </svg>
            </div>
          </div>

          {/* Recent Medications */}
          <div className="rounded-[16px] border border-border bg-white p-5 shadow-xs">
            <h4 className="text-sm font-bold text-[#112342]">Recent Medications</h4>
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Pill className="h-4 w-4" />
                </span>
                <div>
                  <b className="text-xs font-bold text-[#112342]">Metformin 500mg</b>
                  <p className="text-[11px] text-[#637795]">Twice daily with meals</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Pill className="h-4 w-4" />
                </span>
                <div>
                  <b className="text-xs font-bold text-[#112342]">Lisinopril 10mg</b>
                  <p className="text-[11px] text-[#637795]">Once daily in morning</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Patient Roster from API */}
        <div className="rounded-[16px] border border-border bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="flex items-center gap-2 text-sm font-bold text-[#112342]">
              <Users className="h-4 w-4 text-[#009b78]" /> Active Patient Queue
            </h4>
            <span className="text-xs font-bold text-[#547099]">{patients.length} incoming encounters</span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-muted/40" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
              {error}
            </div>
          ) : patients.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-[#f8fafc] p-6 text-center text-xs text-[#637795]">
              No active queue encounters. When patients complete an AI triage, their summary appears here.
            </div>
          ) : (
            <ul className="space-y-2">
              {patients.map((p, i) => (
                <motion.li key={p.conversationId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.04 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.conversationId)}
                    className="w-full rounded-xl border border-border bg-[#fbfcfe] p-3 text-start transition-all hover:border-[#6554e8] hover:bg-white focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'h-3 w-3 shrink-0 rounded-full',
                        p.triageLevel === 'URGENT' ? 'bg-orange-500' : p.triageLevel === 'ROUTINE' ? 'bg-amber-500' : p.triageLevel === 'EMERGENCY' ? 'bg-red-500' : 'bg-emerald-500',
                      )} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-bold text-[#112342]">{p.patientName}</p>
                          <Badge className={cn('shrink-0 text-[9px] font-bold',
                            p.triageLevel === 'URGENT' ? 'bg-orange-500/15 text-orange-700' :
                            p.triageLevel === 'ROUTINE' ? 'bg-amber-500/15 text-amber-700' :
                            p.triageLevel === 'EMERGENCY' ? 'bg-red-500/15 text-red-700' :
                            'bg-emerald-500/15 text-emerald-700')}>
                            {p.triageLevel}
                          </Badge>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-[#637795]">{p.chiefComplaint}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-[#849bb5]" />
                    </div>
                  </button>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right Rail: AI Clinical Insights & Quick Actions (§ references/06_Doctor_Copilot.png) */}
      <aside className="space-y-4 lg:col-span-4">
        {/* AI Clinical Insights */}
        <div className="rounded-[16px] border border-border bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-[#112342]">
            <Sparkles className="h-4 w-4 text-[#6554e8]" />
            AI Clinical Insights
          </div>

          <div className="mt-3 space-y-3 text-xs">
            <div className="rounded-xl border border-blue-200 bg-[#edf5ff] p-3 text-[#1a365d]">
              <b className="block text-xs font-bold">Differential considerations (examples)</b>
              <p className="mt-1 text-[11px] leading-relaxed text-[#3b597c]">
                1. Viral upper respiratory infection <br />
                2. Acute bronchitis <br />
                3. Allergic rhinitis
              </p>
            </div>

            <div className="rounded-xl border border-purple-200 bg-[#f4f1ff] p-3 text-[#2a1b63]">
              <b className="block text-xs font-bold">Investigations (if clinically indicated)</b>
              <p className="mt-1 text-[11px] leading-relaxed text-[#544199]">
                CBC · CRP · Imaging only when supported by clinical findings
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-[#ebfbf5] p-3 text-[#0a4734]">
              <b className="block text-xs font-bold">Management support</b>
              <p className="mt-1 text-[11px] leading-relaxed text-[#15694f]">
                Hydration · Rest · Clinical monitoring
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Guidelines viewer active in Tab 4')}
            className="mt-3.5 w-full rounded-xl border-border text-xs font-bold text-[#547099] hover:bg-[#f5f8fc]"
          >
            View Guidelines
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="rounded-[16px] border border-border bg-white p-5 shadow-xs">
          <h4 className="text-sm font-bold text-[#112342]">Quick Actions</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              'Generate Note',
              'Check Interactions',
              'Set Follow-up',
              'Share Summary',
            ].map((action) => (
              <Button
                key={action}
                variant="outline"
                size="sm"
                onClick={() => toast.info(`Action '${action}' triggered`)}
                className="rounded-xl border-border text-xs font-bold text-[#112342] hover:bg-[#f5f8fc]"
              >
                {action}
              </Button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

// ============================================================
// Tab: Drug Checker (bulk enter meds → cross-check)
// ============================================================
function DrugCheckerTab({ lang }: { lang: 'en' | 'ur' | 'roman' }) {
  const [medications, setMedications] = useState('');
  const [allergies, setAllergies] = useState('');
  const [pregnant, setPregnant] = useState(false);
  const [breastfeeding, setBreastfeeding] = useState(false);
  const [ageBand, setAgeBand] = useState('undisclosed');
  const [conditions, setConditions] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DrugCheckerResult | null>(null);

  const run = useCallback(async () => {
    const meds = medications.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    if (meds.length === 0) { toast.error('Enter at least one medication.'); return; }
    setLoading(true); setResult(null);
    try {
      const res = await fetch('/api/doctor/drug-checker', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medications: meds,
          allergies: allergies.split(/[,\n]/).map((s) => s.trim()).filter(Boolean),
          pregnant, breastfeeding, ageBand,
          conditions: conditions.split(/[,\n]/).map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) { toast.error('Drug check failed.'); return; }
      const data = await res.json();
      setResult(data.result);
    } catch {
      toast.error('Drug check failed.');
    } finally {
      setLoading(false);
    }
  }, [medications, allergies, pregnant, breastfeeding, ageBand, conditions]);

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-1.5 text-sm"><FlaskConical className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Bulk drug-interaction checker</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="meds" className="text-sm font-semibold">Medications (one per line or comma-separated) *</Label>
            <Textarea id="meds" rows={3} value={medications} onChange={(e) => setMedications(e.target.value)} placeholder={'Warfarin 5mg\nIbuprofen\nMetformin'} className="mt-1 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="allergies" className="text-sm font-semibold">Allergies (optional)</Label>
              <Input id="allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Penicillin, Sulfa" className="mt-1 h-11 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="conditions" className="text-sm font-semibold">Conditions (optional)</Label>
              <Input id="conditions" value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="diabetes, hypertension, kidney" className="mt-1 h-11 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="age" className="text-sm font-semibold">Age band</Label>
              <Select value={ageBand} onValueChange={setAgeBand}>
                <SelectTrigger id="age" className="mt-1 h-11 min-h-11 w-full rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['undisclosed','child','adolescent','young-adult','middle-adult','elderly'].map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <label className="mt-1 flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background px-3">
              <Checkbox checked={pregnant} onCheckedChange={(v) => setPregnant(v === true)} /> <span className="text-sm font-semibold">Pregnant</span>
            </label>
            <label className="mt-1 flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background px-3">
              <Checkbox checked={breastfeeding} onCheckedChange={(v) => setBreastfeeding(v === true)} /> <span className="text-sm font-semibold">Breastfeeding</span>
            </label>
          </div>
          <Button onClick={run} disabled={loading} className="min-h-11 w-full gap-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking…</> : <><Pill className="h-4 w-4" /> Check interactions</>}
          </Button>
        </CardContent>
      </Card>

      {result ? (
        <Card className={cn(
          'border-l-4',
          result.overallSeverity === 'HIGH' ? 'border-l-red-500' :
          result.overallSeverity === 'MODERATE' ? 'border-l-amber-500' :
          result.overallSeverity === 'LOW' ? 'border-l-yellow-500' : 'border-l-emerald-500',
        )}>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <AlertTriangle className="h-4 w-4" /> Result: <span className={cn(
                  result.overallSeverity === 'HIGH' ? 'text-red-700 dark:text-red-400' :
                  result.overallSeverity === 'MODERATE' ? 'text-amber-700 dark:text-amber-400' :
                  result.overallSeverity === 'LOW' ? 'text-yellow-700 dark:text-yellow-400' : 'text-emerald-700 dark:text-emerald-400',
                )}>{result.overallSeverity}</span>
              </h3>
              <Badge className="bg-muted text-[10px]">{result.hits.length + result.allergies.length + result.flags.length} alerts</Badge>
            </div>
            <p className="text-sm text-foreground/85">{result.recommendation}</p>

            {result.hits.length > 0 ? (
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Drug-drug interactions</p>
                <ul className="space-y-1.5">
                  {result.hits.map((h, i) => (
                    <li key={i} className="rounded-lg border border-border bg-background p-2">
                      <div className="flex items-center gap-2">
                        <Badge className={cn('text-[9px] font-bold',
                          h.severity === 'HIGH' ? 'bg-red-500/15 text-red-700 dark:text-red-400' :
                          h.severity === 'MODERATE' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' : 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400')}>
                          {h.severity}
                        </Badge>
                        <span className="text-xs font-bold text-foreground">{h.drugA} ↔ {h.drugB}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{h.effect}</p>
                      <p className="text-xs text-foreground/85">→ {h.action}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.allergies.length > 0 ? (
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Allergy cross-reactivity</p>
                <ul className="space-y-1.5">
                  {result.allergies.map((a, i) => (
                    <li key={i} className="rounded-lg border border-border bg-background p-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-500/15 text-[9px] font-bold text-red-700 dark:text-red-400">{a.severity}</Badge>
                        <span className="text-xs font-bold text-foreground">{a.trigger} (allergy: {a.allergy})</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Class: {a.drugClass}</p>
                      <p className="text-xs text-foreground/85">→ {a.action}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.flags.length > 0 ? (
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Population flags</p>
                <ul className="space-y-1.5">
                  {result.flags.map((f, i) => (
                    <li key={i} className="rounded-lg border border-border bg-background p-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-500/15 text-[9px] font-bold text-amber-700 dark:text-amber-400">{f.severity}</Badge>
                        <span className="text-xs font-bold text-foreground">{f.type} · {f.drug}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{f.message}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

// ============================================================
// Tab: Follow-ups
// ============================================================
function FollowupsTab({ lang }: { lang: 'en' | 'ur' | 'roman' }) {
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/doctor/followups', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setFollowups(data.followups ?? []);
      }
    } catch {
      // ignore
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async () => {
    if (!patientId || !scheduledFor) { toast.error('Patient ID and date are required.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/doctor/followups', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, scheduledFor, notes: notes || undefined }),
      });
      if (!res.ok) { toast.error('Failed to schedule follow-up.'); return; }
      toast.success('Follow-up scheduled. Patient will see it in their reminders.');
      setPatientId(''); setScheduledFor(''); setNotes('');
      load();
    } finally { setSubmitting(false); }
  }, [patientId, scheduledFor, notes, load]);

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-1.5 text-sm"><CalendarPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Schedule a follow-up</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="pid" className="text-sm font-semibold">Patient ID *</Label>
              <Input id="pid" value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="cuid from patient roster" className="mt-1 h-11 rounded-xl font-mono text-xs" />
            </div>
            <div>
              <Label htmlFor="when" className="text-sm font-semibold">Scheduled for *</Label>
              <Input id="when" type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} className="mt-1 h-11 rounded-xl" />
            </div>
          </div>
          <div>
            <Label htmlFor="fnotes" className="text-sm font-semibold">Notes (optional)</Label>
            <Textarea id="fnotes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Check BP, review meds, etc." className="mt-1 rounded-xl" />
          </div>
          <Button onClick={create} disabled={submitting} className="min-h-11 gap-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />} Schedule follow-up
          </Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-foreground">
          <ClipboardCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Pending follow-ups
        </h3>
        {loading ? <div className="h-16 animate-pulse rounded-xl bg-card/50" /> : followups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-4 text-center text-xs text-muted-foreground">No pending follow-ups.</div>
        ) : (
          <ul className="space-y-2">
            {followups.map((f) => (
              <li key={f.id} className="rounded-xl border border-border bg-card p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-foreground">{f.patientName}</p>
                  <span className="text-[11px] text-muted-foreground">{new Date(f.scheduledFor).toLocaleString()}</span>
                </div>
                {f.notes ? <p className="mt-1 text-xs text-muted-foreground">{f.notes}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Tab: WHO DAK quick reference
// ============================================================
function WhoDakTab({ lang }: { lang: 'en' | 'ur' | 'roman' }) {
  const [tables, setTables] = useState<Record<string, any[]>>({});
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/doctor/who-dak');
        if (res.ok) {
          const data = await res.json();
          setTables(data.tables ?? {});
          setCount(data.count ?? 0);
        }
      } catch {
        // ignore
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="h-32 animate-pulse rounded-xl bg-card/50" />;

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-foreground">WHO SMART Guidelines — Digital Adaptation Kit</h3>
              <p className="text-xs text-muted-foreground">{count} decision tables encoded. Source: WHO SMART Guidelines (smart.who.int).</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {Object.entries(tables).map(([key, items]) => (
        Array.isArray(items) && items.length > 0 ? (
          <Card key={key}>
            <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{key} ({items.length})</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {items.slice(0, 8).map((item: any, i: number) => (
                  <li key={item.id ?? i} className="rounded-lg border border-border bg-background p-2 text-xs">
                    {item.condition ? <p className="font-bold text-foreground">{item.condition}</p> : null}
                    {item.action ? <p className="mt-0.5 text-muted-foreground">{typeof item.action === 'object' ? item.action.en : item.action}</p> : null}
                    {item.priority ? (
                      <Badge className={cn('mt-1 text-[9px] font-bold',
                        item.priority === 'emergency' ? 'bg-red-500/15 text-red-700 dark:text-red-400' :
                        item.priority === 'urgent' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' :
                        'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400')}>
                        {item.priority}
                      </Badge>
                    ) : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null
      ))}
    </div>
  );
}

// ============================================================
// Tab: Audit trail (doctor's own PHI reads + actions)
// ============================================================
function AuditTab({ lang }: { lang: 'en' | 'ur' | 'roman' }) {
  const [logs, setLogs] = useState<{ id: string; action: string; resource: string | null; meta: unknown; at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/audit?limit=50', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setLogs(data.entries ?? []);
        }
      } catch {
        // ignore
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-foreground">
        <ScrollText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Your audit trail
      </h3>
      <p className="mb-3 text-xs text-muted-foreground">Every PHI read, SOAP draft, and follow-up you create is logged here. Patients can request this log.</p>
      {loading ? <div className="h-32 animate-pulse rounded-xl bg-card/50" /> : logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-4 text-center text-xs text-muted-foreground">No audit events yet.</div>
      ) : (
        <ul className="max-h-96 space-y-1.5 overflow-y-auto custom-scrollbar">
          {logs.map((l) => (
            <li key={l.id} className="rounded-lg border border-border bg-background p-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{l.action}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(l.at).toLocaleString()}</span>
              </div>
              {l.resource ? <p className="text-muted-foreground">resource: <code className="text-[10px]">{l.resource}</code></p> : null}
              {l.meta ? <p className="text-muted-foreground">{typeof l.meta === 'string' ? l.meta : JSON.stringify(l.meta)}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
