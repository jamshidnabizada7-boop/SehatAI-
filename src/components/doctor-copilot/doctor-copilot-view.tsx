'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  FileText,
  ClipboardCheck,
  Pill,
  AlertTriangle,
  Activity,
  Users,
  Clock,
  ShieldCheck,
  Lock,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Doctor Copilot (Phase 2 stub)
// A separate view for clinicians, framed as a documentation aid
// (not SaMD) per Abridge/DAX. Shows:
//   - Patient intake summaries (from conversations with consent)
//   - AI-drafted SOAP notes (auditable — every claim links to source)
//   - Drug-interaction warnings (from the same engine as patient app)
//   - Differential support (3-tier, Glass-style)
//   - Follow-up + outcome tracking
//   - Doctor override + audit trail
//
// This is a STUB for Phase 2 — the full Doctor Copilot is Phase 3.
// It demonstrates the product surface + safety framing.
// ============================================================

interface MockPatient {
  id: string;
  name: string;
  age: number;
  sex: 'M' | 'F';
  chiefComplaint: string;
  triage: 'EMERGENCY' | 'URGENT' | 'ROUTINE' | 'SELF_CARE';
  waitingMin: number;
  conditions: string[];
  allergies: string[];
  medications: string[];
  aiSummary?: string;
  drugAlerts?: { severity: 'HIGH' | 'MODERATE'; drug: string; effect: string }[];
}

const MOCK_PATIENTS: MockPatient[] = [
  {
    id: 'p1',
    name: 'Ayesha K.',
    age: 34,
    sex: 'F',
    chiefComplaint: 'Headache + blurred vision, 3 days',
    triage: 'URGENT',
    waitingMin: 12,
    conditions: ['Hypertension'],
    allergies: [],
    medications: ['Amlodipine 5mg'],
    aiSummary:
      '34F with known hypertension presenting with 3-day headache + blurred vision. Rule out hypertensive emergency — check BP now. Differential includes tension headache, migraine, hypertensive urgency.',
    drugAlerts: [
      { severity: 'MODERATE', drug: 'Amlodipine', effect: 'Continue current dose; monitor BP — headache may indicate inadequate control.' },
    ],
  },
  {
    id: 'p2',
    name: 'Bilal A.',
    age: 58,
    sex: 'M',
    chiefComplaint: 'Chest discomfort on exertion',
    triage: 'URGENT',
    waitingMin: 8,
    conditions: ['Diabetes Type 2', 'Hypertension'],
    allergies: ['Penicillin'],
    medications: ['Metformin 1000mg', 'Warfarin 5mg', 'Glimepiride 2mg'],
    aiSummary:
      '58M diabetic, on warfarin, presenting with exertional chest discomfort — rule out ACS. ECG + troponin indicated. Note: penicillin allergy — avoid amoxicillin if infection suspected.',
    drugAlerts: [
      { severity: 'HIGH', drug: 'Warfarin + NSAIDs', effect: 'Avoid ibuprofen/diclofenac — bleeding risk. Use paracetamol for pain.' },
    ],
  },
  {
    id: 'p3',
    name: 'Fatima R.',
    age: 27,
    sex: 'F',
    chiefComplaint: '7 months pregnant, ankle swelling',
    triage: 'ROUTINE',
    waitingMin: 25,
    conditions: ['Pregnancy (3rd trimester)'],
    allergies: [],
    medications: ['Folic acid', 'Iron'],
    aiSummary:
      '27F, 3rd trimester, bilateral ankle swelling. Likely physiological, but check BP + urine protein to rule out preeclampsia. No red flags reported.',
  },
];

