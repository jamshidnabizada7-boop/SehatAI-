'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Phone,
  Plus,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuthShell } from '@/components/auth/auth-shell';
import { TriInline, TriStack, type TriStrings } from '@/components/auth/trilingual';
import { useChatStore } from '@/lib/store/chat-store';
import { cn } from '@/lib/utils';
import {
  CHRONIC_CONDITIONS,
  emptyProfile,
  isValidPhone,
  newIceId,
  normalizeLineList,
  saveProfile,
  type AgeBand,
  type HealthProfile,
  type IceContact,
  type Sex,
} from '@/lib/profile';

const AGE_BAND_ORDER: AgeBand[] = [
  'undisclosed',
  'child',
  'adolescent',
  'young-adult',
  'middle-adult',
  'elderly',
];

const AGE_LABELS: Record<AgeBand, TriStrings> = {
  undisclosed: { en: 'Prefer not to say', ur: 'بتانے سے معذرت', roman: 'Naheen batana' },
  child: { en: 'Child (under 12)', ur: 'بچہ (12 سے کم)', roman: 'Baccha (12 saal se kam)' },
  adolescent: { en: 'Adolescent (12–17)', ur: 'نوجوان (12–17)', roman: 'Nojawan (12–17 saal)' },
  'young-adult': { en: 'Young adult (18–34)', ur: 'نوجوان بالغ (18–34)', roman: 'Nojawan adult (18–34 saal)' },
  'middle-adult': { en: 'Adult (35–59)', ur: 'بالغ (35–59)', roman: 'Adult (35–59 saal)' },
  elderly: { en: 'Elderly (60+)', ur: 'بزرگ (60+)', roman: 'Buzurg (60+ saal)' },
};

const SEX_ORDER: Sex[] = ['undisclosed', 'female', 'male'];
const SEX_LABELS: Record<Sex, TriStrings> = {
  undisclosed: { en: 'Prefer not to say', ur: 'بتانے سے معذرت', roman: 'Naheen batana' },
  female: { en: 'Female', ur: 'خواتین', roman: 'Aurat' },
  male: { en: 'Male', ur: 'مرد', roman: 'Mard' },
};

const RETENTION_OPTIONS = [
  { value: '30', en: '30 days', ur: '30 دن' },
  { value: '90', en: '90 days', ur: '90 دن' },
  { value: '365', en: '1 year', ur: '1 سال' },
  { value: '1825', en: '5 years', ur: '5 سال' },
  { value: '0', en: 'Until I delete it', ur: 'جب تک میں مٹا نہ دوں' },
];

const CONSENT_UR =
  'میں SehatAI کے استعمال سے متعلق معلومات کے جمع شدہ ہونے سے اتفاق کرتا/کرتی ہوں۔ میری معلومات صرف میری صحت کے مشورے کے لیے استعمال ہوگی اور میں کسی بھی وقت اپنا ڈیٹا مٹا سکتا/سکتی ہوں۔';
const CONSENT_EN =
  'I agree that SehatAI may collect information about my use of the service. My information is used only for my health guidance, and I can delete my data at any time.';

