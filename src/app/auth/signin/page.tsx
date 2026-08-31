'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AuthBrandHeading, AuthShell, ContinueAsGuestLink } from '@/components/auth/auth-shell';
import { TriInline, TriStack } from '@/components/auth/trilingual';

const T = {
  title: {
    en: 'Welcome back',
    ur: 'خوش آمدید',
    roman: 'Khush aamdeed',
  },
  subtitle: {
    en: 'Sign in to sync your health profile, reminders and follow-ups.',
    ur: 'اپنی ہیلتھ پروفائل، یاد دہانیوں اور فالو اپ کے لیے سائن ان کریں۔',
    roman: 'Apni health profile, yaad-dahani aur follow-up ke liye sign in karein.',
  },
  email: {
    en: 'Email',
    ur: 'ای میل',
    roman: 'Email',
  },
  password: {
    en: 'Password',
    ur: 'پاس ورڈ',
    roman: 'Password',
  },
  submit: {
    en: 'Sign in',
    ur: 'سائن ان',
    roman: 'Sign in karein',
  },
  submitting: {
    en: 'Signing in…',
    ur: 'سائن ان ہو رہا ہے…',
    roman: 'Sign in ho raha hai…',
  },
  noAccount: {
    en: 'No account yet?',
    ur: 'ابھی اکاؤنٹ نہیں ہے؟',
    roman: 'Abhi account nahin hai?',
  },
  createOne: {
    en: 'Create one',
    ur: 'ایک بنائیں',
    roman: 'Ek banayein',
  },
  guest: {
    en: 'Continue as guest',
    ur: 'مہمان کے طور پر جاری رکھیں',
    roman: 'Mehmaan ke tor par jari rakhein',
  },
  errEmail: {
    en: 'Enter a valid email address.',
    ur: 'درست ای میل درج کریں۔',
    roman: 'Durust email darj karein.',
  },
  errPassword: {
    en: 'Password must be at least 8 characters.',
    ur: 'پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے۔',
    roman: 'Password kam az kam 8 huruf ka hona chahiye.',
  },
  errSignin: {
    en: 'Could not sign in — check your email and password.',
    ur: 'سائن ان نہیں ہو سکا — اپنا ای میل اور پاس ورڈ جانچیں۔',
    roman: 'Sign in nahin ho saka — apna email aur password janchein.',
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;
      const next: { email?: string; password?: string } = {};
      if (!EMAIL_RE.test(email.trim())) next.email = T.errEmail.en;
      if (password.length < 8) next.password = T.errPassword.en;
      setErrors(next);
      if (next.email || next.password) return;

      setSubmitting(true);
      try {
        const result = await signIn('credentials', {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        });
        if (!result || result.error) {
          toast.error(T.errSignin.en, { description: T.errSignin.ur });
          return;
        }
        // Decide the landing page: onboarding until Urdu consent is recorded.
        let consented = false;
        try {
          const res = await fetch('/api/user/me', { cache: 'no-store' });
          if (res.ok) {
            const data = (await res.json()) as { user?: { consented?: boolean } | null };
            consented = !!data.user?.consented;
          }
        } catch {
          // fall through — default to onboarding, which re-checks consent
        }
        router.replace(consented ? '/' : '/onboarding');
        router.refresh();
      } catch {
        toast.error(T.errSignin.en, { description: T.errSignin.ur });
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, router, submitting],
  );

  return (
    <AuthShell>
      <AuthBrandHeading />

      <Card className="border-border bg-card/70 shadow-sm">
        <CardHeader className="gap-3 border-b border-border px-5 py-5 sm:px-6">
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            <TriStack strings={T.title} size="sm" />
          </h1>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {T.subtitle.en}
            <span dir="rtl" className="mt-1 block font-urdu">
              {T.subtitle.ur}
            </span>
            <span className="mt-1 block italic">{T.subtitle.roman}</span>
          </p>
        </CardHeader>

        <CardContent className="px-5 py-5 sm:px-6">
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
                aria-describedby={errors.email ? 'email-error' : undefined}
                className="h-11 rounded-xl text-sm"
              />
              {errors.email ? (
                <p id="email-error" role="alert" className="text-xs font-medium text-red-700 dark:text-red-400">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                <TriInline strings={T.password} />
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((m) => ({ ...m, password: undefined }));
                  }}
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
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
                <p id="password-error" role="alert" className="text-xs font-medium text-red-700 dark:text-red-400">
                  {errors.password}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="h-auto min-h-12 flex-col gap-0.5 rounded-xl py-2.5 text-sm font-bold"
            >
              <span className="inline-flex items-center gap-1.5">
                <LogIn className="h-4 w-4" aria-hidden />
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

          <div className="mt-5 flex flex-col items-center gap-3 border-t border-border pt-4">
            <p className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
              {T.noAccount.en}
              <span dir="rtl" className="font-urdu">
                {T.noAccount.ur}
              </span>
              <span aria-hidden>·</span>
              <span className="italic">{T.noAccount.roman}</span>
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-primary/40 bg-primary/5 px-4 text-sm font-bold text-primary transition-colors hover:bg-primary/12 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <TriInline strings={T.createOne} />
            </Link>
            <ContinueAsGuestLink label={T.guest.en} />
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
