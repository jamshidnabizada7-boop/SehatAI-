'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Ambulance,
  Pill,
  HeartPulse,
  Droplet,
  Flame,
  Bone,
  Zap,
  Activity,
  ShieldPlus,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  type LucideIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import type { Lang, TriText } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — First-Aid Visual Guide (Phase 2)
// A pictographic, step-by-step first-aid guide for the most
// common Pakistan emergencies. Designed for low-literacy users:
//   - Big icons (no reading required to understand the action)
//   - Short trilingual sentences (≤ 10 words)
//   - Numbered progress (Step 1 of 4)
//   - "Call 1122" is always step 1 with a one-tap tel: link
//   - "Do NOT" section at the end with red icons
//
// Data is static (curated from WHO/IFRC). The guide opens in a
// full-screen modal so it works even mid-emergency.
// ============================================================

interface VisualStep {
  icon: LucideIcon;
  text: TriText;
  /** optional tel: link or action */
  action?: { kind: 'call'; number: string; label: TriText };
}

interface VisualDoNot {
  icon: LucideIcon;
  text: TriText;
}

interface FirstAidGuide {
  id: string;
  category: string;
  title: TriText;
  /** big hero icon for the card */
  heroIcon: LucideIcon;
  /** accent color for hero icon tile */
  accent: string;
  steps: VisualStep[];
  doNot: VisualDoNot[];
  sources: string[];
}