const T = {
  welcome: {
    en: 'Welcome to SehatAI',
    ur: 'SehatAI میں خوش آمدید',
    roman: 'SehatAI mein khush aamdeed',
  },
  stepOf: { en: 'Step', ur: 'قدم', roman: 'Qadam' },
  // step 1
  s1Title: { en: 'Your consent', ur: 'آپ کی رضامندی', roman: 'Aap ki razamandi' },
  s1Body: {
    en: 'Please read and confirm the consent below to continue.',
    ur: 'جاری رکھنے کے لیے نیچے دی گئی رضامندی پڑھ کر تصدیق کریں۔',
    roman: 'Jari rakhne ke liye neeche di gayi razamandi parh kar tasdeeq karein.',
  },
  agree: { en: 'I agree', ur: 'میں اتفاق کرتا/کرتی ہوں', roman: 'Main ittefaq karta/karti hoon' },
  consentRequired: {
    en: 'Please tick the consent box to continue.',
    ur: 'جاری رکھنے کے لیے رضامندی کے خانے پر ٹک لگائیں۔',
    roman: 'Jari rakhne ke liye razamandi ke khane par tick lagayein.',
  },
  consentFailed: {
    en: 'Could not record consent — please try again.',
    ur: 'رضامندی محفوظ نہیں ہو سکی — دوبارہ کوشش کریں۔',
    roman: 'Razamandi mehfooz nahin ho saki — dobara koshish karein.',
  },
  retentionTitle: { en: 'Keep my data for', ur: 'میرا ڈیٹا کتنی مدت تک رکھیں', roman: 'Mera data kitni muddat tak rakhein' },
  // step 2
  s2Title: { en: 'About you', ur: 'آپ کے بارے میں', roman: 'Aap ke baare mein' },
  s2Body: {
    en: 'This helps SehatAI tailor guidance to you. Everything is optional — you can change it later in My Health.',
    ur: 'اس سے SehatAI آپ کے لیے بہتر رہنمائی دے سکتا ہے۔ سب کچھ اختیاری ہے — بعد میں "میری صحت" سے تبدیل کر سکتے ہیں۔',
    roman: 'Is se SehatAI aap ke liye behtar rahnumai de sakta hai. Sab kuch ikhtiyari hai — baad mein "Meri Sehat" se badal sakte hain.',
  },
  ageBand: { en: 'Age band', ur: 'عمر کا گروہ', roman: 'Umar ka groh' },
  sex: { en: 'Sex', ur: 'جنس', roman: 'Jins' },
  pregnant: { en: 'Pregnant', ur: 'حاملہ', roman: 'Haamla' },
  conditions: { en: 'Chronic conditions', ur: 'دائمی بیماریاں', roman: 'Daimi bimariyan' },
  conditionsHint: {
    en: 'Tap all that apply.',
    ur: 'جو لاگو ہوں وہ سب منتخب کریں۔',
    roman: 'Jo lagu hon woh sab muntakhib karein.',
  },
  allergies: { en: 'Allergies (one per line)', ur: 'الرجیز (فی سطر ایک)', roman: 'Allergies (fi satar ek)' },
  meds: { en: 'Medications (one per line)', ur: 'ادویات (فی سطر ایک)', roman: 'Adwaya (fi satar ek)' },
  ice: { en: 'In case of emergency (up to 3)', ur: 'ایمرجنسی میں (زیادہ سے زیادہ 3)', roman: 'Emergency mein (zyada se zyada 3)' },
  iceName: { en: 'Name', ur: 'نام', roman: 'Naam' },
  icePhone: { en: 'Phone', ur: 'فون', roman: 'Phone' },
  iceRelation: { en: 'Relation', ur: 'رشتہ', roman: 'Rishta' },
  iceAdd: { en: 'Add contact', ur: 'رابطہ شامل کریں', roman: 'Rabta shamil karein' },
  iceRemove: { en: 'Remove', ur: 'ہٹائیں', roman: 'Hatayein' },
  iceBadPhone: {
    en: 'Enter a valid phone number (7–15 digits).',
    ur: 'درست فون نمبر درج کریں (7 تا 15 ہندسے)۔',
    roman: 'Durust phone number darj karein (7 ta 15 hindse).',
  },
  // step 3
  s3Title: { en: 'Try it out', ur: 'آزمائیں', roman: 'Azmaayein' },
  s3Body: {
    en: 'Tap any language to try your first question when the chat opens.',
    ur: 'جب چیٹ کھلے تو پہلا سوال آزمانے کے لیے کسی بھی زبان پر ٹیپ کریں۔',
    roman: 'Jab chat khule to pehla sawal azmaane ke liye kisi bhi zaban par tap karein.',
  },
  demoPrompt: { en: 'I have a headache', ur: 'میرے سر میں درد ہے', roman: 'Mere sar mein dard hai' },
  emergencyTitle: { en: 'In an emergency', ur: 'ایمرجنسی میں', roman: 'Emergency mein' },
  emergencyBody: {
    en: 'SehatAI detects emergencies and shows the 1122 button immediately.',
    ur: 'SehatAI ایمرجنسی پہچان کر فوراً 1122 کا بٹن دکھاتا ہے۔',
    roman: 'SehatAI emergency pehchan kar foran 1122 ka button dikhata hai.',
  },
  call1122: { en: 'Call 1122', ur: '1122 پر کال کریں', roman: '1122 par call karein' },
  // step 4
  s4Title: { en: 'Offline pack', ur: 'آف لائن پیک', roman: 'Offline pack' },
  s4Body: {
    en: 'SehatAI keeps a verified offline health pack ready so basic guidance works even without internet.',
    ur: 'SehatAI تصدیق شدہ آف لائن ہیلتھ پیک تیار رکھتا ہے تاکہ بنیادی رہنمائی انٹرنیٹ کے بغیر بھی مل سکے۔',
    roman: 'SehatAI tasdeeq-shudah offline health pack tayyar rakhta hai taake bunyadi rahnumai internet ke baghair bhi mil sake.',
  },
  // nav
  back: { en: 'Back', ur: 'واپس', roman: 'Wapas' },
  next: { en: 'Next', ur: 'آگے', roman: 'Aagay' },
  skip: { en: 'Skip', ur: 'چھوڑیں', roman: 'Chhorein' },
  finish: { en: 'Start chatting', ur: 'چیٹ شروع کریں', roman: 'Chat shuru karein' },
  saving: { en: 'Saving…', ur: 'محفوظ ہو رہا ہے…', roman: 'Mehfooz ho raha hai…' },
  saved: {
    en: 'Profile saved — welcome!',
    ur: 'پروفائل محفوظ ہو گئی — خوش آمدید!',
    roman: 'Profile mehfooz ho gayi — khush aamdeed!',
  },
  saveFailed: {
    en: 'Could not save your profile — you can retry or continue.',
    ur: 'پروفائل محفوظ نہیں ہو سکی — دوبارہ کوشش کریں یا جاری رکھیں۔',
    roman: 'Profile mehfooz nahin ho saki — dobara koshish karein ya jari rakhein.',
  },
  continueAnyway: { en: 'Continue anyway', ur: 'پھر بھی جاری رکھیں', roman: 'Phir bhi jari rakhein' },
};

