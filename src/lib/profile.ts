// ============================================================
// SehatAI — Personal health profile + symptom journal
// Pure client-side module: types, validation, localStorage
// persistence. NO server calls — the user's medical history
// never leaves their device unless they explicitly share it.
//
// Safety note: this module is metadata-only for now. The
// deterministic safety engine (L0 lexicon → L1 classifier →
// RAG → L2 validator) is UNCHANGED — profile data does NOT
// influence triage decisions in the current build. When the
// LLM returns, profile context can be added to the L1 prompt
// as a structured "patient context" block (additive, never
// in the user-facing prompt).
// ============================================================

import type { Lang, TriText } from '@/lib/types';

// ---------- Storage keys ----------
const PROFILE_KEY = 'sehatai.profile.v1';
const JOURNAL_KEY = 'sehatai.journal.v1';

// ---------- Profile shape ----------
export type AgeBand =
  | 'undisclosed'
  | 'child'
  | 'adolescent'
  | 'young-adult'
  | 'middle-adult'
  | 'elderly';

export type Sex = 'undisclosed' | 'female' | 'male';

export interface IceContact {
  id: string;
  name: string;
  phone: string;
  relation?: string;
}

export interface HealthProfile {
  /** schema version for forward-compat migrations */
  v: 1;
  ageBand: AgeBand;
  sex: Sex;
  /** trilingual chronic-condition ids (see CHRONIC_CONDITIONS) */
  conditions: string[];
  /** free-text allergies (one per line) */
  allergies: string[];
  /** pregnancy status (only shown when sex === 'female') */
  pregnant: boolean;
  /** free-text current medications (one per line) */
  medications: string[];
  /** In-Case-of-Emergency contacts (up to 3) */
  iceContacts: IceContact[];
  updatedAt: number; // epoch ms
}

// ---------- Chronic condition catalog (trilingual) ----------
export interface ConditionDef {
  id: string;
  label: TriText;
  /** used by the future L1 patient-context block */
  canonical: string;
}

export const CHRONIC_CONDITIONS: ConditionDef[] = [
  {
    id: 'diabetes',
    label: {
      en: 'Diabetes',
      ur: 'ذیابیطس',
      roman: 'Diabetes (shakar)',
    },
    canonical: 'diabetes mellitus',
  },
  {
    id: 'hypertension',
    label: {
      en: 'High blood pressure',
      ur: 'بلڈ پریشر',
      roman: 'Blood pressure',
    },
    canonical: 'hypertension',
  },
  {
    id: 'asthma',
    label: {
      en: 'Asthma',
      ur: 'دمہ',
      roman: 'Asthma (dama)',
    },
    canonical: 'asthma',
  },
  {
    id: 'heart',
    label: {
      en: 'Heart disease',
      ur: 'دل کا عارضہ',
      roman: 'Heart disease',
    },
    canonical: 'cardiovascular disease',
  },
  {
    id: 'kidney',
    label: {
      en: 'Kidney disease',
      ur: 'گردے کا عارضہ',
      roman: 'Kidney disease',
    },
    canonical: 'chronic kidney disease',
  },
  {
    id: 'epilepsy',
    label: {
      en: 'Epilepsy / seizures',
      ur: 'مرگی',
      roman: 'Epilepsy (mirgi)',
    },
    canonical: 'epilepsy',
  },
  {
    id: 'tb',
    label: {
      en: 'Tuberculosis (TB)',
      ur: 'ٹی بی',
      roman: 'TB (tap dac)',
    },
    canonical: 'tuberculosis',
  },
  {
    id: 'thalassemia',
    label: {
      en: 'Thalassemia',
      ur: 'تھیلیسیمیا',
      roman: 'Thalassemia',
    },
    canonical: 'thalassemia',
  },
];

export function conditionLabel(id: string, lang: Lang): string {
  const def = CHRONIC_CONDITIONS.find((c) => c.id === id);
  return def ? def.label[lang] : id;
}

