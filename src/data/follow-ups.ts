// ============================================================
// SehatAI — Deterministic follow-up suggestions (pure data)
//
// After an assistant answer, SehatAI offers 2-3 grounded
// follow-up questions derived from the CITED corpus docs.
// 100% deterministic and offline-safe: a map from corpus topic
// to pre-written trilingual questions — never LLM-generated,
// never a diagnosis, never a dose. Users can always ignore them.
//
// Selection rule (followUpsFor): take the cited docs in order,
// collect their follow-ups, de-duplicate by question text,
// cap at 3. No matching entries → generic safety follow-ups
// for the answer's triage level.
// ============================================================

import { CORPUS } from '@/data/corpus';
import type { Citation, CorpusItem, Lang, TriageLevel, TriText } from '@/lib/types';

const CORPUS_BY_ID: Record<string, CorpusItem> = Object.fromEntries(
  CORPUS.map((item) => [item.id, item]),
);

const q = (en: string, ur: string, roman: string): TriText => ({ en, ur, roman });

/** Follow-up questions per corpus TOPIC (shared by every doc on that topic). */
const TOPIC_FOLLOW_UPS: Record<string, TriText[]> = {
  fever: [
    q('When should a fever go to the hospital?', 'بخار میں ہسپتال کب جانا چاہیے؟', 'Bukhar mein hospital kab jana chahiye?'),
    q('Which fluids help during fever?', 'بخار میں کون سے مائعات مدد کرتے ہیں؟', 'Bukhar mein kaun se maayeaat madad karte hain?'),
  ],
  diarrhea: [
    q('How do I prepare ORS at home?', 'گھر پر او آر ایس کیسے تیار کروں؟', 'Ghar par ORS kaise tayyar karoon?'),
    q('What are the dehydration danger signs?', 'پانی کی کمی کی خطرے کی علامات کیا ہیں؟', 'Pani ki kami ke khatray ki alamaat kya hain?'),
  ],
  dehydration: [
    q('How much ORS should I drink?', 'کتنا او آر ایس پینا چاہیے؟', 'Kitna ORS peena chahiye?'),
  ],
  dengue: [
    q('How can I prevent dengue at home?', 'گھر پر ڈینگی سے کیسے بچاؤ کروں؟', 'Ghar par dengue se kaise bachao karoon?'),
    q('Which medicines are unsafe in dengue?', 'ڈینگی میں کون سی دوائیں غیر محفوظ ہیں؟', 'Dengue mein kaun si dawayain ghair-mehfooz hain?'),
  ],
  malaria: [
    q('How is malaria prevented?', 'ملیریا سے بچاؤ کیسے ہوتا ہے؟', 'Malaria se bachao kaisa hota hai?'),
  ],
  typhoid: [
    q('Is the typhoid vaccine available in Pakistan?', 'ٹائیفائیڈ کا ٹیکہ پاکستان میں دستیاب ہے؟', 'Typhoid ka teeka Pakistan mein dastyab hai?'),
  ],
  tb: [
    q('How long is TB treatment?', 'تپِ دق کا علاج کتنا عرصہ چلتا ہے؟', 'Tap-e-diq ka ilaaj kitna arsa chalta hai?'),
  ],
  maternal: [
    q('What are the pregnancy danger signs?', 'حمل کی خطرے کی علامات کیا ہیں؟', 'Hamal ke khatray ki alamaat kya hain?'),
    q('Which foods are important in pregnancy?', 'حمل میں کون سے غذائیں اہم ہیں؟', 'Hamal mein kaun se ghizain aham hain?'),
    q('How often should ANC visits be?', 'حمل کی چیک اپ کتنی بار ہونی چاہیے؟', 'Hamal ki check-up kitni bar honi chahiye?'),
  ],
  vaccination: [
    q('What is the EPI schedule in Pakistan?', 'پاکستان میں ای پی آئی شیڈول کیا ہے؟', 'Pakistan mein EPI schedule kya hai?'),
    q('Are vaccine side effects dangerous?', 'ٹیکے کے سائیڈ ایفیکٹس خطرناک ہوتے ہیں؟', 'Teekay ke side effects khatarnak hote hain?'),
  ],
  newborn: [
    q('What are the newborn danger signs?', 'نو مولود کی خطرے کی علامات کیا ہیں؟', 'Nau-molood ke khatray ki alamaat kya hain?'),
  ],
  'child-respiratory': [
    q('How do I recognise pneumonia in a child?', 'بچے میں نمونیا کی پہچان کیسے ہو؟', 'Bachay mein namonia ki pehchaan kaise ho?'),
  ],
  'child-rash': [
    q('Is measles dangerous for children?', 'بچوں کے لیے خسرہ خطرناک ہے؟', 'Bachon ke liye khasra khatarnak hai?'),
  ],
  'first-aid': [
    q('What should I NOT do while giving first aid?', 'ابتدائی امداد دیتے وقت کیا نہیں کرنا چاہیے؟', 'Ibtidai imdaad detay waqt kya nahin karna chahiye?'),
  ],
  bites: [
    q('What if a dog bite is small but deep?', 'اگر کتے کا کاٹا چھوٹا مگر گہرا ہو تو؟', 'Agar kutte ka kaata chhota magar gehra ho to?'),
  ],
  environment: [
    q('Who is most at risk in a heatwave?', 'لو کی لہر میں سب سے زیادہ خطرہ کس کو ہے؟', 'Lo ki lahar mein sab se zyada khatra kis ko hai?'),
  ],
  prevention: [
    q('How do I make water safe to drink?', 'پینے کا پانی محفوظ کیسے بناؤں؟', 'Peene ka paani mehfooz kaise banaoon?'),
  ],
  headache: [
    q('When is a headache an emergency?', 'سر درد کب ایمرجنسی ہوتا ہے؟', 'Sar dard kab emergency hota hai?'),
  ],
  'sore-throat': [
    q('When does a sore throat need antibiotics?', 'گلے کی خراری کو اینٹی بائیوٹک کب چاہیے؟', 'Galay ki kharabi ko antibiotic kab chahiye?'),
  ],
  respiratory: [
    q('How is flu different from a cold?', 'فلو اور زکام میں کیا فرق ہے؟', 'Flu aur zukaam mein kya farq hai?'),
  ],
  hepatitis: [
    q('How is hepatitis spread?', 'یرقان کیسے پھیلتا ہے؟', 'Yarqan kaisa phailta hai?'),
  ],
  eye: [
    q('Is conjunctivitis contagious?', 'آشوبِ چشم متعدی ہے؟', 'Aashub-e-chashm muta\'addi hai?'),
  ],
  skin: [
    q('How is scabies treated at home?', 'خارش کا گھر پر علاج کیسے ہے؟', 'Kharish ka ghar par ilaaj kaise hai?'),
  ],
  asthma: [
    q('What triggers asthma attacks?', 'دمے کے دورے کیا چیز چالو کرتے ہیں؟', 'Damay ke doray kya cheez chalu karte hain?'),
  ],
  diabetes: [
    q('What foods help control sugar?', 'شوگر قابو کرنے میں کون سی غذائیں مدد کرتی ہیں؟', 'Sugar qaboo karne mein kaun se ghizain madad karti hain?'),
  ],
  hypoglycemia: [
    q('What should a diabetic always carry?', 'شوگر کے مریض کے پاس ہمیشہ کیا ہونا چاہیے؟', 'Sugar ke mareez ke paas hamesha kya hona chahiye?'),
  ],
  'diabetes-ramadan': [
    q('When must a diabetic break the fast?', 'شوگر کا مریض روزہ کب توڑنے کا پابند ہے؟', 'Sugar ka mareez roza kab todnay ka paband hai?'),
  ],
  stroke: [
    q('What are the FAST stroke signs?', 'فالج کی فاسٹ علامات کیا ہیں؟', 'Faalij ki FAST alamaat kya hain?'),
  ],
  'asthma-child': [
    q('What household triggers worsen child asthma?', 'گھر میں کون سی چیزیں بچوں کا دمہ بڑھاتی ہیں؟', 'Ghar mein kaun si cheezain bachon ka dama barhati hain?'),
  ],
  anemia: [
    q('Which foods contain iron?', 'آئرن کون سی غذاؤں میں ہوتا ہے؟', 'Iron kaun si ghizaon mein hota hai?'),
  ],
  'mental-health': [
    q('When should I seek help for low mood?', 'اداس موڈ کے لیے مدد کب لیں؟', 'Udaas mood ke liye madad kab lein?'),
  ],
  'head-injury': [
    q('After a head injury, what signs need a hospital?', 'سر کی چوٹ کے بعد کون سی علامات پر ہسپتال جانا ضروری ہے؟', 'Sar ki chot ke baad kaun si alamaat par hospital jana zaroori hai?'),
  ],
  seizure: [
    q('What should I do during a fit?', 'دورے کے دوران کیا کرنا چاہیے؟', 'Doray ke doran kya karna chahiye?'),
  ],
  'family-planning': [
    q('Which family planning methods are common in Pakistan?', 'پاکستان میں خاندانی منصوبہ بندی کے کون سے طریقے عام ہیں؟', 'Pakistan mein khandani mansoobabandi ke kaun se tareeqay aam hain?'),
  ],
  musculoskeletal: [
    q('Which exercises help back pain?', 'کمر درد میں کون سی ورزشیں مدد کرتی ہیں؟', 'Kamar dard mein kaun si warzishain madad karti hain?'),
  ],
  digestive: [
    q('What helps stop vomiting at home?', 'گھر پر الٹی روکنے میں کیا مدد کرتا ہے؟', 'Ghar par ulti rokne mein kya madad karta hai?'),
  ],
  'medication-safety': [
    q('Why should I finish prescribed antibiotics?', 'نسخے کی اینٹی بائیوٹک مکمل کیوں کرنی چاہیے؟', 'Nuskay ki antibiotic mukammal kyun karni chahiye?'),
  ],
};

