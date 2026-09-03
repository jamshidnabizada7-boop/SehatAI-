import { RED_FLAG_PATTERNS, SEVERITY_MODIFIERS } from '@/data/lexicon';
import { EXPANDED_CORPUS as CORPUS } from '@/data/expanded';
import { getEmergencyTemplate } from '@/data/emergency-templates';
import type { ClinicalContext, Lang, RedFlagPattern, TriageLevel } from '@/lib/types';
import { TRIAGE_ORDER } from '@/lib/types';
import {
  assessClarification,
  extractClinicalContext,
  hasAlteredMentalStatus,
  isDiabeticEmergency,
  isEmergencyHomeTreatmentRequest,
  CLARIFICATION_QUESTIONS,
} from '@/lib/engine/context-extraction';
import { fuzzyFindMedicalConcept } from '@/lib/engine/fuzzy-matcher';

// ============================================================
// SehatAI — Shared safety engine (L0)
// Runs on the server (online pipeline step 1) AND in the browser
// (offline mode). Pure TypeScript, zero dependencies, <5ms.
// Same lexicon JSON drives both — drift is caught by eval suite.
// ============================================================

export interface LexiconMatch {
  pattern: RedFlagPattern;
  matchedTerms: string[];
}

export interface TriageResult {
  level: TriageLevel;
  reason: string; // in user language
  signals: string[];
  engine: 'L0' | 'offline' | 'combined';
  shortCircuited: boolean;
  matchedPatternId?: string;
  matchedCategory?: string;
  /** structured clinical context (conditions, meds, trauma, populations…) */
  context?: ClinicalContext;
  /** deterministic clarification requirement (NEEDS_CLARIFICATION state) */
  needsClarification?: boolean;
  clarificationReasons?: string[];
}

/** normalize text: lowercase, strip Urdu diacritics, strip punctuation
 *  (a trailing period must not break token matching — "chemical." ≠ "chemical"),
 *  collapse whitespace. Apostrophes are KEPT: terms like "can't breathe"
 *  and "won't stop" rely on them. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '') // fathah, dammah, kasrah etc + tatweel
    .replace(/[.!?,;:()[\]{}"“”‘’…\u06D4\u061F\u060C\u061B&—–\-\/\\|~*_+#@]/g, ' ') // EN + Urdu + symbols + dashes
    .replace(/\s+/g, ' ')
    .trim();
}

// ------------------------------------------------------------
// Scenario-aware emergency template resolution.
// The template must match the DETECTED scenario (trauma vs medical,
// spine vs chest vs head…), never just the first pattern that fired.
// ------------------------------------------------------------

/** clinical priority — lower index wins when several patterns fire */
const CATEGORY_PRIORITY = [
  'poisoning',
  'anaphylaxis',
  'choking',
  'obstetric-bleeding',
  'obstetric-preeclampsia',
  'obstetric-emergency',
  'cardiac',
  'stroke',
  'spine-trauma',
  'chest-trauma',
  'diabetic-emergency',
  'head-injury',
  'bleeding',
  'snakebite',
  'burns',
  'mental-health',
  'convulsions',
  'meningitis',
  'pediatric',
  'unconscious',
  'dehydration',
  'abdominal',
];

/** trauma compositional rules → which emergency template fits the scenario.
 *  Requires an actual trauma mechanism — a medical symptom (chest pain,
 *  severe pain) with no accident context must never be routed here. */
function traumaCategory(ctx: ClinicalContext): string | null {
  const trauma = ctx.trauma;
  if (!trauma || trauma.mechanism === 'unknown') return null;
  const neuro = trauma.severitySigns.includes('numbness') || trauma.severitySigns.includes('paralysis');
  const loc = trauma.severitySigns.includes('loc');
  const altered = trauma.severitySigns.includes('altered_mental');
  if (neuro || trauma.sites.includes('neck') || trauma.sites.includes('spine')) return 'spine-trauma';
  if (trauma.sites.includes('chest') || trauma.severitySigns.includes('breathing_difficulty')) return 'chest-trauma';
  // vomiting / altered mental status after a fall or blow = possible brain
  // injury even when the head itself was not explicitly mentioned
  if (altered || trauma.severitySigns.includes('vomiting')) return 'head-injury';
  if (loc || trauma.sites.includes('head')) return 'head-injury';
  if (trauma.severitySigns.includes('heavy_bleeding')) return 'bleeding';
  if (trauma.mechanism === 'burn') return 'burns';
  // electrical and chemical injuries need emergency assessment (cardiac
  // rhythm risk / deep tissue damage) and route to burn-care guidance
  if (trauma.mechanism === 'electrical' || trauma.mechanism === 'chemical') return 'burns';
  if (trauma.mechanism === 'penetrating') return 'bleeding';
  return null;
}

/** Trauma severe enough to short-circuit as EMERGENCY at L0 (deterministic). */
export function isTraumaEmergency(ctx: ClinicalContext): boolean {
  if (!ctx.trauma || ctx.trauma.mechanism === 'unknown') return false;
  const t = ctx.trauma;
  // electrical / chemical injuries are always emergencies (cardiac rhythm
  // risk, deep tissue damage) even when the burn looks small
  if (t.mechanism === 'electrical' || t.mechanism === 'chemical') return true;
  // any mechanism + serious site (neck/spine/chest/head) + meaningful sign,
  // or any neuro deficit / LOC after trauma
  if (t.severitySigns.includes('numbness') || t.severitySigns.includes('paralysis')) return true;
  if (t.severitySigns.includes('loc')) return true;
  if (t.severitySigns.includes('altered_mental')) return true;
  if (t.severitySigns.includes('heavy_bleeding')) return true;
  if (t.severitySigns.includes('breathing_difficulty')) return true;
  // vomiting after a fall/blow/vehicle impact = head-injury danger sign
  if (t.severitySigns.includes('vomiting') && ['fall', 'blow', 'vehicle'].includes(t.mechanism)) return true;
  if (t.sites.includes('neck') || t.sites.includes('spine')) {
    // neck/back pain after a fall/accident — treat as possible spinal injury
    return true;
  }
  if (t.sites.includes('chest')) return true;
  if (t.sites.includes('head') && (t.severitySigns.includes('vomiting') || t.severitySigns.includes('severe_pain'))) return true;
  if (t.severitySigns.includes('severe_pain') && (t.sites.includes('abdomen') || t.sites.includes('chest'))) return true;
  return false;
}

/**
 * Resolve which emergency template fits the DETECTED scenario.
 * Uses all pattern hits + structured clinical context — never just the
 * first lexicon match, and never instructions for a state the user did
 * not describe (e.g. unconscious-person steps for a conscious reporter).
 */
