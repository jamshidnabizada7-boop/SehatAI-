// ============================================================
// SehatAI — Shared types (used by BOTH frontend and backend)
// Single source of truth for pipeline data shapes.
// ============================================================

export type Lang = 'en' | 'ur' | 'roman';
export type TriageLevel = 'EMERGENCY' | 'URGENT' | 'ROUTINE' | 'SELF_CARE';

export const TRIAGE_ORDER: Record<TriageLevel, number> = {
  EMERGENCY: 4,
  URGENT: 3,
  ROUTINE: 2,
  SELF_CARE: 1,
};

// ---------- Trilingual text ----------
export interface TriText {
  en: string;
  ur: string;
  roman: string;
}

// ---------- Red-flag lexicon ----------
export interface RedFlagPattern {
  id: string;
  // Terms for each language; a pattern matches when its required
  // combination logic is satisfied (ALL groups present, ANY term per group).
  groups: { terms: string[] }[]; // every group must have at least one term match
  terms_en: string[];
  terms_ur: string[];
  terms_roman: string[];
  reason_template: TriText;
  category: string; // e.g. 'cardiac', 'stroke', 'obstetric', 'pediatric', ...
  sources: string[]; // e.g. ['WHO — Noncommunicable diseases', 'WHO EMRO — Emergency signs']
}

// Severity modifiers raise urgency (duration, intensity words)
export interface ModifierTerm {
  id: string;
  terms: string[]; // any language mixed; matched case-insensitive
  boost: 1 | 2; // 1 = escalate one level, 2 = escalate to EMERGENCY
}

// ---------- Emergency templates (pre-written, never LLM-generated) ----------
export interface EmergencyTemplate {
  patternCategory: string;
  title: TriText;
  reasonIntro: TriText;
  immediateActions: TriText[]; // 3-5 steps while waiting for help
  doNot: TriText[]; // things NOT to do
  sources: string[];
}

// ---------- Knowledge corpus (verified pack) ----------
export interface CorpusItem {
  id: string;
  topic: string; // slug
  title: TriText;
  /** short trilingual guidance used offline + as grounding context */
  content: TriText;
  /** retrieval keywords, all languages mixed */
  tags: string[];
  /** guidance level of the topic itself */
  baseLevel: TriageLevel;
  audience: 'general' | 'maternal' | 'child' | 'emergency';
  source: {
    publisher: string; // WHO, UNICEF, Pakistan MoNHSRC, IFRC...
    title: string;
    url: string;
    license: string;
    verifiedAt: string; // YYYY-MM
  };
}

// ---------- Clinical context extraction (deterministic, shared L0) ----------
/**
 * How a medical condition relates to the user:
 * - ESTABLISHED      user states they have a (past) diagnosis ("I have diabetes",
 *                    "I was diagnosed with hypertension", "mujhe sugar hai")
 * - SUSPECTED        user suspects they may have it ("I think I have diabetes")
 * - QUESTION         user asks whether they could have it ("Could I have diabetes?")
 * - SYMPTOM_ASSOCIATED user mentions symptoms of it without claiming the condition
 * - UNKNOWN          condition mentioned with no clear stance
 */
export type ConditionState = 'ESTABLISHED' | 'SUSPECTED' | 'QUESTION' | 'SYMPTOM_ASSOCIATED' | 'UNKNOWN';

export interface ConditionFinding {
  /** canonical condition key, e.g. 'diabetes', 'hypertension' */
  condition: string;
  state: ConditionState;
  /** evidence term matched in the user text */
  evidence?: string;
}

export type MedicationIntent =
  | 'GENERAL_INFO' // "can I take antibiotics without a doctor?" / "what is paracetamol used for?"
  | 'PRESCRIBING' // "give me the dose", "which antibiotic should I take", "prescribe me X"
  | 'OVERDOSE' // "I took too many pills"
  | 'MISSED_DOSE' // "I forgot my insulin dose"
  | 'INTERACTION' // "can I take X with Y"
  | 'STOP_START' // "should I stop my medication"
  | 'OTHER';

