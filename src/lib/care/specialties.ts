// ============================================================
// Care Connect §19 — AI doctor matching inputs.
// MUST mirror the signup whitelist in src/app/api/auth/signup/route.ts.
// The classifier maps EXISTING pipeline output (L1 conditions,
// red-flag categories, L0 categories, drug classes) to a specialty.
// AI recommends SPECIALTY / CARE TYPE — never a specific doctor
// as "medically guaranteed" (§19). Safety layers stay upstream.
// ============================================================

export const CARE_SPECIALTIES = [
  'Family Medicine', 'Internal Medicine', 'Cardiology', 'Pediatrics', 'Obstetrics & Gynecology',
  'Dermatology', 'Psychiatry', 'Orthopedics', 'ENT', 'Ophthalmology', 'General Surgery',
  'Pulmonology', 'Gastroenterology', 'Neurology', 'Urology', 'Nephrology', 'Endocrinology',
  'Oncology', 'Emergency Medicine', 'Anesthesiology', 'Radiology', 'Pathology',
] as const;
export type CareSpecialty = (typeof CARE_SPECIALTIES)[number];

/**
 * Deterministic keyword → specialty classifier over patient words
 * (English / Roman-Urdu / Urdu). Runs server-side on the intake
 * text PLUS the pipeline's structured output when available.
 * Ordered map: first matching category wins; ties → higher score.
 */
const SPECIALTY_KEYWORDS: Array<{ specialty: CareSpecialty; terms: string[]; weight: number }> = [
  { specialty: 'Cardiology', weight: 3, terms: ['chest pain', 'seene', 'دل', 'heart', 'palpitation', 'dharkan', 'blood pressure high', 'bp', 'hypertension', 'فالج', 'کولہ'] },
  { specialty: 'Pediatrics', weight: 3, terms: ['child', 'baccha', 'بچہ', 'بچے', 'baby', 'infant', 'newborn', ' bachay ', ' toddler', 'neonatal'] },
  { specialty: 'Obstetrics & Gynecology', weight: 3, terms: ['pregnan', 'haamla', 'حاملہ', 'periods', 'mahwari', 'ماہواری', 'menstrual', 'delivery', 'zina paiada', 'vaginal', ' رحم '] },
  { specialty: 'Dermatology', weight: 2, terms: ['skin', 'jild', 'جلد', 'rash', 'kharish', 'خارش', 'itch', 'khujli', 'خارش', 'acne', 'pimples', 'danay', 'دانے', 'eczema', 'scabies'] },
  { specialty: 'Psychiatry', weight: 3, terms: ['depression', 'adasi', 'اداسی', 'anxiety', 'ghabrahat', 'گھبراہٹ', 'mental', 'zaehni', 'ذہنی', 'panic', 'suicide', 'khudkushi', 'خودکشی', 'insomnia', 'neend na aana', 'بے خوابی'] },
  { specialty: 'Orthopedics', weight: 2, terms: ['bone', 'haddi', 'ہڈی', 'joint', 'jor', 'fracture', ' ہڈی ٹوٹ', 'back pain kamar', 'kamar dard', 'کمر درد', 'arthritis', 'ghutne', 'گھٹنے'] },
  { specialty: 'ENT', weight: 2, terms: ['ear', 'kaan', 'کان', 'throat', 'gala', 'گلا', 'nose', 'naak', 'ناک', 'sinus', 'snoring', 'sardi zukam'] },
  { specialty: 'Ophthalmology', weight: 2, terms: ['eye', 'aankh', 'آنکھ', 'aankhen', 'آنکھیں', 'vision', 'nazar', 'نظر', 'blurred'] },
  { specialty: 'General Surgery', weight: 2, terms: ['hernia', 'appendix', 'lump', 'gilti', 'giltee', 'wound', 'zakham', 'زخم', ' piles ', 'bawaseer', 'بواسیر'] },
  { specialty: 'Pulmonology', weight: 3, terms: ['asthma', 'دمہ', 'saans', 'سانس', 'breathless', 'cough zyada', 'khansi', 'کھانسی', 'tb', 'tuberculosis', 'tap dil', 'phphray', 'پھیپھڑے'] },
  { specialty: 'Gastroenterology', weight: 2, terms: ['stomach', 'pait', 'پیٹ', 'liver', 'jigar', 'جگر', 'diarrhea', 'dast', 'دست', 'vomit', 'ulti', 'الٹی', 'ulcer', 'constipation', 'qabz', 'قبض', 'jaundice', 'pilij'] },
  { specialty: 'Neurology', weight: 2, terms: ['headache sar dard', 'سر درد', 'migraine', 'seizure', 'dora', 'دورہ', 'stroke', 'faliij', 'فالج', 'numbness', 'sun hona', ' vertigo ', 'chakkar', 'چکر'] },
  { specialty: 'Urology', weight: 2, terms: ['urine', 'peshab', 'پیشاب', 'kidney', 'gurday', 'گردے', 'stone', 'pathri', 'پتھری', 'burning urine', 'jalan'] },
  { specialty: 'Nephrology', weight: 2, terms: ['kidney failure', 'dialysis', 'gurday fail', 'creatinine'] },
  { specialty: 'Endocrinology', weight: 2, terms: ['diabetes', 'shugar', 'شوگر', 'sugar ki bimari', 'thyroid', 'hormone'] },
  { specialty: 'Oncology', weight: 2, terms: ['cancer', 'saratan', 'سرطان', 'tumor', 'rasoli'] },
  { specialty: 'Dermatology', weight: 1, terms: ['hair fall', 'bal girna', 'بال'] },
  { specialty: 'Family Medicine', weight: 1, terms: ['fever', 'bukhar', 'بخار', 'flu', 'general', 'weakness', 'kamzori', 'کمزوری', 'checkup', 'vaccine', 'vaccination'] },
];