export function resolveEmergencyCategory(hits: LexiconMatch[], ctx: ClinicalContext, diabeticEmergency = false): string {
  // 1) trauma scenario overrides — the accident context changes the template
  const traumaCat = traumaCategory(ctx);
  if (traumaCat) return traumaCat;
  // 2) diabetic emergency (glucose/diabetes + altered mental status)
  if (diabeticEmergency) return 'diabetic-emergency';
  // 3) among lexicon hits pick highest clinical priority
  if (hits.length > 0) {
    const rank = (cat: string) => {
      const i = CATEGORY_PRIORITY.indexOf(cat);
      return i < 0 ? CATEGORY_PRIORITY.length : i;
    };
    const sorted = [...hits].sort((a, b) => rank(a.pattern.category) - rank(b.pattern.category));
    return sorted[0].pattern.category;
  }
  // 4) structured fallbacks
  if (ctx.medications?.intent === 'OVERDOSE') return 'poisoning';
  if (ctx.populations.child) return 'pediatric';
  if (ctx.populations.pregnancy) return 'obstetric-preeclampsia';
  return 'general-emergency';
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Token-aware term matching:
 *  - single-word terms: exact token match (with word boundaries)
 *  - multi-word terms: phrase match with token boundaries OR all words within a small window
 *    (allows modifiers between words, e.g. "seene mein SAKHT dard"
 *     matching "seene mein dard")
 */
export function termMatches(normText: string, term: string): boolean {
  const t = normalizeText(term);
  if (!t) return false;
  if (!t.includes(' ')) {
    // exact token match
    return hasTokenBoundaryMatch(normText, t);
  }
  // exact phrase with token boundaries
  if (hasTokenBoundaryMatch(normText, t)) return true;

  // proximity: all term words as distinct whole tokens within a window of (n + 3) tokens
  const words = t.split(' ').filter((w) => w.length > 1);
  if (words.length === 0) return false;
  const tokens = normText.split(' ').filter(Boolean);
  const tokenSet = new Set(tokens);
  if (!words.every((w) => tokenSet.has(w))) return false;

  const n = words.length;
  const windowSize = n + 3;
  for (let i = 0; i < tokens.length; i++) {
    const window = tokens.slice(i, i + windowSize);
    if (window.length < n) break;
    if (words.every((w) => window.includes(w))) return true;
  }
  return false;
}

// ------------------------------------------------------------
// Informational vs symptom-report detection.
// An informational question ("what are the danger signs…", "kya
// khanay chahiye?") must NOT inherit a topic's severity — only
// first-person symptom reports escalate by topic base level.
// ------------------------------------------------------------

const QUESTION_MARKERS =
  /\b(what|how|which|why|when|where|who|whom|tell|explain|list|show|kya|kaise|kaisay|kaisi|kaun|kaunsa|kaunsi|kitna|kitni|kitne|batayein|batao|bataen|bataiyay|chahiye|maloom|tareeqa|tarika|faida|nuqsan)\b|کیا|کون|کیسے|کون سے|کونسی|کتنا|بتائیں|بتاؤ|معلوم|طریقہ|فائدہ/i;

const SYMPTOM_ASSERTION =
  /\b(mujhe|mera|meri|i have|i feel|i am having|i am suffering|ho raha|ho rahi|ho rahe|raha hai|rahi hai|bukhar hai|bukhar hua|dard hai|dard ho|dard sharu|pet dard|khoon|behosh|chakkar|ulti|dast|khansi|khoon beh|khoon aa|cannot breathe|can't breathe|cant breathe|difficulty breathing|trouble breathing|shortness of breath|struggling to breathe|unable to breathe|bleeding|chest pain|unconscious|seizure|fainted)\b|مجھے|بخار|درد|کھانسی|دست|الٹی|بہہ رہا|آ رہا|خون/i;

export function isInformationalQuery(text: string): boolean {
  if (!QUESTION_MARKERS.test(text)) return false;
  return !SYMPTOM_ASSERTION.test(text);
}

/** Detect language by script + roman markers (fast heuristic; server may refine with LLM) */
export function detectLanguage(text: string): { language: Lang; confidence: number; method: 'script' } {
  const hasArabicScript = /[\u0600-\u06FF]/.test(text);
  if (hasArabicScript) {
    const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const total = text.replace(/\s/g, '').length || 1;
    const ratio = arabicChars / total;
    return { language: 'ur', confidence: Math.min(0.99, 0.75 + ratio * 0.2), method: 'script' };
  }
  // Roman Urdu markers — common function words/romanizations
  const romanMarkers = [
    'mujhe', 'mera', 'meri', 'hai', 'hain', 'nahi', 'nahin', 'kya', 'kaun', 'kaise', 'kaisay',
    'bukhar', 'bukhaar', 'dard', 'pet', 'sar', 'bacha', 'bachay', 'bachon', 'khoon', 'saans',
    'seene', 'seenay', 'mein', 'me', 'ke', 'ki', 'ko', 'se', 'aur', 'main', 'aap', 'bohot',
    'bohat', 'zyada', 'kam', 'din', 'hafte', 'raat', 'subah', 'abhi', 'kal', 'kabhi', 'lagta',
    'raha', 'rahi', 'rahe', 'gaya', 'gayi', 'hota', 'hoti', 'hote', 'kar', 'karna', 'karke',
  ];
  const words = text.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  if (words.length === 0) return { language: 'en', confidence: 0.5, method: 'script' };
  const matches = words.filter((w) => romanMarkers.includes(w)).length;
  const ratio = matches / words.length;
  if (ratio >= 0.2 && matches >= 1) {
    return { language: 'roman', confidence: Math.min(0.98, 0.6 + ratio), method: 'script' };
  }
  return { language: 'en', confidence: 0.9, method: 'script' };
}

/** Split text into clauses by punctuation and contrasting conjunctions */
export function splitIntoClauses(text: string): string[] {
  return text
    .split(/[.,;:!?\n()\-—–]|(?:\b(?:but|however|although|though|except|lekin|magar|par|lekan|balkay|balke|aur)\b|اور)/i)
    .map((c) => c.trim())
    .filter(Boolean);
}

/** Preceding negation markers in English, Roman Urdu, and Urdu */
const PRE_NEGATION_RE =
  /\b(no|not|without|denies|denied|negative for|free of|zero|never had|never|no sign of|no signs of|rule out|koi|bina|bager|baghair|bina kisi|baghair kisi|kisi bhi)\b|کوئی|بغیر|نہ/i;

/** Trailing negation markers in English, Roman Urdu, and Urdu */
const POST_NEGATION_RE =
  /\b(nahi hai|nahin hai|nhi hai|nahi|nahin|nhi|nahi hora|nahi horaha|nahi ho raha|nahi hua|nahi hui|nahi hota|nahi hoti|nahi hote|nahi hotay|absent|not present|ruled out|negative|stopped|has stopped|is gone|resolved|theek hai|theek ho gaya|bilkul theek)\b|نہیں ہے|نہیں ہیں|نہیں ہو رہا|نہیں ہو رہی|نہیں ہوئی|نہیں ہوا|نہیں|ختم ہو گیا|ٹھیک ہے/i;

/** Any negation marker in a clause */
const CLAUSE_NEGATION_RE =
  /\b(no|not|without|denies|denied|negative for|free of|never|koi|bina|bager|baghair|nahi|nahin|nhi|stopped|has stopped)\b|کوئی|بغیر|نہ|نہیں|ختم/i;

/** Red-flag terms that intrinsically represent an inability, failure or deficit (inherent danger signs) */
const INTRINSIC_DANGER_TERMS = new Set([
  'cant breathe', "can't breathe", 'cannot breathe', 'unable to breathe', 'struggling to breathe',
  'saans nahi aa rahi', 'saans nahi', 'saans nahi aa rhi', 'saans nhi aa rahi', 'سانس نہیں آ رہی',
  'cant speak', "can't speak", 'cannot speak', 'cannot speak properly', 'suddenly cannot speak',
  'bol nahi paa raha', 'bol nahi pa raha', 'bol nahi paa rahe', 'bol nahi pa rahe', 'bol nahi pa rahi', 'bol nahi paa rahi', 'بول نہیں پا رہا',
  'cant feel my arm', 'cant feel my hand', 'cant feel one arm', 'cant move one side', "can't move one side", 'cant move my arm', "can't move my arm", 'cant move my leg', "can't move my leg",
  'aik taraf kaam nahi', 'aik taraf kaam nahi kar raha', 'aik taraf kaam nahi kar rahi', 'side not working', 'not working on one side', 'one side isnt working', "one side isn't working", 'طرف کام نہیں',
  'suddenly cannot see', 'cannot see suddenly',
  'bleeding wont stop', "bleeding won't stop", 'bleeding will not stop', 'bleeding does not stop',
  'nosebleed wont stop', "nosebleed won't stop", 'nosebleed will not stop',
  'khoon nahi ruk raha', 'khoon nahi ruk', 'nak se khoon nahi ruk', 'خون نہیں رک رہا',
  'unconscious', 'not waking up', 'wont wake up', "won't wake up", 'no response', 'not responding', 'wont respond', "won't respond",
  'lost consciousness', 'hosh nahi aa raha', 'hosh nahi hai', 'ہوش نہیں ہے', 'ہوش نہیں آ رہا',
  'cant drink', "can't drink", 'cannot drink', 'not drinking', 'wont drink', "won't drink", 'refusing to drink', 'unable to drink', 'not feeding',
  'cant wake', "can't wake", 'cant wake up', "can't wake up", 'cant move', "can't move", 'not moving', 'barely moving',
  'doodh nahi pee raha', 'doodh nahi peeta', 'dawa nahi pee raha', 'paani nahi pee raha', 'kuch nahi kha raha', 'kuch nahi pee raha', 'pee nahi raha', 'pee nahi sakta', 'kuch nahi pee sakta', 'kuch nahi pi raha', 'kuch nahi pi sakta', 'pi nahi raha', 'pi nahi sakta', 'kuch nahi pii raha', 'ni pee raha',
  'nahi hil raha', 'nhin hil raha', 'jwab nahi de raha',
  'کچھ نہیں کھا رہا', 'کچھ نہیں پی رہا', 'نہیں پی رہا', 'پی نہیں سکتا', 'دودھ نہیں پی رہا', 'پانی نہیں پی رہا',
  'no urine', 'hasnt urinated', "hasn't urinated", 'not passing urine', 'not urinated', 'no urination',
  'peshaab nahi ho raha', 'peshaab bilkul nahi', 'peshaab nahi hua', 'peshaab nahi aa raha', 'پیشاب نہیں ہو رہا', 'پیشاب نہیں ہوا',
  'cant touch chin to chest', "can't touch chin", 'gardan nahi hil pa rahi', 'گردن نہیں ہل پا رہی',
  'dont want to live', "don't want to live", 'do not want to live', 'do not want to live anymore', 'no will to live', 'jeena nahi chahta', 'jeena nahi chahti', 'جینا نہیں چاہتا', 'جینا نہیں چاہتی',
  'no fetal movement', 'baby is not moving', 'baby not moving', 'baby stopped moving', 'baby has stopped moving', 'baby stopped kicking', 'baby stopped moving around', 'no movement from baby', 'baby isnt moving', "baby isn't moving", 'cant feel baby moving', "can't feel baby moving", 'cant feel baby', "can't feel baby", 'baby not kicking', 'baby hasnt moved', "baby hasn't moved", 'baby not active',
  'bachay ki harkat nahi', 'bacha harkat nahi', 'bachay ki harkat bohat kam', 'bacha harkat band', 'bachay ki harkat band ho gayi', 'bacha hil nahi raha', 'bachay ki harkat nahi ho rahi', 'بچہ حرکت نہیں', 'بچے کی حرکت بند', 'بچہ حرکت نہیں کر رہا',
]);

/** Check if a term match in a clause is an affirmative mention (not negated) */
/** Check if a term match in a pre-normalized clause is an affirmative mention (not negated) */
export function isTermAffirmedInNormClause(normClause: string, rawTerm: string, normTerm: string): boolean {
  if (!normClause || !normTerm) return false;
  if (!termMatches(normClause, normTerm)) return false;

  const normTermClean = normTerm.replace(/['"]/g, '');
  if (INTRINSIC_DANGER_TERMS.has(rawTerm) || INTRINSIC_DANGER_TERMS.has(normTermClean)) {
    return true;
  }

  const termIdx = normClause.indexOf(normTerm);
  if (termIdx !== -1) {
    const before = normClause.slice(0, termIdx).trim();
    const after = normClause.slice(termIdx + normTerm.length).trim();
    if (before && PRE_NEGATION_RE.test(before)) {
      return false;
    }
    if (after && POST_NEGATION_RE.test(after)) {
      return false;
    }
  } else {
    if (CLAUSE_NEGATION_RE.test(normClause)) {
      return false;
    }
  }

  if (PRE_NEGATION_RE.test(normClause) || POST_NEGATION_RE.test(normClause)) {
    if (/^\s*(no|not|without|denies|koi|bina|baghair)\b/i.test(normClause)) {
      return false;
    }
    if (/\b(nahi|nahin|nhi|nahi hai|nahin hai)\s*$/i.test(normClause)) {
      return false;
    }
  }

  return true;
}

export function isTermAffirmedInClause(clause: string, term: string): boolean {
  return isTermAffirmedInNormClause(normalizeText(clause), term, normalizeText(term));
}

/** L0: match red-flag patterns against normalized text with robust negation handling */
export function matchRedFlags(rawText: string): LexiconMatch[] {
  const hits: LexiconMatch[] = [];
  const rawClauses = splitIntoClauses(rawText);
  const normClauses = rawClauses.map((c) => normalizeText(c)).filter(Boolean);
  if (normClauses.length === 0) return hits;

  for (const pattern of RED_FLAG_PATTERNS) {
    let allGroupsMatch = true;
    const matched: string[] = [];

    for (const group of pattern.groups) {
      let groupAffirmedHit: string | undefined;

      for (const term of group.terms) {
        const normTerm = normalizeText(term);
        for (const normClause of normClauses) {
          if (isTermAffirmedInNormClause(normClause, term, normTerm)) {
            groupAffirmedHit = term;
            break;
          }
        }
        if (groupAffirmedHit) break;
      }

      if (!groupAffirmedHit) {
        allGroupsMatch = false;
        break;
      }
      matched.push(groupAffirmedHit);
    }

    if (allGroupsMatch) {
      // Guard against musculoskeletal chest wall tenderness / palpation reproducing chest tightness
      if (pattern.id === 'cardiac_pressure_severe' || pattern.id === 'chest_pain_dyspnea') {
        const isMsk = /\b(press|pressing|touch|touching|palpat|sternum|rib bone|ribs|pushup|push up|pushups|push-ups|bench press|weightlift|muscle|muscular)\b/i.test(rawText) &&
          /\b(tender|tenderness|hurt|hurts|pain|tight|sore)\b/i.test(rawText) &&
          !/\b(radiat|arm numb|jaw|sweat|diaphores|collapse|faint|unconscious)\b/i.test(rawText);
        if (isMsk) {
          continue;
        }
      }

      hits.push({ pattern, matchedTerms: matched });
    }
  }
  return hits;
}

/** Check severity modifiers */
export function matchModifiers(rawText: string): string[] {
  const rawClauses = splitIntoClauses(rawText);
  const normClauses = rawClauses.map((c) => normalizeText(c)).filter(Boolean);
  const matched: string[] = [];

  for (const mod of SEVERITY_MODIFIERS) {
    let modHit = false;
    for (const term of mod.terms) {
      const normTerm = normalizeText(term);
      for (const normClause of normClauses) {
        if (normClause.includes(normTerm) && !CLAUSE_NEGATION_RE.test(normClause)) {
          modHit = true;
          break;
        }
      }
      if (modHit) break;
    }
    if (modHit) {
      matched.push(mod.id);
    }
  }
  return matched;
}

// re-export for API routes
export { RED_FLAG_PATTERNS, SEVERITY_MODIFIERS } from '@/data/lexicon';

/** breathing-difficulty patterns (trilingual, spelling-tolerant) */
const DYSPNEA_RE =
  /(difficulty breathing|shortness of breath|cant breathe|can't breathe|cannot breathe|trouble breathing|breathless|breathing difficulty|breathing is really hard|breathing hard|struggling to breathe|struggling to breath|struggling for breath|unable to breathe|gasping|gasping for air|cant catch my breath|can't catch my breath|cant catch breath|can't catch breath|catching my breath|cant get enough air|can't get enough air|cant get a full breath|wheezing badly|wheezing severe|wheezing a lot|cant get air|can't get air|winded|winded just|breathless just walking|breathless walking|saans lene mein mushkil|saans lene mein takleef|saans nahi aa rah|saans nhi aa rah|saans phool|sanse nahi aa rah|saans ki takleef|saans nahi aa rahi|saans phul rahi|سانس لینے میں مشکل|سانس نہیں آ رہی|سانس پھول|سانس نہیں آ رہی)/i;

/** food / medicine exposure context (anaphylaxis driver) */
const EXPOSURE_RE =
  /(\bate|\beaten|\beating\b|\bfood\b|khana|khaya|kha liya|kha li|allerg|medicine|dawa|dawai|tablet|goli|capsule|took|taken|taking|antibiotic|penicillin|brufen|aspirin|injection|لگا|دوا|گولی|کھا)/i;

/** heat-illness context (heat stroke driver) */
const HEAT_RE =
  /(extreme heat|heat wave|very hot|too hot|bohot garm|bohat garm|gharmi|garmi ka|looh|گرمی|بہت گرم)/i;

/** qualitative severe-glucose statements ("my sugar is very high/low", "my
 *  sugar dropped") */
const GLUCOSE_QUALITATIVE_RE =
  /(sugar|shugar|shakar|glucose|شوگر)[^.]{0,30}(very high|too high|bohot zyada|bohat zyada|zyada hai|zyada ho|barh rah|barh gay|barh rahi|very low|too low|bohot kam|bohat kam|kam hai|kam ho|gir rah|girn|gir gay|gir gayi|neeche|high hai|bahut zyada|dropped|dropping|fell|falling|going down|going low|crashing|کم ہو|گر رہ|گرن|گر گئ)|(?:very|too|bohot|bohat)[^.]{0,15}(high|low|zyada|kam)[^.]{0,15}(sugar|shugar|glucose|شوگر)/i;

/** inability to keep fluids / everything coming back up → dehydration risk */
const FLUID_INTOLERANCE_RE =
  /(cannot keep fluids|can't keep fluids|cant keep fluids|cannot keep anything|can't keep anything|not keeping anything|cannot stop vomiting|cant stop vomiting|vomiting everything|bringing everything back)/i;

/** rapidly worsening skin/wound signs → urgent wound assessment */
const WOUND_SEVERITY_RE =
  /(turning black|turning blue around|black around the wound|black skin around|spreading rapidly|spreading fast|spreading quickly|spreading redness|red streaks|red streaking)/i;

/**
 * Full L0 triage scoring (deterministic, no LLM).
 *
 * Emergency sources (any → EMERGENCY, LLM never consulted, never downgradeable):
 *   1. red-flag lexicon patterns (classic danger-sign combinations)
 *   2. diabetic emergency (glucose/diabetes + altered mental status OR DKA
 *      signs OR severe hypoglycemia reading < 55)
 *   3. compositional trauma (mechanism × serious site/sign, e.g. fall + numb legs)
 *   4. medicine overdose with altered mental status
 *   5. anaphylaxis reaction (breathing difficulty + food/medicine exposure)
 *   6. respiratory emergency (breathing difficulty + fever/elderly/pregnancy/
 *      established chronic condition)
 *   7. heat stroke (altered mental status + extreme heat)
 *
 * Non-emergency rules build on topic base levels + severity modifiers, with
 * clinical-context floors/caps (all generalize across languages):
 *   - trauma mechanism without red signs → URGENT floor (injuries need checking)
 *   - emergency-condition home-treatment request → URGENT floor
 *   - medication prescribing request → ROUTINE floor (never SELF_CARE)
 *   - medicine overdose without danger signs → URGENT floor
 *   - severe glucose reading alone → URGENT floor
 *   - qualitative very high/low sugar → URGENT floor
 *   - baby with fever (age not stated) → URGENT floor
 *   - cannot keep fluids / vomiting everything → URGENT floor
 *   - rapidly spreading rash / blackening wound → URGENT floor
 *   - pure vague distress → URGENT (strong words) / ROUTINE (mild) + clarification
 *   - established condition statement with no complaint → cap ROUTINE
 *   - suspected/asked condition with no complaint → cap ROUTINE + clarification
 *   - special-population statement alone (pregnant/child/elderly) → cap ROUTINE
 */
export function runL0Triage(text: string, language?: Lang): TriageResult {
  const lang = language ?? detectLanguage(text).language;
  const norm = normalizeText(text);
  const ctx = extractClinicalContext(text);
  const clarification = assessClarification(ctx, text);
  const redFlags = matchRedFlags(text);

  // ---------- deterministic EMERGENCY sources ----------
  const diabeticEmerg = isDiabeticEmergency(ctx, norm);
  const traumaEmerg = isTraumaEmergency(ctx);
  const overdoseEmerg =
    ctx.medications?.intent === 'OVERDOSE' && hasAlteredMentalStatus(norm);
  const homeEmergency = isEmergencyHomeTreatmentRequest(norm);
  // altered mental status + systemic trigger (fever / elderly / chronic
  // condition / pregnancy / extreme heat) = emergency-level concern; alone it
  // still floors at URGENT — confusion is a danger sign, never "no concern"
  const isClauseAffirmed = (re: RegExp): boolean => {
    const clauses = splitIntoClauses(text);
    return clauses.some((c) => re.test(c) && !CLAUSE_NEGATION_RE.test(c));
  };

  const alteredMental = hasAlteredMentalStatus(norm) && !CLAUSE_NEGATION_RE.test(norm);
  const hasFeverNow = isClauseAffirmed(/(bukhar|bukhaar|fever|temperature|hararat|بخار)/i);
  const mentalStatusEmergency =
    alteredMental &&
    (hasFeverNow || ctx.populations.elderly || ctx.populations.pregnancy ||
      ctx.conditions.some((c) => c.state === 'ESTABLISHED') || HEAT_RE.test(text));
  // breathing difficulty + fever/high-risk group = respiratory emergency
  // (WHO danger sign); breathing difficulty + food/medicine exposure =
  // possible anaphylaxis — both are emergencies
  const dyspneaNow = isClauseAffirmed(DYSPNEA_RE);
  const respiratoryEmergency =
    dyspneaNow &&
    (hasFeverNow || ctx.populations.elderly || ctx.populations.pregnancy ||
      ctx.conditions.some((c) => c.state === 'ESTABLISHED')) &&
    redFlags.length === 0;
  const anaphylaxisReaction = dyspneaNow && EXPOSURE_RE.test(text) && redFlags.length === 0;
  // glucose reading far below the safe range (< 55) = severe hypoglycemia,
  // an emergency even before symptoms are described
  const hypoglycemiaEmergency =
    ctx.glucoseReading !== null && ctx.glucoseReading.value > 0 && ctx.glucoseReading.value < 55;

  if (redFlags.length > 0 || diabeticEmerg || traumaEmerg || overdoseEmerg || mentalStatusEmergency || respiratoryEmergency || anaphylaxisReaction || hypoglycemiaEmergency) {
    const contextualEmerg = mentalStatusEmergency || respiratoryEmergency || anaphylaxisReaction || hypoglycemiaEmergency;
    const category = contextualEmerg && !redFlags.length && !diabeticEmerg && !traumaEmerg && !overdoseEmerg
      ? (anaphylaxisReaction ? 'anaphylaxis' : hypoglycemiaEmergency ? 'diabetic-emergency' : 'general-emergency')
      : resolveEmergencyCategory(redFlags, ctx, diabeticEmerg);
    const pattern = redFlags.find((r) => r.pattern.category === category)?.pattern;
    const reason = pattern
      ? pattern.reason_template[lang]
      : (EMERGENCY_CATEGORY_REASONS[category]?.[lang] ??
        triageReason('EMERGENCY', lang, []));
    return {
      level: 'EMERGENCY',
      reason,
      signals: [
        ...redFlags.flatMap((r) => r.matchedTerms).slice(0, 6),
        ...ctx.trauma ? [`trauma:${ctx.trauma.mechanism}`, ...ctx.trauma.sites.map((s) => `site:${s}`), ...ctx.trauma.severitySigns.map((s) => `sign:${s}`)] : [],
        ...(diabeticEmerg ? ['diabetic-emergency'] : []),
        ...(overdoseEmerg ? ['overdose:altered-mental-status'] : []),
        ...(mentalStatusEmergency ? ['altered-mental-status:emergency'] : []),
        ...(respiratoryEmergency ? ['respiratory-emergency'] : []),
        ...(anaphylaxisReaction ? ['anaphylaxis-reaction'] : []),
        ...(hypoglycemiaEmergency ? [`hypoglycemia:${ctx.glucoseReading?.value}`] : []),
        ...(ctx.injection.detected ? ['injection-attempt'] : []),
        `emergency:${category}`,
      ],
      engine: 'L0',
      shortCircuited: true,
      matchedPatternId: pattern?.id ?? (diabeticEmerg || hypoglycemiaEmergency ? 'diabetic_emergency' : traumaEmerg ? 'trauma_composition' : overdoseEmerg ? 'overdose_altered' : anaphylaxisReaction ? 'anaphylaxis_reaction' : 'altered_mental_status'),
      matchedCategory: category,
      context: ctx,
      needsClarification: false,
      clarificationReasons: [],
    };
  }

  // ---------- non-emergency scoring ----------
  const modifiers = matchModifiers(text);
  const retrievals = retrieveCorpus(text, 3);
  let level: TriageLevel = 'SELF_CARE';
  const signals: string[] = [];

  const informational = isInformationalQuery(text);
  if (retrievals.length > 0 && retrievals[0].score >= 2) {
    const base = retrievals[0].item.baseLevel;
    // For informational queries:
    // - SELF_CARE base → SELF_CARE (e.g. pregnancy nutrition advice)
    // - ROUTINE/URGENT/EMERGENCY base → ROUTINE (cap informational at ROUTINE;
    //   asking "what are the danger signs?" is never itself an emergency)
    // For symptom reports: floor at URGENT to ensure clinical engagement.
    level = informational
      ? (base === 'SELF_CARE' ? 'SELF_CARE' : 'ROUTINE')
      : minSeverity(base, 'URGENT');
    signals.push(`topic:${retrievals[0].item.topic}`);
  }
  if (informational) signals.push('informational-question');

  const hasFever = /(bukhar|bukhaar|fever|temperature|hararat|بخار)/i.test(text);

  // Apply severity modifiers — escalate, never de-escalate.
  // The high_risk_person modifier only counts when a condition is ESTABLISHED
  // (or when no condition terms matched at all, e.g. a stated pregnancy) —
  // asking "could I have diabetes?" must never raise risk like having it.
  const hasEstablishedCondition = ctx.conditions.some((c) => c.state === 'ESTABLISHED');
  if (!informational) {
    for (const modId of modifiers) {
      if (modId === 'duration_long' && !hasFever) continue;
      if (modId === 'high_risk_person' && ctx.conditions.length > 0 && !hasEstablishedCondition) continue;
      // a PLANNING question from someone with a chronic condition ("I have
      // diabetes, can I fast in Ramadan?") carries no current complaint —
      // the chronic-risk escalation is for active complaints, not questions
      if (modId === 'high_risk_person' && ctx.isQuestion && !ctx.hasSymptoms) continue;
      const mod = SEVERITY_MODIFIERS.find((m) => m.id === modId);
      if (!mod) continue;
      if (mod.boost === 2) {
        level = 'EMERGENCY';
        signals.push(`modifier:${modId}`);
        break;
      }
      if (mod.boost === 1) {
        const next = escalate(level);
        if (next) level = next;
        signals.push(`modifier:${modId}`);
      }
    }
  }

  // ---------- statement caps (run BEFORE floors) ----------
  // An active complaint includes breathing difficulty, chest pain and glucose
  // concerns — the caps below classify BARE statements and must never suppress
  // a live cardio-respiratory or metabolic complaint to routine reassurance.
  // Caps run before the danger-sign floors: the floors may then only raise the
  // level, never lower it (a danger sign always beats a statement cap).
  const chestPainNow =
    /\bchest\b[^.!?]{0,25}\bpain\b|\bpain\b[^.!?]{0,25}\bchest\b|\bchest\b[^.!?]{0,25}\bhurt|\bchest (?:pressure|tightness|discomfort|heaviness)\b|\btight chest\b|\bheavy chest\b|\bheavy feeling in (?:my )?chest\b|\bchest feels[^.!?]{0,15}(?:tight|heavy|weird|strange|pressure|crushed|squeezed)\b|\bcrushing (?:feeling|sensation|pain|chest)\b|\bsqueezing (?:feeling|sensation|in (?:my )?chest|chest)\b|\belephant on (?:my )?chest\b|\bsomeone sitting on (?:my )?chest\b|\btight band around (?:my )?chest\b|\bweight on (?:my )?chest\b/i.test(text) ||
    /seene[\w ]{0,15}dard|dard[\w ]{0,15}seene|seene mein[^.!?]{0,15}bharipan|seene mein[^.!?]{0,15}dabao|seene par[^.!?]{0,15}bojh|seene par[^.!?]{0,15}wazan|seena[^.!?]{0,10}daba/i.test(text) ||
    /سینے[^۔!؟]{0,15}درد|درد[^۔!؟]{0,15}سینے|سینے[^۔!؟]{0,15}دباؤ|سینے[^۔!؟]{0,15}بوجھ|سینہ[^۔!؟]{0,10}دبا/.test(text);
  const glucoseConcern =
    ctx.glucoseReading !== null || GLUCOSE_QUALITATIVE_RE.test(text);
  const hasActiveComplaint =
    ctx.hasSymptoms || ctx.vagueDistress.detected || ctx.isQuestion || dyspneaNow || chestPainNow || glucoseConcern;

  // established condition stated with NO current complaint → general guidance,
  // never an automatic appointment or re-confirmation of the diagnosis
  const establishedOnly =
    ctx.conditions.some((c) => c.state === 'ESTABLISHED') && !hasActiveComplaint;
  if (establishedOnly) {
    level = minSeverity(level, 'ROUTINE');
    signals.push('condition-established');
  }
  // suspected / asked-about / symptom-associated condition with no active
  // complaint → evaluation guidance, capped at ROUTINE
  const conditionInquiry =
    ctx.conditions.some(
      (c) => c.state === 'QUESTION' || c.state === 'SUSPECTED' || c.state === 'SYMPTOM_ASSOCIATED',
    ) &&
    !ctx.hasSymptoms;
  if (conditionInquiry) {
    level = minSeverity(level, 'ROUTINE');
    level = maxSeverityLevel(level, 'ROUTINE');
    signals.push('condition-inquiry');
  }
  // special-population statement alone (no complaint) → general guidance at
  // ROUTINE (engage with guidance + questions, never a bare SELF_CARE shrug)
  // BUT: if the query is informational AND has a corpus match with a lower
  // base level (e.g. pregnancy nutrition = SELF_CARE), respect that level.
  const populationOnly =
    (ctx.populations.pregnancy || ctx.populations.child || ctx.populations.elderly) &&
    !hasActiveComplaint &&
    ctx.conditions.length === 0 &&
    !(informational && retrievals.length > 0 && retrievals[0].score >= 2 && retrievals[0].item.baseLevel === 'SELF_CARE');
  if (populationOnly) {
    level = minSeverity(maxSeverityLevel(level, 'ROUTINE'), 'ROUTINE');
    signals.push('population-context');
  }

  // ---------- danger-sign floors (only ever raise the level) ----------
  // medication questions naming a specific prescription drug WITH a symptom
  // context are never self-care ("can I take ciprofloxacin for fever?"); a
  // hypothetical/informational phrasing keeps its informational level
  if (
    !informational &&
    ctx.medications &&
    ctx.medications.drugs.some((d) => d !== 'generic-medicine') &&
    (ctx.hasSymptoms || ctx.medications.drugs.some((d) => d !== 'generic-medicine' && d !== 'antibiotic'))
  ) {
    level = maxSeverityLevel(level, 'ROUTINE');
    signals.push('medication-question');
  }
  // fever + rash (possible dengue warning sign) → same-day assessment
  if (hasFever && !informational && /\b(rash|rashes|dane|spots on skin)\b|چھاپٹی|دانیاں/i.test(text)) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('fever-with-rash');
  }
  // fever during pregnancy needs prompt medical advice
  if (ctx.populations.pregnancy && hasFever && !informational) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('pregnancy-fever-concern');
  }
  // a child who is unusually sleepy / lethargic needs same-day assessment
  if (ctx.populations.child && !informational && /(unusually sleepy|very lethargic|lethargic|listless|gone limp|bohot sust|bilkul sust|hoshiyar nahi)/i.test(text)) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('child-lethargy');
  }
  // child with diarrhea/vomiting needs closer monitoring than an adult —
  // never bare SELF_CARE; floor at ROUTINE so ORS guidance + when-to-seek-care
  // is always given (children dehydrate faster than adults). Informational /
  // treatment questions still get their original level.
  if (ctx.populations.child && !informational && !ctx.isQuestion && /\b(diarrhea|diarrhoea|vomiting|vomited|loose motion|dast|ulti|qay|pet kharab|دست|الٹی|پیٹ خراب)\b/i.test(text)) {
    level = maxSeverityLevel(level, 'ROUTINE');
    signals.push('child-gi-symptom');
  }
  // child + bleeding sign (blood in stool etc.) → same-day assessment
  if (ctx.populations.child && modifiers.includes('bleeding_present') && !informational) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('child-bleeding-sign');
  }
  // deep cut / deep wound needs assessment (possible stitches)
  if (/\b(deep (cut|wound|wounds|gash|incision))\b|girah lagi|گہرا زخم|گہری چوٹ/i.test(text) && !informational) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('deep-wound-assessment');
  }
  // possible fracture / deformity → same-day assessment
  if (/\b(broke|broken|fracture|fractured|deformed|deformity)\b|ٹوٹ گیا|ٹیڑھا/i.test(text) && !informational) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('possible-fracture');
  }
  // animal bite (rabies risk) — mosquito/insect bites excluded
  if (
    /\b(bit me|bitten by|bite|bites|ne kata|ne dasa|dasa hai)\b|کاٹا/i.test(text) &&
    !/\b(mosquito|mosquitoes|insect|bug|machhar|makhi|مچھر)\b/i.test(text) &&
    !informational
  ) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('animal-bite-assessment');
  }
  // severe fluid-loss / dysentery presentations → same-day assessment
  if (
    /(severe|heavy|watery|persistent|constant)\s+(diarrhea|diarrhoea|vomiting)|(diarrhea|vomiting)\s+(wont|won't|will not)\s+stop|bloody diarrhea|blood in (?:my |the )?stool|bohot dast|zyada dast|dast nahi ruk|khoon ki dast/i.test(text) &&
    !informational
  ) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('severe-fluid-loss');
  }
  // strong thirst / weakness (dehydration concern) — "slightly thirsty" stays calm
  if (/(extremely|very|terribly)\s+(thirsty|weak)|dehydrated|bohot pyasa|bohat pyasa|bohot kamzor/i.test(text) && !informational) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('dehydration-concern');
  }
  // vision loss (with or without headache) → same-day assessment
  if (/\b(vision loss|losing vision|lost my vision|sudden double vision|double vision|cannot see properly|cant see properly)\b|نظر کم|اندھا/i.test(text) && !informational) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('vision-loss-concern');
  }
  // black / tar-like stool (possible GI bleeding) → same-day assessment
  if (/\bblack (stool|motion|peshab)\b|stool is black|tar-?like (stool|motion)|kaali peshab/i.test(text) && !informational) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('possible-gi-bleed');
  }
  // any clarification requirement is never answered with bare self-care
  if (clarification.needed) {
    level = maxSeverityLevel(level, 'ROUTINE');
    signals.push('needs-clarification');
  }
  // medication prescribing requests are NEVER self-care
  if (ctx.medications?.intent === 'PRESCRIBING') {
    level = maxSeverityLevel(level, 'ROUTINE');
    signals.push('medication-prescribing-request');
  }
  // overdose without danger signs still needs same-day advice
  if (ctx.medications?.intent === 'OVERDOSE') {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('medication-overdose');
  }
  // trauma mechanism present but not emergency-composition → get checked
  if (ctx.trauma && !traumaEmerg) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('trauma-assessment-needed');
  }
  // asking to treat an emergency condition at home → at least urgent redirect
  if (homeEmergency) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('emergency-home-treatment-request');
  }
  // severe glucose reading without danger signs → same-day doctor contact
  if (ctx.glucoseReading?.severe) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push(`abnormal-glucose:${ctx.glucoseReading.value}`);
  }
  // qualitative severe-glucose statements ("my sugar is very high/low") → same-day advice
  if (GLUCOSE_QUALITATIVE_RE.test(text)) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('abnormal-glucose:qualitative');
  }
  // a baby (age not stated) with fever needs its age checked — treat urgently
  // until an infant-vs-toddler distinction is established
  if (ctx.populations.child && hasFever && /\b(baby|babies|shishu)\b/i.test(text) && !informational) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('infant-fever-concern');
  }
  // cannot keep fluids down / vomiting everything → dehydration risk
  if (FLUID_INTOLERANCE_RE.test(text)) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('fluid-intolerance');
  }
  // rapidly spreading rash / blackening skin around a wound → urgent assessment
  if (WOUND_SEVERITY_RE.test(text)) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('wound-severity-sign');
  }
  // altered mental status without a systemic trigger → still urgent + clarify
  if (alteredMental && !mentalStatusEmergency) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('altered-mental-status');
  }
  // breathing difficulty without fever → breathing must be assessed same day
  if (dyspneaNow && !respiratoryEmergency) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('breathing-difficulty-assessment');
  }
  // any chest pain without a trauma mechanism → cardiac assessment floor
  // (angina can present without breathing difficulty) — EXCEPT chest-wall
  // tenderness reproducible on palpation, which is classically musculoskeletal.
  // Flexible patterns allow modifiers between words ("seene me SAKHT dard").
  if (
    !ctx.trauma &&
    chestPainNow &&
    !/(pressing on|press on|pressed on|touch|touched|tender|tenderness|palpat|dabane|chhone|چھون|دبان)/i.test(text)
  ) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('chest-pain-assessment');
  }
  // pure vague distress — NEVER "no concern"; clarify instead
  if (ctx.vagueDistress.detected && !ctx.vagueDistress.hasSpecificSymptoms) {
    level = maxSeverityLevel(level, ctx.vagueDistress.intensity === 'high' ? 'URGENT' : 'ROUTINE');
    signals.push(`vague-distress:${ctx.vagueDistress.intensity}`);
  }
  // a symptom is mentioned in a SHORT message but the corpus has no matching
  // topic — never bare SELF_CARE; floor at ROUTINE so the response asks
  // clarifying questions. Only fires for terse messages (<= 5 words) without
  // duration/severity context, so "pet dard hai kal sham se, halka hai" (which
  // gives duration + severity) stays at its appropriate SELF_CARE level.
  if (
    !informational &&
    !ctx.isQuestion &&
    ctx.hasSymptoms &&
    retrievals.length === 0 &&
    !ctx.vagueDistress.detected &&
    norm.split(' ').length <= 5
  ) {
    level = maxSeverityLevel(level, 'ROUTINE');
    signals.push('unrecognized-symptom');
  }
  // established chronic condition + a wound or infection sign — classic
  // complication pattern (e.g. diabetic foot) → same-day facility visit
  if (
    ctx.conditions.some((c) => c.state === 'ESTABLISHED') &&
    /(wound|ulcer|sore|not healing|infected|infection|swelling|redness|pus|zakhm|chot|nahin bharna|سوجن|زخم|چوٹ|پیپ)/i.test(text)
  ) {
    level = maxSeverityLevel(level, 'URGENT');
    signals.push('chronic-complication-sign');
  }
  if (ctx.injection.detected) {
    // logged, never affects classification
    signals.push('injection-attempt');
  }
  if (ctx.medications?.intent === 'GENERAL_INFO') signals.push('medication-general-info');
  if (ctx.medications?.intent === 'INTERACTION') signals.push('medication-interaction');
  if (ctx.medications?.intent === 'MISSED_DOSE') signals.push('medication-missed-dose');
  if (ctx.medications?.intent === 'STOP_START') signals.push('medication-stop-start');
  if (ctx.medications?.personalized) signals.push('medication-personalized');
  if (ctx.populations.pregnancy && hasActiveComplaint) signals.push('pregnancy-context');
  if (ctx.populations.child && hasActiveComplaint) signals.push('child-context');
  if (ctx.populations.elderly && hasActiveComplaint) signals.push('elderly-context');

  const reason = contextualReason(signals, level, lang);
  return {
    level,
    reason,
    signals,
    engine: 'L0',
    shortCircuited: false,
    context: ctx,
    needsClarification: clarification.needed,
    clarificationReasons: clarification.reasons,
  };
}