export interface MedicationFinding {
  /** canonical drug/compound names detected, e.g. ['amoxicillin'] or ['antibiotic'] */
  drugs: string[];
  intent: MedicationIntent;
  /** user supplied age/weight/symptoms expecting an individualized regimen */
  personalized: boolean;
  /** special contexts mentioned alongside (child, pregnancy, elderly, chronic) */
  contexts: string[];
}

export interface TraumaFinding {
  /** 'vehicle' | 'fall' | 'blow' | 'penetrating' | 'burn' | 'electrical' | 'chemical' | 'unknown' */
  mechanism: string;
  /** injury sites: head, neck, spine/back, chest, abdomen, limbs */
  sites: string[];
  /** severity signs: loc, numbness, paralysis, severe_pain, deformity, heavy_bleeding, breathing_difficulty, vomiting */
  severitySigns: string[];
}

export interface SpecialPopulationFinding {
  pregnancy: boolean;
  child: boolean;
  elderly: boolean;
  /** explicit age in years mentioned for the patient, if any */
  ageMentioned: number | null;
}

export interface VagueDistressFinding {
  detected: boolean;
  /** 'high' = strong distress words ("very sick", "something is wrong"); 'low' = mild ("feel weird") */
  intensity: 'high' | 'low';
  /** any concrete symptom/condition mentioned in the message */
  hasSpecificSymptoms: boolean;
}

export interface InjectionFinding {
  detected: boolean;
  /** which manipulation patterns matched (for logging only — never affects triage) */
  matched: string[];
}

/** Everything deterministic L0 extraction knows about one user message. */
export interface ClinicalContext {
  conditions: ConditionFinding[];
  medications: MedicationFinding | null;
  trauma: TraumaFinding | null;
  populations: SpecialPopulationFinding;
  vagueDistress: VagueDistressFinding;
  injection: InjectionFinding;
  /** abnormal glucose reading mentioned, e.g. {value: 300, unit: 'mg'} */
  glucoseReading: { value: number; severe: boolean } | null;
  /** user explicitly asks a question about a condition (not asserting symptoms) */
  isQuestion: boolean;
  /** any concrete symptom asserted (fever, pain, vomiting…) */
  hasSymptoms: boolean;
}

/** Deterministic clarification requirement derived from the context. */
export interface ClarificationNeed {
  needed: boolean;
  /** machine-readable reason codes: 'vague_distress' | 'condition_question' | ... */
  reasons: string[];
}

// ---------- Glossary ----------
export interface GlossaryTerm {
  en: string;
  ur: string;
  roman: string;
}

// ---------- Citations ----------
export interface Citation {
  id: string; // corpus item id
  title: string; // in English for the card header
  publisher: string;
  url: string;
  license?: string;
  verifiedAt?: string;
}

// ---------- Pipeline stages (SSE events) ----------
export type PipelineStage =
  | 'safety'
  | 'language'
  | 'triage'
  | 'retrieval'
  | 'generation'
  | 'validation'
  | 'emergency'
  | 'done'
  | 'error';

export interface SafetyStageData {
  engine: 'L0-lexicon' | 'L1-classifier' | 'combined';
  redFlags: { id: string; category: string; reason: string }[];
  latencyMs: number;
}

export interface LanguageStageData {
  language: Lang;
  confidence: number;
  method: 'script' | 'llm';
}

export interface TriageStageData {
  level: TriageLevel;
  reason: string; // in user language
  signals: string[];
  engine: 'L0' | 'L1' | 'offline' | 'combined' | 'intent';
  shortCircuited: boolean;
}

export interface RetrievalStageData {
  chunks: { id: string; title: string; publisher: string; score: number }[];
  method: 'keyword-hybrid' | 'context-aware' | 'none';
}

export interface ValidationStageData {
  verdict: 'pass' | 'regenerated' | 'fallback';
  checks: { name: string; passed: boolean }[];
  latencyMs: number;
}

export interface EmergencyStageData {
  templateCategory: string;
  title: string; // in user language
  reason: string; // why it triggered (matched pattern reason)
  matchedPatternId: string;
  actions: string[];
  doNot: string[];
  numbers: { label: string; number: string }[];
  sources: string[];
}

// ---------- Phase 1: Confidence band (calibrated self-assessment) ----------
/** Deterministic confidence estimate attached to every pipeline response. */
export interface ResponseConfidence {
  band: 'HIGH' | 'MEDIUM' | 'LOW';
  /** 0-1 calibrated score (1.0 = deterministic short-circuit) */
  score: number;
  /** human-readable factors that lowered/anchored the score */
  reasons: string[];
}