// ---------- Age band labels ----------
export const AGE_BAND_LABELS: Record<AgeBand, TriText> = {
  undisclosed: {
    en: 'Prefer not to say',
    ur: 'بتانے سے معذرت',
    roman: 'Naheen batana',
  },
  child: {
    en: 'Child (under 12)',
    ur: 'بچہ (12 سال سے کم)',
    roman: 'Baccha (12 saal se kam)',
  },
  adolescent: {
    en: 'Adolescent (12–17)',
    ur: 'نوجوان (12–17 سال)',
    roman: 'Nojawan (12–17 saal)',
  },
  'young-adult': {
    en: 'Young adult (18–34)',
    ur: 'نوجوان بالغ (18–34 سال)',
    roman: 'Nojawan adult (18–34 saal)',
  },
  'middle-adult': {
    en: 'Adult (35–59)',
    ur: 'بالغ (35–59 سال)',
    roman: 'Adult (35–59 saal)',
  },
  elderly: {
    en: 'Elderly (60+)',
    ur: 'بزرگ (60 سال سے زائد)',
    roman: 'Buzurg (60 saal se zyada)',
  },
};

export function ageBandLabel(band: AgeBand, lang: Lang): string {
  return AGE_BAND_LABELS[band]?.[lang] ?? band;
}

// ---------- Sex labels ----------
export const SEX_LABELS: Record<Sex, TriText> = {
  undisclosed: {
    en: 'Prefer not to say',
    ur: 'بتانے سے معذرت',
    roman: 'Naheen batana',
  },
  female: { en: 'Female', ur: 'خواتین', roman: 'Aurat' },
  male: { en: 'Male', ur: 'مرد', roman: 'Mard' },
};

export function sexLabel(sex: Sex, lang: Lang): string {
  return SEX_LABELS[sex]?.[lang] ?? sex;
}

// ---------- Default profile ----------
export function emptyProfile(): HealthProfile {
  return {
    v: 1,
    ageBand: 'undisclosed',
    sex: 'undisclosed',
    conditions: [],
    allergies: [],
    pregnant: false,
    medications: [],
    iceContacts: [],
    updatedAt: Date.now(),
  };
}

/** A profile counts as "set" if any field has been personalised. */
export function isProfileSet(p: HealthProfile | null | undefined): boolean {
  if (!p) return false;
  if (p.ageBand !== 'undisclosed') return true;
  if (p.sex !== 'undisclosed') return true;
  if (p.conditions.length > 0) return true;
  if (p.allergies.some((a) => a.trim())) return true;
  if (p.pregnant) return true;
  if (p.medications.some((m) => m.trim())) return true;
  if (p.iceContacts.some((c) => c.name.trim() && c.phone.trim())) return true;
  return false;
}

// ---------- Validation helpers ----------
export function normalizeLineList(input: string): string[] {
  return input
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export function isValidPhone(s: string): boolean {
  // Pakistan phone: 03XXXXXXXXX, +92XXXXXXXXXXX, or just digits 7–15 chars
  const trimmed = s.replace(/[\s\-()]/g, '');
  if (!trimmed) return false;
  return /^\+?\d{7,15}$/.test(trimmed);
}

// ---------- Profile persistence ----------
export function loadProfile(): HealthProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<HealthProfile>;
    return sanitizeProfile(parsed);
  } catch {
    return null;
  }
}

export function saveProfile(profile: HealthProfile): void {
  if (typeof window === 'undefined') return;
  try {
    const toStore: HealthProfile = { ...profile, v: 1, updatedAt: Date.now() };
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(toStore));
  } catch {
    // storage may be full / disabled — silent
  }
}

export function clearProfile(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PROFILE_KEY);
  } catch {
    // ignore
  }
}

