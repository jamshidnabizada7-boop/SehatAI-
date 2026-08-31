// ============================================================
// SehatAI — Air Quality + Environmental Health Data (Phase 2)
// Pakistan city AQI data (mock/deterministic — real API
// integration is Phase 3). Covers major cities with AQI bands,
// health advice per band, pollen seasons, and asthma triggers.
//
// Sources: WHO Air Quality Guidelines, Pakistan EPA, IQAir.
// Lahore consistently ranks among the world's most polluted
// cities (AQI >300 in winter).
// ============================================================

import type { TriText } from '@/lib/types';

export interface CityAqi {
  city: string;
  cityUr: string;
  /** AQI value (mock — would come from OpenAQ/WAQI API in production) */
  aqi: number;
  /** dominant pollutant */
  dominant: string;
  /** last updated (mock timestamp) */
  updatedAt: string;
}

// Mock AQI data — deterministic based on city (in production, fetch from WAQI API)
export const CITY_AQI: CityAqi[] = [
  { city: 'Lahore', cityUr: 'لاہور', aqi: 285, dominant: 'PM2.5', updatedAt: '2026-09-01T06:00:00Z' },
  { city: 'Karachi', cityUr: 'کراچی', aqi: 142, dominant: 'PM2.5', updatedAt: '2026-09-01T06:00:00Z' },
  { city: 'Islamabad', cityUr: 'اسلام آباد', aqi: 95, dominant: 'PM10', updatedAt: '2026-09-01T06:00:00Z' },
  { city: 'Peshawar', cityUr: 'پشاور', aqi: 178, dominant: 'PM2.5', updatedAt: '2026-09-01T06:00:00Z' },
  { city: 'Multan', cityUr: 'ملتان', aqi: 210, dominant: 'PM2.5', updatedAt: '2026-09-01T06:00:00Z' },
  { city: 'Faisalabad', cityUr: 'فیصل آباد', aqi: 195, dominant: 'PM2.5', updatedAt: '2026-09-01T06:00:00Z' },
  { city: 'Quetta', cityUr: 'کوئٹہ', aqi: 88, dominant: 'PM10', updatedAt: '2026-09-01T06:00:00Z' },
  { city: 'Rawalpindi', cityUr: 'راولپنڈی', aqi: 102, dominant: 'PM2.5', updatedAt: '2026-09-01T06:00:00Z' },
];

export interface AqiBand {
  min: number;
  max: number;
  label: TriText;
  color: string;
  bgColor: string;
  advice: TriText;
  asthmaRisk: 'low' | 'moderate' | 'high' | 'very-high' | 'extreme';
}