// ---------- Phase 1: Drug-interaction check (frontend-facing summary) ----------
/** Severity scale shared by interactions, allergy hits and population flags. */
export type DrugSeverity = 'HIGH' | 'MODERATE' | 'LOW' | 'NONE';

/** One drug-drug interaction hit (from the rules engine). */
export interface DrugInteractionHit {
  drugA: string;
  drugB: string;
  severity: DrugSeverity;
  effect: string;
  action: string;
  source: string;
}

/** One allergy cross-reactivity hit. */
export interface AllergyHit {
  allergy: string;
  trigger: string;
  drugClass: string;
  severity: DrugSeverity;
  action: string;
}

/** One special-population flag (pregnancy, renal, paediatric, …). */
export interface FlagHit {
  type: 'pregnancy' | 'breastfeeding' | 'renal' | 'hepatic' | 'pediatric' | 'elderly' | 'duplicate';
  drug: string;
  message: string;
  severity: DrugSeverity;
}

/** Full drug-check payload — shipped on the SSE `done` event so the
 *  DrugWarningCard can render hits/allergies/flags verbatim. */
export interface DrugCheckSummary {
  severity: DrugSeverity;
  recommendation: string;
  hits: DrugInteractionHit[];
  allergies: AllergyHit[];
  flags: FlagHit[];
}

export interface DoneStageData {
  messageId: string;
  conversationId: string;
  content: string; // final full answer text (markdown-ish)
  language: Lang;
  triage: TriageStageData;
  citations: Citation[];
  validation: ValidationStageData | null;
  offline: boolean;
  latencyMs: number;
  /** Phase 1: confidence band on every response */
  confidence?: ResponseConfidence | null;
  /** Phase 1: drug-interaction / allergy / flag payload (when present and severity !== 'NONE') */
  drugCheck?: DrugCheckSummary | null;
}

export interface SSEEvent {
  stage: PipelineStage;
  data: unknown;
}

// ---------- Dialogue Stream Isolation (M1 / R1) ----------
export interface PatientDialogueMessage {
  readonly role: 'user';
  readonly content: string;
  readonly language?: Lang;
  readonly timestamp?: Date | string;
}

export type PatientDialogueStream = readonly PatientDialogueMessage[];

export interface AssistantDialogueMessage {
  readonly role: 'assistant';
  readonly content: string;
  readonly triageLevel?: TriageLevel;
  readonly citations?: Citation[];
  readonly emergency?: boolean;
  readonly timestamp?: Date | string;
}

export type DialogueHistoryMessage = PatientDialogueMessage | AssistantDialogueMessage;
export type DialogueHistoryStream = readonly DialogueHistoryMessage[];

/**
 * Pure stream splitter that guarantees structural role isolation.
 * Takes raw history messages from persistence/session and current message,
 * separating them into:
 * 1. `patientStream`: strictly `role: 'user'` messages for L0 triage, L1 clinical extraction, and clinical context builder.
 * 2. `historyStream`: all turns with role tags for conversational generation.
 */
export function createDialogueStreams(
  rawMessages: Array<{ role: string; content: string; [key: string]: unknown }>,
  currentMessage: string,
  currentLanguage?: Lang,
): {
  patientStream: PatientDialogueStream;
  historyStream: DialogueHistoryStream;
} {
  const patientStream: PatientDialogueMessage[] = [];
  const historyStream: DialogueHistoryMessage[] = [];

  for (const m of rawMessages) {
    if (m.role === 'user') {
      const userMsg: PatientDialogueMessage = {
        role: 'user',
        content: m.content,
        language: m.language as Lang | undefined,
        timestamp: (m.createdAt ?? m.timestamp) as Date | string | undefined,
      };
      patientStream.push(userMsg);
      historyStream.push(userMsg);
    } else if (m.role === 'assistant') {
      historyStream.push({
        role: 'assistant',
        content: m.content,
        triageLevel: m.triageLevel as TriageLevel | undefined,
        citations: Array.isArray(m.citations) ? (m.citations as Citation[]) : undefined,
        emergency: Boolean(m.emergency),
        timestamp: (m.createdAt ?? m.timestamp) as Date | string | undefined,
      });
    }
  }

  const currentMsg: PatientDialogueMessage = {
    role: 'user',
    content: currentMessage,
    language: currentLanguage,
    timestamp: new Date().toISOString(),
  };
  patientStream.push(currentMsg);
  historyStream.push(currentMsg);

  return {
    patientStream: Object.freeze(patientStream),
    historyStream: Object.freeze(historyStream),
  };
}

