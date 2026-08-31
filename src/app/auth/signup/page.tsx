'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuthBrandHeading, AuthShell } from '@/components/auth/auth-shell';
import { TriInline, TriStack } from '@/components/auth/trilingual';

/** The Phase-0 Urdu consent statement (Nastaliq, RTL) — source of truth. */
const CONSENT_UR =
  'میں SehatAI کے استعمال سے متعلق معلومات کے جمع شدہ ہونے سے اتفاق کرتا/کرتی ہوں۔ میری معلومات صرف میری صحت کے مشورے کے لیے استعمال ہوگی اور میں کسی بھی وقت اپنا ڈیٹا مٹا سکتا/سکتی ہوں۔';
const CONSENT_EN =
  'I agree that SehatAI may collect information about my use of the service. My information is used only for my health guidance, and I can delete my data at any time.';
const CONSENT_ROMAN =
  'Main SehatAI ke istemal se mutaliq maloomat ke jama shudah hone se ittefaq karta/karti hoon. Meri maloomat sirf meri sehat ke mashwaray ke liye istemal hogi aur main kisi bhi waqt apna data mita sakta/sakti hoon.';

const T = {
  title: {
    en: 'Create your SehatAI account',
    ur: 'اپنا SehatAI اکاؤنٹ بنائیں',
    roman: 'Apna SehatAI account banayein',
  },
  email: { en: 'Email', ur: 'ای میل', roman: 'Email' },
  password: { en: 'Password (8+ characters)', ur: 'پاس ورڈ (8+ حروف)', roman: 'Password (8+ huruf)' },
  name: { en: 'Name (optional)', ur: 'نام (اختیاری)', roman: 'Naam (ikhtiyari)' },
  submit: { en: 'Create account', ur: 'اکاؤنٹ بنائیں', roman: 'Account banayein' },
  submitting: { en: 'Creating account…', ur: 'اکاؤنٹ بن رہا ہے…', roman: 'Account ban raha hai…' },
  haveAccount: { en: 'Already have an account?', ur: 'پہلے سے اکاؤنٹ ہے؟', roman: 'Pehle se account hai?' },
  signinLink: { en: 'Sign in', ur: 'سائن ان', roman: 'Sign in karein' },
  consentTitle: { en: 'Your consent', ur: 'آپ کی رضامندی', roman: 'Aap ki razamandi' },
  consentRequired: {
    en: 'Please tick the consent box to continue.',
    ur: 'جاری رکھنے کے لیے رضامندی کے خانے پر ٹک لگائیں۔',
    roman: 'Jari rakhne ke liye razamandi ke khane par tick lagayein.',
  },
  retentionTitle: {
    en: 'Keep my data for',
    ur: 'میرا ڈیٹا کتنی مدت تک رکھیں',
    roman: 'Mera data kitni muddat tak rakhein',
  },
  errEmail: { en: 'Enter a valid email address.', ur: 'درست ای میل درج کریں۔', roman: 'Durust email darj karein.' },
  errPassword: {
    en: 'Password must be at least 8 characters.',
    ur: 'پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے۔',
    roman: 'Password kam az kam 8 huruf ka hona chahiye.',
  },
  errSignup: {
    en: 'Could not create the account — it may already exist.',
    ur: 'اکاؤنٹ نہیں بن سکا — شاید پہلے سے موجود ہو۔',
    roman: 'Account nahin ban saka — shayad pehle se maujood ho.',
  },
};