const GUIDES: FirstAidGuide[] = [
  {
    id: 'burns',
    category: 'burns',
    title: { en: 'Severe burns', ur: 'شدید جلن', roman: 'Shadeed jalan' },
    heroIcon: Flame,
    accent: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
    steps: [
      {
        icon: Droplet,
        text: {
          en: 'Cool the burn under running water for 20 minutes',
          ur: 'جلن کو 20 منٹ بہتے پانی سے ٹھنڈا کریں',
          roman: 'Jalan ko 20 minute bahte pani se thanda karein',
        },
      },
      {
        icon: Phone,
        text: { en: 'Call 1122 if the burn is large or on face/hands', ur: 'بڑی جلن یا چہرے/ہاتھوں پر ہو تو 1122 پر کال کریں', roman: 'Bari jalan ya chehre/haathon par ho to 1122 par call karein' },
        action: { kind: 'call', number: '1122', label: { en: 'Call 1122', ur: '1122 کال کریں', roman: '1122 call karein' } },
      },
      {
        icon: ShieldPlus,
        text: { en: 'Cover loosely with a clean cloth', ur: 'صاف کپڑے سے ڈھیلا ڈھانپیں', roman: 'Saaf kapray se dheela dhaanpein' },
      },
      {
        icon: Check,
        text: { en: 'Remove jewellery before swelling starts', ur: 'سوجن سے پہلے زیورات نکالیں', roman: 'Soojan se pehle zewar nikalein' },
      },
    ],
    doNot: [
      { icon: X, text: { en: 'No toothpaste, butter, oil or ice', ur: 'ٹوتھ پیسٹ، مکھن، تیل یا برف نہ لگائیں', roman: 'Toothpaste, makkhan, tail ya barf na lagayein' } },
      { icon: X, text: { en: 'Do not burst blisters', ur: 'آبلے نہ پھاڑیں', roman: 'Aable na phaarein' } },
    ],
    sources: ['IFRC — First aid for burns', 'WHO — Burn prevention'],
  },
  {
    id: 'bleeding',
    category: 'bleeding',
    title: { en: 'Severe bleeding', ur: 'شدید خون بہنا', roman: 'Shadeed khoon behna' },
    heroIcon: Droplet,
    accent: 'bg-red-500/15 text-red-600 dark:text-red-400',
    steps: [
      {
        icon: ShieldPlus,
        text: { en: 'Press firmly on the wound with a clean cloth', ur: 'صاف کپڑے سے زخم پر مضبوط دباؤ دیں', roman: 'Saaf kapray se zakham par mazboot dabao dein' },
      },
      {
        icon: Phone,
        text: { en: 'Call 1122 immediately', ur: 'فوراً 1122 پر کال کریں', roman: 'Fori 1122 par call karein' },
        action: { kind: 'call', number: '1122', label: { en: 'Call 1122', ur: '1122 کال کریں', roman: '1122 call karein' } },
      },
      {
        icon: HeartPulse,
        text: { en: 'Raise the wound above heart level if possible', ur: 'اگر ہو سکے تو زخم کو دل سے اوپر اٹھائیں', roman: 'Agar ho sake to zakham ko dil se oopar uthayein' },
      },
      {
        icon: Check,
        text: { en: 'Keep pressing until help arrives', ur: 'مدد آنے تک دباؤ دیں', roman: 'Madad anay tak dabao dein' },
      },
    ],
    doNot: [
      { icon: X, text: { en: 'Do not wash a large wound', ur: 'بڑے زخم کو دھوئیں نہیں', roman: 'Baray zakham ko dhoain nahin' } },
      { icon: X, text: { en: 'Do not remove an object stuck in the wound', ur: 'زخم میں پھنسا ہوا شيء نہ نکالیں', roman: 'Zakham mein phansa hua cheez na nikalein' } },
    ],
    sources: ['IFRC — First aid for severe bleeding'],
  },
  {
    id: 'fracture',
    category: 'fracture',
    title: { en: 'Broken bone', ur: 'ہڈی ٹوٹنا', roman: 'Haddi tootna' },
    heroIcon: Bone,
    accent: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    steps: [
      {
        icon: Check,
        text: { en: 'Keep the person still — do not move the limb', ur: 'مریض کو سکون سے رکھیں — ہاتھ پاؤں نہ ہلائیں', roman: 'Mareez ko sukoon se rakhein — haath paon na hilayein' },
      },
      {
        icon: Phone,
        text: { en: 'Call 1122 for transport', ur: 'سفر کے لیے 1122 پر کال کریں', roman: 'Safar ke liye 1122 par call karein' },
        action: { kind: 'call', number: '1122', label: { en: 'Call 1122', ur: '1122 کال کریں', roman: '1122 call karein' } },
      },
      {
        icon: ShieldPlus,
        text: { en: 'Pad around the limb with soft material', ur: 'ہاتھ پاؤں کے گرد نرم material رکھیں', roman: 'Haath paon ke gird narm material rakhein' },
      },
      {
        icon: Check,
        text: { en: 'Support the limb with a firm object', ur: 'سخت شيء سے ہاتھ پاؤں کو سہارا دیں', roman: 'Sakht cheez se haath paon ko sahara dein' },
      },
    ],
    doNot: [
      { icon: X, text: { en: 'Do not try to straighten the bone', ur: 'ہڈی سیدھی کرنے کی کوشش نہ کریں', roman: 'Haddi seedhi karne ki koshish na karein' } },
      { icon: X, text: { en: 'Do not give food or drink', ur: 'کھانا یا پانی نہ دیں', roman: 'Khana ya pani na dein' } },
    ],
    sources: ['IFRC — First aid for fractures'],
  },
  {
    id: 'seizure',
    category: 'seizure',
    title: { en: 'Seizure / fits', ur: 'دورہ / مرگی', roman: 'Dorra / mirgi' },
    heroIcon: Activity,
    accent: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    steps: [
      {
        icon: ShieldPlus,
        text: { en: 'Clear the area of hard/sharp objects', ur: 'سخت/تیز اشیاء دور کریں', roman: 'Sakht/tez ashia door karein' },
      },
      {
        icon: Check,
        text: { en: 'Cushion the head — do not restrain', ur: 'سر کے نیچے کمرا رکھیں — نہ روکیں', roman: 'Sar ke neeche kamar rakhein — na rokein' },
      },
      {
        icon: Phone,
        text: { en: 'Call 1122 if seizure lasts over 5 minutes', ur: 'اگر دورہ 5 منٹ سے زیادہ رہے تو 1122 پر کال کریں', roman: 'Agar dorra 5 minute se zyada rahe to 1122 par call karein' },
        action: { kind: 'call', number: '1122', label: { en: 'Call 1122', ur: '1122 کال کریں', roman: '1122 call karein' } },
      },
      {
        icon: Check,
        text: { en: 'After shaking stops, roll them onto their side', ur: 'کانپنا رکنے کے بعد بائیں کرو پھیر دیں', roman: 'Kaanpna rukne ke baad baen karou phir dein' },
      },
    ],
    doNot: [
      { icon: X, text: { en: 'Do not put anything in their mouth', ur: 'منہ میں کچھ نہ ڈالیں', roman: 'Munh mein kuch na daalein' } },
      { icon: X, text: { en: 'Do not hold them down', ur: 'انہیں دبائیں نہیں', roman: 'Inhein dabayein nahin' } },
    ],
    sources: ['WHO — Epilepsy management', 'ILAE — First-aid for seizures'],
  },
  {
    id: 'electric-shock',
    category: 'electric-shock',
    title: { en: 'Electric shock', ur: 'برقی جھٹکا', roman: 'Barqi jhatka' },
    heroIcon: Zap,
    accent: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
    steps: [
      {
        icon: X,
        text: { en: 'Do NOT touch the person until power is off', ur: 'بجلی بند ہونے تک مریض کو چھوئیں نہیں', roman: 'Bijli band hone tak mareez ko chhoain nahin' },
      },
      {
        icon: Zap,
        text: { en: 'Switch off the main power switch', ur: 'مین بجلی کا سوئچ بند کریں', roman: 'Main bijli ka switch band karein' },
      },
      {
        icon: Phone,
        text: { en: 'Call 1122 immediately', ur: 'فوراً 1122 پر کال کریں', roman: 'Fori 1122 par call karein' },
        action: { kind: 'call', number: '1122', label: { en: 'Call 1122', ur: '1122 کال کریں', roman: '1122 call karein' } },
      },
      {
        icon: HeartPulse,
        text: { en: 'If not breathing, start CPR if trained', ur: 'اگر سانس نہ ہو تو تربیت ہو تو CPR شروع کریں', roman: 'Agar saans na ho to tarbiyat ho to CPR shuru karein' },
      },
    ],
    doNot: [
      { icon: X, text: { en: 'Never use water on electrical fires', ur: 'برقی آگ پر پانی استعمال نہ کریں', roman: 'Barqi aag par pani istemal na karein' } },
      { icon: X, text: { en: 'Do not cut the wire yourself', ur: 'تار خود نہ کاٹیں', roman: 'Taar khud na kaaein' } },
    ],
    sources: ['IFRC — Electric shock first aid'],
  },
  {
    id: 'choking',
    category: 'choking',
    title: { en: 'Choking', ur: 'چھوکے کا حملہ', roman: 'Chokay ka hamla' },
    heroIcon: HeartPulse,
    accent: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
    steps: [
      {
        icon: ShieldPlus,
        text: { en: 'Encourage them to cough hard', ur: 'انہیں زور سے کھانسی کرنے کہیں', roman: 'Inhein zor se khansi karne kahein' },
      },
      {
        icon: HeartPulse,
        text: { en: 'Lean them forward, give 5 back blows', ur: 'آگے جھکائیں، 5 بار پیٹھ پر ماریں', roman: 'Aagay jhukayein, 5 baar peeth par maarein' },
      },
      {
        icon: Phone,
        text: { en: 'Call 1122 if they cannot breathe', ur: 'اگر سانس نہ لے سکے تو 1122 پر کال کریں', roman: 'Agar saans na le sake to 1122 par call karein' },
        action: { kind: 'call', number: '1122', label: { en: 'Call 1122', ur: '1122 کال کریں', roman: '1122 call karein' } },
      },
      {
        icon: Check,
        text: { en: 'Start abdominal thrusts (Heimlich) if trained', ur: 'تربیت ہو تو ہیملک مانیور کریں', roman: 'Tarbiyat ho to Heimlich maneuver karein' },
      },
    ],
    doNot: [
      { icon: X, text: { en: 'Do not give water if they cannot cough', ur: 'کھانسی نہ ہو تو پانی نہ دیں', roman: 'Khansi na ho to pani na dein' } },
    ],
    sources: ['IFRC — First aid for choking'],
  },
];

