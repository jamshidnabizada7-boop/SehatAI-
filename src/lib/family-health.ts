// ============================================================
// SehatAI — Family Health Profiles Data (Phase 2)
// Multi-profile management: a user can create + manage health
// profiles for family members (children, elderly parents,
// spouse, self). Each profile stores: name, relation, age band,
// sex, conditions, allergies, medications, notes.
//
// Privacy: all data in localStorage (sehatai.family.v1).
// No server calls — family PHI never leaves the device.
// ============================================================

export type Relation = 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';

export interface FamilyMember {
  id: string;
  name: string;
  relation: Relation;
  ageBand: 'undisclosed' | 'child' | 'adolescent' | 'young-adult' | 'middle-adult' | 'elderly';
  sex: 'undisclosed' | 'female' | 'male';
  conditions: string[];
  allergies: string[];
  medications: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'sehatai.family.v1';

export function loadFamily(): FamilyMember[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m): m is FamilyMember => m && typeof m === 'object' && typeof m.id === 'string')
      .map(sanitizeMember);
  } catch {
    return [];
  }
}

export function saveFamily(members: FamilyMember[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  } catch {
    // ignore
  }
}

export function sanitizeMember(input: unknown): FamilyMember {
  const base: FamilyMember = {
    id: '',
    name: '',
    relation: 'other',
    ageBand: 'undisclosed',
    sex: 'undisclosed',
    conditions: [],
    allergies: [],
    medications: [],
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (!input || typeof input !== 'object') return base;
  const r = input as Partial<FamilyMember>;
  const out: FamilyMember = { ...base, ...r };
  out.id = typeof r.id === 'string' ? r.id : genId('fam');
  out.name = typeof r.name === 'string' ? r.name.trim().slice(0, 60) : '';
  out.relation = isRelation(r.relation) ? r.relation : 'other';
  out.ageBand = isAgeBand(r.ageBand) ? r.ageBand : 'undisclosed';
  out.sex = isSex(r.sex) ? r.sex : 'undisclosed';
  out.conditions = Array.isArray(r.conditions) ? r.conditions.filter((c) => typeof c === 'string').slice(0, 10) : [];
  out.allergies = Array.isArray(r.allergies) ? r.allergies.filter((a) => typeof a === 'string').slice(0, 10) : [];
  out.medications = Array.isArray(r.medications) ? r.medications.filter((m) => typeof m === 'string').slice(0, 10) : [];
  out.notes = typeof r.notes === 'string' ? r.notes.trim().slice(0, 200) : '';
  return out;
}

function genId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isRelation(v: unknown): v is Relation {
  return v === 'self' || v === 'spouse' || v === 'child' || v === 'parent' || v === 'sibling' || v === 'other';
}

function isAgeBand(v: unknown): v is FamilyMember['ageBand'] {
  return v === 'undisclosed' || v === 'child' || v === 'adolescent' || v === 'young-adult' || v === 'middle-adult' || v === 'elderly';
}

function isSex(v: unknown): v is FamilyMember['sex'] {
  return v === 'undisclosed' || v === 'female' || v === 'male';
}

// ---------- Relation metadata ----------

export const RELATION_META: Record<Relation, { icon: string; label: { en: string; ur: string; roman: string }; color: string }> = {
  self: { icon: 'User', label: { en: 'Self', ur: 'خود', roman: 'Khud' }, color: 'bg-primary/15 text-primary' },
  spouse: { icon: 'Heart', label: { en: 'Spouse', ur: 'شوہر/بیوی', roman: 'Shohar/Biwi' }, color: 'bg-pink-500/15 text-pink-700 dark:text-pink-400' },
  child: { icon: 'Baby', label: { en: 'Child', ur: 'بچہ', roman: 'Bacha' }, color: 'bg-orange-500/15 text-orange-700 dark:text-orange-400' },
  parent: { icon: 'Users', label: { en: 'Parent', ur: 'والدین', roman: 'Walidain' }, color: 'bg-violet-500/15 text-violet-700 dark:text-violet-400' },
  sibling: { icon: 'Users', label: { en: 'Sibling', ur: 'بھائی/بہن', roman: 'Bhai/Behen' }, color: 'bg-teal-500/15 text-teal-700 dark:text-teal-400' },
  other: { icon: 'User', label: { en: 'Other', ur: 'دیگر', roman: 'Deegar' }, color: 'bg-muted text-muted-foreground' },
};