interface MeResponse {
  user?: { id: string; email: string; name: string | null; consented: boolean; retentionDays: number | null } | null;
}

const STEPS = 4;

export function OnboardingFlow() {
  const router = useRouter();
  const setPendingChatDraft = useChatStore((s) => s.setPendingChatDraft);

  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(0); // 0-based; consent skipped when already recorded
  const [consent, setConsent] = useState(false);
  const [retention, setRetention] = useState('365');
  const [consentError, setConsentError] = useState('');
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<HealthProfile>(() => emptyProfile());
  const [allergiesText, setAllergiesText] = useState('');
  const [medsText, setMedsText] = useState('');
  const [iceErrors, setIceErrors] = useState<Record<string, string>>({});
  const [demoDraft, setDemoDraft] = useState<string | null>(null);
  const advancedOnce = useRef(false);

  // Probe session + consent state once on mount. If consent is already
  // recorded (e.g. signup flow / Google OAuth), skip straight to the profile step.
  useEffect(() => {
    if (advancedOnce.current) return;
    advancedOnce.current = true;
    let cancelled = false;
    (async () => {
      try {
        const [meRes, profileRes] = await Promise.all([
          fetch('/api/user/me', { cache: 'no-store' }),
          fetch('/api/profile', { cache: 'no-store' }),
        ]);
        if (meRes.ok) {
          const data = (await meRes.json()) as MeResponse;
          if (cancelled) return;
          if (!data.user) {
            router.replace('/auth/signin');
            return;
          }
          if (data.user.consented) {
            setConsent(true);
            setStep((s) => (s === 0 ? 1 : s));
          }
          if (typeof data.user.retentionDays === 'number') {
            setRetention(String(data.user.retentionDays ?? 365));
          }
        }
        if (profileRes.ok) {
          const data = (await profileRes.json()) as { profile?: {
            ageBand?: AgeBand;
            sex?: Sex;
            conditions?: string[];
            allergies?: string[];
            medications?: string[];
            pregnant?: boolean;
            iceContacts?: { name?: string; phone?: string; relation?: string }[];
          } | null };
          if (cancelled || !data.profile) return;
          const p = data.profile;
          setProfile({
            v: 1,
            ageBand: p.ageBand ?? 'undisclosed',
            sex: p.sex ?? 'undisclosed',
            conditions: p.conditions ?? [],
            allergies: p.allergies ?? [],
            medications: p.medications ?? [],
            pregnant: !!p.pregnant,
            iceContacts: (p.iceContacts ?? []).map((c) => ({
              id: newIceId(),
              name: c.name ?? '',
              phone: c.phone ?? '',
              relation: c.relation ?? '',
            })),
            updatedAt: Date.now(),
          });
          setAllergiesText((p.allergies ?? []).join('\n'));
          setMedsText((p.medications ?? []).join('\n'));
        }
      } catch {
        // network hiccup — stay on consent step, user can still continue
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // ---------- Step 1: consent ----------
  const submitConsent = useCallback(async () => {
    if (!consent) {
      setConsentError(T.consentRequired.en);
      return;
    }
    setConsentError('');
    setSaving(true);
    try {
      const res = await fetch('/api/user/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent: true,
          retentionDays: retention === '0' ? 0 : Number(retention),
        }),
      });
      if (!res.ok) throw new Error('consent failed');
      setStep(1);
    } catch {
      toast.error(T.consentFailed.en, { description: T.consentFailed.ur });
    } finally {
      setSaving(false);
    }
  }, [consent, retention]);

  // ---------- Step 2: profile ----------
  const saveProfileToServer = useCallback(async (): Promise<boolean> => {
    const next: HealthProfile = {
      ...profile,
      allergies: normalizeLineList(allergiesText),
      medications: normalizeLineList(medsText),
      updatedAt: Date.now(),
    };
    // validate ICE phones
    const errors: Record<string, string> = {};
    for (const c of next.iceContacts) {
      if (c.phone && !isValidPhone(c.phone)) errors[c.id] = T.iceBadPhone.en;
    }
    setIceErrors(errors);
    if (Object.keys(errors).length > 0) return false;

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ageBand: next.ageBand,
          sex: next.sex,
          conditions: next.conditions,
          allergies: next.allergies,
          medications: next.medications,
          pregnant: next.pregnant,
          iceContacts: next.iceContacts.map((c) => ({
            name: c.name,
            phone: c.phone,
            relation: c.relation || undefined,
          })),
        }),
      });
      if (!res.ok) throw new Error('profile failed');
      // mirror to the device-local profile so My Health is in sync
      saveProfile(next);
      setProfile(next);
      toast.success(T.saved.en, { description: T.saved.ur });
      return true;
    } catch {
      return false;
    }
  }, [allergiesText, medsText, profile]);

  const nextFromProfile = useCallback(async () => {
    setSaving(true);
    const ok = await saveProfileToServer();
    setSaving(false);
    if (ok) {
      setStep(2);
    } else {
      toast.error(T.saveFailed.en, { description: T.saveFailed.ur });
    }
  }, [saveProfileToServer]);

  // ---------- Finish ----------
  const finish = useCallback(
    (draft?: string | null) => {
      if (draft) setPendingChatDraft(draft);
      router.replace('/');
      router.refresh();
    },
    [router, setPendingChatDraft],
  );

  const stepTitles: TriStrings[] = [T.s1Title, T.s2Title, T.s3Title, T.s4Title];

  return (
    <AuthShell>
      <div className="flex flex-col gap-4">
        {/* stepper */}
        <nav aria-label="Onboarding progress">
          <ol className="flex items-center gap-1.5" dir="ltr">
            {Array.from({ length: STEPS }, (_, i) => (
              <li key={i} className="flex flex-1 flex-col gap-1">
                <span
                  aria-hidden
                  className={cn(
                    'h-1.5 w-full rounded-full transition-colors',
                    i < step ? 'bg-primary' : i === step ? 'bg-primary/60' : 'bg-border',
                  )}
                />
                <span className="sr-only">
                  {T.stepOf.en} {i + 1} / {STEPS}
                  {i === step ? ' — current' : i < step ? ' — done' : ''}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-center text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            {T.stepOf.en} {step + 1} / {STEPS} · <span dir="rtl" className="font-urdu">{T.stepOf.ur}</span> ·{' '}
            <span className="normal-case italic">{T.stepOf.roman}</span>
          </p>
        </nav>

        <Card className="border-border bg-card/70 shadow-sm">
          <CardHeader className="gap-2 border-b border-border px-5 py-4 sm:px-6">
            <p className="text-[11px] font-bold tracking-wider text-primary uppercase">
              {T.welcome.en}
            </p>
            <h1 className="text-lg font-extrabold tracking-tight text-foreground">
              <TriInline strings={stepTitles[step]} />
            </h1>
          </CardHeader>

          <CardContent className="px-5 py-5 sm:px-6">
            {/* ---------------- STEP 1: consent ---------------- */}
            {step === 0 ? (
              <div className="flex flex-col gap-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {T.s1Body.en}
                  <span dir="rtl" className="mt-1 block font-urdu">
                    {T.s1Body.ur}
                  </span>
                  <span className="mt-1 block italic">{T.s1Body.roman}</span>
                </p>

                <fieldset className="flex flex-col gap-2.5 rounded-2xl border border-primary/25 bg-primary/5 p-4">
                  <legend className="px-1 text-sm font-bold text-foreground">
                    <TriInline strings={T.s1Title} />
                  </legend>
                  <p dir="rtl" className="font-urdu text-sm leading-loose text-foreground">
                    {CONSENT_UR}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{CONSENT_EN}</p>
                  <label
                    htmlFor="ob-consent"
                    className="mt-1 flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border bg-background px-3 py-2.5 transition-colors hover:bg-accent/50 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-ring"
                  >
                    <Checkbox
                      id="ob-consent"
                      checked={consent}
                      onCheckedChange={(v) => {
                        setConsent(v === true);
                        if (consentError) setConsentError('');
                      }}
                      aria-invalid={!!consentError}
                      aria-describedby={consentError ? 'ob-consent-error' : undefined}
                      className="mt-0.5"
                    />
                    <span className="text-sm font-semibold text-foreground">
                      <TriInline strings={T.agree} />
                    </span>
                  </label>
                  {consentError ? (
                    <p id="ob-consent-error" role="alert" className="text-xs font-medium text-red-700 dark:text-red-400">
                      {consentError}
                    </p>
                  ) : null}

                  <div className="mt-1 flex flex-col gap-1.5">
                    <Label htmlFor="ob-retention" className="text-xs font-semibold text-foreground">
                      <TriInline strings={T.retentionTitle} />
                    </Label>
                    <Select value={retention} onValueChange={setRetention}>
                      <SelectTrigger
                        id="ob-retention"
                        className="h-11 min-h-11 w-full rounded-xl border-border text-sm"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RETENTION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.en} · <span dir="rtl" className="font-urdu">{opt.ur}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </fieldset>

                <Button
                  type="button"
                  onClick={() => void submitConsent()}
                  disabled={saving || checking}
                  className="h-12 rounded-xl text-sm font-bold"
                >
                  {saving ? T.saving.en : T.next.en} ·{' '}
                  <span dir="rtl" className="font-urdu">
                    {saving ? T.saving.ur : T.next.ur}
                  </span>
                </Button>
              </div>
            ) : null}

            {/* ---------------- STEP 2: profile ---------------- */}
            {step === 1 ? (
              <div className="flex flex-col gap-5">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {T.s2Body.en}
                  <span dir="rtl" className="mt-1 block font-urdu">
                    {T.s2Body.ur}
                  </span>
                </p>

                {/* age band */}
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-xs font-semibold text-foreground">
                    <TriInline strings={T.ageBand} />
                  </legend>
                  <div className="flex flex-wrap gap-1.5">
                    {AGE_BAND_ORDER.map((band) => (
                      <button
                        key={band}
                        type="button"
                        aria-pressed={profile.ageBand === band}
                        onClick={() => setProfile((p) => ({ ...p, ageBand: band }))}
                        className={cn(
                          'inline-flex min-h-11 items-center rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                          profile.ageBand === band
                            ? 'border-primary bg-primary/12 text-primary'
                            : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                      >
                        {AGE_LABELS[band].en}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* sex */}
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-xs font-semibold text-foreground">
                    <TriInline strings={T.sex} />
                  </legend>
                  <div className="flex flex-wrap gap-1.5">
                    {SEX_ORDER.map((s) => (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={profile.sex === s}
                        onClick={() =>
                          setProfile((p) => ({
                            ...p,
                            sex: s,
                            pregnant: s === 'female' ? p.pregnant : false,
                          }))
                        }
                        className={cn(
                          'inline-flex min-h-11 items-center rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                          profile.sex === s
                            ? 'border-primary bg-primary/12 text-primary'
                            : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                      >
                        {SEX_LABELS[s].en}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* pregnant */}
                {profile.sex === 'female' ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-pink-500/25 bg-pink-500/5 px-3 py-3">
                    <Label htmlFor="ob-pregnant" className="text-sm font-semibold text-foreground">
                      <TriInline strings={T.pregnant} />
                    </Label>
                    <Switch
                      id="ob-pregnant"
                      checked={profile.pregnant}
                      onCheckedChange={(v) => setProfile((p) => ({ ...p, pregnant: v }))}
                    />
                  </div>
                ) : null}

                {/* conditions */}
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-xs font-semibold text-foreground">
                    <TriInline strings={T.conditions} />
                  </legend>
                  <p className="text-[11px] text-muted-foreground">{T.conditionsHint.en}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CHRONIC_CONDITIONS.map((def) => {
                      const active = profile.conditions.includes(def.id);
                      return (
                        <button
                          key={def.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setProfile((p) => ({
                              ...p,
                              conditions: p.conditions.includes(def.id)
                                ? p.conditions.filter((c) => c !== def.id)
                                : [...p.conditions, def.id],
                            }))
                          }
                          className={cn(
                            'inline-flex min-h-11 items-center rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                            active
                              ? 'border-primary bg-primary/12 text-primary'
                              : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                          )}
                        >
                          {def.label.en}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* allergies */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ob-allergies" className="text-xs font-semibold text-foreground">
                    <TriInline strings={T.allergies} />
                  </Label>
                  <Textarea
                    id="ob-allergies"
                    value={allergiesText}
                    onChange={(e) => setAllergiesText(e.target.value)}
                    rows={2}
                    dir="auto"
                    placeholder="Penicillin"
                    className="resize-y text-sm"
                  />
                </div>

                {/* medications */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="ob-meds" className="text-xs font-semibold text-foreground">
                    <TriInline strings={T.meds} />
                  </Label>
                  <Textarea
                    id="ob-meds"
                    value={medsText}
                    onChange={(e) => setMedsText(e.target.value)}
                    rows={2}
                    dir="auto"
                    placeholder="Metformin 500mg"
                    className="resize-y text-sm"
                  />
                </div>

                {/* ICE contacts */}
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-xs font-semibold text-foreground">
                    <TriInline strings={T.ice} />
                  </legend>
                  <div className="flex flex-col gap-2.5">
                    {profile.iceContacts.map((c) => (
                      <div
                        key={c.id}
                        className="flex flex-col gap-2 rounded-xl border border-border bg-background/60 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-foreground">
                            <TriInline strings={T.iceName} />
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setProfile((p) => ({
                                ...p,
                                iceContacts: p.iceContacts.filter((x) => x.id !== c.id),
                              }))
                            }
                            className="inline-flex h-8 items-center rounded-full border border-red-500/25 bg-red-500/5 px-2.5 text-[11px] font-semibold text-red-700 hover:bg-red-500/15 dark:text-red-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                          >
                            {T.iceRemove.en}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <Input
                            aria-label={T.iceName.en}
                            value={c.name}
                            onChange={(e) =>
                              setProfile((p) => ({
                                ...p,
                                iceContacts: p.iceContacts.map((x) =>
                                  x.id === c.id ? { ...x, name: e.target.value } : x,
                                ),
                              }))
                            }
                            dir="auto"
                            maxLength={80}
                            className="h-10 text-sm"
                          />
                          <div className="flex flex-col gap-1">
                            <Input
                              aria-label={T.icePhone.en}
                              value={c.phone}
                              onChange={(e) => {
                                setProfile((p) => ({
                                  ...p,
                                  iceContacts: p.iceContacts.map((x) =>
                                    x.id === c.id ? { ...x, phone: e.target.value } : x,
                                  ),
                                }));
                                if (iceErrors[c.id]) {
                                  setIceErrors((m) => {
                                    const next = { ...m };
                                    delete next[c.id];
                                    return next;
                                  });
                                }
                              }}
                              inputMode="tel"
                              type="tel"
                              dir="ltr"
                              maxLength={24}
                              aria-invalid={!!iceErrors[c.id]}
                              className={cn(
                                'h-10 text-sm',
                                iceErrors[c.id] && 'border-red-500/60 focus-visible:outline-red-500',
                              )}
                            />
                            {iceErrors[c.id] ? (
                              <p role="alert" className="text-[11px] font-medium text-red-700 dark:text-red-400">
                                {iceErrors[c.id]}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <Input
                          aria-label={T.iceRelation.en}
                          value={c.relation ?? ''}
                          onChange={(e) =>
                            setProfile((p) => ({
                              ...p,
                              iceContacts: p.iceContacts.map((x) =>
                                x.id === c.id ? { ...x, relation: e.target.value } : x,
                              ),
                            }))
                          }
                          dir="auto"
                          placeholder={T.iceRelation.en}
                          maxLength={40}
                          className="h-10 text-sm"
                        />
                      </div>
                    ))}
                    {profile.iceContacts.length < 3 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setProfile((p) => ({
                            ...p,
                            iceContacts: [...p.iceContacts, { id: newIceId(), name: '', phone: '', relation: '' }],
                          }))
                        }
                        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-dashed border-primary/40 bg-primary/5 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                        {T.iceAdd.en} · <span dir="rtl" className="font-urdu">{T.iceAdd.ur}</span>
                      </button>
                    ) : null}
                  </div>
                </fieldset>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(2)}
                    className="min-h-11 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground"
                  >
                    {T.skip.en} · <span dir="rtl" className="font-urdu">{T.skip.ur}</span>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void nextFromProfile()}
                    disabled={saving}
                    className="min-h-11 flex-1 rounded-xl text-sm font-bold"
                  >
                    {saving ? T.saving.en : T.next.en} ·{' '}
                    <span dir="rtl" className="font-urdu">
                      {saving ? T.saving.ur : T.next.ur}
                    </span>
                  </Button>
                </div>
              </div>
            ) : null}

            {/* ---------------- STEP 3: demo + 1122 ---------------- */}
            {step === 2 ? (
              <div className="flex flex-col gap-4">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {T.s3Body.en}
                  <span dir="rtl" className="mt-1 block font-urdu">
                    {T.s3Body.ur}
                  </span>
                </p>

                <div className="flex flex-col gap-2">
                  <TriStack strings={T.demoPrompt} size="sm" />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {(['en', 'ur', 'roman'] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setDemoDraft(T.demoPrompt[k])}
                        aria-pressed={demoDraft === T.demoPrompt[k]}
                        className={cn(
                          'inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                          demoDraft === T.demoPrompt[k]
                            ? 'border-primary bg-primary/12 text-primary'
                            : 'border-border bg-background text-foreground/90 hover:bg-accent',
                        )}
                      >
                        <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
                        {T.demoPrompt[k]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 rounded-2xl border border-red-500/25 bg-red-500/5 p-4">
                  <p className="text-sm font-bold text-foreground">
                    <TriInline strings={T.emergencyTitle} />
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {T.emergencyBody.en}
                    <span dir="rtl" className="mt-1 block font-urdu">
                      {T.emergencyBody.ur}
                    </span>
                  </p>
                  <a
                    href="tel:1122"
                    className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-red-600"
                  >
                    <Phone className="h-4 w-4" aria-hidden />
                    1122 · <span dir="rtl" className="font-urdu">{T.call1122.ur}</span>
                  </a>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(1)}
                    className="min-h-11 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="me-1 h-4 w-4" aria-hidden />
                    {T.back.en}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep(3)}
                    className="min-h-11 flex-1 rounded-xl text-sm font-bold"
                  >
                    {T.next.en} · <span dir="rtl" className="font-urdu">{T.next.ur}</span>
                    <ArrowRight className="ms-1 h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </div>
            ) : null}

            {/* ---------------- STEP 4: offline pack ---------------- */}
            {step === 3 ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                    <WifiOff className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">
                      <TriInline strings={T.s4Title} />
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {T.s4Body.en}
                      <span dir="rtl" className="mt-1 block font-urdu">
                        {T.s4Body.ur}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {T.welcome.en} — {T.saved.en}
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(2)}
                    className="min-h-11 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="me-1 h-4 w-4" aria-hidden />
                    {T.back.en}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => finish(demoDraft)}
                    className="min-h-11 flex-1 rounded-xl text-sm font-bold"
                  >
                    {T.finish.en} · <span dir="rtl" className="font-urdu">{T.finish.ur}</span>
                    <ArrowRight className="ms-1 h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AuthShell>
  );
}