const RETENTION_OPTIONS = [
  { value: '30', en: '30 days', ur: '30 دن', roman: '30 din' },
  { value: '90', en: '90 days', ur: '90 دن', roman: '90 din' },
  { value: '365', en: '1 year', ur: '1 سال', roman: '1 saal' },
  { value: '1825', en: '5 years', ur: '5 سال', roman: '5 saal' },
  { value: '0', en: 'Until I delete it', ur: 'جب تک میں مٹا نہ دوں', roman: 'Jab tak main mita na doon' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [consent, setConsent] = useState(false);
  const [retention, setRetention] = useState('365');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    consent?: string;
  }>({});

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;
      const next: { email?: string; password?: string; consent?: string } = {};
      if (!EMAIL_RE.test(email.trim())) next.email = T.errEmail.en;
      if (password.length < 8) next.password = T.errPassword.en;
      if (!consent) next.consent = T.consentRequired.en;
      setErrors(next);
      if (next.email || next.password || next.consent) return;

      setSubmitting(true);
      try {
        // 1) create the account (consent timestamp recorded server-side)
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            name: name.trim() || undefined,
            consent: true,
          }),
        });
        if (!res.ok) {
          toast.error(T.errSignup.en, { description: T.errSignup.ur });
          return;
        }
        // 2) sign in immediately with the new credentials
        const result = await signIn('credentials', {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        });
        if (!result || result.error) {
          toast.error(T.errSignup.en, { description: T.errSignup.ur });
          return;
        }
        // 3) persist the retention preference chosen at signup
        try {
          await fetch('/api/user/consent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              consent: true,
              retentionDays: retention === '0' ? 0 : Number(retention),
            }),
          });
        } catch {
          // non-blocking — onboarding re-records consent + retention
        }
        router.replace('/onboarding');
        router.refresh();
      } catch {
        toast.error(T.errSignup.en, { description: T.errSignup.ur });
      } finally {
        setSubmitting(false);
      }
    },
    [consent, email, name, password, retention, router, submitting],
  );

  return (
    <AuthShell>
      <AuthBrandHeading />

      <Card className="border-border bg-card/70 shadow-sm">
        <CardHeader className="gap-3 border-b border-border px-5 py-5 sm:px-6">
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            <TriStack strings={T.title} size="sm" />
          </h1>
        </CardHeader>

        <CardContent className="flex flex-col gap-5 px-5 py-5 sm:px-6">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                <TriInline strings={T.email} />
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                dir="ltr"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((m) => ({ ...m, email: undefined }));
                }}
                placeholder="aisha@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'su-email-error' : undefined}
                className="h-11 rounded-xl text-sm"
              />
              {errors.email ? (
                <p id="su-email-error" role="alert" className="text-xs font-medium text-red-700 dark:text-red-400">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="su-password" className="text-sm font-semibold text-foreground">
                <TriInline strings={T.password} />
              </Label>
              <div className="relative">
                <Input
                  id="su-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((m) => ({ ...m, password: undefined }));
                  }}
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'su-password-error' : undefined}
                  className="h-11 rounded-xl pe-12 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute end-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                </button>
              </div>
              {errors.password ? (
                <p id="su-password-error" role="alert" className="text-xs font-medium text-red-700 dark:text-red-400">
                  {errors.password}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="su-name" className="text-sm font-semibold text-foreground">
                <TriInline strings={T.name} />
              </Label>
              <Input
                id="su-name"
                type="text"
                autoComplete="name"
                dir="auto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aisha Khan"
                maxLength={80}
                className="h-11 rounded-xl text-sm"
              />
            </div>

            {/* Urdu consent — the legally primary statement */}
            <fieldset className="flex flex-col gap-2 rounded-2xl border border-primary/25 bg-primary/5 p-4">
              <legend className="px-1 text-sm font-bold text-foreground">
                <TriInline strings={T.consentTitle} />
              </legend>
              <p dir="rtl" className="font-urdu text-sm leading-loose text-foreground">
                {CONSENT_UR}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">{CONSENT_EN}</p>
              <p className="text-xs leading-relaxed text-muted-foreground italic">{CONSENT_ROMAN}</p>
              <label
                htmlFor="consent"
                className="mt-1 flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border bg-background px-3 py-2.5 transition-colors hover:bg-accent/50 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-ring"
              >
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(v) => {
                    setConsent(v === true);
                    if (errors.consent) setErrors((m) => ({ ...m, consent: undefined }));
                  }}
                  aria-invalid={!!errors.consent}
                  aria-describedby={errors.consent ? 'su-consent-error' : undefined}
                  className="mt-0.5"
                />
                <span className="text-sm font-semibold text-foreground">
                  <TriInline
                    strings={{
                      en: 'I agree',
                      ur: 'میں اتفاق کرتا/کرتی ہوں',
                      roman: 'Main ittefaq karta/karti hoon',
                    }}
                  />
                </span>
              </label>
              {errors.consent ? (
                <p id="su-consent-error" role="alert" className="text-xs font-medium text-red-700 dark:text-red-400">
                  {errors.consent}
                </p>
              ) : null}
            </fieldset>

            {/* Retention preference */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="retention" className="text-sm font-semibold text-foreground">
                <TriInline strings={T.retentionTitle} />
              </Label>
              <Select value={retention} onValueChange={setRetention}>
                <SelectTrigger
                  id="retention"
                  className="h-11 min-h-11 w-full rounded-xl border-border text-sm"
                  aria-label={T.retentionTitle.en}
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

            <Button
              type="submit"
              disabled={submitting}
              className="h-auto min-h-12 flex-col gap-0.5 rounded-xl py-2.5 text-sm font-bold"
            >
              <span className="inline-flex items-center gap-1.5">
                <UserPlus className="h-4 w-4" aria-hidden />
                {submitting ? T.submitting.en : T.submit.en}
              </span>
              <span dir="rtl" className="font-urdu text-[11px] font-semibold opacity-90">
                {submitting ? T.submitting.ur : T.submit.ur}
              </span>
              <span className="text-[10px] font-medium italic opacity-80">
                {submitting ? T.submitting.roman : T.submit.roman}
              </span>
            </Button>
          </form>

          <div className="flex flex-col items-center gap-2 border-t border-border pt-4">
            <p className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
              {T.haveAccount.en}
              <span dir="rtl" className="font-urdu">
                {T.haveAccount.ur}
              </span>
              <span aria-hidden>·</span>
              <span className="italic">{T.haveAccount.roman}</span>
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-primary/40 bg-primary/5 px-4 text-sm font-bold text-primary transition-colors hover:bg-primary/12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <TriInline strings={T.signinLink} />
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
