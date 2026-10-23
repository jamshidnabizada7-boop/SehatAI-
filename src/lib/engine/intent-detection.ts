// ============================================================
// SehatAI — Conversational Intent Detection (pre-L0)
// Detects non-medical intents (greetings, farewells, gratitude,
// introductions, capabilities, guidance requests, language changes,
// wellness checks, non-medical queries) and conversation flow intents
// (follow-ups, repeats) BEFORE the clinical triage pipeline runs.
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
  | 'introduction'
  | 'capabilities'
  | 'guidance_request'
  | 'language_change'
  | 'non_medical'
  | 'user_correction'
  | 'follow_up'
  | 'repeat'
  | 'health_query';

export interface IntentResult {
  intent: ConversationalIntent;
  confidence: number;
  /** For introduction: the extracted person's name */
  extractedName?: string;
  /** For follow_up: the inferred topic from history */
  topicFromHistory?: string;
  /** For repeat: the index of the matching prior message */
  repeatIndex?: number;
  /** For language_change: the requested language target */
  requestedLanguage?: Lang;
  /** For user_correction: details on corrected statement */
  correctedDetail?: string;
}

// ── Introduction patterns (e.g. "I AM AHMAD", "Hello, my name is Sarah", "Salam, Mera naam Ali hai") ──