interface FirstAidGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialGuideId?: string;
}

export function FirstAidGuideModal({ open, onOpenChange, initialGuideId }: FirstAidGuideModalProps) {
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const [selectedId, setSelectedId] = useState<string | null>(initialGuideId ?? null);
  const [stepIndex, setStepIndex] = useState(0);

  const selected = GUIDES.find((g) => g.id === (initialGuideId ?? selectedId));

  const handleClose = () => {
    setSelectedId(null);
    setStepIndex(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="custom-scrollbar max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Ambulance className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden />
            {uiLang === 'ur' ? 'ابتدائی طبی امداد' : uiLang === 'roman' ? 'Ibtidai tibbi imdaad' : 'First-aid visual guide'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {uiLang === 'ur' ? 'بصری مرحلہ وار ابتدائی طبی امداد گائیڈ' : uiLang === 'roman' ? 'Basri marhala war ibtidai tibbi imdaad guide' : 'Pictographic step-by-step first-aid guide'}
          </DialogDescription>
        </DialogHeader>

        {!selected ? (
          /* guide picker */
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {uiLang === 'ur'
                ? 'ایمرجنسی کی قسم منتخب کریں:'
                : uiLang === 'roman'
                  ? 'Emergency ki qisam muntakhib karein:'
                  : 'Choose the emergency type:'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {GUIDES.map((g) => {
                const HeroIcon = g.heroIcon;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => { setSelectedId(g.id); setStepIndex(0); }}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center shadow-sm transition-all hover:border-red-500/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110', g.accent)}>
                      <HeroIcon className="h-6 w-6" aria-hidden />
                    </span>
                    <span className={cn('text-xs font-bold leading-tight text-foreground', uiLang === 'ur' && 'font-urdu')} dir={uiLang === 'ur' ? 'rtl' : 'ltr'}>
                      {g.title[uiLang]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* step-by-step view */
          <FirstAidStepView
            guide={selected}
            lang={uiLang}
            stepIndex={stepIndex}
            onStepChange={setStepIndex}
            onBack={() => { setSelectedId(null); setStepIndex(0); }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FirstAidStepView({
  guide,
  lang,
  stepIndex,
  onStepChange,
  onBack,
}: {
  guide: FirstAidGuide;
  lang: Lang;
  stepIndex: number;
  onStepChange: (i: number) => void;
  onBack: () => void;
}) {
  const HeroIcon = guide.heroIcon;
  const step = guide.steps[stepIndex];
  const StepIcon = step.icon;
  const isLast = stepIndex === guide.steps.length - 1;

  return (
    <div className="space-y-4">
      {/* header with hero icon + title */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
        <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', guide.accent)}>
          <HeroIcon className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-bold text-foreground', lang === 'ur' && 'font-urdu')} dir={lang === 'ur' ? 'rtl' : 'ltr'}>
            {guide.title[lang]}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {lang === 'ur' ? `قدم ${stepIndex + 1} از ${guide.steps.length}` : lang === 'roman' ? `Qadam ${stepIndex + 1} of ${guide.steps.length}` : `Step ${stepIndex + 1} of ${guide.steps.length}`}
          </p>
        </div>
      </div>

      {/* progress dots */}
      <div className="flex justify-center gap-1.5">
        {guide.steps.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onStepChange(i)}
            aria-label={`Step ${i + 1}`}
            className={cn(
              'h-2 rounded-full transition-all',
              i === stepIndex ? 'w-6 bg-primary' : i < stepIndex ? 'w-2 bg-primary/50' : 'w-2 bg-muted',
            )}
          />
        ))}
      </div>

      {/* current step */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center"
        >
          <span className={cn('flex h-20 w-20 items-center justify-center rounded-2xl', guide.accent)}>
            <StepIcon className="h-10 w-10" aria-hidden />
          </span>
          <p className={cn('text-base font-semibold leading-relaxed text-foreground', lang === 'ur' && 'font-urdu')} dir={lang === 'ur' ? 'rtl' : 'ltr'}>
            {step.text[lang]}
          </p>
          {step.action?.kind === 'call' ? (
            <a
              href={`tel:${step.action.number}`}
              className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
              aria-label={step.action.label[lang]}
            >
              <Phone className="h-5 w-5" aria-hidden />
              {step.action.label[lang]}
            </a>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* nav buttons */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (stepIndex === 0 ? onBack() : onStepChange(stepIndex - 1))}
          className="gap-1.5"
          aria-label={lang === 'ur' ? 'پیچھے' : lang === 'roman' ? 'Peechay' : 'Back'}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {lang === 'ur' ? 'پیچھے' : lang === 'roman' ? 'Peechay' : 'Back'}
        </Button>
        {isLast ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="gap-1.5"
          >
            <Check className="h-4 w-4" aria-hidden />
            {lang === 'ur' ? 'ہو گیا' : lang === 'roman' ? 'Ho gaya' : 'Done'}
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => onStepChange(stepIndex + 1)}
            className="gap-1.5"
            aria-label={lang === 'ur' ? 'اگلا' : lang === 'roman' ? 'Agla' : 'Next'}
          >
            {lang === 'ur' ? 'اگلا' : lang === 'roman' ? 'Agla' : 'Next'}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>

      {/* do not section — shown on last step */}
      {isLast && guide.doNot.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-red-500/30 bg-red-50/40 p-3 dark:bg-red-950/20"
        >
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400">
            <X className="h-3.5 w-3.5" aria-hidden />
            {lang === 'ur' ? 'مت کریں' : lang === 'roman' ? 'Mat karein' : 'Do NOT'}
          </p>
          <ul className="space-y-1.5">
            {guide.doNot.map((d, i) => {
              const DIcon = d.icon;
              return (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-red-800 dark:text-red-300">
                  <DIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
                  <span className={cn(lang === 'ur' && 'font-urdu')} dir={lang === 'ur' ? 'rtl' : 'ltr'}>
                    {d.text[lang]}
                  </span>
                </li>
              );
            })}
          </ul>
        </motion.div>
      ) : null}

      {/* sources */}
      <p className="text-center text-[10px] text-muted-foreground">
        {guide.sources.join(' · ')}
      </p>
    </div>
  );
}
