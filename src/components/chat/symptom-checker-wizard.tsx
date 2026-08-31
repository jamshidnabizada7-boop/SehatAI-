'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Send,
  HelpCircle,
  Body,
  Clock,
  Thermometer,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Lang } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Symptom Checker Wizard (Phase 2)
// A guided multi-step intake that helps users describe their
// symptoms before sending to the chat. Designed for low-
// literacy users who may not know how to phrase symptoms.
//
// Steps:
//   1. Body area (where is the problem?)
//   2. Main symptom (what do you feel?)
//   3. Duration (how long?)
//   4. Severity (how bad?)
//   5. Review + send to chat
// ============================================================

type BodyArea = 'head' | 'chest' | 'stomach' | 'limbs' | 'skin' | 'general';
type Severity = 'mild' | 'moderate' | 'severe';
type Duration = 'today' | 'days' | 'week' | 'longer';

interface SymptomWizardProps {
  lang: Lang;
  onSend: (query: string) => void;
  className?: string;
}

const BODY_AREAS: { value: BodyArea; label: { en: string; ur: string; roman: string }; icon: string }[] = [
  { value: 'head', label: { en: 'Head / face', ur: 'سر / چہرہ', roman: 'Sar / Chehra' }, icon: '🧠' },
  { value: 'chest', label: { en: 'Chest / breathing', ur: 'سینہ / سانس', roman: 'Seena / Saans' }, icon: '🫁' },
  { value: 'stomach', label: { en: 'Stomach / digestion', ur: 'پیٹ / ہاضمہ', roman: 'Pait / Hazma' }, icon: '🫃' },
  { value: 'limbs', label: { en: 'Arms / legs', ur: 'بازو / ٹانگیں', roman: 'Baazu / Taangein' }, icon: '🦵' },
  { value: 'skin', label: { en: 'Skin', ur: 'جلد', roman: 'Jild' }, icon: '🤚' },
  { value: 'general', label: { en: 'Whole body', ur: 'پورا جسم', roman: 'Poora jism' }, icon: '🧍' },
];

const SYMPTOMS: Record<BodyArea, { label: { en: string; ur: string; roman: string } }[]> = {
  head: [
    { label: { en: 'Headache', ur: 'سر درد', roman: 'Sar dard' } },
    { label: { en: 'Fever', ur: 'بخار', roman: 'Bukhar' } },
    { label: { en: 'Dizziness', ur: 'چکر', roman: 'Chakkar' } },
    { label: { en: 'Sore throat', ur: 'گلے میں درد', roman: 'Galay mein dard' } },
    { label: { en: 'Runny nose', ur: 'نک بہنا', roman: 'Nak behna' } },
    { label: { en: 'Vision changes', ur: 'نظر میں تبدیلی', roman: 'Nazar mein tabdeeli' } },
  ],
  chest: [
    { label: { en: 'Chest pain', ur: 'سینے میں درد', roman: 'Seene mein dard' } },
    { label: { en: 'Difficulty breathing', ur: 'سانس لینے میں مشکل', roman: 'Saans lene mein mushkil' } },
    { label: { en: 'Cough', ur: 'کھانسی', roman: 'Khansi' } },
    { label: { en: 'Wheezing', ur: 'سیٹی', roman: 'Seeti' } },
    { label: { en: 'Palpitations', ur: 'دھڑکن', roman: 'Dhadkan' } },
  ],
  stomach: [
    { label: { en: 'Abdominal pain', ur: 'پیٹ درد', roman: 'Pait dard' } },
    { label: { en: 'Nausea / vomiting', ur: 'متلی / الٹی', roman: 'Matli / Ulti' } },
    { label: { en: 'Diarrhea', ur: 'دست', roman: 'Dast' } },
    { label: { en: 'Constipation', ur: 'قبض', roman: 'Qabz' } },
    { label: { en: 'Loss of appetite', ur: 'بھوک نہ لگنا', roman: 'Bhook na lagna' } },
  ],
  limbs: [
    { label: { en: 'Joint pain', ur: 'جوڑوں میں درد', roman: 'Jodon mein dard' } },
    { label: { en: 'Swelling', ur: 'سوجن', roman: 'Soojan' } },
    { label: { en: 'Weakness', ur: 'کمزوری', roman: 'Kamzori' } },
    { label: { en: 'Numbness', ur: 'سن پن', roman: 'Sun pan' } },
    { label: { en: 'Back pain', ur: 'کمر درد', roman: 'Kamar dard' } },
  ],
  skin: [
    { label: { en: 'Rash', ur: 'دانے', roman: 'Danay' } },
    { label: { en: 'Itching', ur: 'خارش', roman: 'Khaarish' } },
    { label: { en: 'Swelling of lips/face', ur: 'ہونٹ/چہرے کی سوجن', roman: 'Hont/chehre ki soojan' } },
    { label: { en: 'Burn', ur: 'جلن', roman: 'Jalan' } },
    { label: { en: 'Wound', ur: 'زخم', roman: 'Zakham' } },
  ],
  general: [
    { label: { en: 'Fever', ur: 'بخار', roman: 'Bukhar' } },
    { label: { en: 'Feeling unwell', ur: 'بیمار محسوس ہونا', roman: 'Bimar mehsoos hona' } },
    { label: { en: 'Fatigue', ur: 'تھکاوٹ', roman: 'Thakaawat' } },
    { label: { en: 'Weight loss', ur: 'وزن کم', roman: 'Wazan kam' } },
    { label: { en: 'Sleep problems', ur: 'نیند کی مسئلہ', roman: 'Neend ki masla' } },
  ],
};

