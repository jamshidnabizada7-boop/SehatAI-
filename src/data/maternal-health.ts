// ============================================================
// SehatAI — Maternal Health Data (Phase 2)
// WHO 8-visit antenatal care (ANC) schedule + Pakistan-specific
// maternal danger signs + postnatal care milestones.
//
// Sources:
//   - WHO Recommendations on Antenatal Care for a Positive
//     Pregnancy Experience (2016) — the 8-contact model.
//   - WHO Maternal danger signs.
//   - Pakistan Maternal Mortality context (MMR 186/100k).
//
// All content is trilingual (EN / Urdu-Nastaliq / Roman-Urdu).
// ============================================================

import type { TriText } from '@/lib/types';

/** WHO 8-contact ANC schedule (week of gestation). */
export interface AncContact {
  /** contact number 1-8 */
  contact: number;
  /** gestational week when due */
  week: number;
  /** what happens at this contact */
  title: TriText;
  /** key checks at this visit */
  checks: TriText[];
}

export const ANC_SCHEDULE: AncContact[] = [
  {
    contact: 1,
    week: 12,
    title: { en: 'Booking visit', ur: 'پہلا معائنہ', roman: 'Pehla muaina' },
    checks: [
      { en: 'Confirm pregnancy + estimate due date', ur: 'حمل کی تصدیق + توقع کی تاریخ', roman: 'Hamal ki tasdeeq + tawaqa ki tareekh' },
      { en: 'Blood pressure + weight + height', ur: 'بلڈ پریشر + وزن + قد', roman: 'Blood pressure + wazan + qad' },
      { en: 'Blood tests (Hb, blood group, HIV, syphilis, hepatitis B)', ur: 'خون کے ٹیسٹ (ہیموگلوبن، گروپ، ایچ آئی وی، سفلس، ہیپاٹائٹس بی)', roman: 'Khoon ke test (Hb, group, HIV, syphilis, hepatitis B)' },
      { en: 'Urine test for protein + infection', ur: 'پیشاب کا ٹیسٹ پروٹین اور انفیکشن کے لیے', roman: 'Peshab ka test protein aur infection ke liye' },
    ],
  },
  {
    contact: 2,
    week: 20,
    title: { en: 'Second contact', ur: 'دوسرا معائنہ', roman: 'Doosra muaina' },
    checks: [
      { en: 'Blood pressure + weight', ur: 'بلڈ پریشر + وزن', roman: 'Blood pressure + wazan' },
      { en: 'Ultrasound (anomaly scan)', ur: 'الٹراساؤنڈ (نواقص کا اسکین)', roman: 'Ultrasound (nawais ka scan)' },
      { en: 'Fetal heartbeat', ur: 'بچے کی دھڑکن', roman: 'Bachay ki dharkan' },
    ],
  },
  {
    contact: 3,
    week: 26,
    title: { en: 'Third contact', ur: 'تیسرا معائنہ', roman: 'Teesra muaina' },
    checks: [
      { en: 'Blood pressure + weight', ur: 'بلڈ پریشر + وزن', roman: 'Blood pressure + wazan' },
      { en: 'Fetal growth + position', ur: 'بچے کی نشوونما + حالت', roman: 'Bachay ki nashonuma + halat' },
      { en: 'Iron + folic acid supplementation', ur: 'آئرن + فولک ایسڈ سپلیمنٹ', roman: 'Iron + folic acid supplement' },
    ],
  },
  {
    contact: 4,
    week: 30,
    title: { en: 'Fourth contact', ur: 'چوتھا معائنہ', roman: 'Chotha muaina' },
    checks: [
      { en: 'Blood pressure + weight', ur: 'بلڈ پریشر + وزن', roman: 'Blood pressure + wazan' },
      { en: 'Anti-D (if Rh negative)', ur: 'اینٹی ڈی (اگر آر ایچ نیگیٹو ہو)', roman: 'Anti-D (agar Rh negative ho)' },
      { en: 'Tetanus booster (if due)', ur: 'ٹٹنوس بواسٹر (اگر واجب الادا ہو)', roman: 'Tetanus booster (agar wajib-ul-ada ho)' },
    ],
  },
  {
    contact: 5,
    week: 34,
    title: { en: 'Fifth contact', ur: 'پانچواں معائنہ', roman: 'Panchawan muaina' },
    checks: [
      { en: 'Blood pressure + weight', ur: 'بلڈ پریشر + وزن', roman: 'Blood pressure + wazan' },
      { en: 'Fetal position + growth', ur: 'بچے کی حالت + نشوونما', roman: 'Bachay ki halat + nashonuma' },
      { en: 'Discuss birth plan', ur: 'پیدائش کا منصوبہ', roman: 'Paidaish ka mansooba' },
    ],
  },
  {
    contact: 6,
    week: 36,
    title: { en: 'Sixth contact', ur: 'چھٹا معائنہ', roman: 'Chhata muaina' },
    checks: [
      { en: 'Blood pressure + weight', ur: 'بلڈ پریشر + وزن', roman: 'Blood pressure + wazan' },
      { en: 'Vaginal exam (if needed)', ur: 'اندرونی معائنہ (اگر ضروری ہو)', roman: 'Androoni muaina (agar zaroori ho)' },
      { en: 'Group B Strep screen (if offered)', ur: 'گروپ بی سٹریپ ٹیسٹ', roman: 'Group B Strep test' },
    ],
  },
  {
    contact: 7,
    week: 38,
    title: { en: 'Seventh contact', ur: 'ساتواں معائنہ', roman: 'Saatawan muaina' },
    checks: [
      { en: 'Blood pressure + weight', ur: 'بلڈ پریشر + وزن', roman: 'Blood pressure + wazan' },
      { en: 'Fetal position + wellbeing', ur: 'بچے کی حالت + بہتری', roman: 'Bachay ki halat + behtari' },
      { en: 'Discuss labour signs', ur: 'ڈیلیوری کی علامات', roman: 'Delivery ki alamaat' },
    ],
  },
  {
    contact: 8,
    week: 40,
    title: { en: 'Eighth contact (due date)', ur: 'آٹھواں معائنہ (توقع کی تاریخ)', roman: 'Aathawan muaina (tawaqa ki tareekh)' },
    checks: [
      { en: 'Blood pressure + weight', ur: 'بلڈ پریشر + وزن', roman: 'Blood pressure + wazan' },
      { en: 'Discuss induction if overdue', ur: 'اگر وقت گزر جائے تو induction پر بات', roman: 'Agar waqt guzar jaye to induction par baat' },
      { en: 'Plan for post-dates monitoring', ur: 'تاریخ گزرنے کے بعد نگرانی', roman: 'Tareekh guzarne ke baad nigrani' },
    ],
  },
];

