// SehatAI — Phase 1: Server-side health profile type + sanitizer
// Mirrors the client HealthProfile (src/lib/profile.ts) so the pipeline
// can read the patient profile from the database and inject it into L1 context.
//
// IMPORTANT: profile is now WIRED into triage (fixes W1). See run.ts.

export interface ServerHealthProfile {
  ageBand:
    | 'undisclosed'
    | 'child'
    | 'adolescent'
    | 'young-adult'
    | 'middle-adult'
    | 'elderly';
  sex: 'undisclosed' | 'female' | 'male';
  conditions: string[]; // ids from CHRONIC_CONDITIONS
  allergies: string[];
  medications: string[];
  pregnant: boolean;
  iceContacts: { name: string; phone: string; relation?: string }[];
  updatedAt: number;
}

export function emptyServerProfile(): ServerHealthProfile {
  return {
    ageBand: 'undisclosed',
    sex: 'undisclosed',
    conditions: [],
    allergies: [],
    medications: [],
    pregnant: false,
    iceContacts: [],
    updatedAt: Date.now(),
  };
}

/** Defensive: only accept known fields + known enum values + trimmed arrays. */
export function sanitizeProfileServer(input: Partial<ServerHealthProfile> | null | undefined): ServerHealthProfile {
  const base = emptyServerProfile();
  if (!input || typeof input !== 'object') return base;
  const out: ServerHealthProfile = { ...base, ...input };
  if (!isAgeBand(out.ageBand)) out.ageBand = 'undisclosed';
  if (!isSex(out.sex)) out.sex = 'undisclosed';
  out.conditions = Array.isArray(out.conditions) ? out.conditions.filter((c) => typeof c === 'string') : [];
  out.allergies = Array.isArray(out.allergies) ? out.allergies.map((a) => String(a).trim()).filter(Boolean) : [];
  out.medications = Array.isArray(out.medications) ? out.medications.map((m) => String(m).trim()).filter(Boolean) : [];
  out.pregnant = out.sex === 'female' ? Boolean(out.pregnant) : false;
  out.iceContacts = Array.isArray(out.iceContacts) ? out.iceContacts.slice(0, 3) : [];
  out.updatedAt = typeof out.updatedAt === 'number' && Number.isFinite(out.updatedAt) ? out.updatedAt : Date.now();
  return out;
}

function isAgeBand(v: unknown): v is ServerHealthProfile['ageBand'] {
  return (
    v === 'undisclosed' ||
    v === 'child' ||
    v === 'adolescent' ||
    v === 'young-adult' ||
    v === 'middle-adult' ||
    v === 'elderly'
  );
}
function isSex(v: unknown): v is ServerHealthProfile['sex'] {
  return v === 'undisclosed' || v === 'female' || v === 'male';
}

// ---------- Profile → L1 prompt block (injected before triage) ----------
// Returns a compact, structured "patient context" string that the L1 classifier
// reads alongside the user's message. This is the W1 fix.
export function profileToPromptBlock(p: ServerHealthProfile | null | undefined): string {
  if (!p || !isProfileMeaningful(p)) return '(no patient profile on file)';
  const lines: string[] = ['PATIENT CONTEXT (use when classifying risk):'];
  if (p.ageBand !== 'undisclosed') lines.push(`- age band: ${p.ageBand}`);
  if (p.sex !== 'undisclosed') lines.push(`- sex: ${p.sex}`);
  if (p.pregnant) lines.push('- pregnant: yes (treat as OB case)');
  if (p.conditions.length) lines.push(`- established chronic conditions: ${p.conditions.join(', ')}`);
  if (p.allergies.length) lines.push(`- known allergies: ${p.allergies.join(', ')}`);
  if (p.medications.length) lines.push(`- current medications: ${p.medications.join(', ')}`);
  return lines.join('\n');
}

export function isProfileMeaningful(p: ServerHealthProfile | null | undefined): boolean {
  if (!p) return false;
  if (p.ageBand !== 'undisclosed') return true;
  if (p.sex !== 'undisclosed') return true;
  if (p.conditions.length > 0) return true;
  if (p.allergies.length > 0) return true;
  if (p.pregnant) return true;
  if (p.medications.length > 0) return true;
  return false;
}