/** Defensive: only accept known fields + known enum values + trimmed arrays. */
export function sanitizeProfile(input: Partial<HealthProfile> | null | undefined): HealthProfile {
  const base = emptyProfile();
  if (!input || typeof input !== 'object') return base;
  const out: HealthProfile = { ...base, ...input, v: 1 };
  // ageBand
  if (!isAgeBand(out.ageBand)) out.ageBand = 'undisclosed';
  // sex
  if (!isSex(out.sex)) out.sex = 'undisclosed';
  // conditions: must be known ids
  out.conditions = Array.isArray(out.conditions)
    ? out.conditions.filter((c) => typeof c === 'string' && CHRONIC_CONDITIONS.some((d) => d.id === c))
    : [];
  // allergies / medications: string arrays of trimmed lines
  out.allergies = Array.isArray(out.allergies)
    ? out.allergies.map((a) => String(a).trim()).filter(Boolean)
    : [];
  out.medications = Array.isArray(out.medications)
    ? out.medications.map((m) => String(m).trim()).filter(Boolean)
    : [];
  // pregnant: only meaningful if sex === 'female'
  out.pregnant = out.sex === 'female' ? Boolean(out.pregnant) : false;
  // iceContacts
  out.iceContacts = Array.isArray(out.iceContacts) ? out.iceContacts.slice(0, 3).map(sanitizeIce).filter(Boolean) : [];
  out.updatedAt = typeof out.updatedAt === 'number' && Number.isFinite(out.updatedAt) ? out.updatedAt : Date.now();
  return out;
}

function sanitizeIce(input: unknown): IceContact | null {
  if (!input || typeof input !== 'object') return null;
  const r = input as Partial<IceContact>;
  const name = typeof r.name === 'string' ? r.name.trim().slice(0, 80) : '';
  const phone = typeof r.phone === 'string' ? r.phone.trim().slice(0, 24) : '';
  if (!name && !phone) return null;
  return {
    id: typeof r.id === 'string' && r.id ? r.id : genId('ice'),
    name,
    phone,
    relation: typeof r.relation === 'string' ? r.relation.trim().slice(0, 40) : undefined,
  };
}

function isAgeBand(v: unknown): v is AgeBand {
  return v === 'undisclosed' || v === 'child' || v === 'adolescent' || v === 'young-adult' || v === 'middle-adult' || v === 'elderly';
}
function isSex(v: unknown): v is Sex {
  return v === 'undisclosed' || v === 'female' || v === 'male';
}

// ============================================================
// Symptom journal
// ============================================================

export type Severity = 1 | 2 | 3 | 4 | 5;

export interface JournalEntry {
  id: string;
  /** ISO 8601 timestamp of the entry (when the symptom was logged) */
  at: string;
  /** user-typed symptom description */
  symptom: string;
  severity: Severity;
  /** optional notes: context, what they tried, etc. */
  notes?: string;
  /** trilingual triage level the offline engine assigned at log time, if any */
  triage?: 'EMERGENCY' | 'URGENT' | 'ROUTINE' | 'SELF_CARE';
}

export function emptyJournal(): JournalEntry[] {
  return [];
}

export function loadJournal(): JournalEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(JOURNAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeEntry).filter(Boolean);
  } catch {
    return [];
  }
}

export function saveJournal(entries: JournalEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    // keep most-recent-first, cap at 200 entries to bound storage
    const sorted = entries.slice().sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 200);
    window.localStorage.setItem(JOURNAL_KEY, JSON.stringify(sorted));
  } catch {
    // ignore
  }
}

export function clearJournal(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(JOURNAL_KEY);
  } catch {
    // ignore
  }
}

export function sanitizeEntry(input: unknown): JournalEntry | null {
  if (!input || typeof input !== 'object') return null;
  const r = input as Partial<JournalEntry>;
  const symptom = typeof r.symptom === 'string' ? r.symptom.trim().slice(0, 280) : '';
  if (!symptom) return null;
  const sev = clampSeverity(r.severity);
  const at = typeof r.at === 'string' && r.at ? r.at : new Date().toISOString();
  return {
    id: typeof r.id === 'string' && r.id ? r.id : genId('je'),
    at,
    symptom,
    severity: sev,
    notes: typeof r.notes === 'string' && r.notes.trim() ? r.notes.trim().slice(0, 280) : undefined,
    triage:
      r.triage === 'EMERGENCY' || r.triage === 'URGENT' || r.triage === 'ROUTINE' || r.triage === 'SELF_CARE'
        ? r.triage
        : undefined,
  };
}