export const AQI_BANDS: AqiBand[] = [
  {
    min: 0,
    max: 50,
    label: { en: 'Good', ur: 'اچھا', roman: 'Acha' },
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    advice: { en: 'Air quality is satisfactory. Safe for outdoor activities.', ur: 'ہوا کا معیار اچھا ہے۔ باہر سرگرمیاں محفوظ ہیں۔', roman: 'Hawa ka mayar acha hai. Bahar sargarmiyan mehfooz hain.' },
    asthmaRisk: 'low',
  },
  {
    min: 51,
    max: 100,
    label: { en: 'Moderate', ur: 'درمیانی', roman: 'Darmiyani' },
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/15',
    advice: { en: 'Acceptable for most. Unusually sensitive people should limit prolonged outdoor exertion.', ur: 'زیادہ تر لوگوں کے لیے قابل قبول۔ حساس افراد لمبی باہر سرگرمی محدود رکھیں۔', roman: 'Zyada tar logon ke liye qaabil-e-qubool. Hassas afraad lambi bahar sargarmi makhsoos rakhein.' },
    asthmaRisk: 'moderate',
  },
  {
    min: 101,
    max: 150,
    label: { en: 'Unhealthy for sensitive groups', ur: 'حساس افراد کے لیے نقصان دہ', roman: 'Hassas afraad ke liye nuksan-deh' },
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500/15',
    advice: { en: 'Children, elderly, and those with heart/lung disease should reduce outdoor activity.', ur: 'بچے، بزرگ، اور دل/پھیپھڑوں کی بیماری والے باہر سرگرمی کم کریں۔', roman: 'Bachay, buzurg, aur dil/phaingron ki bimari wale bahar sargarmi kam karein.' },
    asthmaRisk: 'high',
  },
  {
    min: 151,
    max: 200,
    label: { en: 'Unhealthy', ur: 'نقصان دہ', roman: 'Nuksan-deh' },
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/15',
    advice: { en: 'Everyone may experience health effects. Limit outdoor exertion. Wear a mask outdoors.', ur: 'سب کو صحت پر اثر پڑ سکتا ہے۔ باہر سرگرمی محدود رکھیں۔ ماسک پہنیں۔', roman: 'Sab ko sehat par asar par sakta hai. Bahar sargarmi makhsoos rakhein. Mask pehnein.' },
    asthmaRisk: 'very-high',
  },
  {
    min: 201,
    max: 300,
    label: { en: 'Very unhealthy', ur: 'بہت نقصان دہ', roman: 'Bohat nuksan-deh' },
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-500/15',
    advice: { en: 'Health alert: avoid all outdoor activity. Keep windows closed. Use air purifier if available.', ur: 'صحت الرٹ: تمام باہر سرگرمی سے گریز کریں۔ کھڑکیاں بند رکھیں۔ ایئر پیوریفائر استعمال کریں۔', roman: 'Sehat alert: tamam bahar sargarmi se parhez karein. Khidkiyan band rakhein. Air purifier istemal karein.' },
    asthmaRisk: 'extreme',
  },
  {
    min: 301,
    max: 500,
    label: { en: 'Hazardous', ur: 'خطرناک', roman: 'Khatarnaak' },
    color: 'text-rose-800 dark:text-rose-400',
    bgColor: 'bg-rose-500/20',
    advice: { en: 'Emergency conditions. Stay indoors. Do not go outside unless necessary. Seek medical help if breathing difficulty.', ur: 'ایمرجنسی صورتحال۔ گھر میں رہیں۔ ضرورت نہ ہو تو باہر نہ جائیں۔ سانس کی تکلیف ہو تو طبی مدد لیں۔', roman: 'Emergency soorat-e-haal. Ghar mein rahein. Zaroorat na ho to bahar na jayein. Saans ki takleef ho to tibbi madad lein.' },
    asthmaRisk: 'extreme',
  },
];

export function aqiBand(aqi: number): AqiBand {
  for (const band of AQI_BANDS) {
    if (aqi >= band.min && aqi <= band.max) return band;
  }
  return AQI_BANDS[AQI_BANDS.length - 1]; // hazardous
}

// ---------- Pollen / seasonal allergy data ----------

export interface PollenSeason {
  name: TriText;
  months: string; // e.g. "Mar-May"
  severity: 'low' | 'moderate' | 'high';
  advice: TriText;
}

export const POLLEN_SEASONS: PollenSeason[] = [
  {
    name: { en: 'Spring (tree pollen)', ur: 'بہار (درختوں کا pollen)', roman: 'Bahar (darakhton ka pollen)' },
    months: 'Mar-May',
    severity: 'high',
    advice: { en: 'Keep windows closed in morning. Use antihistamine (ask pharmacist). Shower after going outside.', ur: 'صبح کھڑکیاں بند رکھیں۔ اینٹی ہسٹامائن استعمال کریں (فارماسسٹ سے پوچھیں)۔ باہر جانے کے بعد نہائیں۔', roman: 'Subah khidkiyan band rakhein. Antihistamine istemal karein (pharmacist se poochein). Bahar jane ke baad nahayein.' },
  },
  {
    name: { en: 'Monsoon (mold spores)', ur: 'برسات (فنگس)', roman: 'Barsaat (fungus)' },
    months: 'Jul-Sep',
    severity: 'moderate',
    advice: { en: 'Keep indoor humidity low. Fix leaks. Avoid damp areas.', ur: 'گھر کی نمی کم رکھیں۔ لیک کریں۔ نمی والی جگہوں سے بچیں۔', roman: 'Ghar ki nami kam rakhein. Leak karein. Nami wali jaghon se bachein.' },
  },
  {
    name: { en: 'Autumn (weed pollen)', ur: 'خزاں (گھاس pollen)', roman: 'Khazaan (ghaas pollen)' },
    months: 'Oct-Nov',
    severity: 'moderate',
    advice: { en: 'Monitor symptoms. Avoid outdoor work in windy weather.', ur: 'علامات پر نظر رکھیں۔ ہوا والے موسم میں باہر کام سے بچیں۔', roman: 'Alamaat par nazar rakhein. Hawa wale mausam mein bahar kaam se bachein.' },
  },
  {
    name: { en: 'Winter (smog season)', ur: 'سردی (دھند کا موسم)', roman: 'Sardi (dhund ka mausam)' },
    months: 'Nov-Feb',
    severity: 'high',
    advice: { en: 'Wear N95 mask outdoors. Avoid morning walks. Air purifier recommended.', ur: 'باہر N95 ماسک پہنیں۔ صبح کی سیر سے بچیں۔ ایئر پیوریفائر تجویز کیا جاتا ہے۔', roman: 'Bahar N95 mask pehnein. Subah ki seer se bachein. Air purifier tajweez kiya jata hai.' },
  },
];