function maxSeverityLevel(a: TriageLevel, b: TriageLevel): TriageLevel {
  return TRIAGE_ORDER[a] >= TRIAGE_ORDER[b] ? a : b;
}

/** trilingual reasons for the new context signals (checked in priority order) */
const CONTEXT_REASONS: { signal: string; text: Record<Lang, string> }[] = [
  {
    signal: 'medication-prescribing-request',
    text: {
      en: 'Choosing a medicine and its dose needs a doctor or pharmacist who can examine you — I can share general information only.',
      ur: 'دوا کا انتخاب اور اس کی خوراک کسی ایسے ڈاکٹر یا فارماسسٹ سے ہونی چاہیے جو آپ کا معائنہ کر سکے — میں صرف عمومی معلومات دے سکتا ہوں۔',
      roman: 'Dawa ka intikhab aur is ki khoraak kisi aise doctor ya pharmacist se honi chahiye jo aap ka muaina kar sake — main sirf aam maloomat de sakta hoon.',
    },
  },
  {
    signal: 'medication-overdose',
    text: {
      en: 'Taking more medicine than prescribed can be dangerous — get advice from a doctor or the Health Helpline today.',
      ur: 'تجویز سے زیادہ دوا لینا خطرناک ہو سکتا ہے — آج ہی ڈاکٹر یا ہیلتھ ہیلپ لائن سے رہنمائی لیں۔',
      roman: 'Tayweez se zyada dawa lena khatarnak ho sakta hai — aaj hi doctor ya Health Helpline se rehnumai lein.',
    },
  },
  {
    signal: 'trauma-assessment-needed',
    text: {
      en: 'After an accident or fall, injuries should be checked at a health facility within 24 hours.',
      ur: 'حادثے یا گرنے کے بعد چوٹوں کا معائنہ 24 گھنٹے کے اندر ہیلتھ فیسلٹی میں کروانا چاہیے۔',
      roman: 'Hadse ya girne ke baad choton ka muaina 24 ghanton ke andar health facility mein karwana chahiye.',
    },
  },
  {
    signal: 'emergency-home-treatment-request',
    text: {
      en: 'This kind of condition is always a medical emergency — it can never be safely treated at home without emergency services.',
      ur: 'یہ قسم کی حالت ہمیشہ طبی ایمرجنسی ہوتی ہے — ایمرجنسی سروس کے بغیر اسے گھر پر محفوظ طریقے سے نہیں سنبھالا جا سکتا۔',
      roman: 'Yeh qism ki halat hamesha tibbi emergency hoti hai — emergency service ke baghair ise ghar par mehfooz tareeqe se nahin sambhala ja sakta.',
    },
  },
  {
    signal: 'abnormal-glucose',
    text: {
      en: 'That sugar reading is far outside the usual safe range — contact a doctor today for advice.',
      ur: 'یہ شوگر ریڈنگ عام محفوظ حد سے بہت باہر ہے — رہنمائی کے لیے آج ہی ڈاکٹر سے رابطہ کریں۔',
      roman: 'Yeh sugar reading aam mehfooz had se bohot bahar hai — rehnumai ke liye aaj hi doctor se raabta karein.',
    },
  },
  {
    signal: 'vague-distress:high',
    text: {
      en: "You are clearly unwell and I don't yet have enough information — please answer the questions below, and don't ignore this feeling.",
      ur: 'آپ واضح طور پر بیمار محسوس کر رہے ہیں اور میرے پاس ابھی کافی معلومات نہیں — براہِ کرم نیچے دیے گئے سوالات کے جواب دیں، اور اس احساس کو نظرانداز نہ کریں۔',
      roman: 'Aap waazeh tor par bimaar mehsoos kar rahein hain aur mere paas abhi kaafi maloomat nahin — barah-e-karam neeche diye gaye sawalon ke jawab dein, aur is ehsas ko nazar-andaz na karein.',
    },
  },
  {
    signal: 'vague-distress:low',
    text: {
      en: 'Something does not feel right — I need a little more information to guide you safely.',
      ur: 'کچھ ٹھیک محسوس نہیں ہو رہا — محفوظ رہنمائی کے لیے مجھے تھوڑی مزید معلومات درکار ہیں۔',
      roman: 'Kuch theek mehsoos nahin ho raha — mehfooz rehnumai ke liye mujhe thori mazeed maloomat darkar hain.',
    },
  },
  {
    signal: 'condition-established',
    text: {
      en: 'Living with a long-term condition — here is general guidance. Tell me what is bothering you today.',
      ur: 'دیرپا بیماری کے ساتھ زندگی — یہاں عمومی رہنمائی ہے۔ مجھے بتائیں آج آپ کو کیا تکلیف ہے۔',
      roman: 'Der-pa bimari ke saath zindagi — yahan aam rehnumai hai. Mujhe batayein aaj aap ko kya takleef hai.',
    },
  },
  {
    signal: 'condition-inquiry',
    text: {
      en: "Whether you have this condition is something a doctor must check — here is general information while you arrange that.",
      ur: 'کیا آپ کو یہ بیماری ہے یہ ڈاکٹر ہی جانچ سکتا ہے — انتظام کرتے ہوئے یہاں عمومی معلومات ہیں۔',
      roman: 'Kya aap ko yeh bimari hai yeh doctor hi jaanch sakta hai — intezam karte hue yahan aam maloomat hain.',
    },
  },
  {
    signal: 'population-context',
    text: {
      en: 'Thanks for telling me — here is general guidance for this stage. What would you like help with today?',
      ur: 'مجھے بتانے کا شکریہ — اس مرحلے کے لیے یہاں عمومی رہنمائی ہے۔ آج آپ کس معاملے میں مدد چاہتے ہیں؟',
      roman: 'Mujhe batanay ka shukriya — is marhalay ke liye yahan aam rehnumai hai. Aaj aap kis maamlay mein madad chahte hain?',
    },
  },
];

