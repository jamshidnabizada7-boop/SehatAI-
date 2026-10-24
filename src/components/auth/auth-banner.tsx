'use client';

import { useState, useSyncExternalStore } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'sehatai.authBannerDismissed';
const noopSubscribe = () => () => {};

/**
 * Guest-mode banner: shown in the app shell when the user is NOT signed in.
 * Chat keeps working in guest mode (sessionId-based) — the banner explains
 * what signing in adds (history, profile, reminders, outcomes).
 * One row on phones; the longer explanation shows from `sm` up.
 */
export function AuthBanner() {
  const { status } = useSession();
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const isRtl = uiLang === 'ur';
  const [dismissedNow, setDismissed] = useState(false);
  // Remembered for the browser session; storage may be blocked, then it just shows again.
  const dismissedBefore = useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return sessionStorage.getItem(DISMISS_KEY) === '1';
      } catch {
        return false;
      }
    },
    () => false,
  );
  const dismissed = dismissedNow || dismissedBefore;

  if (status !== 'unauthenticated' || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
  };

  return (
    <section
      aria-label={t(uiLang, 'auth.bannerTitle')}
      className={cn('border-b border-border bg-accent/60 px-3 py-1.5 sm:px-4', isRtl && 'font-urdu')}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-2">
        <p className="min-w-0 flex-1 text-xs leading-snug text-foreground">
          <span className="font-semibold">{t(uiLang, 'auth.bannerTitle')}</span>
          <span className="hidden text-muted-foreground sm:inline"> — {t(uiLang, 'auth.bannerDesc')}</span>
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex min-h-9 shrink-0 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t(uiLang, 'auth.bannerCta')}
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          aria-label={t(uiLang, 'auth.bannerDismiss')}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}
