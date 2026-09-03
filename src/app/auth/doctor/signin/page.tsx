'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AuthBrandHeading, AuthShell, ContinueAsGuestLink } from '@/components/auth/auth-shell';

const T = {
  title: 'Doctor sign in',
  subtitle: 'Access the Doctor Portal — patient intake, SOAP drafts, drug alerts and follow-ups.',
  email: 'Email',
  password: 'Password',
  submit: 'Sign in to Doctor Portal',
  submitting: 'Signing in…',
  noAccount: 'No doctor account yet?',
  createOne: 'Register as a doctor',
  guest: 'Continue as guest',
  errSignin: 'Could not sign in — check your email and password.',
  errNotDoctor: 'This login is for verified doctors. Please use the patient sign in.',
  errPending: 'Your PMDC verification is pending. We will notify you once approved.',
  errSuspended: 'Your account has been suspended. Contact support@sehatai.pk.',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function DoctorSignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;
      if (!EMAIL_RE.test(email.trim())) return toast.error('Enter a valid email address.');
      if (password.length < 8) return toast.error('Password must be at least 8 characters.');

      setSubmitting(true);
      try {
        const result = await signIn('credentials', {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        });
        if (!result || result.error) {
          toast.error(T.errSignin);
          return;
        }
        // Fetch role + accountStatus
        let role: string | null = null;
        let accountStatus: string | null = null;
        try {
          const res = await fetch('/api/user/me', { cache: 'no-store' });
          if (res.ok) {
            const data = (await res.json()) as { user?: { role?: string; accountStatus?: string; consented?: boolean } | null };
            role = data.user?.role ?? null;
            accountStatus = data.user?.accountStatus ?? null;
          }
        } catch {
          // fall through
        }
        if (role && role !== 'doctor' && role !== 'admin') {
          toast.error(T.errNotDoctor);
          // Sign them out so they don't end up in a weird state
          await signIn('credentials', { redirect: false, email: '__signout__', password: '__nope__' }).catch(() => {});
          return;
        }
        if (accountStatus === 'pending_verification') {
          toast.info(T.errPending);
          router.replace('/onboarding/doctor/pending');
          return;
        }
        if (accountStatus === 'suspended' || accountStatus === 'deleted') {
          toast.error(T.errSuspended);
          router.replace('/onboarding/doctor/rejected');
          return;
        }
        // Verified doctor — go to the doctor portal
        // Force a full reload so the JWT callback's new role takes effect
        window.location.href = '/?view=doctor-copilot';
      } catch {
        toast.error(T.errSignin);
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, router, submitting],
  );

  return (
    <AuthShell variant="doctor">
      <AuthBrandHeading variant="doctor" />

      <Card className="border-emerald-200/60 bg-card/70 shadow-sm dark:border-emerald-900/40">
        <CardHeader className="gap-3 border-b border-border px-5 py-5 sm:px-6">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">{T.title}</h1>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{T.subtitle}</p>
        </CardHeader>

        <CardContent className="px-5 py-5 sm:px-6">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dr.khan@hospital.pk"
                className="h-11 rounded-xl text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 rounded-xl pe-12 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute end-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="h-auto min-h-12 gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <LogIn className="h-4 w-4" />
              {submitting ? T.submitting : T.submit}
            </Button>
          </form>

          <div className="mt-5 flex flex-col items-center gap-3 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">{T.noAccount}</p>
            <Link
              href="/auth/doctor/signup"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-4 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-500/12 dark:text-emerald-400"
            >
              <Stethoscope className="me-1.5 h-4 w-4" /> {T.createOne}
            </Link>
            <ContinueAsGuestLink label={T.guest} />
          </div>
        </CardContent>
      </Card>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Not a doctor?{' '}
        <Link href="/auth/signin" className="font-semibold text-primary hover:underline">Patient sign in →</Link>
      </p>
    </AuthShell>
  );
}