export function DoctorCopilotView() {
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [realPatients, setRealPatients] = useState<typeof MOCK_PATIENTS>([]);
  const [loading, setLoading] = useState(true);
  const [useReal, setUseReal] = useState(false);

  // Phase 2 — fetch real patient conversations (consent-gated)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/doctor/patients');
        if (res.ok) {
          const data = await res.json();
          if (data.patients && data.patients.length > 0 && !cancelled) {
            const mapped = data.patients.map((p: any) => ({
              id: p.conversationId,
              name: p.patientName || (p.isGuest ? 'Guest patient' : 'Unknown'),
              age: 0,
              sex: (p.profile?.sex === 'female' ? 'F' : 'M') as 'M' | 'F',
              chiefComplaint: p.chiefComplaint || 'No complaint recorded',
              triage: (p.triageLevel || 'ROUTINE') as 'EMERGENCY' | 'URGENT' | 'ROUTINE' | 'SELF_CARE',
              waitingMin: Math.floor((Date.now() - new Date(p.updatedAt).getTime()) / 60000),
              conditions: p.profile?.conditions ?? [],
              allergies: p.profile?.allergies ?? [],
              medications: p.profile?.medications ?? [],
              aiSummary: undefined,
              drugAlerts: undefined,
              isGuest: p.isGuest ?? false,
            }));
            if (!cancelled) {
              setRealPatients(mapped);
              setUseReal(true);
            }
          }
        }
      } catch {
        // fall back to mock data
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Use real patients if available; show mock data only as a fallback if the API returned nothing
  // (e.g. no conversations in the database yet)
  const patients = useReal ? realPatients : (loading ? [] : MOCK_PATIENTS);
  const selected = patients.find((p) => p.id === selectedId);

  if (selected) {
    return <PatientDetail patient={selected} lang={uiLang} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="custom-scrollbar h-full overflow-y-auto px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-4">
        {/* header */}
        <div>
          <div className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" aria-hidden />
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
              {uiLang === 'ur' ? 'ڈاکٹر کاپائلٹ' : uiLang === 'roman' ? 'Doctor Copilot' : 'Doctor Copilot'}
            </h1>
            <Badge variant="secondary" className="bg-amber-500/15 text-[10px] font-bold text-amber-700 dark:text-amber-400">
              {uiLang === 'ur' ? 'پائلٹ' : uiLang === 'roman' ? 'Pilot' : 'Pilot'}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {uiLang === 'ur'
              ? 'ابتدائی جائزہ + دستاویزی امداد — تشخیص نہیں۔'
              : uiLang === 'roman'
                ? 'Ibtidai jaiza + dastaveezi imdaad — tashkhees nahin.'
                : 'Pre-visit intake summaries + documentation aid — not a diagnosis.'}
          </p>
        </div>

        {/* safety framing banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-amber-500/30 bg-amber-50/60 p-3 dark:bg-amber-950/20"
        >
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
            <div className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              <p className="font-bold">
                {uiLang === 'ur' ? 'دستاویزی امداد، SaMD نہیں' : uiLang === 'roman' ? 'Dastaveezi imdaad, SaMD nahin' : 'Documentation aid, not SaMD'}
              </p>
              <p className="mt-0.5">
                {uiLang === 'ur'
                  ? 'یہ ٹول ڈاکٹر کی مدد کرتا ہے، فیصلے نہیں کرتا۔ ہر AI تجویز قابل ترمیم ہے۔'
                  : uiLang === 'roman'
                    ? 'Yeh tool doctor ki madad karta hai, faislay nahin karta. Har AI tajweez qaabil-e-tameer hai.'
                    : 'This tool assists the doctor, it does not make decisions. Every AI suggestion is overridable.'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* patient queue */}
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card/50" />
            ))}
          </div>
        ) : patients.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" aria-hidden />
            <p className="text-sm text-muted-foreground">
              {uiLang === 'ur'
                ? 'ابھی کوئی مریض نہیں۔ جب مریض چیٹ کریں گے تو یہاں ظاہر ہوں گے۔'
                : uiLang === 'roman'
                  ? 'Abhi koi mareez nahin. Jab mareez chat karenge to yahan zahir honge.'
                  : 'No patients yet. When patients chat with SehatAI, they will appear here.'}
            </p>
          </div>
        ) : (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <Users className="h-4 w-4 text-primary" aria-hidden />
              {uiLang === 'ur' ? 'مریضوں کی قطار' : uiLang === 'roman' ? 'Mareezon ki qatar' : 'Patient queue'}
            </h2>
            <span className="text-xs text-muted-foreground">
              {patients.length} {uiLang === 'ur' ? 'مریض' : uiLang === 'roman' ? 'mareez' : 'patients'}
            </span>
          </div>
          <ul className="space-y-2">
            {patients.map((p, i) => (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className="w-full rounded-xl border border-border bg-card p-3.5 text-start shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <div className="flex items-center gap-3">
                    {/* triage indicator dot */}
                    <span
                      className={cn(
                        'h-3 w-3 shrink-0 rounded-full',
                        p.triage === 'URGENT' ? 'bg-orange-500' : p.triage === 'ROUTINE' ? 'bg-amber-500' : p.triage === 'EMERGENCY' ? 'bg-red-500' : 'bg-emerald-500',
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-foreground">{p.name}</p>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'shrink-0 text-[9px] font-bold',
                            p.triage === 'URGENT' ? 'bg-orange-500/15 text-orange-700 dark:text-orange-400' : p.triage === 'ROUTINE' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' : p.triage === 'EMERGENCY' ? 'bg-red-500/15 text-red-700 dark:text-red-400' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
                          )}
                        >
                          {p.triage}
                        </Badge>
                        {(p as any).isGuest ? (
                          <Badge variant="secondary" className="shrink-0 bg-muted text-[9px] font-bold text-muted-foreground">
                            Guest
                          </Badge>
                        ) : null}
                        {p.drugAlerts?.length ? (
                          <Badge variant="secondary" className="shrink-0 bg-red-500/15 text-[9px] font-bold text-red-700 dark:text-red-400">
                            <AlertTriangle className="mr-0.5 h-2.5 w-2.5" aria-hidden />
                            {p.drugAlerts.length}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{p.chiefComplaint}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" aria-hidden />
                          {p.waitingMin}m ago
                        </span>
                        {p.conditions.length > 0 ? (
                          <span className="flex items-center gap-1 truncate">
                            <Activity className="h-3 w-3 shrink-0" aria-hidden />
                            <span className="truncate">{p.conditions.join(', ')}</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 self-center text-muted-foreground/40" aria-hidden />
                  </div>
                </button>
              </motion.li>
            ))}
          </ul>
        </div>
        )}

        {/* feature roadmap */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            {uiLang === 'ur' ? 'آمد والی خصوصیات' : uiLang === 'roman' ? 'Aamad wali khasosiat' : 'Coming features'}
          </h3>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-primary" aria-hidden />
              {uiLang === 'ur' ? 'SOAP نوٹ آٹو جنریشن (قابل آڈٹ)' : uiLang === 'roman' ? 'SOAP note auto-generation (auditable)' : 'SOAP note auto-generation (auditable)'}
            </li>
            <li className="flex items-center gap-2">
              <Pill className="h-3.5 w-3.5 text-primary" aria-hidden />
              {uiLang === 'ur' ? 'نسخے کی تجویز میں مدد' : uiLang === 'roman' ? 'Nuskhe ki tajweez mein madad' : 'Prescription drafting assistance'}
            </li>
            <li className="flex items-center gap-2">
              <ClipboardCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
              {uiLang === 'ur' ? 'فالو اپ + نتیجہ ٹریکنگ' : uiLang === 'roman' ? 'Follow-up + nateeja tracking' : 'Follow-up + outcome tracking'}
            </li>
            <li className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-primary" aria-hidden />
              {uiLang === 'ur' ? 'EHR انضمام (FHIR)' : uiLang === 'roman' ? 'EHR integration (FHIR)' : 'EHR integration (FHIR)'}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ---------- Patient detail view ----------

function PatientDetail({ patient, lang, onBack }: { patient: MockPatient; lang: 'en' | 'ur' | 'roman'; onBack: () => void }) {
  return (
    <div className="custom-scrollbar h-full overflow-y-auto px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* back */}
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowRight className="h-4 w-4 rotate-180" aria-hidden />
          {lang === 'ur' ? 'واپس' : lang === 'roman' ? 'Wapas' : 'Back to queue'}
        </Button>

        {/* patient header */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'mt-1 h-3 w-3 shrink-0 rounded-full',
                patient.triage === 'URGENT' ? 'bg-orange-500' : patient.triage === 'ROUTINE' ? 'bg-amber-500' : 'bg-emerald-500',
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h1 className="text-lg font-bold text-foreground">{patient.name}</h1>
                <span className="text-sm text-muted-foreground">{patient.age}{patient.sex}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-[10px] font-bold',
                    patient.triage === 'URGENT' ? 'bg-orange-500/15 text-orange-700 dark:text-orange-400' : patient.triage === 'ROUTINE' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
                  )}
                >
                  {patient.triage}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{patient.chiefComplaint}</p>
            </div>
          </div>

          {/* conditions + allergies + meds — fixed alignment */}
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-border/40 p-2">
              <p className="mb-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                {lang === 'ur' ? 'بیماریاں' : lang === 'roman' ? 'Bimariyan' : 'Conditions'}
              </p>
              <div className="flex flex-wrap gap-1">
                {patient.conditions.length > 0 ? patient.conditions.map((c) => (
                  <span key={c} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">{c}</span>
                )) : <span className="text-[10px] text-muted-foreground">None</span>}
              </div>
            </div>
            <div className="rounded-lg border border-border/40 p-2">
              <p className="mb-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                {lang === 'ur' ? 'الرجیز' : lang === 'roman' ? 'Allergies' : 'Allergies'}
              </p>
              <div className="flex flex-wrap gap-1">
                {patient.allergies.length > 0 ? patient.allergies.map((a) => (
                  <span key={a} className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:text-red-400">⚠ {a}</span>
                )) : <span className="text-[10px] text-muted-foreground">None</span>}
              </div>
            </div>
            <div className="rounded-lg border border-border/40 p-2">
              <p className="mb-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                {lang === 'ur' ? 'ادویات' : lang === 'roman' ? 'Adwayaat' : 'Medications'}
              </p>
              <div className="flex flex-wrap gap-1">
                {patient.medications.length > 0 ? patient.medications.map((m) => (
                  <span key={m} className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">💊 {m}</span>
                )) : <span className="text-[10px] text-muted-foreground">None</span>}
              </div>
            </div>
          </div>
        </div>

        {/* AI summary (auditable) */}
        {patient.aiSummary ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                {lang === 'ur' ? 'AI خلاصہ' : lang === 'roman' ? 'AI khulasa' : 'AI pre-visit summary'}
              </h3>
              <Badge variant="secondary" className="bg-primary/10 text-[9px] font-bold text-primary">
                {lang === 'ur' ? 'قابل ترمیم' : lang === 'roman' ? 'Qaabil-e-tameer' : 'Overridable'}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{patient.aiSummary}</p>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {lang === 'ur' ? 'یہ خلاصہ مریض کی گفتگو سے بنا ہے — ڈاکٹر تصدیق کرے گا۔' : lang === 'roman' ? 'Yeh khulasa mareez ki guftagu se bana hai — doctor tasdeeq karega.' : 'Generated from patient conversation — doctor must verify.'}
            </p>
          </div>
        ) : null}

        {/* drug alerts */}
        {patient.drugAlerts?.length ? (
          <div className="rounded-xl border border-red-500/30 bg-red-50/50 p-4 dark:bg-red-950/20">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" aria-hidden />
              {lang === 'ur' ? 'دوا کے انتباہات' : lang === 'roman' ? 'Dawa ke intebahat' : 'Drug safety alerts'}
            </h3>
            <ul className="space-y-2">
              {patient.drugAlerts.map((a, i) => (
                <li key={i} className="rounded-lg border border-red-500/20 bg-card p-2.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={cn('text-[10px] font-bold', a.severity === 'HIGH' ? 'bg-red-500/15 text-red-700 dark:text-red-400' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400')}>
                      {a.severity}
                    </Badge>
                    <span className="text-xs font-bold text-foreground">{a.drug}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{a.effect}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* action: view full conversation */}
        <a
          href={`/api/conversations/${patient.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          <FileText className="h-3.5 w-3.5" aria-hidden />
          {lang === 'ur' ? 'مکمل گفتگو دیکھیں' : lang === 'roman' ? 'Mukammal guftagu dekhein' : 'View full conversation'}
        </a>

        {/* action stub */}
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            {lang === 'ur' ? 'SOAP نوٹ + نسخہ Phase 3 میں آئے گا۔' : lang === 'roman' ? 'SOAP note + nuskha Phase 3 mein aayega.' : 'SOAP note + prescription drafting coming in Phase 3.'}
          </p>
        </div>
      </div>
    </div>
  );
}