/** Generic safety-net follow-ups by triage level (used when the cited
 *  topic has no dedicated entries, or there are no citations). */
const GENERIC_FOLLOW_UPS: Record<TriageLevel, TriText[]> = {
  EMERGENCY: [
    q('What should I do while waiting for the ambulance?', 'ایمبولینس کے انتظار میں کیا کروں؟', 'Ambulance ke intezar mein kya karoon?'),
    q('Which number should I call right now?', 'ابھی کس نمبر پر کال کروں؟', 'Abhi kis number par call karoon?'),
  ],
  URGENT: [
    q('What should I do before reaching the doctor?', 'ڈاکٹر تک پہنچنے سے پہلے کیا کروں؟', 'Doctor tak pohanchne se pehle kya karoon?'),
    q('What are the danger signs to watch for?', 'کون سی خطرے کی علامات دیکھنی ہیں؟', 'Kaun si khatray ki alamaat dekhni hain?'),
  ],
  ROUTINE: [
    q('What are the danger signs to watch for?', 'کون سی خطرے کی علامات دیکھنی ہیں؟', 'Kaun si khatray ki alamaat dekhni hain?'),
    q('How can I prevent this at home?', 'گھر پر اس سے بچاؤ کیسے کروں؟', 'Ghar par is se bachao kaise karoon?'),
  ],
  SELF_CARE: [
    q('When should this go to a doctor?', 'یہ ڈاکٹر کو کب دکھانا چاہیے؟', 'Yeh doctor ko kab dikhana chahiye?'),
    q('How can I prevent this at home?', 'گھر پر اس سے بچاؤ کیسے کروں؟', 'Ghar par is se bachao kaise karoon?'),
  ],
};

export const MAX_FOLLOW_UPS = 3;

/** Compute follow-up suggestions for a finished assistant message:
 *  grounded in its citations, deterministic, capped, de-duplicated. */
export function followUpsFor(
  citations: Citation[] | undefined,
  triage: TriageLevel | undefined,
  lang: Lang,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (entry: TriText) => {
    const text = entry[lang] || entry.en;
    if (!seen.has(text)) {
      seen.add(text);
      out.push(text);
    }
  };

  if (citations && citations.length > 0) {
    for (const citation of citations) {
      const item = CORPUS_BY_ID[citation.id];
      if (!item) continue;
      const list = TOPIC_FOLLOW_UPS[item.topic] ?? [];
      for (const entry of list) push(entry);
      if (out.length >= MAX_FOLLOW_UPS) return out.slice(0, MAX_FOLLOW_UPS);
    }
  }

  if (out.length < MAX_FOLLOW_UPS) {
    for (const entry of GENERIC_FOLLOW_UPS[triage ?? 'ROUTINE']) push(entry);
  }

  return out.slice(0, MAX_FOLLOW_UPS);
}