function contextualReason(signals: string[], level: TriageLevel, lang: Lang): string {
  for (const entry of CONTEXT_REASONS) {
    const hit = signals.some((s) => s === entry.signal || s.startsWith(`${entry.signal}:`));
    if (hit) return entry.text[lang];
  }
  return triageReason(level, lang, signals);
}

/** reason templates for context-driven emergency categories (no lexicon pattern) */
const EMERGENCY_CATEGORY_REASONS: Record<string, Record<Lang, string>> = {
  'choking': {
    en: 'Choking means the airway is blocked — this is immediately life-threatening. Start first aid now and call 1122.',
    ur: 'گلا پھنسنا سانس کی نالی کے بند ہونے کا نام ہے — یہ فوراً جان لیوا ہے۔ ابھی ابتدائی امداد شروع کریں اور 1122 پر کال کریں۔',
    roman: 'Gala phansna saans ki nali ke band hone ka naam hai — yeh fori tor par jaan lewa hai. Abhi ibtidai imdad shuru karein aur 1122 par call karein.',
  },
  'obstetric-emergency': {
    en: 'These are maternal danger signs — reduced baby movement, leaking fluid or severe pain in pregnancy needs emergency care now.',
    ur: 'یہ حمل کے خطرے کی علامات ہیں — بچے کی حرکت کم ہونا، پانی کا اٹھنا یا شدید درد کے لیے فوری ایمرجنسی ضروری ہے۔',
    roman: 'Yeh hamal ke khatre ki alamaat hain — bachay ki harkat kam hona, pani ka uthna ya shadeed dard ke liye fori emergency zaroori hai.',
  },
  'spine-trauma': {
    en: 'After a fall or accident, neck/back pain with numbness or inability to move can mean a spine injury — moving could make it permanent. Keep completely still and call 1122.',
    ur: 'گرنے یا حادثے کے بعد گردن/کمر کے درد کے ساتھ سن پن یا حرکت نہ کر پانا ریڑھ کی ہڈی کی چوٹ ہو سکتی ہے — حرکت اسے مستقل بنا سکتی ہے۔ بالکل ساکن رہیں اور 1122 پر کال کریں۔',
    roman: 'Girne ya hadse ke baad gardan/kamar ke dard ke saath sun pan ya harkat na kar paana reedh ki haddi ki chot ho sakti hai — harkat ise mustaqil bana sakti hai. Bilkul saakin rahein aur 1122 par call karein.',
  },
  'chest-trauma': {
    en: 'Chest pain after an accident, fall or blow can mean rib, lung or heart injury — this needs emergency assessment now.',
    ur: 'حادثے، گرنے یا ضرب کے بعد سینے کا درد پسلی، پھیپھڑے یا دل کی چوٹ ہو سکتی ہے — اس کے لیے فوری ایمرجنسی معائنہ ضروری ہے۔',
    roman: 'Hadse, girne ya zarb ke baad seene ka dard pasli, phaingra ya dil ki chot ho sakti hai — is ke liye fori emergency muaina zaroori hai.',
  },
  'diabetic-emergency': {
    en: 'Confusion or extreme sleepiness with diabetes (or a very high/low sugar reading) can be a diabetic emergency — it needs treatment now.',
    ur: 'ذیابیطس کے ساتھ الجھن یا حد سے زیادہ نیند (یا بہت زیادہ/کم شوگر ریڈنگ) ذیابیطس ایمرجنسی ہو سکتی ہے — اسے ابھی علاج درکار ہے۔',
    roman: 'Diabetes ke saath uljhan ya had se zyada neend (ya bohot zyada/kam sugar reading) diabetic emergency ho sakti hai — ise abhi ilaaj darkar hai.',
  },
  'general-emergency': {
    en: 'Emergency signs detected — this needs immediate care.',
    ur: 'ایمرجنسی علامات ملی ہیں — فوری طبی امداد درکار ہے۔',
    roman: 'Emergency alamaat mili hain — fori tibbi imdad darkar hai.',
  },
};