export interface SpecialtyMatch {
  specialty: CareSpecialty;
  score: number;
  matchedTerms: string[];
}

/** Classify free text to ranked specialties (deterministic, no LLM). */
export function classifySpecialty(text: string): SpecialtyMatch[] {
  const t = ` ${text.toLowerCase()} `;
  const scores = new Map<CareSpecialty, { score: number; matched: string[] }>();
  for (const rule of SPECIALTY_KEYWORDS) {
    for (const term of rule.terms) {
      if (t.includes(term.toLowerCase())) {
        const cur = scores.get(rule.specialty) ?? { score: 0, matched: [] };
        cur.score += rule.weight;
        if (!cur.matched.includes(term)) cur.matched.push(term);
        scores.set(rule.specialty, cur);
      }
    }
  }
  const ranked = [...scores.entries()]
    .map(([specialty, v]) => ({ specialty, score: v.score, matchedTerms: v.matched }))
    .sort((a, b) => b.score - a.score);
  if (ranked.length === 0) {
    return [{ specialty: 'Family Medicine', score: 1, matchedTerms: [] }];
  }
  return ranked;
}

/** Fold existing pipeline signals (red-flag categories / conditions) into the classifier. */
export function classifyFromPipelineSignals(opts: {
  intakeText: string;
  redFlagCategories?: string[];
  l1Conditions?: Array<{ name: string; state?: string }>;
}): SpecialtyMatch[] {
  const merged = classifySpecialty(opts.intakeText);
  const boost = (specialty: CareSpecialty, amount: number) => {
    const hit = merged.find((m) => m.specialty === specialty);
    if (hit) hit.score += amount;
    else merged.push({ specialty, score: amount, matchedTerms: [] });
  };
  const catMap: Record<string, CareSpecialty> = {
    cardiac: 'Cardiology',
    stroke: 'Neurology',
    obstetric: 'Obstetrics & Gynecology',
    pediatric: 'Pediatrics',
    respiratory: 'Pulmonology',
    gastrointestinal: 'Gastroenterology',
    neurological: 'Neurology',
    renal: 'Nephrology',
    dermatology: 'Dermatology',
    psychiatric: 'Psychiatry',
    toxicology: 'Emergency Medicine',
    trauma: 'Orthopedics',
  };
  for (const cat of opts.redFlagCategories ?? []) {
    const mapped = catMap[cat.toLowerCase()];
    if (mapped) boost(mapped, 4);
  }
  const condMap: Record<string, CareSpecialty> = {
    diabetes: 'Endocrinology',
    hypertension: 'Cardiology',
    asthma: 'Pulmonology',
    copd: 'Pulmonology',
    hepatitis: 'Gastroenterology',
    ckd: 'Nephrology',
    epilepsy: 'Neurology',
  };
  for (const c of opts.l1Conditions ?? []) {
    const mapped = condMap[c.name.toLowerCase()];
    if (mapped) boost(mapped, 3);
  }
  return merged.sort((a, b) => b.score - a.score);
}

export const CARE_TYPE_LABEL: Record<string, string> = {
  TEXT: 'Text consultation',
  AUDIO: 'Audio consultation',
  VIDEO: 'Video consultation',
};