/** WHO maternal danger signs — immediate hospital visit required. */
export const MATERNAL_DANGER_SIGNS: { symptom: TriText; action: TriText }[] = [
  {
    symptom: { en: 'Vaginal bleeding', ur: 'خون بہنا', roman: 'Khoon behna' },
    action: { en: 'Go to hospital now', ur: 'فوراً ہسپتال جائیں', roman: 'Fori hospital jayein' },
  },
  {
    symptom: { en: 'Severe headache with blurred vision', ur: 'شدید سر درد + دھندلا نظر', roman: 'Shadeed sar dard + dhundla nazar' },
    action: { en: 'Check BP — possible preeclampsia', ur: 'بلڈ پریشر چیک کریں — پری ایکلیمپسیا', roman: 'BP check karein — preeclampsia' },
  },
  {
    symptom: { en: 'Swollen face/hands', ur: 'چہرے/ہاتھوں میں سوجن', roman: 'Chehre/haathon mein soojan' },
    action: { en: 'Check BP — possible preeclampsia', ur: 'بلڈ پریشر چیک کریں', roman: 'BP check karein' },
  },
  {
    symptom: { en: 'Severe abdominal pain', ur: 'شدید پیٹ درد', roman: 'Shadeed pait dard' },
    action: { en: 'Go to hospital now', ur: 'فوراً ہسپتال جائیں', roman: 'Fori hospital jayein' },
  },
  {
    symptom: { en: 'Convulsions / fits', ur: 'دورے', roman: 'Doray' },
    action: { en: 'Call 1122 — eclampsia emergency', ur: '1122 پر کال کریں — ایکلیمپسیا', roman: '1122 par call karein — eclampsia' },
  },
  {
    symptom: { en: 'Reduced fetal movements', ur: 'بچے کی حرکت کم', roman: 'Bachay ki harkat kam' },
    action: { en: 'Go to hospital today', ur: 'آج ہی ہسپتال جائیں', roman: 'Aaj hi hospital jayein' },
  },
  {
    symptom: { en: 'Leaking fluid / water broke', ur: 'پانی آنا', roman: 'Pani aana' },
    action: { en: 'Go to hospital now', ur: 'فوراً ہسپتال جائیں', roman: 'Fori hospital jayein' },
  },
  {
    symptom: { en: 'High fever', ur: 'تیز بخار', roman: 'Tez bukhar' },
    action: { en: 'See a doctor today', ur: 'آج ڈاکٹر کو دیکھیں', roman: 'Aaj doctor ko dekhein' },
  },
];