const DURATIONS: { value: Duration; label: { en: string; ur: string; roman: string } }[] = [
  { value: 'today', label: { en: 'Today (started today)', ur: 'آج شروع ہوا', roman: 'Aaj shuru hua' } },
  { value: 'days', label: { en: 'A few days (1-3 days)', ur: 'کچھ دن (1-3 دن)', roman: 'Kuch din (1-3 din)' } },
  { value: 'week', label: { en: 'About a week', ur: 'تقریباً ایک ہفتہ', roman: 'Taqreeban ek hafta' } },
  { value: 'longer', label: { en: 'More than a week', ur: 'ہفتے سے زیادہ', roman: 'Hafte se zyada' } },
];

const SEVERITIES: { value: Severity; label: { en: string; ur: string; roman: string }; color: string }[] = [
  { value: 'mild', label: { en: 'Mild (can manage)', ur: 'ہلکا', roman: 'Halka' }, color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  { value: 'moderate', label: { en: 'Moderate (troubling)', ur: 'درمیانی', roman: 'Darmiyani' }, color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  { value: 'severe', label: { en: 'Severe (need help)', ur: 'شدید', roman: 'Shadeed' }, color: 'bg-red-500/15 text-red-700 dark:text-red-400' },
];

export function SymptomCheckerWizard({ lang, onSend, className }: SymptomWizardProps) {
  const [step, setStep] = useState(0);
  const [bodyArea, setBodyArea] = useState<BodyArea | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState<Duration | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(null);

  const totalSteps = 5; // body area, symptoms, duration, severity, review
  const progress = ((step + 1) / totalSteps) * 100;

  const buildQuery = (): string => {
    const parts: string[] = [];
    if (bodyArea && symptoms.length > 0) {
      parts.push(`I have ${symptoms.join(' and ')}`);
    }
    if (duration) {
      const durMap = { today: 'since today', days: 'for a few days', week: 'for about a week', longer: 'for more than a week' };
      parts.push(durMap[duration]);
    }
    if (severity) {
      const sevMap = { mild: 'It is mild', moderate: 'It is moderate', severe: 'It is severe' };
      parts.push(sevMap[severity]);
    }
    return parts.join('. ') + '.';
  };

  const reset = () => {
    setStep(0);
    setBodyArea(null);
    setSymptoms([]);
    setDuration(null);
    setSeverity(null);
  };

  const canProceed = () => {
    if (step === 0) return bodyArea !== null;
    if (step === 1) return symptoms.length > 0;
    if (step === 2) return duration !== null;
    if (step === 3) return severity !== null;
    return true;
  };

  const handleSend = () => {
    const query = buildQuery();
    onSend(query);
    reset();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('w-full max-w-lg rounded-2xl border border-violet-500/30 bg-violet-50/30 p-4 shadow-sm dark:bg-violet-950/10', className)}
    >
      {/* header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400">
          <HelpCircle className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">
            {lang === 'ur' ? 'علامات چیکر' : lang === 'roman' ? 'Alamaat checker' : 'Symptom checker'}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {lang === 'ur' ? 'مرحلہ وار مدد' : lang === 'roman' ? 'Marhala war madad' : 'Step-by-step guidance'}
          </p>
        </div>
        {step > 0 ? (
          <Button variant="ghost" size="sm" onClick={reset} className="h-7 gap-1 px-2 text-[11px] text-muted-foreground">
            <X className="h-3 w-3" aria-hidden />
            {lang === 'ur' ? 'منسوخ' : lang === 'roman' ? 'Mansookh' : 'Cancel'}
          </Button>
        ) : null}
      </div>

      {/* progress bar */}
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full bg-violet-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* step content */}
      <AnimatePresence mode="wait">
        {/* Step 0: Body area */}
        {step === 0 ? (
          <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p className="mb-2 text-xs font-semibold text-foreground">
              {lang === 'ur' ? 'کہاں مسئلہ ہے؟' : lang === 'roman' ? 'Kahan masla hai?' : 'Where is the problem?'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {BODY_AREAS.map((area) => (
                <button
                  key={area.value}
                  type="button"
                  onClick={() => setBodyArea(area.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border p-3 transition-all',
                    bodyArea === area.value ? 'border-violet-500/50 bg-violet-500/10' : 'border-border bg-card hover:bg-accent/30',
                  )}
                >
                  <span className="text-2xl" aria-hidden>{area.icon}</span>
                  <span className={cn('text-[10px] font-semibold text-center', lang === 'ur' && 'font-urdu')} dir={lang === 'ur' ? 'rtl' : 'ltr'}>
                    {area.label[lang]}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}

        {/* Step 1: Symptoms */}
        {step === 1 ? (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p className="mb-2 text-xs font-semibold text-foreground">
              {lang === 'ur' ? 'کیا محسوس ہوتا ہے؟ (ایک سے زیادہ منتخب کر سکتے ہیں)' : lang === 'roman' ? 'Kya mehsoos hota hai? (ek se zyada muntakhib kar sakte hain)' : 'What do you feel? (select all that apply)'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SYMPTOMS[bodyArea ?? 'general'].map((symptom, i) => {
                const isSelected = symptoms.includes(symptom.label.en);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSymptoms((prev) =>
                        isSelected
                          ? prev.filter((s) => s !== symptom.label.en)
                          : [...prev, symptom.label.en],
                      );
                    }}
                    className={cn(
                      'rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
                      isSelected ? 'border-violet-500/50 bg-violet-500/10 text-violet-700 dark:text-violet-400' : 'border-border text-muted-foreground hover:bg-accent/30',
                    )}
                  >
                    {isSelected ? <Check className="mr-1 inline h-3 w-3" aria-hidden /> : null}
                    {symptom.label[lang]}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : null}

        {/* Step 2: Duration */}
        {step === 2 ? (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Clock className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" aria-hidden />
              {lang === 'ur' ? 'کب سے؟' : lang === 'roman' ? 'Kab se?' : 'How long?'}
            </p>
            <div className="space-y-1.5">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDuration(d.value)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg border p-2.5 text-start transition-colors',
                    duration === d.value ? 'border-violet-500/50 bg-violet-500/10' : 'border-border bg-card hover:bg-accent/30',
                  )}
                >
                  {duration === d.value ? <Check className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden /> : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" aria-hidden />}
                  <span className={cn('text-xs font-semibold', lang === 'ur' && 'font-urdu')} dir={lang === 'ur' ? 'rtl' : 'ltr'}>{d.label[lang]}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}

        {/* Step 3: Severity */}
        {step === 3 ? (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Thermometer className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" aria-hidden />
              {lang === 'ur' ? 'کتنا شدید ہے؟' : lang === 'roman' ? 'Kitna shadeed hai?' : 'How severe?'}
            </p>
            <div className="space-y-1.5">
              {SEVERITIES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSeverity(s.value)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg border p-2.5 text-start transition-colors',
                    severity === s.value ? 'border-violet-500/50 bg-violet-500/10' : 'border-border bg-card hover:bg-accent/30',
                  )}
                >
                  {severity === s.value ? <Check className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden /> : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" aria-hidden />}
                  <span className={cn('text-xs font-semibold', lang === 'ur' && 'font-urdu')} dir={lang === 'ur' ? 'rtl' : 'ltr'}>{s.label[lang]}</span>
                  {severity === s.value ? <Badge variant="secondary" className={cn('ml-auto text-[9px] font-bold', s.color)}>{s.label[lang]}</Badge> : null}
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}

        {/* Step 4: Review + send */}
        {step === 4 ? (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p className="mb-2 text-xs font-semibold text-foreground">
              {lang === 'ur' ? 'جائزہ' : lang === 'roman' ? 'Jaiza' : 'Review + send'}
            </p>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs leading-relaxed text-foreground/90">{buildQuery()}</p>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {lang === 'ur' ? 'یہ پیغام چیٹ بھیجا جائے گا اور سی ایچ اے آئی آپ کو محفوظ رہنمائی دے گا۔' : lang === 'roman' ? 'Yeh pegaham chat bheja jayega aur SehatAI aap ko mehfooz rahnumai dega.' : 'This will be sent to the chat and SehatAI will give you safe guidance.'}
            </p>
            <Button onClick={handleSend} className="mt-2 w-full gap-1.5 bg-violet-600 hover:bg-violet-700">
              <Send className="h-3.5 w-3.5" aria-hidden />
              {lang === 'ur' ? 'چیٹ بھیجیں' : lang === 'roman' ? 'Chat bhejein' : 'Send to chat'}
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* nav buttons */}
      {step < 4 ? (
        <div className="mt-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (step > 0 ? setStep((s) => s - 1) : reset())}
            className="gap-1.5 text-xs"
            disabled={step === 0 && !bodyArea}
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            {step === 0 ? (lang === 'ur' ? 'منسوخ' : lang === 'roman' ? 'Mansookh' : 'Cancel') : (lang === 'ur' ? 'پیچھے' : lang === 'roman' ? 'Peechay' : 'Back')}
          </Button>
          <Button
            size="sm"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="gap-1.5 bg-violet-600 hover:bg-violet-700"
          >
            {lang === 'ur' ? 'اگلا' : lang === 'roman' ? 'Agla' : 'Next'}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      ) : null}

      {/* step counter */}
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        {step + 1} / {totalSteps}
      </p>
    </motion.div>
  );
}
