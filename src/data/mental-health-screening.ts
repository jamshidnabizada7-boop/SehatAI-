// ============================================================
// SehatAI — Mental Health Screening Data (Phase 2)
// PHQ-9 (depression) + GAD-7 (anxiety) validated screening tools.
//
// Sources:
//   - PHQ-9: Patient Health Questionnaire-9 (public domain, validation
//     across many cultures including Urdu).
//   - GAD-7: Generalized Anxiety Disorder-7 (public domain).
//
// SAFETY: These are SCREENING tools, not diagnostic. A high score
// does NOT mean the person has depression/anxiety — it means they
// should see a clinician. The UI always says this explicitly +
// routes to crisis lines if suicidal ideation is detected.
// ============================================================

import type { TriText } from '@/lib/types';

export interface ScreeningQuestion {
  id: number;
  text: TriText;
}

export interface ScreeningOption {
  value: number;
  label: TriText;
}

export interface ScreeningResult {
  score: number;
  maxScore: number;
  severity: 'minimal' | 'mild' | 'moderate' | 'moderately-severe' | 'severe';
  title: TriText;
  description: TriText;
  recommendation: TriText;
  color: string;
}

export const PHQ9_OPTIONS: ScreeningOption[] = [
  { value: 0, label: { en: 'Not at all', ur: 'بالکل نہیں', roman: 'Bilkul nahin' } },
  { value: 1, label: { en: 'Several days', ur: 'کئی دن', roman: 'Kai din' } },
  { value: 2, label: { en: 'More than half the days', ur: 'نصف سے زیادہ دن', roman: 'Nisf se zyada din' } },
  { value: 3, label: { en: 'Nearly every day', ur: 'تقریباً ہر دن', roman: 'Taqreeban har din' } },
];

export const PHQ9_QUESTIONS: ScreeningQuestion[] = [
  {
    id: 1,
    text: { en: 'Little interest or pleasure in doing things', ur: 'چیزیں کرنے میں کم دلچسپی یا خوشی', roman: 'Cheezein karne mein kam dilchaspi ya khushi' },
  },
  {
    id: 2,
    text: { en: 'Feeling down, depressed, or hopeless', ur: 'اداس، مایوس یا ناامید', roman: 'Udaas, mayoos ya na-umeed' },
  },
  {
    id: 3,
    text: { en: 'Trouble falling/staying asleep, or sleeping too much', ur: 'نیند آنے یا رک رک کر آنے میں مشکل، یا زیادہ نیند', roman: 'Neend aane ya ruk ruk kar aane mein mushkil, ya zyada neend' },
  },
  {
    id: 4,
    text: { en: 'Feeling tired or having little energy', ur: 'تھکاوٹ یا کم توانائی', roman: 'Thakaawat ya kam tawanai' },
  },
  {
    id: 5,
    text: { en: 'Poor appetite or overeating', ur: 'بھوک کم لگنا یا زیادہ کھانا', roman: 'Bhook kam lagna ya zyada khana' },
  },
  {
    id: 6,
    text: { en: 'Feeling bad about yourself — or that you are a failure', ur: 'اپنے بارے میں برا لگنا یا خود کو ناکام سمجھنا', roman: 'Apne baray mein bura lagna ya khud ko nakaam samajhna' },
  },
  {
    id: 7,
    text: { en: 'Trouble concentrating on things', ur: 'چیزوں پر توجہ مرکوز کرنے میں مشکل', roman: 'Cheezon par tawajjuh markooz karne mein mushkil' },
  },
  {
    id: 8,
    text: { en: 'Moving/speaking slowly OR being fidgety/restless', ur: 'آہستہ حرکت/بات یا بے چینی', roman: 'Aahista harkat/baat ya bechaini' },
  },
  {
    id: 9,
    text: { en: 'Thoughts that you would be better off dead or of hurting yourself', ur: 'یہ سوچ کہ مر جانا بہتر ہے یا خود کو نقصان پہنچانا', roman: 'Yeh soch ke mar jana behtar hai ya khud ko nuksan pahunchana' },
  },
];

export const GAD7_OPTIONS: ScreeningOption[] = PHQ9_OPTIONS;

export const GAD7_QUESTIONS: ScreeningQuestion[] = [
  {
    id: 1,
    text: { en: 'Feeling nervous, anxious, or on edge', ur: 'گھبراہٹ، اضطراب، یا بے چینی', roman: 'Ghabrahat, iztarab, ya bechaini' },
  },
  {
    id: 2,
    text: { en: 'Not being able to stop or control worrying', ur: 'فکر کو روک نہ سکنا', roman: 'Fikr ko rok na sakna' },
  },
  {
    id: 3,
    text: { en: 'Worrying too much about different things', ur: 'مختلف باتوں کی بہت زیادہ فکر', roman: 'Mukhtalif baton ki bohat zyada fikr' },
  },
  {
    id: 4,
    text: { en: 'Trouble relaxing', ur: 'آرام کرنے میں مشکل', roman: 'Aaraam karne mein mushkil' },
  },
  {
    id: 5,
    text: { en: 'Being so restless that it is hard to sit still', ur: 'اتنی بے چینی کہ بیٹھنا مشکل', roman: 'Itni bechaini ke baithna mushkil' },
  },
  {
    id: 6,
    text: { en: 'Becoming easily annoyed or irritable', ur: 'جلدی چڑھ جانا یا irritate ہونا', roman: 'Jaldi charrh jana ya irritate hona' },
  },
  {
    id: 7,
    text: { en: 'Feeling afraid as if something awful might happen', ur: 'خوف کہ کوئی برا واقعہ ہو سکتا ہے', roman: 'Khauf ke koi bura waqea ho sakta hai' },
  },
];