// ---------- Chat messages (client-side state) ----------
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  language?: Lang;
  triage?: TriageStageData;
  citations?: Citation[];
  validation?: ValidationStageData | null;
  offline?: boolean;
  emergency?: EmergencyStageData | null;
  /** Phase 1: confidence band on every assistant response. */
  confidence?: ResponseConfidence | null;
  /** Phase 1: drug-interaction / allergy / flag payload (when present and severity !== 'NONE'). */
  drugCheck?: DrugCheckSummary | null;
  createdAt: number;
  streaming?: boolean;
}

// ---------- Facilities ----------
export interface Facility {
  id: string;
  name: string;
  nameUr?: string;
  type: 'hospital' | 'clinic' | 'bhuc' | 'maternity' | 'pharmacy';
  lat: number;
  lng: number;
  city: string;
  district: string;
  phone?: string;
  services: string[];
  emergency24h: boolean;
  source: string;
  verified: boolean;
}

export const FACILITY_TYPE_LABEL: Record<Facility['type'], string> = {
  hospital: 'Hospital',
  clinic: 'Clinic',
  bhuc: 'Basic Health Unit (BHU)',
  maternity: 'Maternity Home',
  pharmacy: 'Pharmacy',
};

// ---------- Reminders ----------
export interface Reminder {
  id: string;
  sessionToken: string;
  type: 'med' | 'vax' | 'anc' | 'other';
  title: string;
  notes?: string;
  timeOfDay: string; // "HH:MM"
  days: number[]; // 0-6 (Sun-Sat), empty = every day
  nextDue: string; // ISO
  status: 'active' | 'done' | 'snoozed';
  createdAt: string;
}

// ---------- Doctor summary ----------
export interface DoctorSummary {
  conversationId: string;
  chiefComplaint: string;
  duration: string;
  symptoms: string[];
  redFlagsObserved: string[];
  triageLevel: TriageLevel;
  guidanceGiven: string[];
  language: Lang;
  disclaimer: string;
}

// ---------- Eval ----------
export type EvalCategory =
  | 'triage'
  | 'redflag-positive'
  | 'redflag-nearmiss'
  | 'refusal'
  | 'grounding'
  | 'multilingual-parity';

export interface GoldenCase {
  id: string;
  category: EvalCategory;
  input: string;
  language: Lang;
  expected: {
    triage?: TriageLevel;
    refuse?: boolean; // should refuse diagnosis/dose requests
    cite?: boolean; // should include citations
    topic?: string; // expected corpus topic tag
  };
}

export interface EvalResultRow {
  caseId: string;
  category: EvalCategory;
  input: string;
  language: Lang;
  expected: string;
  actual: string;
  passed: boolean;
  metric: Record<string, unknown>;
}

export interface EvalRunSummary {
  total: number;
  passed: number;
  accuracy: number;
  emergencyRecall: number;
  underTriageRate: number;
  falsePositiveRate: number;
  refusalCorrectness: number;
  citationRate: number;
  latencyP50: number;
  latencyP95: number;
  categoryBreakdown: Record<string, { total: number; passed: number }>;
}

// ---------- API request/response bodies ----------
export interface ChatRequestBody {
  message: string;
  language?: Lang | 'auto';
  sessionId: string;
  conversationId?: string;
}

export interface VoiceTranscribeResponse {
  text: string;
  language?: Lang;
}

export interface FacilitiesQuery {
  lat?: number;
  lng?: number;
  city?: string;
  type?: Facility['type'] | 'all';
  radiusKm?: number;
}

export interface KnowledgeManifest {
  version: string;
  generatedAt: string;
  items: number;
  lexiconPatterns: number;
  corpusChecksum: string;
}