const INTRO_EN = /^\s*(?:(?:hi|hello|hey|salam|assalam\s*o?\s*alaikum|aoa|slm|good\s+(?:morning|afternoon|evening))\s*[,!.-]?\s*)?(?:i\s*am|i'?m|my\s+name\s+is|this\s+is|it'?s|name\s+is)\s+([A-Za-z\s'-]{2,30})\s*[.!]?$/i;
const INTRO_ROMAN = /^\s*(?:(?:hi|hello|hey|salam|assalam\s*o?\s*alaikum|aoa|slm)\s*[,!.-]?\s*)?(?:mera\s+naam|main|mera\s+nam)\s+([A-Za-z\s'-]{2,30}?)(?:\s+(?:hoon|hon|hai|ha))?\s*[.!]?$/i;
const INTRO_URDU = /^\s*(?:(?:سلام|السلام\s*علیکم|ہیلو|ہائے)\s*[,!؟.-]?\s*)?(?:میرا\s*نام|میں)\s+([\u0600-\u06FF\s]{2,30}?)(?:\s*(?:ہوں|ہے))?\s*[!؟.]*$/;

// Medical words that shouldn't be parsed as names ("I am sick", "I am pregnant", "I am bleeding")
const NON_NAME_WORDS = new Set([
  'sick', 'ill', 'fine', 'good', 'ok', 'okay', 'well', 'hurting', 'injured', 'bleeding',
  'pregnant', 'diabetic', 'asthmatic', 'dying', 'in pain', 'feverish', 'choking',
  'theek', 'beemar', 'khush', 'pareshan', 'theek hoon',
]);

// ── Capabilities patterns (e.g. "WHAT CAN YOU DO", "who are you") ──

const CAPABILITIES_PATTERNS: RegExp[] = [
  /\b(?:what\s+(?:can|do)\s+you\s+do|who\s+are\s+you|how\s+can\s+you\s+help(?:\s+me)?|what\s+are\s+your\s+(?:capabilities|features|functions)|what\s+is\s+sehatai|tell\s+me\s+about\s+yourself)\b/i,
  /\b(?:aap\s+kya\s+kar\s+sakt[ey]\s+h[ae]i?n?|tum\s+kya\s+kar\s+sakt[ey]\s+ho|aap\s+kaun\s+h[ae]i?n?|tum\s+kaun\s+ho|aap\s+kya\s+ho|sehatai\s+kya\s+hai)\b/i,
  /آپ\s*کیا\s*کر\s*سکتے\s*ہیں|تم\s*کیا\s*کر\s*سکتے\s*ہو|آپ\s*کون\s*ہیں|صحت\s*اے\s*آئی\s*کیا\s*ہے|آپ\s*کے\s*بارے\s*میں/,
];

// ── Guidance request patterns (e.g. "OK GUIDE ME", "guide me", "help me") ──

const GUIDANCE_PATTERNS: RegExp[] = [
  /^\s*(?:ok|okay|acha|theek\s+hai|please|plz)?\s*(?:guide\s+me|help\s+me|assist\s+me|tell\s+me|guide\s+karein|rehnumai\s+karein|guide\s+karo|madad\s+karein|madad\s+karo)\s*[!.?]*\s*$/i,
  /^\s*(?:رہنمائی\s*کریں|مجھے\s*گائیڈ\s*کریں|مدد\s*کریں|رہنمائی\s*فرمائیں)\s*[!؟.]*$/,
];

// ── Language change patterns (e.g. "Say it in English", "Speak in English", "English please") ──

const LANG_EN_PATTERNS: RegExp[] = [
  /\b(?:say\s+it\s+in|speak\s+in|talk\s+in|write\s+in|switch\s+to|reply\s+in|respond\s+in|can\s+you\s+speak\s+in|answer\s+in)\s+english\b/i,
  /^\s*(?:in\s+)?english(?:\s+please|\s+mein|\s+plz)?\s*[!.?]*\s*$/i,
  /^\s*english\s+mein\s+(?:bolo|baat\s+karo|likho|rehnumai\s+karein|jawab\s+dein)\s*[!.?]*\s*$/i,
];

const LANG_ROMAN_PATTERNS: RegExp[] = [
  /\b(?:say\s+it\s+in|speak\s+in|talk\s+in|write\s+in|switch\s+to|reply\s+in|respond\s+in|can\s+you\s+speak\s+in|answer\s+in)\s+(?:roman\s*urdu|roman)\b/i,
  /^\s*(?:in\s+)?(?:roman\s*urdu|roman)(?:\s+please|\s+mein|\s+plz)?\s*[!.?]*\s*$/i,
  /^\s*roman\s*(?:urdu)?\s+mein\s+(?:bolo|baat\s+karo|likho|rehnumai\s+karein|jawab\s+dein)\s*[!.?]*\s*$/i,
];

const LANG_URDU_PATTERNS: RegExp[] = [
  /\b(?:say\s+it\s+in|speak\s+in|talk\s+in|write\s+in|switch\s+to|reply\s+in|respond\s+in|can\s+you\s+speak\s+in|answer\s+in)\s+urdu\b/i,
  /^\s*(?:in\s+)?urdu(?:\s+please|\s+mein|\s+plz)?\s*[!.?]*\s*$/i,
  /^\s*urdu\s+mein\s+(?:bolo|baat\s+karo|likho|rehnumai\s+karein|jawab\s+dein)\s*[!.?]*\s*$/i,
  /^\s*(?:اردو\s*میں\s*(?:بات\s*کریں|بولیں|لکھیں|جواب\s*دیں)|اردو\s*پلیز)\s*[!؟.]*$/,
  /\bاردو\s*میں\s*(?:بات\s*کریں|بولیں|لکھیں)/,
];

// ── User correction patterns (e.g. "Actually it is not my chest, the drawer broke") ──

export const USER_CORRECTION_PATTERNS: RegExp[] = [
  /^\s*(?:actually|correction|sorry\s+correction|no\s+i\s+meant|i\s+meant|my\s+mistake|not\s+my\s+chest|galti\s+se|mera\s+matlab|galat\s+likh\s+diya)\b/i,
  /\b(?:it\s+is\s+not\s+(?:my\s+)?chest|it\s+was\s+not\s+(?:my\s+)?chest|the\s+chest\s+of\s+drawers\s+broke|i\s+was\s+talking\s+about\s+(?:furniture|a\s+box|a\s+drawer)|not\s+a\s+medical\s+emergency)\b/i,
  /\b(?:asl\s+mein|mera\s+matlab\s+tha|chest\s+of\s+drawers\s+ki\s+baat\s+kar\s+raha)\b/i,
];

// ── Non-medical patterns (furniture, hardware, non-health) ──

const NON_MEDICAL_PATTERNS: RegExp[] = [
  /^\s*(?:the\s+)?chest\s+of\s+(?:my\s+)?drawers?\s+is\s+broken\s*[!.?]*\s*$/i,
  /\b(?:chest\s+of\s+drawers?|tool\s*chest|toy\s*chest|ice\s*chest|treasure\s*chest)\b/i,
  /\b(?:repair\s+(?:my\s+)?car|weather\s+today|cricket\s+score|stock\s+market|capital\s+of|prime\s+minister)\b/i,
];

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

// ── Conversational response templates ──

export const GREETING_RESPONSES: Record<Lang, string> = {
  en: "Hello! 👋 I'm SehatAI, your health guidance assistant. How can I help you with your health today?",
  ur: 'السلام علیکم! 👋 میں صحت اے آئی ہوں، آپ کا صحت رہنما معاون۔ آج آپ کی صحت کے بارے میں کیا مدد کر سکتا ہوں؟',
  roman: 'Assalam o Alaikum! 👋 Main SehatAI hoon, aap ka sehat rehnuma. Aaj aap ki sehat ke baray mein kya madad kar sakta hoon?',
};

export const FAREWELL_RESPONSES: Record<Lang, string> = {
  en: "Take care! 🙏 Remember, I'm here whenever you need health guidance. Stay healthy!",
  ur: 'اپنا خیال رکھیں! 🙏 یاد رکھیں، جب بھی صحت کے بارے میں رہنمائی چاہیں، میں یہاں ہوں۔ صحت مند رہیں!',
  roman: 'Apna khayal rakhein! 🙏 Yaad rakhein, jab bhi sehat ke baray mein rehnumai chahein, main yahan hoon. Sehatmand rahein!',
};

export const GRATITUDE_RESPONSES: Record<Lang, string> = {
  en: "You're welcome! 😊 I'm glad I could help. If you have any more health questions in the future, don't hesitate to ask. Take care!",
  ur: 'خوش آمدید! 😊 خوشی ہوئی کہ مدد کر سکا۔ مستقبل میں کوئی بھی صحت کا سوال ہو تو پوچھنے میں ہچکچاہٹ نہ کریں۔ اپنا خیال رکھیں!',
  roman: 'Khush aamdeed! 😊 Khushi hui ke madad kar saka. Mustaqbil mein koi bhi sehat ka sawal ho to poochhne mein hichkichahat na karein. Apna khayal rakhein!',
};

export const WELLNESS_RESPONSES: Record<Lang, string> = {
  en: "That's great to hear! 😊 Since you're feeling well, here are some simple tips to stay healthy:\n\n• Drink plenty of water throughout the day\n• Eat a balanced diet with fruits and vegetables\n• Get regular physical activity and good sleep\n• Wash your hands frequently\n\nIf anything ever changes or you feel unwell, I'm right here to help. Stay healthy! 💪",
  ur: 'یہ سن کر خوشی ہوئی! 😊 چونکہ آپ صحت مند ہیں، صحت مند رہنے کی چند آسان تجاویز:\n\n• دن بھر وافر مقدار میں پانی پیتے رہیں\n• پھلوں اور سبزیوں کے ساتھ متوازن غذا کھائیں\n• باقاعدہ ورزش کریں اور اچھی نیند لیں\n• بار بار ہاتھ دھوئیں\n\nاگر کبھی طبیعت میں تبدیلی آئے، میں یہاں آپ کی مدد کے لیے موجود ہوں۔ صحت مند رہیں! 💪',
  roman: 'Yeh sun kar khushi hui! 😊 Choonke aap sehatmand hain, sehatmand rehne ki chand aasan tajweezein:\n\n• Din bhar wafir miqdaar mein paani peetay rahein\n• Phalon aur sabziyon ke saath mutawazin ghiza khayein\n• Baqaida warzish karein aur achhi neend lein\n• Baar baar haath dhoyein\n\nAgar kabhi tabiyat mein tabdeeli aaye, main yahan aap ki madad ke liye maujood hoon. Sehatmand rahein! 💪',
};

export function INTRODUCTION_RESPONSES(name: string): Record<Lang, string> {
  const cleanName = name.trim().replace(/^[\s,.-]+|[\s,.-]+$/g, '');
  const formattedName = cleanName ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) : 'there';
  return {
    en: `Nice to meet you, ${formattedName}! 👋 I'm SehatAI, your health guidance assistant. How can I help you today? Please feel free to share any symptoms or health questions you have.`,
    ur: `آپ سے مل کر خوشی ہوئی، ${formattedName}! 👋 میں صحت اے آئی ہوں، آپ کا صحت رہنمائی معاون۔ آج میں آپ کی کیا مدد کر سکتا ہوں؟ اگر صحت سے متعلق کوئی سوال ہو تو ضرور بتائیں۔`,
    roman: `Aap se mil kar khushi hui, ${formattedName}! 👋 Main SehatAI hoon, aap ka sehat rehnuma. Aaj main aap ki kya madad kar sakta hoon? Agar koi sehat ka sawal ya alamat ho to zaroor batayein.`,
  };
}

export const CAPABILITIES_RESPONSES: Record<Lang, string> = {
  en: `I'm SehatAI, a digital health assistant designed for Pakistan. Here is what I can help you with:

• **Symptom guidance**: Describe how you are feeling, and I'll help assess the urgency.
• **Triage advice**: Understand whether home care, a routine clinic visit, or immediate emergency care is appropriate.
• **First aid & home care**: Practical, safe steps for common conditions.
• **When to see a doctor**: Clear danger signs and guidance on when to seek in-person medical care.

What health topic or symptoms would you like guidance on today?`,
  ur: `میں صحت اے آئی ہوں، پاکستان کے لیے ڈیجیٹل صحت رہنمائی معاون۔ میں ان امور میں آپ کی مدد کر سکتا ہوں:

• **علامات کی رہنمائی**: اپنی کیفیت بتائیں تاکہ شدت اور نوعیت کا اندازہ لگایا جا سکے۔
• **طبی درجہ بندی**: جانیں کہ گھریلو دیکھ بھال، کلینک کا معائنہ، یا فوری ہسپتال جانا مناسب ہے۔
• **ابتدائی طبی امداد**: عام مسائل کے لیے محفوظ اور آسان گھریلو تدابیر۔
• **ڈاکٹر سے رجوع**: خطرے کی علامات اور ہنگامی دیکھ بھال کی نشاندہی۔

آج آپ کو کس بارے میں رہنمائی چاہیے؟`,
  roman: `Main SehatAI hoon, Pakistan ke liye digital sehat rehnuma. Main in cheezon mein aap ki madad kar sakta hoon:

• **Alamaat ki rehnumai**: Apni tabiyat batayein taake shiddat ka andaza lagaya ja sake.
• **Triage mashwara**: Janein ke gharelu dekh bhal, routine clinic visit, ya fori emergency ki zaroorat hai.
• **First aid aur gharelu dekh bhal**: Aam masail ke liye aasan aur mehfooz tareeqay.
• **Doctor se rabta**: Khatray ki alamaat aur hifazati rehnumai.

Aaj aap ko kis baray mein rehnumai chahiye?`,
};

export const GUIDANCE_RESPONSES: Record<Lang, string> = {
  en: "I'm ready to guide you. Please describe the symptoms you or someone else is experiencing, how long they have been present, and any other details you can share.",
  ur: 'میں رہنمائی کے لیے تیار ہوں۔ براہ کرم بتائیں کہ آپ کو یا کسی اور کو کیا علامات محسوس ہو رہی ہیں، یہ کب سے ہیں، اور کوئی دیگر تفصیلات بتائیں۔',
  roman: 'Main rehnumai ke liye tayar hoon. Barah-e-karam batayein ke aap ko ya kisi aur ko kya alamaat mehsoos ho rahi hain, yeh kab se hain, aur koi aur tafseel ho to batayein.',
};

export const LANGUAGE_CHANGE_RESPONSES: Record<Lang, string> = {
  en: "Understood, I will continue in English. How can I assist you with your health today?",
  ur: 'سمجھ گیا، اب میں اردو میں بات کروں گا۔ آج آپ کی صحت کے بارے میں کیا مدد کر سکتا ہوں؟',
  roman: 'Samajh gaya, ab main Roman Urdu mein baat karoon ga. Aaj aap ki sehat ke baray mein kya madad kar sakta hoon?',
};

export const NON_MEDICAL_RESPONSES: Record<Lang, string> = {
  en: "I am specialized in health guidance and medical triage. For non-medical questions or household repairs, I'm unable to assist. If you or someone else has any health concerns or symptoms, please let me know!",
  ur: 'میں صحت اور طبی رہنمائی کے لیے مخصوص ہوں۔ غیر طبی سوالات یا گھریلو سامان کی مرمت کے لیے معذرت۔ اگر صحت سے متعلق کوئی مسئلہ یا سوال ہو تو ضرور بتائیں!',
  roman: 'Main sehat aur tibbi rehnumai ke liye makhsoos hoon. Ghair-tibbi mamlaat ya marammat ke liye shayad madad na kar sakoon. Agar sehat ke hawale se koi masla ya sawal ho to batayein!',
};

export const USER_CORRECTION_RESPONSES: Record<Lang, string> = {
  en: "Thank you for clarifying! I've updated my understanding. How can I help you with your health today?",
  ur: 'وضاحت کا شکریہ! میں نے معلومات درست کر لی ہیں۔ آج آپ کی صحت کے حوالے سے کیا مدد کر سکتا ہوں؟',
  roman: 'Wazahat ka shukriya! Main ne maloomat theek kar li hain. Aaj sehat ke hawale se aap ki kya madad kar sakta hoon?',
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

  // 1. Language change requests
  if (matchesAnyPattern(trimmed, LANG_EN_PATTERNS)) {
    return { intent: 'language_change', confidence: 0.98, requestedLanguage: 'en' };
  }
  if (matchesAnyPattern(trimmed, LANG_ROMAN_PATTERNS)) {
    return { intent: 'language_change', confidence: 0.98, requestedLanguage: 'roman' };
  }
  if (matchesAnyPattern(trimmed, LANG_URDU_PATTERNS)) {
    return { intent: 'language_change', confidence: 0.98, requestedLanguage: 'ur' };
  }

  // 1.5 User corrections (e.g. "Actually it is not my chest, the drawer broke")
  if (matchesAnyPattern(trimmed, USER_CORRECTION_PATTERNS)) {
    return { intent: 'user_correction', confidence: 0.95 };
  }

  // 2. Non-medical queries (e.g. "The chest of my drawers is broken")
  if (matchesAnyPattern(trimmed, NON_MEDICAL_PATTERNS)) {
    return { intent: 'non_medical', confidence: 0.95 };
  }

  // 3. User introduction (e.g. "I AM AHMAD", "My name is Sarah")
  const mEn = trimmed.match(INTRO_EN);
  if (mEn && mEn[1] && !NON_NAME_WORDS.has(mEn[1].trim().toLowerCase())) {
    return { intent: 'introduction', confidence: 0.95, extractedName: mEn[1].trim() };
  }
  const mRoman = trimmed.match(INTRO_ROMAN);
  if (mRoman && mRoman[1]) {
    const rawName = mRoman[1].replace(/\s+(?:hoon|hon|hai|ha)$/i, '').trim();
    if (rawName && !NON_NAME_WORDS.has(rawName.toLowerCase())) {
      return { intent: 'introduction', confidence: 0.95, extractedName: rawName };
    }
  }
  const mUrdu = trimmed.match(INTRO_URDU);
  if (mUrdu && mUrdu[1]) {
    return { intent: 'introduction', confidence: 0.95, extractedName: mUrdu[1].trim() };
  }

  // 4. Capabilities inquiry (e.g. "WHAT CAN YOU DO", "who are you")
  if (matchesAnyPattern(trimmed, CAPABILITIES_PATTERNS)) {
    return { intent: 'capabilities', confidence: 0.95 };
  }

  // 5. Guidance requests (e.g. "OK GUIDE ME", "guide me", "help me")
  if (matchesAnyPattern(trimmed, GUIDANCE_PATTERNS)) {
    return { intent: 'guidance_request', confidence: 0.95 };
  }

  // 6. Greetings
  if (matchesAnyPattern(trimmed, GREETING_PATTERNS)) {
    return { intent: 'greeting', confidence: 0.95 };
  }

  // 7. Farewells
  if (matchesAnyPattern(trimmed, FAREWELL_PATTERNS)) {
    return { intent: 'farewell', confidence: 0.95 };
  }

  // 8. Gratitude
  if (matchesAnyPattern(trimmed, GRATITUDE_PATTERNS)) {
    return { intent: 'gratitude', confidence: 0.95 };
  }

  // 9. Wellness check (user says they're fine)
  if (matchesAnyPattern(trimmed, WELLNESS_PATTERNS)) {
    return { intent: 'wellness_check', confidence: 0.90 };
  }

  // 10. Repeat detection
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

  // 11. Follow-up detection
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
