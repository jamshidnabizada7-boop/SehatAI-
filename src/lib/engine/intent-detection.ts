// ============================================================
// SehatAI — Conversational Intent Detection (pre-L0)
// Detects non-medical intents (greetings, farewells, gratitude,
// wellness checks) and conversation flow intents (follow-ups,
// repeats) BEFORE the clinical triage pipeline runs.
//
// Pure TypeScript, zero dependencies, trilingual
// (English / Urdu script / Roman Urdu).
// ============================================================

import type { Lang } from '@/lib/types';

export type ConversationalIntent =
  | 'greeting'
  | 'farewell'
  | 'gratitude'
  | 'wellness_check'
  | 'follow_up'
  | 'repeat'
  | 'health_query';

export interface IntentResult {
  intent: ConversationalIntent;
  confidence: number;
  /** For follow_up: the inferred topic from history */
  topicFromHistory?: string;
  /** For repeat: the index of the matching prior message */
  repeatIndex?: number;
}

// ── Greeting patterns (EN, Roman Urdu, Urdu) ──

const GREETING_PATTERNS: RegExp[] = [
  /^\s*(hi|hello|hey|hiya|good\s+(morning|afternoon|evening|day)|howdy|sup|what'?s?\s*up)\s*[!.?]*\s*$/i,
  /^\s*(hi|hello|hey)\s+(there|sehatai|sehat\s*ai)\s*[!.?]*\s*$/i,
  /^\s*(salam|assalam\s*o?\s*alaikum|aoa|slm|asalaam\s*o?\s*alaikum|slam\s*alaikum)\s*[!.?]*\s*$/i,
  /^\s*(kia\s+hal\s+hai|kya\s+haal\s+hai|kese\s+ho|kaisa\s+hai|sab\s+theek)\s*[!.?]*\s*$/i,
  /^\s*(السلام\s*و?\s*علیکم|سلام|ہیلو)\s*[!؟.]*\s*$/,
];

// ── Farewell patterns ──

const FAREWELL_PATTERNS: RegExp[] = [
  /^\s*(bye|goodbye|good\s*bye|see\s+you|take\s+care|gotta\s+go|gtg)\s*[!.?]*\s*$/i,
  /^\s*(khuda\s*hafiz|allah\s*hafiz|acha\s+phir|ok\s+bye|theek\s+hai\s+bye)\s*[!.?]*\s*$/i,
  /^\s*(خدا\s*حافظ|اللہ\s*حافظ|الوداع)\s*[!؟.]*\s*$/,
];

// ── Gratitude patterns ──

const GRATITUDE_PATTERNS: RegExp[] = [
  /^\s*(thanks?|thank\s+you|ty|thx|much\s+appreciated|thanks?\s+a\s+lot)\s*[!.?]*\s*$/i,
  /^\s*(thanks?\s+(for\s+the\s+help|sehatai|so\s+much|a\s+lot))\s*[!.?]*\s*$/i,
  /^\s*(shukriya|mehrbani|bahut\s+shukriya|bohat\s+shukriya)\s*[!.?]*\s*$/i,
  /^\s*(شکریہ|بہت\s*شکریہ|مہربانی)\s*[!؟.]*\s*$/,
];

// ── Wellness check patterns (user says they're fine / no problem) ──

const WELLNESS_PATTERNS: RegExp[] = [
  /^\s*(i'?m?\s+(fine|good|ok|okay|great|well|alright|doing\s+well))\s*[!.?]*\s*$/i,
  /^\s*(no\s+(problem|issue|symptom|complaint)s?)\s*[!.?]*\s*$/i,
  /^\s*(i\s+don'?t\s+have\s+any\s*(problem|issue|symptom|complaint)s?)\s*[!.?]*\s*$/i,
  /^\s*(nothing\s+(is\s+)?wrong|everything\s+(is\s+)?(fine|ok|good))\s*[!.?]*\s*$/i,
  /^\s*(i'?m?\s+not\s+sick|i\s+feel\s+(fine|good|ok|great|normal))\s*[!.?]*\s*$/i,
  /^\s*(no\s+i\s+don'?t\s+have\s+any\s+symptom)\s*[!.?]*\s*$/i,
  /^\s*(no\s+i\s+(am|'?m)\s+(fine|ok|good|well|alright))\s*[!.?]*\s*$/i,
  /^\s*(main\s+theek\s+hoon?|sab\s+theek\s+hai|koi\s+masla\s+nahin?|mujhe\s+koi\s+(?:problem|masla|takleef)\s+nahin?)\s*[!.?]*\s*$/i,
  /^\s*(main\s+bilkul\s+theek\s+hoon?|kuch\s+nahin?\s+hua)\s*[!.?]*\s*$/i,
  /^\s*(میں\s*ٹھیک\s*ہوں|سب\s*ٹھیک\s*ہے|کوئی\s*مسئلہ\s*نہیں)\s*[!؟.]*\s*$/,
];

// ── Follow-up question patterns ──

const FOLLOW_UP_PATTERNS: RegExp[] = [
  /\b(how\s+(can|do|should)\s+i\s+(prevent|avoid|stop|manage|treat|handle|deal\s+with)\s+(this|it|that))\b/i,
  /\b(what\s+(causes?|triggers?|leads?\s+to)\s+(this|it|that|these?))\b/i,
  /\b(when\s+should\s+(i|this|we)\s+(go|see|visit|consult)\s+(a\s+)?(doctor|hospital|clinic))\b/i,
  /\b(when\s+should\s+this\s+go\s+to\s+a\s+doctor)\b/i,
  /\b(is\s+(this|it|that)\s+(serious|dangerous|normal|concerning))\b/i,
  /\b(what\s+(should|can)\s+i\s+(do|take|eat|drink|avoid))\b/i,
  /\b(can\s+(this|it)\s+(spread|be\s+cured|go\s+away|get\s+worse))\b/i,
  /\b(how\s+long\s+(will|does)\s+(this|it)\s+(last|take|continue))\b/i,
  /\b(what\s+should\s+i\s+do)\b/i,
  /\b(iska\s+ilaj\s+kya\s+hai|ye\s+kaise\s+theek\s+hoga|doctor\s+ko\s+kab\s+dikhana)\b/i,
  /\b(isse\s+kaise\s+(rokein|bachein)|ye\s+kyun\s+hota\s+hai)\b/i,
  /اس\s*کا\s*علاج|یہ\s*کیسے\s*ٹھیک|ڈاکٹر\s*کو\s*کب/,
];

// ── Warm response templates ──

export const GREETING_RESPONSES: Record<Lang, string> = {
  en: "Hello! \u{1F44B} I'm SehatAI, your health guidance assistant. How can I help you with your health today?",
  ur: '\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u06CC\u06A9\u0645! \u{1F44B} \u0645\u06CC\u06BA \u0633\u06C1\u062A \u0627\u06D2 \u0622\u0626\u06CC \u06C1\u0648\u06BA\u060C \u0622\u067E \u06A9\u0627 \u0635\u062D\u062A \u0631\u06C1\u0646\u0645\u0627 \u0645\u0639\u0627\u0648\u0646\u06D4 \u0622\u062C \u0622\u067E \u06A9\u06CC \u0635\u062D\u062A \u06A9\u06D2 \u0628\u0627\u0631\u06D2 \u0645\u06CC\u06BA \u06A9\u06CC\u0627 \u0645\u062F\u062F \u06A9\u0631 \u0633\u06A9\u062A\u0627 \u06C1\u0648\u06BA\u061F',
  roman: 'Assalam o Alaikum! \u{1F44B} Main SehatAI hoon, aap ka sehat rehnuma. Aaj aap ki sehat ke baray mein kya madad kar sakta hoon?',
};

export const FAREWELL_RESPONSES: Record<Lang, string> = {
  en: "Take care! \u{1F64F} Remember, I'm here whenever you need health guidance. Stay healthy!",
  ur: '\u0627\u067E\u0646\u0627 \u062E\u06CC\u0627\u0644 \u0631\u06A9\u06BE\u06CC\u06BA! \u{1F64F} \u06CC\u0627\u062F \u0631\u06A9\u06BE\u06CC\u06BA\u060C \u062C\u0628 \u0628\u06BE\u06CC \u0635\u062D\u062A \u06A9\u06D2 \u0628\u0627\u0631\u06D2 \u0645\u06CC\u06BA \u0631\u06C1\u0646\u0645\u0627\u0626\u06CC \u0686\u0627\u06C1\u06CC\u06BA\u060C \u0645\u06CC\u06BA \u06CC\u06C1\u0627\u06BA \u06C1\u0648\u06BA\u06D4 \u0635\u062D\u062A\u0645\u0646\u062F \u0631\u06C1\u06CC\u06BA!',
  roman: 'Apna khayal rakhein! \u{1F64F} Yaad rakhein, jab bhi sehat ke baray mein rehnumai chahein, main yahan hoon. Sehatmand rahein!',
};

export const GRATITUDE_RESPONSES: Record<Lang, string> = {
  en: "You're welcome! \u{1F60A} I'm glad I could help. If you have any more health questions in the future, don't hesitate to ask. Take care!",
  ur: '\u062E\u0648\u0634 \u0622\u0645\u062F\u06CC\u062F! \u{1F60A} \u062E\u0648\u0634\u06CC \u06C1\u0648\u0626\u06CC \u06A9\u06C1 \u0645\u062F\u062F \u06A9\u0631 \u0633\u06A9\u0627\u06D4 \u0645\u0633\u062A\u0642\u0628\u0644 \u0645\u06CC\u06BA \u06A9\u0648\u0626\u06CC \u0628\u06BE\u06CC \u0635\u062D\u062A \u06A9\u0627 \u0633\u0648\u0627\u0644 \u06C1\u0648 \u062A\u0648 \u067E\u0648\u0686\u06BE\u0646\u06D2 \u0645\u06CC\u06BA \u06C1\u0686\u06A9\u0686\u0627\u06C1\u0679 \u0646\u06C1 \u06A9\u0631\u06CC\u06BA\u06D4 \u0627\u067E\u0646\u0627 \u062E\u06CC\u0627\u0644 \u0631\u06A9\u06BE\u06CC\u06BA!',
  roman: "Khush aamdeed! \u{1F60A} Khushi hui ke madad kar saka. Mustaqbil mein koi bhi sehat ka sawal ho to poochhne mein hichkichahat na karein. Apna khayal rakhein!",
};

export const WELLNESS_RESPONSES: Record<Lang, string> = {
  en: "That's great to hear! \u{1F60A} Since you're feeling well, here are some simple tips to stay healthy:\n\n\u2022 Drink plenty of water throughout the day\n\u2022 Eat a balanced diet with fruits and vegetables\n\u2022 Get regular physical activity and good sleep\n\u2022 Wash your hands frequently\n\nIf anything ever changes or you feel unwell, I'm right here to help. Stay healthy! \u{1F4AA}",
  ur: '\u06CC\u06C1 \u0633\u0646 \u06A9\u0631 \u062E\u0648\u0634\u06CC \u06C1\u0648\u0626\u06CC! \u{1F60A} \u0686\u0648\u0646\u06A9\u06C1 \u0622\u067E \u0635\u062D\u062A\u0645\u0646\u062F \u06C1\u06CC\u06BA\u060C \u0635\u062D\u062A\u0645\u0646\u062F \u0631\u06C1\u0646\u06D2 \u06A9\u06CC \u0686\u0646\u062F \u0622\u0633\u0627\u0646 \u062A\u062C\u0627\u0648\u06CC\u0632:\n\n\u2022 \u062F\u0646 \u0628\u06BE\u0631 \u0648\u0627\u0641\u0631 \u0645\u0642\u062F\u0627\u0631 \u0645\u06CC\u06BA \u067E\u0627\u0646\u06CC \u067E\u06CC\u062A\u06D2 \u0631\u06C1\u06CC\u06BA\n\u2022 \u067E\u06BE\u0644\u0648\u06BA \u0627\u0648\u0631 \u0633\u0628\u0632\u06CC\u0648\u06BA \u06A9\u06D2 \u0633\u0627\u062A\u06BE \u0645\u062A\u0648\u0627\u0632\u0646 \u063A\u0630\u0627 \u06A9\u06BE\u0627\u0626\u06CC\u06BA\n\u2022 \u0628\u0627\u0642\u0627\u0639\u062F\u06C1 \u0648\u0631\u0632\u0634 \u06A9\u0631\u06CC\u06BA \u0627\u0648\u0631 \u0627\u0686\u06BE\u06CC \u0646\u06CC\u0646\u062F \u0644\u06CC\u06BA\n\u2022 \u0628\u0627\u0631 \u0628\u0627\u0631 \u06C1\u0627\u062A\u06BE \u062F\u06BE\u0648\u0626\u06CC\u06BA\n\n\u0627\u06AF\u0631 \u06A9\u0628\u06BE\u06CC \u0637\u0628\u06CC\u0639\u062A \u0645\u06CC\u06BA \u062A\u0628\u062F\u06CC\u0644\u06CC \u0622\u0626\u06D2\u060C \u0645\u06CC\u06BA \u06CC\u06C1\u0627\u06BA \u0622\u067E \u06A9\u06CC \u0645\u062F\u062F \u06A9\u06D2 \u0644\u06CC\u06D2 \u0645\u0648\u062C\u0648\u062F \u06C1\u0648\u06BA\u06D4 \u0635\u062D\u062A\u0645\u0646\u062F \u0631\u06C1\u06CC\u06BA! \u{1F4AA}',
  roman: "Yeh sun kar khushi hui! \u{1F60A} Choonke aap sehatmand hain, sehatmand rehne ki chand aasan tajweezein:\n\n\u2022 Din bhar wafir miqdaar mein paani peetay rahein\n\u2022 Phalon aur sabziyon ke saath mutawazin ghiza khayein\n\u2022 Baqaida warzish karein aur achhi neend lein\n\u2022 Baar baar haath dhoyein\n\nAgar kabhi tabiyat mein tabdeeli aaye, main yahan aap ki madad ke liye maujood hoon. Sehatmand rahein! \u{1F4AA}",
};

// ── Core detection functions ──

function matchesAnyPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

/** Compute simple word-overlap similarity between two strings (0-1). */
function wordOverlapSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  return (2 * overlap) / (wordsA.size + wordsB.size);
}

/** Normalize message for comparison (lowercase, strip punctuation, trim). */
function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[!?.,:;'"()\[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detect the conversational intent of a user message.
 */
export function detectIntent(
  message: string,
  priorUserMessages: string[] = [],
  priorAssistantMessages: string[] = [],
): IntentResult {
  const trimmed = message.trim();

  // Greeting
  if (matchesAnyPattern(trimmed, GREETING_PATTERNS)) {
    return { intent: 'greeting', confidence: 0.95 };
  }

  // Farewell
  if (matchesAnyPattern(trimmed, FAREWELL_PATTERNS)) {
    return { intent: 'farewell', confidence: 0.95 };
  }

  // Gratitude
  if (matchesAnyPattern(trimmed, GRATITUDE_PATTERNS)) {
    return { intent: 'gratitude', confidence: 0.95 };
  }

  // Wellness check (user says they're fine)
  if (matchesAnyPattern(trimmed, WELLNESS_PATTERNS)) {
    return { intent: 'wellness_check', confidence: 0.90 };
  }

  // Repeat detection
  if (priorUserMessages.length > 0) {
    const normCurrent = normalizeForComparison(trimmed);
    for (let i = priorUserMessages.length - 1; i >= Math.max(0, priorUserMessages.length - 3); i--) {
      const normPrior = normalizeForComparison(priorUserMessages[i]);
      if (!normPrior) continue;
      if (normCurrent === normPrior || wordOverlapSimilarity(normCurrent, normPrior) >= 0.8) {
        return { intent: 'repeat', confidence: 0.90, repeatIndex: i };
      }
    }
  }

  // Follow-up detection
  if (priorUserMessages.length > 0 && matchesAnyPattern(trimmed, FOLLOW_UP_PATTERNS)) {
    const topic = findTopicFromHistory(priorUserMessages, priorAssistantMessages);
    return {
      intent: 'follow_up',
      confidence: 0.85,
      topicFromHistory: topic ?? undefined,
    };
  }

  return { intent: 'health_query', confidence: 1.0 };
}

/**
 * Extract the active health topic from conversation history.
 */
function findTopicFromHistory(
  priorUserMessages: string[],
  _priorAssistantMessages: string[],
): string | null {
  const SYMPTOM_KEYWORDS = [
    'headache', 'head ache', 'sar dard', 'fever', 'bukhar', 'cough', 'khansi',
    'cold', 'nazla', 'sore throat', 'gala kharab', 'stomach', 'pet dard',
    'diarrhea', 'dast', 'vomiting', 'ulti', 'toothache', 'tooth', 'dant',
    'back pain', 'kamar dard', 'chest pain', 'seena', 'breathing', 'saans',
    'diabetes', 'sugar', 'blood pressure', 'pregnant', 'pregnancy', 'hamal',
    'burn', 'wound', 'zakhm', 'fracture', 'haddi', 'allergy', 'rash', 'danay',
    'asthma', 'dama', 'dengue', 'malaria', 'nausea', 'anxiety', 'depression',
    'headeach', 'headeache', 'headach',
  ];

  for (let i = priorUserMessages.length - 1; i >= 0; i--) {
    const msg = priorUserMessages[i].toLowerCase();
    for (const kw of SYMPTOM_KEYWORDS) {
      if (msg.includes(kw.toLowerCase())) {
        return kw;
      }
    }
  }

  return null;
}

/**
 * Check if a message is too short/vague to be a medical query.
 */
export function isTrivialMessage(message: string): boolean {
  const trimmed = message.trim().toLowerCase().replace(/[!?.]+$/, '').trim();
  const trivials = new Set([
    'ok', 'okay', 'yes', 'no', 'ya', 'nah', 'hmm', 'hm', 'oh',
    'ji', 'han', 'nahi', 'haan', 'nahin', 'achha', 'acha', 'thik',
  ]);
  return trivials.has(trimmed);
}
