'use client';

import { Stethoscope, HeartPulse } from 'lucide-react';
import Link from 'next/link';
import { AppHeader } from '@/components/app/app-header';
import { AppFooter } from '@/components/app/app-footer';
import { AuthLanguageSwitch } from '@/components/auth/trilingual';
import { cn } from '@/lib/utils';

type Variant = 'patient' | 'doctor';

/**
 * Shared shell for the auth + onboarding pages: app header, scrollable
 * centered main area, footer.
 *
 * `variant="doctor"` swaps the brand icon and label for the Doctor Portal.
 */
export function AuthShell({ children, variant = 'patient' }: { children: React.ReactNode; variant?: Variant }) {
  return (
    <div className={cn('flex min-h-dvh flex-col bg-background text-foreground')}>
      <AppHeader />
      <main
        id="main"
        className="flex flex-1 flex-col items-center px-4 py-8 sm:justify-center sm:px-6"
        data-variant={variant}
      >
        <div className="w-full max-w-md">{children}</div>
      </main>
      <AppFooter />
    </div>
  );
}

/** Brand mark above the auth forms, plus the language switch. */
export function AuthBrandHeading({ variant = 'patient' }: { variant?: Variant }) {
  const Icon = variant === 'doctor' ? Stethoscope : HeartPulse;
  return (
    <div className="mb-6 flex flex-col items-center gap-3 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary">
        <Icon className="h-5.5 w-5.5 text-primary-foreground" aria-hidden />
      </span>
      <p className="text-base font-bold tracking-tight text-foreground">
        Sehat<span className="text-primary">AI</span>
        {variant === 'doctor' ? (
          <span className="ms-1.5 text-sm font-medium text-muted-foreground">Doctor Portal</span>
        ) : null}
      </p>
      <AuthLanguageSwitch />
    </div>
  );
}

/** Link back to the main app (guest mode). */
export function ContinueAsGuestLink({ label }: { label: React.ReactNode }) {
  return (
    <Link
      href="/"
      className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      {label}
    </Link>
  );
}