function clampSeverity(v: unknown): Severity {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return 3;
  return Math.max(1, Math.min(5, Math.round(n))) as Severity;
}

// ---------- Severity styling helpers ----------
export const SEVERITY_META: Record<Severity, { color: string; dot: string; ring: string }> = {
  1: {
    color: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500/30',
  },
  2: {
    color: 'text-lime-700 dark:text-lime-400',
    dot: 'bg-lime-500',
    ring: 'ring-lime-500/30',
  },
  3: {
    color: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    ring: 'ring-amber-500/30',
  },
  4: {
    color: 'text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-500',
    ring: 'ring-orange-500/30',
  },
  5: {
    color: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
    ring: 'ring-red-500/30',
  },
};

export function severityLabel(sev: Severity, lang: Lang): string {
  const labels: Record<Severity, TriText> = {
    1: {
      en: 'Mild',
      ur: 'ہلکی',
      roman: 'Halki',
    },
    2: {
      en: 'Mild–moderate',
      ur: 'ہلکی تا درمیانی',
      roman: 'Halki darmiyani',
    },
    3: {
      en: 'Moderate',
      ur: 'درمیانی',
      roman: 'Darmiyani',
    },
    4: {
      en: 'Strong',
      ur: 'شدید',
      roman: 'Shadeed',
    },
    5: {
      en: 'Severe',
      ur: 'بہت شدید',
      roman: 'Bohat shadeed',
    },
  };
  return labels[sev][lang];
}

// ---------- Generic id generator (shared with reminders) ----------
function genId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function newIceId(): string {
  return genId('ice');
}

export function newJournalId(): string {
  return genId('je');
}

// ---------- Sharing (My Health summary for a doctor) ----------
export function formatProfileForSharing(p: HealthProfile, lang: Lang): string {
  const lines: string[] = [];
  lines.push('SehatAI — My Health Profile');
  lines.push('');
  lines.push(`Age: ${ageBandLabel(p.ageBand, lang)}`);
  lines.push(`Sex: ${sexLabel(p.sex, lang)}`);
  if (p.conditions.length) {
    lines.push(`Conditions: ${p.conditions.map((c) => conditionLabel(c, lang)).join(', ')}`);
  }
  if (p.allergies.length) lines.push(`Allergies: ${p.allergies.join(', ')}`);
  if (p.sex === 'female' && p.pregnant) lines.push('Pregnant: yes');
  if (p.medications.length) lines.push(`Medications: ${p.medications.join(', ')}`);
  if (p.iceContacts.length) {
    lines.push('In case of emergency:');
    for (const c of p.iceContacts) {
      if (c.name || c.phone) {
        lines.push(`  • ${c.name}${c.relation ? ` (${c.relation})` : ''} — ${c.phone}`);
      }
    }
  }
  return lines.join('\n');
}

/** Friendly relative-time formatter (e.g. "5 minutes ago") — trilingual. */
export function formatRelativeTime(epochMs: number, lang: Lang): string {
  const diff = Date.now() - epochMs;
  if (diff < 0) return '';
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (lang === 'ur') {
    if (sec < 60) return 'ابھی';
    if (min < 60) return `${min} منٹ پہلے`;
    if (hr < 24) return `${hr} گھنٹے پہلے`;
    if (day === 1) return 'کل';
    if (day < 7) return `${day} دن پہلے`;
  } else if (lang === 'roman') {
    if (sec < 60) return 'abhi';
    if (min < 60) return `${min} minute pehle`;
    if (hr < 24) return `${hr} ghante pehle`;
    if (day === 1) return 'kal';
    if (day < 7) return `${day} din pehle`;
  } else {
    if (sec < 60) return 'just now';
    if (min < 60) return `${min} min ago`;
    if (hr < 24) return `${hr} hr ago`;
    if (day === 1) return 'yesterday';
    if (day < 7) return `${day} days ago`;
  }
  try {
    return new Intl.DateTimeFormat(lang === 'ur' ? 'ur-PK' : undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(epochMs));
  } catch {
    return new Date(epochMs).toISOString().slice(0, 10);
  }
}