function escalate(level: TriageLevel): TriageLevel | null {
  if (level === 'SELF_CARE') return 'ROUTINE';
  if (level === 'ROUTINE') return 'URGENT';
  if (level === 'URGENT') return 'URGENT';
  return null;
}

function minSeverity(a: TriageLevel, b: TriageLevel): TriageLevel {
  return TRIAGE_ORDER[a] <= TRIAGE_ORDER[b] ? a : b;
}

export function triageReason(level: TriageLevel, lang: Lang, signals: string[]): string {
  const map: Record<TriageLevel, Record<Lang, string>> = {
    EMERGENCY: {
      en: 'Emergency signs detected — this needs immediate care.',
      ur: 'ایمرجنسی علامات ملی ہیں — فوری طبی امداد درکار ہے۔',
      roman: 'Emergency alamaat mili hain — fori tibbi imdad darkar hai.',
    },
    URGENT: {
      en: 'Your symptoms should be checked by a health facility within 24 hours.',
      ur: 'آپ کی علامات کے لیے 24 گھنٹے کے اندر ہیلتھ فیسلٹی کا معائنہ ضروری ہے۔',
      roman: 'Aap ki alamaat ke liye 24 ghanton ke andar health facility ka muaina zaroori hai.',
    },
    ROUTINE: {
      en: 'These symptoms should be checked by a doctor within 2–3 days.',
      ur: 'ان علامات کے لیے 2-3 دن میں ڈاکٹر کو دکھانا چاہیے۔',
      roman: 'In alamaat ke liye 2-3 din mein doctor ko dikhana chahiye.',
    },
    SELF_CARE: {
      en: 'This can usually be managed safely at home — see guidance below.',
      ur: 'یہ عام طور پر گھر پر محفوظ طریقے سے سنبھالا جا سکتا ہے — نیچے ہدایات دیکھیں۔',
      roman: 'Yeh aam tor par ghar par mehfooz tareeqe se sambhala ja sakta hai — neeche hidayat dekhein.',
    },
  };
  return map[level][lang];
}

// ------------------------------------------------------------
// Lightweight corpus retrieval (keyword/tag overlap scoring).
// Token boundary detection & strict RAG scoring contracts (R2).
// Used by offline engine directly; the server also uses it
// as the first-stage retrieval before LLM grounding.
// ------------------------------------------------------------

export const MIN_CORPUS_SCORE_THRESHOLD = 2.5;

/**
 * Tokenize text into distinct normalized tokens supporting English, Roman Urdu, and Perso-Arabic Urdu.
 */
export function tokenizeText(text: string): string[] {
  return normalizeText(text)
    .split(/[^a-z0-9\u0600-\u06FF]+/i)
    .filter(Boolean);
}

/**
 * Token-bounded whole-word/phrase checker supporting Latin, Roman Urdu, and Perso-Arabic boundaries.
 */