// ---------- Profile-aware red-flag rules (W1 fix) ----------
// Returns additional L0 red-flag overrides based on profile + symptom text.
// E.g. diabetic + "confused/shaky/drowsy" → EMERGENCY (hypoglycemia).
export function profileRedFlagOverrides(
  p: ServerHealthProfile | null | undefined,
  text: string,
): { category: string; reason: string } | null {
  if (!p) return null;
  const t = text.toLowerCase();
  // Diabetic emergency: known diabetic + altered mental status / severe hypoglycemia signs
  if (p.conditions.includes('diabetes')) {
    if (/\b(confused|confusion|drowsy|sleepy|unresponsive|unconscious|shaky|shaking|sweating|low sugar|hypoglycemia|behosh|khichao|ghabrana)\b/i.test(t)) {
      return {
        category: 'diabetic-emergency',
        reason:
          'Known diabetic with altered consciousness, sweating, shaking, or confusion — possible severe hypoglycemia or hyperglycemia. EMERGENCY.',
      };
    }
  }
  // Asthma emergency: known asthma + severe breathing distress
  if (p.conditions.includes('asthma')) {
    if (/\b(cant breathe|can't breathe|cannot breathe|severe wheeze|blue lips|saans nahi|saans nahi aa rahi)\b/i.test(t)) {
      return {
        category: 'respiratory',
        reason:
          'Known asthma with severe breathing distress — possible acute severe asthma. EMERGENCY.',
      };
    }
  }
  // Hypertension emergency: known HTN + severe headache / vision change / chest pain
  if (p.conditions.includes('hypertension')) {
    if (/\b(worst headache|severe headache|vision change|blurred vision|chest pain|seene mein dard)\b/i.test(t)) {
      return {
        category: 'hypertensive-emergency',
        reason:
          'Known hypertension with severe headache, vision change, or chest pain — possible hypertensive emergency. EMERGENCY.',
      };
    }
  }
  // Pregnancy emergency: pregnant + bleeding / severe headache / reduced movements
  if (p.pregnant) {
    if (/\b(bleeding|blood loss|severe headache|blurred vision|seizure|convulsion|no movement|reduced movements|baby not moving|khoon|sar dard|doray)\b/i.test(t)) {
      return {
        category: 'pregnancy-emergency',
        reason:
          'Pregnant with bleeding, severe headache, vision change, seizure, or reduced fetal movements — obstetric emergency. Call 1122.',
      };
    }
  }
  return null;
}

// ---------- Allergy cross-check (W4 partial fix; full engine in drug-interaction.ts) ----------
// Returns matched allergies if the message mentions a medication that could
// cross-react with a known allergy. Used by the medication-safety constellation validator.
export function allergyCrossCheck(
  p: ServerHealthProfile | null | undefined,
  messageText: string,
): { allergy: string; trigger: string; class: string }[] {
  if (!p || !p.allergies.length) return [];
  const t = ` ${messageText.toLowerCase()} `;
  const hits: { allergy: string; trigger: string; class: string }[] = [];
  // Penicillin / amoxicillin class
  const penAllergy = p.allergies.some((a) => /penicillin|amoxicillin|ampicillin/i.test(a));
  if (penAllergy && /amoxicillin|ampicillin|amoxil|augmentin|moxacil|amox/i.test(t)) {
    hits.push({ allergy: 'penicillin', trigger: 'amoxicillin-class', class: 'beta-lactam' });
  }
  // Sulfa allergy
  const sulfaAllergy = p.allergies.some((a) => /sulfa|sulphonamide|sulfonamide|septran|septrin|cotrimoxazole/i.test(a));
  if (sulfaAllergy && /septran|septrin|cotrimoxazole|sulfamethoxazole|sulfonamide/i.test(t)) {
    hits.push({ allergy: 'sulfa', trigger: 'cotrimoxazole-class', class: 'sulfonamide' });
  }
  // NSAID / aspirin allergy + asthma
  const nsaidAllergy = p.allergies.some((a) => /aspirin|nsaid|ibuprofen|brufen|diclofenac|voltaren|naproxen/i.test(a));
  if (nsaidAllergy && /ibuprofen|brufen|aspirin|disprin|naproxen|diclofenac|voltaren/i.test(t)) {
    hits.push({ allergy: 'nsaid/aspirin', trigger: 'nsaid-class', class: 'nsaid' });
  }
  return hits;
}