// ---------- Scoring ----------

export function phq9Result(score: number): ScreeningResult {
  const severity =
    score <= 4 ? 'minimal' :
    score <= 9 ? 'mild' :
    score <= 14 ? 'moderate' :
    score <= 19 ? 'moderately-severe' :
    'severe';
  const config = {
    minimal: {
      title: { en: 'Minimal depression', ur: 'ہلکی ڈپریشن', roman: 'Halki depression' },
      description: { en: 'Your score suggests minimal or no depression symptoms.', ur: 'آپ کا اسکور بتاتا ہے کہ ڈپریشن کی علامات نہ ہونے کے برابر ہیں۔', roman: 'Aap ka score batata hai ke depression ki alamaat na hone ke barabar hain.' },
      recommendation: { en: 'Continue self-care. Re-check if things change.', ur: 'خود کی دیکھ بھال جاری رکھیں۔ تبدیلی ہو تو دوبارہ چیک کریں۔', roman: 'Khud ki dekh bhaal jari rakhein. Tabdeeli ho to dobara check karein.' },
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    mild: {
      title: { en: 'Mild depression', ur: 'ہلکی ڈپریشن', roman: 'Halki depression' },
      description: { en: 'Your score suggests mild depression symptoms.', ur: 'آپ کے اسکور سے ہلکی ڈپریشن کی علامات معلوم ہوتی ہیں۔', roman: 'Aap ke score se halki depression ki alamaat maloom hoti hain.' },
      recommendation: { en: 'Consider talking to someone you trust. See a doctor if symptoms persist beyond 2 weeks.', ur: 'قابل بھروسہ شخص سے بات کرنے پر غور کریں۔ علامات 2 ہفتے سے زیادہ رہیں تو ڈاکٹر کو دیکھیں۔', roman: 'Qaabil-e-bharoosa shakhs se baat karne par ghaur karein. Alamaat 2 hafte se zyada rahain to doctor ko dekhein.' },
      color: 'text-amber-600 dark:text-amber-400',
    },
    moderate: {
      title: { en: 'Moderate depression', ur: 'درمیانی ڈپریشن', roman: 'Darmiyani depression' },
      description: { en: 'Your score suggests moderate depression symptoms.', ur: 'آپ کے اسکور سے درمیانی ڈپریشن کی علامات معلوم ہوتی ہیں۔', roman: 'Aap ke score se darmiyani depression ki alamaat maloom hoti hain.' },
      recommendation: { en: 'See a doctor or counselor. Treatment can help.', ur: 'ڈاکٹر یا کاؤنسلر کو دیکھیں۔ علاج مدد کر سکتا ہے۔', roman: 'Doctor ya counselor ko dekhein. Ilaaj madad kar sakta hai.' },
      color: 'text-orange-600 dark:text-orange-400',
    },
    'moderately-severe': {
      title: { en: 'Moderately severe depression', ur: 'درمیانی شدید ڈپریشن', roman: 'Darmiyani shadeed depression' },
      description: { en: 'Your score suggests moderately severe depression symptoms.', ur: 'آپ کے اسکور سے درمیانی شدید ڈپریشن کی علامات معلوم ہوتی ہیں۔', roman: 'Aap ke score se darmiyani shadeed depression ki alamaat maloom hoti hain.' },
      recommendation: { en: 'See a doctor soon. Treatment is important.', ur: 'جلد ڈاکٹر کو دیکھیں۔ علاج ضروری ہے۔', roman: 'Jald doctor ko dekhein. Ilaaj zaroori hai.' },
      color: 'text-red-600 dark:text-red-400',
    },
    severe: {
      title: { en: 'Severe depression', ur: 'شدید ڈپریشن', roman: 'Shadeed depression' },
      description: { en: 'Your score suggests severe depression symptoms.', ur: 'آپ کے اسکور سے شدید ڈپریشن کی علامات معلوم ہوتی ہیں۔', roman: 'Aap ke score se shadeed depression ki alamaat maloom hoti hain.' },
      recommendation: { en: 'See a doctor as soon as possible. You deserve support.', ur: 'جلسے میں جلد از جلد ڈاکٹر کو دیکھیں۔ آپ مدد کے حقدار ہیں۔', roman: 'Jalse mein jald az jald doctor ko dekhein. Aap madad ke haqdaar hain.' },
      color: 'text-red-700 dark:text-red-400',
    },
  }[severity];
  return { score, maxScore: 27, severity, ...config };
}

export function gad7Result(score: number): ScreeningResult {
  const severity =
    score <= 4 ? 'minimal' :
    score <= 9 ? 'mild' :
    score <= 14 ? 'moderate' :
    'severe';
  const config = {
    minimal: {
      title: { en: 'Minimal anxiety', ur: 'ہلکی گھبراہٹ', roman: 'Halki ghabrahat' },
      description: { en: 'Your score suggests minimal or no anxiety symptoms.', ur: 'آپ کا اسکور بتاتا ہے کہ گھبراہٹ کی علامات نہ ہونے کے برابر ہیں۔', roman: 'Aap ka score batata hai ke ghabrahat ki alamaat na hone ke barabar hain.' },
      recommendation: { en: 'Continue self-care. Re-check if things change.', ur: 'خود کی دیکھ بھال جاری رکھیں۔', roman: 'Khud ki dekh bhaal jari rakhein.' },
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    mild: {
      title: { en: 'Mild anxiety', ur: 'ہلکی گھبراہٹ', roman: 'Halki ghabrahat' },
      description: { en: 'Your score suggests mild anxiety symptoms.', ur: 'آپ کے اسکور سے ہلکی گھبراہٹ کی علامات معلوم ہوتی ہیں۔', roman: 'Aap ke score se halki ghabrahat ki alamaat maloom hoti hain.' },
      recommendation: { en: 'Try relaxation techniques. See a doctor if persistent.', ur: 'آرام کی تکنیک آزمائیں۔ مسلسل رہے تو ڈاکٹر کو دیکھیں۔', roman: 'Aaraam ki taknik azmayein. Musalsal rahe to doctor ko dekhein.' },
      color: 'text-amber-600 dark:text-amber-400',
    },
    moderate: {
      title: { en: 'Moderate anxiety', ur: 'درمیانی گھبراہٹ', roman: 'Darmiyani ghabrahat' },
      description: { en: 'Your score suggests moderate anxiety symptoms.', ur: 'آپ کے اسکور سے درمیانی گھبراہٹ کی علامات معلوم ہوتی ہیں۔', roman: 'Aap ke score se darmiyani ghabrahat ki alamaat maloom hoti hain.' },
      recommendation: { en: 'See a doctor or counselor. Treatment can help.', ur: 'ڈاکٹر یا کاؤنسلر کو دیکھیں۔', roman: 'Doctor ya counselor ko dekhein.' },
      color: 'text-orange-600 dark:text-orange-400',
    },
    severe: {
      title: { en: 'Severe anxiety', ur: 'شدید گھبراہٹ', roman: 'Shadeed ghabrahat' },
      description: { en: 'Your score suggests severe anxiety symptoms.', ur: 'آپ کے اسکور سے شدید گھبراہٹ کی علامات معلوم ہوتی ہیں۔', roman: 'Aap ke score se shadeed ghabrahat ki alamaat maloom hoti hain.' },
      recommendation: { en: 'See a doctor soon. You deserve support.', ur: 'جلد ڈاکٹر کو دیکھیں۔', roman: 'Jald doctor ko dekhein.' },
      color: 'text-red-600 dark:text-red-400',
    },
    'moderately-severe': {
      title: { en: 'Severe anxiety', ur: 'شدید گھبراہٹ', roman: 'Shadeed ghabrahat' },
      description: { en: 'Your score suggests severe anxiety symptoms.', ur: 'آپ کے اسکور سے شدید گھبراہٹ کی علامات معلوم ہوتی ہیں۔', roman: 'Aap ke score se shadeed ghabrahat ki alamaat maloom hoti hain.' },
      recommendation: { en: 'See a doctor soon. You deserve support.', ur: 'جلد ڈاکٹر کو دیکھیں۔', roman: 'Jald doctor ko dekhein.' },
      color: 'text-red-600 dark:text-red-400',
    },
  }[severity];
  return { score, maxScore: 21, severity, ...config };
}

export const MENTAL_HEALTH_DISCLAIMER: TriText = {
  en: 'This is a screening tool, NOT a diagnosis. A high score does not mean you have depression or anxiety — it means you should see a clinician. If you have thoughts of harming yourself, call 1122 or 1166 immediately.',
  ur: 'یہ ایک اسکریننگ ٹول ہے، تشخیص نہیں۔ زیادہ اسکور کا مطلب یہ نہیں کہ آپ کو ڈپریشن یا گھبراہٹ ہے — بلکہ آپ کو ڈاکٹر کو دکھانا چاہیے۔ اگر آپ کو خود کو نقصان پہنچانے کے خیالات آئیں تو فوراً 1122 یا 1166 پر کال کریں۔',
  roman: 'Yeh ek screening tool hai, tashkhees nahin. Zyada score ka matlab yeh nahin ke aap ko depression ya ghabrahat hai — balke aap ko doctor ko dikhana chahiye. Agar aap ko khud ko nuksan pahunchane ke khayalat aayein to fori 1122 ya 1166 par call karein.',
};
