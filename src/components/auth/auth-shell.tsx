'use client';

import { HeartPulse } from 'lucide-react';
import Link from 'next/link';
import { AppHeader } from '@/components/app/app-header';
import { AppFooter } from '@/components/app/app-footer';

/**
 * Shared shell for the auth + onboarding pages: app header, scrollable
 * centered main area, sticky footer (mt-auto inside a min-h-dvh flex column).
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <AppHeader />
      <main
        id="main"
        className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6"
      >
        <div className="w-full max-w-md">{children}</div>
      </main>
      <AppFooter />
    </div>
  );
}

/** Small brand heading used above the auth forms. */
export function AuthBrandHeading() {
  return (
    <div className="mb-6 flex flex-col items-center gap-2 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-sm">
        <HeartPulse className="h-6 w-6 text-primary-foreground" aria-hidden />
      </span>
      <p className="text-base font-extrabold tracking-tight text-foreground">
        Sehat<span className="text-primary">AI</span>
      </p>
    </div>
  );
}

/** Link back to the main app (guest mode). */
export function ContinueAsGuestLink({ label }: { label: string }) {
  return (
    <Link
      href="/"
      className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      {label}
    </Link>
  );
}