/** Postnatal care milestones. */
export const POSTNATAL_MILESTONES: { day: number; title: TriText; checks: TriText[] }[] = [
  {
    day: 1,
    title: { en: 'Within 24 hours', ur: '24 گھنٹے میں', roman: '24 ghante mein' },
    checks: [
      { en: 'Check bleeding + lochia', ur: 'خون کی جانچ', roman: 'Khoon ki janch' },
      { en: 'Check uterus contraction', ur: 'بچہ دانی کی سکڑن', roman: 'Bachadani ki sakran' },
      { en: 'Baby: feeding + warmth', ur: 'بچہ: دودھ + گرمی', roman: 'Bacha: doodh + garmi' },
    ],
  },
  {
    day: 3,
    title: { en: 'Day 3', ur: 'تیسرا دن', roman: 'Teesra din' },
    checks: [
      { en: 'Check for postnatal depression signs', ur: 'پوسٹ ناتل ڈپریشن کی علامات', roman: 'Postnatal depression ki alamaat' },
      { en: 'Baby: jaundice check', ur: 'بچہ: یرقان کی جانچ', roman: 'Bacha: yarkan ki janch' },
    ],
  },
  {
    day: 7,
    title: { en: 'Day 7', ur: 'ساتواں دن', roman: 'Saatawan din' },
    checks: [
      { en: 'Check healing (tears/episiotomy)', ur: 'زخم کیrecovering', roman: 'Zakhm ki healing' },
      { en: 'Baby: weight + feeding', ur: 'بچہ: وزن + دودھ', roman: 'Bacha: wazan + doodh' },
    ],
  },
  {
    day: 42,
    title: { en: '6 weeks (final check)', ur: '6 ہفتے (آخری معائنہ)', roman: '6 hafte (akhri muaina)' },
    checks: [
      { en: 'Full postnatal check', ur: 'مکمل پوسٹ ناتل معائنہ', roman: 'Mukammal postnatal muaina' },
      { en: 'Family planning discussion', ur: 'فیملی پلاننگ', roman: 'Family planning' },
      { en: 'Iron + folate continuation', ur: 'آئرن + فولک ایسڈ جاری', roman: 'Iron + folic acid jari' },
    ],
  },
];

// ---------- Gestational age helpers ----------

/** Calculate gestational age from LMP (last menstrual period). */
export function gestationalAge(lmpDate: string): { weeks: number; days: number } {
  const lmp = new Date(lmpDate);
  if (isNaN(lmp.getTime())) return { weeks: 0, days: 0 };
  const now = new Date();
  const diffMs = now.getTime() - lmp.getTime();
  if (diffMs < 0) return { weeks: 0, days: 0 };
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return { weeks, days };
}

/** Estimated due date from LMP (Naegele's rule: LMP + 280 days). */
export function estimatedDueDate(lmpDate: string): string | null {
  const lmp = new Date(lmpDate);
  if (isNaN(lmp.getTime())) return null;
  const edd = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);
  return edd.toISOString();
}

/** Which ANC contact is due next? */
export function nextAncContact(weeksPregnant: number): AncContact | null {
  for (const c of ANC_SCHEDULE) {
    if (weeksPregnant < c.week) return c;
  }
  return null; // overdue
}

/** Trimester label. */
export function trimester(weeks: number): 1 | 2 | 3 | 'post' {
  if (weeks <= 13) return 1;
  if (weeks <= 27) return 2;
  return 3;
}