// ---------- Asthma trigger guide ----------

export const ASTHMA_TRIGGERS: { trigger: TriText; avoidance: TriText }[] = [
  {
    trigger: { en: 'Dust + dust mites', ur: 'دھول + دھول کے کیڑے', roman: 'Dhool + dhool ke keeray' },
    avoidance: { en: 'Wash bedding weekly in hot water. Vacuum with HEPA filter.', ur: 'بستر ہفتہ وار گرم پانی سے دھوئیں۔ HEPA فلٹر والی ویکیوم استعمال کریں۔', roman: 'Bistar haftah-war garam pani se dhoayin. HEPA filter wali vacuum istemal karein.' },
  },
  {
    trigger: { en: 'Smoke (tobacco, wood, crop)', ur: 'دھواں (تمباکو، لکڑی، فصل)', roman: 'Dhuan (tambaku, lakri, fasal)' },
    avoidance: { en: 'Avoid smoky areas. Don\'t allow smoking indoors.', ur: 'دھوئیں والی جگہ سے بچیں۔ گھر میں تمباکو نوشی نہ کریں۔', roman: 'Dhuain wali jagah se bachein. Ghar mein tambaku noshi na karein.' },
  },
  {
    trigger: { en: 'Cold air', ur: 'ٹھنڈی ہوا', roman: 'Thandi hawa' },
    avoidance: { en: 'Cover nose/mouth with scarf in cold. Breathe through nose.', ur: 'سردی میں منہ/ناک چھتری سے ڈھانپیں۔ ناک سے سانس لیں۔', roman: 'Sardi mein munh/naak chhatri se dhaanpein. Naak se saans lein.' },
  },
  {
    trigger: { en: 'Air pollution (AQI >100)', ur: 'ہوا کی آلودگی (AQI >100)', roman: 'Hawa ki aaloodgi (AQI >100)' },
    avoidance: { en: 'Stay indoors on high AQI days. Wear N95 mask if outdoors.', ur: 'زیادہ AQI والے دن گھر پر رہیں۔ باہر N95 ماسک پہنیں۔', roman: 'Zyada AQI wale din ghar par rahein. Bahar N95 mask pehnein.' },
  },
  {
    trigger: { en: 'Strong smells + chemicals', ur: 'تیز خوشبو + کیمیکل', roman: 'Tez khushbu + chemical' },
    avoidance: { en: 'Avoid strong perfume, cleaning products, paint fumes.', ur: 'تیز عطر، صفائی کی چیزیں، پینٹ کی بو سے بچیں۔', roman: 'Tez itr, safai ki cheezein, paint ki bo se bachein.' },
  },
  {
    trigger: { en: 'Pollen (seasonal)', ur: 'پولن (موسمی)', roman: 'Pollen (mausmi)' },
    avoidance: { en: 'Check pollen forecast. Keep windows closed in season.', ur: 'پولن فورکاسٹ دیکھیں۔ موسم میں کھڑکیاں بند رکھیں۔', roman: 'Pollen forecast dekhein. Mausam mein khidkiyan band rakhein.' },
  },
];