export function hasTokenBoundaryMatch(text: string, phrase: string): boolean {
  const normText = normalizeText(text);
  const normPhrase = normalizeText(phrase);
  if (!normText || !normPhrase) return false;

  const escaped = normPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|[^a-z0-9\\u0600-\\u06FF])${escaped}(?:$|[^a-z0-9\\u0600-\\u06FF])`, 'i');
  return re.test(normText);
}

export interface RetrievalHit {
  item: (typeof CORPUS)[number];
  score: number;
}

/**
 * Common misspellings + symptom synonyms (EN & Roman Urdu) → canonical tag words.
 * Real users misspell ("diabetis"), judges type terse symptoms ("nausea"),
 * and accidents get described loosely ("a bike hit me"). This map rewrites the
 * query BEFORE tag matching so retrieval still finds the right verified doc.
 */
export const QUERY_SYNONYMS: Record<string, string> = {
  // misspellings & canonical clinical terms
  diabetis: 'diabetes sugar',
  diabeties: 'diabetes sugar',
  diabet: 'diabetes sugar',
  diabities: 'diabetes sugar',
  dyabetes: 'diabetes sugar',
  diabetes: 'diabetes sugar',
  diarea: 'diarrhea dast loose motions',
  diarroea: 'diarrhea dast loose motions',
  diahrea: 'diarrhea dast loose motions',
  diarrhea: 'diarrhea dast loose motions',
  diarrhoea: 'diarrhea dast loose motions',
  dast: 'diarrhea dast loose motions',
  loosemotion: 'diarrhea loose motions',
  'loose motions': 'diarrhea loose motions',
  'loose motion': 'diarrhea loose motions',
  nuasea: 'nausea vomiting matli ulti',
  nausia: 'nausea vomiting matli ulti',
  nauseous: 'nausea vomiting matli ulti',
  nausea: 'nausea vomiting matli ulti',
  nauseated: 'nausea vomiting matli ulti',
  feelsick: 'nausea vomiting matli ulti',
  matli: 'nausea vomiting matli ulti',
  ulti: 'nausea vomiting matli ulti',
  'ulti aa rahi': 'nausea vomiting matli ulti',
  headake: 'headache sar dard',
  hedache: 'headache sar dard',
  headeach: 'headache sar dard',
  'head ache': 'headache sar dard',
  'head pain': 'headache sar dard',
  toothache: 'toothache dant dard',
  tootheach: 'toothache dant dard',
  'tooth ache': 'toothache dant dard',
  'dant dard': 'toothache dant dard',
  feever: 'fever bukhar',
  faver: 'fever bukhar',
  bukhaar: 'bukhar',
  'tez bukhar': 'fever bukhar high temperature',
  denguey: 'dengue dengue fever',
  maleria: 'malaria malaria fever chills',
  maliria: 'malaria malaria fever chills',
  tifoid: 'typhoid typhoid fever',
  tiphoid: 'typhoid typhoid fever',
  pheumonia: 'pneumonia namonia',
  pneumoniya: 'pneumonia namonia',
  namonia: 'pneumonia namonia',
  asthama: 'asthma asthma attack wheezing',
  asmatic: 'asthma asthma attack wheezing',
  hyptension: 'hypertension blood pressure high bp',
  'hyper tension': 'hypertension blood pressure high bp',
  anemiaa: 'anemia anaemia khoon ki kami',
  'khoon ki kami': 'anemia anaemia khoon ki kami',
  tb: 'tuberculosis tb',
  concusion: 'head injury concussion',
  vomitting: 'vomiting nausea ulti',
  puking: 'vomiting nausea ulti',
  'throwing up': 'vomiting nausea ulti',
  // accident / trauma phrasing → injury tags
  'hit me': 'injury wound',
  'hit my': 'injury wound',
  hitted: 'hit injury wound',
  accident: 'injury wound',
  'chot lagi': 'injury wound',
  'chot lgi': 'injury wound',
  // terse symptom words → canonical tags
  backpain: 'back pain backache kamar dard',
  'back ache': 'back pain backache kamar dard',
  'waist pain': 'back pain backache kamar dard',
  kammar: 'back pain kamar dard',
  'kamar dard': 'back pain kamar dard',
  shakar: 'diabetes sugar',
  shugar: 'diabetes sugar',
  // hypo-specific phrasings map to the hypoglycemia doc
  'sugar kam': 'hypoglycemia low sugar',
  'sugar gir': 'hypoglycemia low sugar',
  'sugar girna': 'hypoglycemia low sugar',
  'shugar gir gayi': 'hypoglycemia low sugar',
  'low sugar': 'hypoglycemia low sugar',
  hypoglycaemia: 'hypoglycemia low sugar',
  'شوگر کم': 'hypoglycemia low sugar',
  'شوگر گر': 'hypoglycemia low sugar',
  bp: 'hypertension blood pressure high bp',
  'high bp': 'hypertension blood pressure high bp',
  // infectious & skin conditions
  khujli: 'scabies khujli',
  khasra: 'measles khasra',
  zukaam: 'covid flu zukaam',
  'sore throat': 'sore throat gala kharab',
  'gala kharab': 'sore throat gala kharab',
  'eye flu': 'conjunctivitis eye flu red eyes',
  'red eyes': 'conjunctivitis eye flu red eyes',
  'pink eye': 'conjunctivitis eye flu red eyes',
  'surkh aankhein': 'conjunctivitis eye flu red eyes',
  // first aid & burns
  'garam pani': 'burn burns garam pani',
  'broken bone': 'fracture broken bone haddi toot',
  'haddi toot': 'fracture broken bone haddi toot',
  mirgi: 'seizure fits dora mirgi',
  faalij: 'stroke faalij',
  falij: 'stroke faalij',
  paralysis: 'stroke faalij paralysis',
  // body-part colloquialisms → canonical tags for retrieval
  belly: 'stomach abdominal',
  tummy: 'stomach abdominal',
  gut: 'stomach abdominal',
  // gastrointestinal, metabolic & renal additions
  bawaseer: 'hemorrhoids piles bawaseer',
  bawasir: 'hemorrhoids piles bawaseer',
  bawaser: 'hemorrhoids piles bawaseer',
  piles: 'hemorrhoids piles bawaseer',
  yarqan: 'jaundice yarqan peeliya',
  yerqan: 'jaundice yarqan peeliya',
  peeliya: 'jaundice yarqan peeliya',
  peelia: 'jaundice yarqan peeliya',
  jaundice: 'jaundice yarqan peeliya',
  'gurde ki pathri': 'kidney stones gurde ki pathri renal stone',
  'gurde me pathri': 'kidney stones gurde ki pathri renal stone',
  'gurdy me pathri': 'kidney stones gurde ki pathri renal stone',
  'pitte ki pathri': 'gallstones pitte ki pathri cholecystitis',
  'pitta pathri': 'gallstones pitte ki pathri cholecystitis',
  'pitte me pathri': 'gallstones pitte ki pathri cholecystitis',
  sinusitis: 'sinusitis sinus infection sinus dard',
  'sinus dard': 'sinusitis sinus infection sinus dard',
  sinus: 'sinusitis sinus infection sinus dard',
  chambal: 'eczema chambal dermatitis',
  eczema: 'eczema chambal dermatitis',
  'uric acid': 'gout uric acid naqras',
  naqras: 'gout uric acid naqras',
  'munh ke chhale': 'mouth ulcers munh ke chhale canker sores',
  'munh me chhale': 'mouth ulcers munh ke chhale canker sores',
  'muh ke chhale': 'mouth ulcers munh ke chhale canker sores',
  chhale: 'mouth ulcers munh ke chhale canker sores',
  'loo lagna': 'heatstroke loo lagna heat exhaustion',
  'loo lag gayi': 'heatstroke loo lagna heat exhaustion',
  'bijli ka current': 'electric shock bijli ka current',
  'current lagna': 'electric shock bijli ka current',
  'electric shock': 'electric shock bijli ka current',
  daad: 'fungal infection ringworm daad',
  ringworm: 'fungal infection ringworm daad',
  'keel muhasay': 'acne keel muhasay pimples',
  pimples: 'acne keel muhasay pimples',
  acne: 'acne keel muhasay pimples',
  cholesterol: 'cholesterol hyperlipidemia chiknai',
  chiknai: 'cholesterol hyperlipidemia chiknai',
  haiza: 'cholera haiza dehydration',
  cholera: 'cholera haiza dehydration',
  'lakra kakra': 'chickenpox lakra kakra varicella',
  chickenpox: 'chickenpox lakra kakra varicella',
  'bawla kutta': 'rabies bawla kutta dog bite',
  rabies: 'rabies bawla kutta dog bite',
  nakseer: 'nosebleed epistaxis nakseer',
  nosebleed: 'nosebleed epistaxis nakseer',
  tonsils: 'tonsillitis tonsils galay ke tonsils',
  tonsillitis: 'tonsillitis tonsils galay ke tonsils',
  cheenk: 'allergic rhinitis dust allergy cheenk',
  cheenkay: 'allergic rhinitis dust allergy cheenk',
  'dust allergy': 'allergic rhinitis dust allergy cheenk',
  'ghutno ka dard': 'osteoarthritis knee pain ghutno ka dard',
  moch: 'sprain moch strain',
  sprain: 'sprain moch strain',
  'gardan me dard': 'neck pain gardan me dard neck strain',
  'gardan ka dard': 'neck pain gardan me dard neck strain',
  'neend na aana': 'insomnia neend na aana',
  insomnia: 'insomnia neend na aana',
  ghabrahat: 'panic attack anxiety ghabrahat',
  'panic attack': 'panic attack anxiety ghabrahat',
  chakkar: 'vertigo dizziness chakkar',
  vertigo: 'vertigo dizziness chakkar',
  masoorhay: 'gingivitis gum bleeding masoorhay',
  'diaper rash': 'diaper rash diaper ke danay',
  colic: 'infant colic bachay ke pet me dard',
  ulcer: 'peptic ulcer meday ka ulcer',
  'meday ka ulcer': 'peptic ulcer meday ka ulcer',
  ibs: 'ibs irritable bowel pait maror',
  'pait maror': 'ibs irritable bowel pait maror',
  prostate: 'prostate bph peshab me rukawat',
  'wiladat ke baad': 'postpartum wiladat ke baad',
  postpartum: 'postpartum wiladat ke baad',
  // 20 clinical domains expanded synonyms
  pcos: 'pcos polycystic ovary pcod irregular periods پی سی او ایس',
  pcod: 'pcos polycystic ovary pcod',
  'polycystic ovary': 'pcos polycystic ovary pcod',
  thalassemia: 'thalassemia thalassemia trait thalassemia major تھیلیسیمیا',
  thalasemia: 'thalassemia thalassemia trait',
  bph: 'prostate bph peshab me rukawat gadood پروسٹیٹ',
  gadood: 'prostate bph peshab me rukawat gadood',
  leishmaniasis: 'leishmaniasis sal dana kal dana sandfly سال دانہ',
  'sal dana': 'leishmaniasis sal dana kal dana',
  'kal dana': 'leishmaniasis sal dana kal dana',
  motia: 'cataract motia safaid motia سفید موتیا',
  motiya: 'cataract motia safaid motia',
  'safaid motia': 'cataract motia safaid motia',
  cataract: 'cataract motia safaid motia',
  cataracts: 'cataract motia safaid motia',
  glaucoma: 'glaucoma kaala motia کالا موتیا',
  'kaala motia': 'glaucoma kaala motia',
  dvt: 'dvt deep vein thrombosis pindli me sujan ڈی وی ٹی',
  'deep vein thrombosis': 'dvt deep vein thrombosis pindli me sujan',
  copd: 'copd chronic bronchitis purani khansi سی او پی ڈی',
  emphysema: 'copd chronic bronchitis emphysema',
  dementia: 'dementia alzheimers yaaddasht bhoolne ki bimari ڈیمینشیا',
  alzheimers: 'dementia alzheimers bhoolne ki bimari',
  anaphylaxis: 'anaphylaxis severe allergy epipen شدید الرجی',
  'severe allergy': 'anaphylaxis severe allergy',
  'scorpion sting': 'scorpion sting bichhoo ka dang بچھو کا ڈنک',
  'bichhoo ka dang': 'scorpion sting bichhoo ka dang',
  bichhoo: 'scorpion sting bichhoo ka dang',
  'pesticide poisoning': 'pesticide poisoning keeray mar dawa organophosphate کیڑے مار دوا',
  'keeray mar dawa': 'pesticide poisoning keeray mar dawa',
  'acid ingestion': 'acid ingestion tezaab peena caustic soda تیزاب پینا',
  'tezaab peena': 'acid ingestion tezaab peena',
  tezaab: 'acid ingestion tezaab peena',
  'carbon monoxide': 'carbon monoxide geyser gas geyser ka dhuwan کاربن مونو آکسائیڈ',
  'geyser gas': 'carbon monoxide geyser gas geyser ka dhuwan',
  'geyser ka dhuwan': 'carbon monoxide geyser gas geyser ka dhuwan',
  'geyser dhuwan': 'carbon monoxide geyser gas geyser ka dhuwan',
  'koyle ka dhuwan': 'carbon monoxide geyser gas koyle ka dhuwan',
  'bed sores': 'bed sores bedsores pressure ulcers bistar ke zakhm بستر کے زخم',
  bedsores: 'bed sores bedsores pressure ulcers bistar ke zakhm',
  'bistar ke zakham': 'bed sores bedsores pressure ulcers bistar ke zakhm',
  'bistar ke zakhm': 'bed sores bedsores pressure ulcers bistar ke zakhm',
  'cervical spondylosis': 'neck pain gardan me dard cervical spondylosis',
  'cervical pain': 'neck pain gardan me dard cervical spondylosis',
  'knee pain': 'osteoarthritis knee pain ghutno ka dard',
  'rheumatoid arthritis': 'rheumatoid arthritis gathiya joron ki sozish گٹھیا',
  gathiya: 'rheumatoid arthritis gathiya joron ki sozish',
  gathia: 'rheumatoid arthritis gathiya joron ki sozish',
  'frozen shoulder': 'frozen shoulder kandha jam adhesive capsulitis',
  'kandha jam': 'frozen shoulder kandha jam',
  'carpal tunnel': 'carpal tunnel kalaai me dard haath sunn',
  psoriasis: 'psoriasis silvery scales chandi jaise chhilkay پسوریاسس',
  melasma: 'melasma jhainiyan chhayian chehre ke daagh جھائیاں',
  jhainiyan: 'melasma jhainiyan chhayian',
  chhayian: 'melasma jhainiyan chhayian',
  cellulitis: 'cellulitis spreading redness jild infection سیلولائٹس',
  warts: 'warts masse mohkay مسے',
  masse: 'warts masse mohkay',
  mohkay: 'warts masse mohkay',
  ckd: 'ckd chronic kidney disease creatinine renal failure گردے کی بیماری',
  'kidney failure': 'ckd chronic kidney disease creatinine',
  creatinine: 'ckd chronic kidney disease creatinine',
  hematuria: 'hematuria blood in urine peshab me khoon پیشاب میں خون',
  'blood in urine': 'hematuria blood in urine peshab me khoon',
  'peshab me khoon': 'hematuria blood in urine peshab me khoon',
  hydrocele: 'hydrocele fauton me sujan scrotal swelling فوطوں میں سوجن',
  'morning sickness': 'morning sickness hamal me ulti pregnancy nausea حمل میں الٹی',
  'hamal me ulti': 'morning sickness hamal me ulti',
  preeclampsia: 'preeclampsia hamal me bp high bp pregnancy پری ایکلیمپسیا',
  'gestational diabetes': 'gestational diabetes hamal ki sugar gdm حمل کی شوگر',
  'hamal ki sugar': 'gestational diabetes hamal ki sugar',
  'ectopic pregnancy': 'ectopic pregnancy tube pregnancy hamal nali me',
  'postpartum hemorrhage': 'postpartum hemorrhage pph zichgi me khoon',
  pph: 'postpartum hemorrhage pph zichgi me khoon',
  'period pain': 'dysmenorrhea period pain haiz ka dard mahwari dard حیض کا درد',
  dysmenorrhea: 'dysmenorrhea period pain haiz ka dard mahwari dard',
  'haiz ka dard': 'dysmenorrhea period pain haiz ka dard mahwari dard',
  'mahwari dard': 'dysmenorrhea period pain haiz ka dard mahwari dard',
  'vaginal candidiasis': 'vaginal candidiasis yeast infection safeed paani یسٹ انفیکشن',
  'safeed paani': 'vaginal candidiasis yeast infection safeed paani',
  'yeast infection': 'vaginal candidiasis yeast infection safeed paani',
  endometriosis: 'endometriosis chronic pelvic pain chocolate cyst اینڈومیٹریوسس',
  menopause: 'menopause hot flashes mahwari band سن یاس',
  'neonatal jaundice': 'neonatal jaundice newborn jaundice nawzaida peelia نوزائیدہ کا پیلیا',
  'nawzaida peelia': 'neonatal jaundice newborn jaundice nawzaida peelia',
  croup: 'croup barking cough stridor kuttay jaisi khansi کروپ',
  'febrile seizures': 'febrile seizures bukhar ke doray jhatkay bacha بخار کے جھٹکے',
  'bukhar ke doray': 'febrile seizures bukhar ke doray',
  rickets: 'rickets bowed legs vitamin d haddiyon ka teerha pan ریکٹس',
  malnutrition: 'malnutrition child wasting sukha pan stunting غذائی قلت',
  'sukha pan': 'malnutrition child wasting sukha pan',
  hyperglycemia: 'hyperglycemia high blood sugar dka شوگر کی زیادتی',
  hypothyroidism: 'hypothyroidism underactive thyroid thyroid ki susti تھائی رائیڈ کی سستی',
  hyperthyroidism: 'hyperthyroidism overactive thyroid thyroid ki tezi تھائی رائیڈ کی تیزی',
  'vitamin d': 'vitamin d deficiency vitamin d ki kami haddiyon me dard وٹامن ڈی کی کمی',
  'metabolic syndrome': 'metabolic syndrome abdominal obesity pait ki charbi میٹابولک سنڈروم',
  stye: 'stye chalazion anjanari guhanjani گہانجنی',
  anjanari: 'stye chalazion anjanari guhanjani',
  guhanjani: 'stye chalazion anjanari guhanjani',
  'dry eye': 'dry eye dry eye syndrome aankhon ki khushki آنکھوں کی خشکی',
  tinnitus: 'tinnitus ringing ears kaan me aawaz kaan me ghanti کان میں گھنٹیاں',
  'foreign body': 'foreign body foreign object in ear object in nose کان میں چیز ناک میں چیز',
  'dental abscess': 'dental abscess tooth abscess dant me peep دانت کا پھوڑا',
  'dant me peep': 'dental abscess tooth abscess dant me peep',
  'knocked out tooth': 'knocked out tooth dental trauma dant tootna ٹوٹا ہوا دانت',
  'oral thrush': 'oral thrush thrush munh me phaphoondi منہ میں پھپھوندی',
  bruising: 'bleeding disorder easy bruising neel parna جسم پر نیل پڑنا',
  'neel parna': 'bleeding disorder easy bruising neel parna',
  'lymph node': 'lymph node swollen glands gilti گلٹیاں',
  gilti: 'lymph node swollen glands gilti',
  gad: 'generalized anxiety gad chronic worry مسلسل فکر',
  depression: 'depression major depression shadeed udaasi mayoosi ڈپریشن',
  'postpartum depression': 'postpartum depression ppd zichgi depression زچگی کے بعد ڈپریشن',
  polypharmacy: 'polypharmacy zyada dawaiyan multiple medications بزرگوں کی ادویات',
  osteoporosis: 'osteoporosis haddiyon ki kamzori bone thinning ہڈیوں کی کمزوری',
  angina: 'angina heart pain dil ki sharyan انجائنا',
  'heart failure': 'heart failure chf congestive heart failure dil ki kamzori ہارٹ فیلئیر',
  arrhythmia: 'arrhythmia palpitations irregular heartbeat dil ki dharkan tez دل کی دھڑکن',
  'pleural pain': 'pleural pain pleurisy seene me chubhata dard پھیپھڑوں کا درد',
  gerd: 'gerd acid reflux acidity seene ki jalan tezaabiyat تیزابیت سینے کی جلن',
  'fatty liver': 'fatty liver jigar par charbi فیٹی لیور',
  'food poisoning': 'food poisoning kharab khana baasi khana فوڈ پوائزننگ',
  celiac: 'celiac celiac disease gluten wheat allergy گندم سے الرجی',
  migraine: 'migraine adhe sar ka dard aadha sar dard مائیگرین',
  epilepsy: 'epilepsy seizure fits mirgi dora مرگی دورے',
  seizure: 'seizure epilepsy fits mirgi dora مرگی دورے',
  seizures: 'seizure epilepsy fits mirgi dora مرگی دورے',
  'bells palsy': 'bells palsy bell palsy laqwa facial palsy چہرے کا فالج',
  neuropathy: 'neuropathy peripheral neuropathy paon me jalan نیوروپیتھی',
  tetanus: 'tetanus lockjaw dhanakbaad تشنج ٹٹنس',
  polio: 'polio poliomyelitis polio drops پولیو',
  'cervical strain': 'cervical spondylosis neck strain gardan ka khichao gardan ka dard گردن کا درد',
  'knee oa': 'knee oa knee osteoarthritis ghutno ka dard ghutne dard گھٹنوں کا درد',
  scabies: 'scabies scabies rash kharish raat ki kharish خارش اسکبیز',
  urticaria: 'urticaria hives pitti danay khujli پتی چھپاکی',
  uti: 'uti urinary infection burning urination peshab me jalan پیشاب میں جلن',
  'antenatal care': 'antenatal care anc schedule pregnancy checkup hamal ke checkup دوران حمل معائنہ',
  'anc schedule': 'antenatal care anc schedule pregnancy checkup hamal ke checkup دوران حمل معائنہ',
  'anemia in women': 'anemia in women khawateen me khoon ki kami',
  'anemia women': 'anemia in women khawateen me khoon ki kami',
  'eye injury': 'eye injury chemical splash aankh me chot',
  'eye trauma': 'eye injury eye trauma aankh me chot',
  chestpain: 'chest pain seene me dard dil ka dard سینے میں درد',
  'chest pain': 'chest pain seene me dard dil ka dard سینے میں درد',
  'falls in elderly': 'falls in elderly bazurgon me girna بزرگوں میں گرنا',
  'falls elderly': 'falls in elderly bazurgon me girna بزرگوں میں گرنا',
  'bazurgon me girna': 'falls in elderly bazurgon me girna',
  'fell down': 'falls in elderly bazurgon me girna falls elderly',
  'fall down': 'falls in elderly bazurgon me girna falls elderly',
  'gir gaya': 'falls in elderly bazurgon me girna falls elderly',
  'gir gaye': 'falls in elderly bazurgon me girna falls elderly',
  'gir jana': 'falls in elderly bazurgon me girna falls elderly',
  'elderly fall': 'falls in elderly bazurgon me girna falls elderly',
  'barking cough': 'croup croup stridor barking cough kuttay jaisi khansi',
  'kuttay jaisi khansi': 'croup croup stridor barking cough',
  peep: 'pus ear infection kaan behna otitis media',
  'kaan me infection': 'otitis media middle ear infection ear infection kaan ka infection',
  'kaan ka dard': 'earache ear pain kaan dard',
  'zehni dabao': 'mental health anxiety depression zehni dabao',
  'zehni sehat': 'mental health anxiety depression',
  'bachon me waqfa': 'family planning birth spacing bachon me waqfa',
  'birth spacing': 'family planning birth spacing bachon me waqfa',
  'aag se jalna': 'burns burn first aid aag se jalna',
  'jalne ke zakhm': 'burns burn first aid aag se jalna',
  'aankh me chemical': 'eye injury chemical splash aankh me chot',
  'aankh ki chot': 'eye injury chemical splash aankh me chot',
  'gala dard': 'sore throat gala kharab galay ka dard',
  'galay ka dard': 'sore throat gala kharab galay ka dard',
  'sar ki chot': 'head injury concussion sar ki chot',
  'sar par chot': 'head injury concussion sar ki chot',
  'teekay ke asraat': 'vaccine side effects teeka bukhar ٹیکے کے بعد بخار',
  'vaccine reactions': 'vaccine side effects teeka bukhar',
  'roza sugar': 'diabetes ramadan fasting roza sugar',
  'roze me sugar': 'diabetes ramadan fasting roza sugar',
  'epi schedule': 'epi schedule vaccination schedule hifazati teekay حفاظتی ٹیکے',
  conjunctivitis: 'conjunctivitis pink eye eye flu aankh aana آنکھ آنا آشوب چشم',
  'otitis media': 'otitis media middle ear infection ear infection kaan ka infection کان کا انفیکشن',
  choking: 'choking heimlich gale me phansna dam ghutna گلے میں پھنسنا',
  cpr: 'cpr chest compressions artificial respiration مصنوعی سانس سی پی آر',
  snakebite: 'snakebite saanp ka katna saanp ka zeher سانپ کا کاٹنا',
};

/**
 * Expand a raw user query with canonical tag words for misspellings/synonyms using strict token boundaries.
 */
export function expandQuerySynonyms(text: string): string {
  const norm = normalizeText(text);
  const tokens = new Set(tokenizeText(norm));
  const additions: string[] = [];

  for (const [syn, canon] of Object.entries(QUERY_SYNONYMS)) {
    const synNorm = normalizeText(syn);
    if (!synNorm) continue;
    if (synNorm.includes(' ')) {
      if (hasTokenBoundaryMatch(norm, synNorm)) {
        if (!hasTokenBoundaryMatch(norm, canon)) {
          additions.push(canon);
        }
      }
    } else if (tokens.has(synNorm)) {
      if (!hasTokenBoundaryMatch(norm, canon)) {
        additions.push(canon);
      }
    }
  }

  return additions.length > 0 ? `${norm} ${additions.join(' ')}` : norm;
}

const STOP_WORDS = new Set([
  'in', 'on', 'of', 'the', 'a', 'an', 'and', 'for', 'with', 'to', 'from', 'by', 'at', 'is', 'are', 'was', 'were', 'or', 'its', 'it', 'as',
  'ka', 'ki', 'ke', 'ko', 'me', 'mein', 'se', 'par', 'aur', 'ya', 'hai', 'hain', 'ho', 'tha', 'thi', 'the', 'kya', 'wali', 'wale', 'wala', 'baad', 'pehle', 'kuch', 'bhi',
  'کا', 'کی', 'کے', 'کو', 'میں', 'سے', 'پر', 'اور', 'یا', 'ہے', 'ہیں', 'ہو', 'تھا', 'تھی', 'تھے', 'کیا', 'والی', 'والے', 'والا', 'بعد', 'پہلے', 'کچھ', 'بھی'
]);

/**
 * Calibrated RAG confidence retrieval with token-boundary matching and minimum confidence threshold.
 */
export function retrieveCorpus(
  query: string,
  topK = 5,
  minScore = MIN_CORPUS_SCORE_THRESHOLD
): RetrievalHit[] {
  const rawClauses = splitIntoClauses(query);
  const affirmativeClauses: string[] = [];
  for (const rc of rawClauses) {
    const normC = normalizeText(rc);
    if (!normC) continue;
    if (CLAUSE_NEGATION_RE.test(normC) || PRE_NEGATION_RE.test(normC) || POST_NEGATION_RE.test(normC)) {
      continue;
    }
    affirmativeClauses.push(normC);
  }

  const queryText = affirmativeClauses.length > 0 ? affirmativeClauses.join(' ') : normalizeText(query);
  const unexpandedTokens = Array.from(new Set(tokenizeText(queryText)));
  const expandedText = expandQuerySynonyms(queryText);
  const queryTokens = new Set(tokenizeText(expandedText));
  const hits: RetrievalHit[] = [];

  for (const item of CORPUS) {
    let score = 0;
    const matchedSourceWords = new Set<string>();

    // 1. Direct Tag Matching
    for (const tag of item.tags) {
      const normTag = normalizeText(tag);
      if (!normTag) continue;

      if (normTag.includes(' ')) {
        if (hasTokenBoundaryMatch(expandedText, normTag)) {
          score += 4.0;
        } else if (affirmativeClauses.length > 0) {
          const tagTokens = tokenizeText(normTag).filter((t) => !STOP_WORDS.has(t));
          if (tagTokens.length > 0) {
            for (const clause of affirmativeClauses) {
              const clauseTokens = new Set(tokenizeText(clause));
              const matchedCount = tagTokens.filter((t) => clauseTokens.has(t)).length;
              if (matchedCount === tagTokens.length) {
                score += 3.0;
                break;
              } else if (matchedCount >= 2 && matchedCount >= tagTokens.length * 0.65) {
                score += 2.0;
                break;
              }
            }
          }
        }
      } else {
        if (queryTokens.has(normTag)) {
          for (const w of unexpandedTokens) {
            if (w === normTag || expandQuerySynonyms(w).split(' ').includes(normTag)) {
              if (!matchedSourceWords.has(w)) {
                matchedSourceWords.add(w);
                score += 2.5;
              }
            }
          }
        }
      }
    }

    // 2. Title & Topic Metadata Matching
    const titleCandidates = [item.title.en, item.title.ur, item.title.roman, item.topic, item.id];
    for (const cand of titleCandidates) {
      if (!cand) continue;
      const normCand = normalizeText(cand);
      if (!normCand) continue;

      if (hasTokenBoundaryMatch(expandedText, normCand)) {
        score += 5.0;
      } else {
        const candTokens = tokenizeText(normCand).filter((t) => !STOP_WORDS.has(t));
        if (candTokens.length >= 1) {
          const overallMatchedCount = candTokens.filter((t) => queryTokens.has(t)).length;
          if (overallMatchedCount === candTokens.length) {
            score += 4.5;
          } else if (overallMatchedCount >= 2 && overallMatchedCount >= candTokens.length * 0.5) {
            score += 3.0;
          } else if (affirmativeClauses.length > 0) {
            for (const clause of affirmativeClauses) {
              const clauseTokens = new Set(tokenizeText(clause));
              const matchedCount = candTokens.filter((t) => clauseTokens.has(t)).length;
              if (matchedCount === candTokens.length) {
                score += 3.5;
                break;
              } else if (matchedCount >= 2 && matchedCount >= candTokens.length * 0.5) {
                score += 2.5;
                break;
              }
            }
          }
        }
      }
    }

    if (score >= minScore) {
      hits.push({ item, score });
    }
  }

  // 3. Algorithmic Fuzzy Fallback (sub-1ms Levenshtein matching for typos)
  if (hits.length === 0) {
    const fuzzy = fuzzyFindMedicalConcept(query);
    if (fuzzy) {
      for (const item of CORPUS) {
        const matchesCanonical =
          item.topic.toLowerCase().includes(fuzzy.canonical) ||
          item.id.toLowerCase().includes(fuzzy.canonical) ||
          item.tags.some((t) => t.toLowerCase().includes(fuzzy.canonical) || t.toLowerCase().includes(fuzzy.matchedAlias));
        if (matchesCanonical) {
          hits.push({ item, score: 3.5 * fuzzy.similarity });
        }
      }
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, topK);
}

// ------------------------------------------------------------
// Offline engine: deterministic local response builder
// (mirrors what the server would do, without any LLM)
// ------------------------------------------------------------

export interface OfflineResponse {
  content: string;
  triage: TriageResult;
  citations: { id: string; title: string; publisher: string; url: string }[];
  emergencyCategory?: string;
}

/** honest publisher → real organization URL (never a fabricated deep link) */
const PUBLISHER_URLS: [RegExp, string][] = [
  [/^who\b|^who\s|world health/i, 'https://www.who.int'],
  [/^ifrc|international federation/i, 'https://www.ifrc.org'],
  [/^unicef/i, 'https://www.unicef.org'],
  [/^idf|international diabetes/i, 'https://www.idf.org'],
  [/^fast/i, 'https://www.stroke.org'],
  [/^umang/i, 'https://www.umangpk.org'],
  [/pakistan|monhsrc/i, 'https://www.nhsrc.gov.pk'],
];

/** honest publisher → real organization URL (shared with the server pipeline) */
export function publisherUrlFor(source: string): string {
  for (const [re, url] of PUBLISHER_URLS) {
    if (re.test(source)) return url;
  }
  return '';
}

const OFFLINE_MED_REFUSAL: Record<Lang, (drugs: string[]) => string> = {
  en: (drugs) =>
    `**Medication decisions need a professional**\n\nI cannot recommend ${drugs.length ? `which medicine (${drugs.join(', ')})` : 'a medicine'} or what dose — the right choice depends on your health, other medicines and personal factors, and must come from a doctor or pharmacist who can examine you.\n\n• Take medicines only as they were prescribed for you\n• Never start, stop or change a dose on your own\n• A pharmacist can advise on safe general use\n\nIf you feel worse after taking any medicine, contact a doctor or call 1166 (Health Helpline) today.`,
  ur: (drugs) =>
    `**دوا کا فیصلہ ماہر کی ضرورت**\n\nمیں تجویز نہیں کر سکتا کہ کون سی دوا (${drugs.join('، ')}) اور کتنی خوراک — صحیح انتخاب آپ کی صحت، دیگر ادویات اور ذاتی امور پر منحصر ہے، اور یہ صرف ڈاکٹر یا فارماسسٹ ہی کر سکتا ہے۔\n\n• دوا صرف اسی طرح لیں جیسے آپ کے لیے تجویز ہوئی\n• اپنی مرضی سے دوا شروع، بند یا بدلیں نہیں\n• عمومی محفوظ استعمال کے لیے فارماسسٹ سے پوچھیں\n\nکوئی دوا لینے کے بعد تکلیف بڑھے تو ڈاکٹر سے رابطہ کریں یا آج 1166 (ہیلتھ ہیلپ لائن) پر کال کریں۔`,
  roman: (drugs) =>
    `**Dawa ka faisla mahir ki zaroorat**\n\nMain tajweez nahin kar sakta ke kaun si dawa (${drugs.join(', ')}) aur kitni khoraak — sahi intikhab aap ki sehat, doosri adwiyat aur zaati umoor par munhasir hai, aur yeh sirf doctor ya pharmacist hi kar sakta hai.\n\n• Dawa sirf usi tarah lein jaisi aap ke liye tayweez hui\n• Apni marzi se dawa shuru, band ya badlein nahin\n• Aam mehfooz istemal ke liye pharmacist se poochein\n\nKoi dawa lene ke baad takleef barhay to doctor se raabta karein ya aaj 1166 (Health Helpline) par call karein.`,
};

const OFFLINE_CLARIFY_HEADER: Record<Lang, string> = {
  en: '**I want to help you safely**\n\nI do not have enough information yet to guide you. Please tell me:',
  ur: '**میں آپ کی محفوظ مدد کرنا چاہتا ہوں**\n\nرہنمائی کے لیے میرے پاس ابھی کافی معلومات نہیں ہیں۔ براہِ کرم بتائیں:',
  roman: '**Main aap ki mehfooz madad karna chahta hoon**\n\nRehnumai ke liye mere paas abhi kaafi maloomat nahin hain. Barah-e-karam batayein:',
};

const OFFLINE_CLARIFY_FOOTER: Record<Lang, string> = {
  en: 'If there is chest pain, trouble breathing, heavy bleeding, a seizure, or someone cannot be woken — call 1122 (Rescue) immediately.',
  ur: 'اگر سینے میں درد، سانس لینے میں مشکل، بھاری خون بہنا، دورہ، یا کسی کو جگایا نہ جا سکے — فوراً 1122 (ریسکیو) پر کال کریں۔',
  roman: 'Agar seene mein dard, saans lene mein mushkil, bhaari khoon behna, dora, ya kisi ko jagaya na ja sake — fori tor par 1122 (Rescue) par call karein.',
};

export interface MessageHistoryItem {
  role: string;
  content: string;
}

export function runOfflineEngine(
  query: string,
  lang?: Lang,
  history?: MessageHistoryItem[]
): OfflineResponse {
  const language = lang ?? detectLanguage(query).language;
  const triage = runL0Triage(query, language);
  const ctx = triage.context;

  if (triage.shortCircuited && triage.matchedCategory) {
    const tpl = getEmergencyTemplate(triage.matchedCategory);
    if (tpl) {
      const lines: string[] = [];
      lines.push(`**${tpl.title[language]}**`);
      lines.push('');
      lines.push(tpl.reasonIntro[language]);
      lines.push('');
      lines.push(language === 'ur' ? 'فوری اقدام:' : language === 'roman' ? 'Fori iqdam:' : 'Immediate actions:');
      tpl.immediateActions.forEach((a) => lines.push(`• ${a[language]}`));
      lines.push('');
      lines.push(language === 'ur' ? 'نہ کریں:' : language === 'roman' ? 'Na karein:' : 'Do NOT:');
      tpl.doNot.forEach((d) => lines.push(`• ${d[language]}`));
      lines.push('');
      lines.push(language === 'ur' ? '📞 فوراً کال کریں: 1122 (ریسکیو) یا 1023 (الخدمت ایمبولینس)' : language === 'roman' ? '📞 Fori call karein: 1122 (Rescue) ya 1023 (Alkhidmat Ambulance)' : '📞 Call now: 1122 (Rescue) or 1023 (Alkhidmat Ambulance)');
      return {
        content: lines.join('\n'),
        triage,
        citations: tpl.sources.map((s, i) => ({ id: `tpl-${i}`, title: s, publisher: s.split('—')[0].trim(), url: publisherUrlFor(s) })),
        emergencyCategory: triage.matchedCategory,
      };
    }
  }

  // Medication prescribing request → deterministic refusal (offline, no LLM)
  if (ctx?.medications?.intent === 'PRESCRIBING') {
    const drugs = ctx.medications.drugs.filter((d) => d !== 'generic-medicine');
    const lines = [OFFLINE_MED_REFUSAL[language](drugs), ''];
    const label =
      language === 'ur'
        ? '_آف لائن رہنمائی — تصدیق شدہ پیک، ای آئی چیٹ نہیں۔_'
        : language === 'roman'
          ? '_Offline guidance — verified pack, not AI chat._'
          : '_Offline guidance — verified pack, not AI chat._';
    lines.push(label);
    return { content: lines.join('\n'), triage, citations: [] };
  }

  // Insufficient information → deterministic clarification, never false reassurance
  if (triage.needsClarification && triage.clarificationReasons && triage.clarificationReasons.length > 0) {
    const lines = [OFFLINE_CLARIFY_HEADER[language], ''];
    const seen = new Set<string>();
    for (const reason of triage.clarificationReasons) {
      const qs = CLARIFICATION_QUESTIONS[reason];
      if (!qs) continue;
      for (const q of qs) {
        if (seen.has(q.en)) continue;
        seen.add(q.en);
        lines.push(`• ${q[language]}`);
      }
    }
    lines.push('');
    lines.push(OFFLINE_CLARIFY_FOOTER[language]);
    lines.push('');
    const label =
      language === 'ur'
        ? '_آف لائن رہنمائی — تصدیق شدہ پیک، ای آئی چیٹ نہیں۔_'
        : language === 'roman'
          ? '_Offline guidance — verified pack, not AI chat._'
          : '_Offline guidance — verified pack, not AI chat._';
    lines.push(label);
    return { content: lines.join('\n'), triage, citations: [] };
  }

  // Non-emergency: retrieve pack content
  let retrievals = retrieveCorpus(query, 3);
  const lines: string[] = [];

  // Multi-Turn Context Inheritance for Offline Follow-up queries & Quick Action Chips
  // (e.g. "What are the danger signs to watch for?", "How can I treat and prevent this at home?", "When should I see a doctor for this?")
  const isGenericFollowUp =
    /^(what are the danger signs|danger signs|khatray ki alamaat|khatra|when should i see a doctor|when to see|doctor ko kab|how can i treat|treat and prevent|home care|home remedies|gharelu ilaj|what should i do|is this an emergency|kya yeh emergency|ye doctor ko kab|gardan|sar|pait)/i.test(query.trim()) ||
    (/(danger signs|warning signs|when to see a doctor|doctor ko|home care|home remedies|treat and prevent|dekh bhaal|bachao|parhez|ehtiyat|khatray|kya karoon|what to do|what are the danger)/i.test(query) && !/(pregnancy|pregnant|maternal|hamal|newborn|baby|neonate|bacha|paidaish)/i.test(query));

  const isFollowUp = isGenericFollowUp || /(prevent|prevention|precaution|precautions|precautionary|danger signs|warning signs|emergency signs|emergency|danger|warning|red flag|signs|symptoms|alamaat|see a doctor|doctor ko|consult|hospital|dawa|medicine|medication|home care|home remedies|remedies|remedy|treat|treating|treatment|cure|manage|management|steps|tips|guide|guidance|what to do|what should i do|totkay|gharelu|ilaj|ilaaj|when to see|kya karoon|kya karein|bachao|parhez|ehtiyat|khatray|khatra|dekh bhaal|dekhbhal|dekh bhal|tareeqay|tadbeer|diet|khana|feed|feeding|food|eat|eating|nutrition|khorak|at home|in home|tell me more|more info|more details|mazeed|mazid|گھر پر|دیکھ بھال|علاج|رہنمائی|خطرے|علامات|ڈاکٹر|ہسپتال|بچاؤ|احتیاط|طریقے|تدابیر|ٹوٹکے|کیا کریں|کیا کھانا|خوراک|مزید)/i.test(query);

  const hasSpecificMedicalConcept = !isGenericFollowUp && fuzzyFindMedicalConcept(query) !== null;

  if ((isGenericFollowUp || retrievals.length === 0 || !hasSpecificMedicalConcept) && isFollowUp && Array.isArray(history) && history.length > 0) {
    // Look backwards through user messages only (most specific user intent)
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'user') {
        const pastMsg = history[i].content;
        const pastRetrievals = retrieveCorpus(pastMsg, 2);
        if (pastRetrievals.length > 0) {
          retrievals = pastRetrievals;
          break;
        }
      }
    }
  }

  if (retrievals.length === 0) {
    lines.push(
      language === 'ur'
        ? 'آف لائن پیک میں اس سوال کا براہِ راست جواب موجود نہیں۔ مکمل رہنمائی کے لیے مخصوص علامت (جیسے بخار، کمر درد، دانت درد، الٹی) لکھیں یا نیٹ ورک آن کریں۔'
        : language === 'roman'
          ? 'Offline pack mein is sawal ka seedha jawab maujood nahin. Mukammal rahnumai ke liye makhsoos alamat (jaise bukhar, kamar dard, dant dard, ulti) likhein ya network on karein.'
          : 'The offline pack does not cover this exact question. For full guidance, mention a specific symptom (e.g. fever, backache, toothache, cough) or go online.'
    );
    return {
      content: lines.join('\n'),
      triage: { ...triage, level: triage.level === 'SELF_CARE' ? 'ROUTINE' : triage.level, engine: 'offline', reason: triageReason(triage.level === 'SELF_CARE' ? 'ROUTINE' : triage.level, language, triage.signals) },
      citations: [],
    };
  }

  // Established condition → acknowledge it explicitly before the guidance
  const established = ctx?.conditions.find((c) => c.state === 'ESTABLISHED');
  if (established) {
    lines.push(
      language === 'ur'
        ? 'آپ کی بتائی ہوئی بیماری کو تسلیم کرتے ہوئے عمومی رہنمائی حاضر ہے — اسے دوبارہ تصدیق کی ضرورت نہیں۔'
        : language === 'roman'
          ? 'Aap ki batayi hui bimari ko tasleem karte hue aam rehnumai haazir hai — ise dobara tasdeeq ki zaroorat nahin.'
          : 'Acknowledging the condition you mentioned — here is general guidance. It does not need re-confirming.'
    );
    lines.push('');
  }

  // Build grounded offline answer from pack
  for (const hit of retrievals.slice(0, 2)) {
    const item = hit.item;
    lines.push(`**${item.title[language]}**`);
    lines.push('');

    // If query asks for specific danger signs or when to see doctor, emphasize those lines
    const rawContent = item.content[language];
    const isDangerInquiry = /(danger|warning|emergency|khatra|alamate|foran|serious)/i.test(query);
    const isDoctorInquiry = /(see a doctor|doctor ko|kab dikhayein|physician|hospital)/i.test(query);

    if (isDangerInquiry || isDoctorInquiry) {
      const contentLines = rawContent.split('\n');
      const filtered = contentLines.filter((l) =>
        /SEE A DOCTOR|GO IMMEDIATELY|EMERGENCY|ڈاکٹر کو دکھائیں|فوراً جائیں|ایمرجنسی|DOCTOR KO DIKHAYEIN|FORAN JAYEIN/i.test(l) ||
        l.startsWith('•')
      );
      lines.push(filtered.length > 0 ? filtered.join('\n') : rawContent);
    } else {
      lines.push(rawContent);
    }
    lines.push('');
  }

  const offlineLabel =
    language === 'ur'
      ? '_آف لائن رہنمائی — تصدیق شدہ پیک، ای آئی چیٹ نہیں۔ مکمل جواب کے لیے نیٹ ورک آن کریں۔_'
      : language === 'roman'
        ? '_Offline guidance — verified pack, not AI chat. Turn network on for full answers._'
        : '_Offline guidance — verified pack, not AI chat. Go online for full answers._';
  lines.push(offlineLabel);

  return {
    content: lines.join('\n'),
    triage: { ...triage, engine: 'offline' },
    citations: retrievals.slice(0, 2).map((h) => ({
      id: h.item.id,
      title: h.item.source.title,
      publisher: h.item.source.publisher,
      url: h.item.source.url,
    })),
  };
}

// ============================================================
// Deterministic post-L1 triage calibration
// ------------------------------------------------------------
// Fixes documented over-triage patterns where the deterministic
// layers (or an over-cautious L1) escalate informational/mild
// presentations. Downgrade-only: every cap can only LOWER a
// severity, never raise it, and never applies when a red-flag
// pattern matched (those short-circuit to EMERGENCY earlier).
// ============================================================

export interface TriageCalibration {
  level: TriageLevel;
  signal: string;
}

const MILD_QUALIFIER = /(halka|halki|halkay|thora|thori|mild|slight|light|halka sa)/i;
const SEVERE_QUALIFIER = /(bohot|sakht|sakhtee|severe|intense|unbearable|bardasht nahin|bardasht nahi|tez|shadid|شدید|بہت)/i;
const ALARM_SIGNS = /(bukhar|fever|khoon|blood|bleeding|ulti|vomit|jalan|weight loss|wazan kam|raat ko paseena|night sweats)/i;
const BREATHING_DISTRESS = /(saans lene mein (mushkil|dushwari|dikkat)|difficulty breath|breathing difficulty|(fast|rapid|quick|tez) (breathing|saans)|breathing (fast|rapid|quick)|saans (tez|chal|phool)|stridor|neela|hont neele|blue lip|cannot speak|can't speak|nahin bol pa|saans ki awaz|grunting|shortness of breath)/i;
const HYPO_ALARM = /(behosh|unconscious|fainted|gir gaya|seizure|dora|convulsion|confus|ghabr|unresponsive|nahin hosh)/i;
const PREGNANCY_ALARM = /(bleeding|khun|khoon|dard|pain|cramp|dizziness|chakkar|vomit|ulti|fever|bukhar|swelling|sojan|fluid|pani phatna)/i;

/**
 * Post-L1 calibration caps. Returns null when no calibration applies.
 * Called AFTER L0 (which short-circuits true EMERGENCY red flags) and
 * after the L1 floors — it can only reduce severity for narrow,
 * clinically-documented patterns.
 */
export function calibrateTriage(params: {
  text: string;
  level: TriageLevel;
  informational: boolean;
  redFlagCount: number;
  child: boolean;
  pregnancy: boolean;
  hasHighDrugSeverity: boolean;
}): TriageCalibration | null {
  // never touch red-flag short-circuits or high-severity drug interactions
  if (params.redFlagCount > 0 || params.hasHighDrugSeverity) return null;

  const text = params.text;
  const downgradeIf = (target: TriageLevel, signal: string): TriageCalibration | null =>
    TRIAGE_ORDER[params.level] > TRIAGE_ORDER[target] ? { level: target, signal } : null;

  // 1) Pregnancy + informational question:
  //    - asking ABOUT danger signs / warning signs = health education → ROUTINE
  //    - asking for self-care advice (e.g. "what foods should I eat?") → SELF_CARE
  //    Neither applies when alarm signs are present.
  if (
    params.informational &&
    params.pregnancy &&
    !PREGNANCY_ALARM.test(text) &&
    !SEVERE_QUALIFIER.test(text)
  ) {
    if (/(danger signs|warning signs|signs of|alamaat|alamaat|khatra|khatray|when (to see|should)|kab (milna|doctor)|kis doctor|خطرے|خطرہ|اشارے|علامات|کب ڈاکٹر)/i.test(text)) {
      return downgradeIf('ROUTINE', 'calibration:pregnancy-education');
    }
    return downgradeIf('SELF_CARE', 'calibration:pregnancy-informational');
  }

  // 2) Mild abdominal pain (e.g. "halka pet dard") with no severe qualifier,
  //    fever, blood or vomiting → self-care with worsening advice.
  if (
    MILD_QUALIFIER.test(text) &&
    /(pet|maeda|stomach|tummy|abdomen|abdominal|dard|pain)/i.test(text) &&
    !SEVERE_QUALIFIER.test(text) &&
    !ALARM_SIGNS.test(text)
  ) {
    return downgradeIf('SELF_CARE', 'calibration:mild-abdominal-pain');
  }

  // 3) Child night cough / wheeze WITHOUT breathing distress, high fever or
  //    alarum terms → routine follow-up (asthma evaluation), not urgent.
  if (
    params.child &&
    /(khansi|cough|seeti|wheeze|whistl)/i.test(text) &&
    !BREATHING_DISTRESS.test(text) &&
    !SEVERE_QUALIFIER.test(text) &&
    !ALARM_SIGNS.test(text)
  ) {
    return downgradeIf('ROUTINE', 'calibration:child-cough');
  }

  // 4) Conscious hypoglycemia (low sugar + shakiness/sweating) without
  //    unconsciousness, seizure or confusion → urgent same-day care,
  //    not emergency (emergency is for unconscious/seizing patients).
  //    Non-null even at URGENT so the L1 emergency escalation path is blocked.
  if (
    /(sugar|glucose)/i.test(text) &&
    /(kam|low|very low|gir rahi|drop)/i.test(text) &&
    !HYPO_ALARM.test(text)
  ) {
    return downgradeIf('URGENT', 'calibration:hypoglycemia-conscious');
  }

  return null;
}
