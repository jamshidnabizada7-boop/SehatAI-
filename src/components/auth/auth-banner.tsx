'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogIn, X } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * Guest-mode banner: shown in the app shell when the user is NOT signed in.
 * Chat keeps working in guest mode (sessionId-based) — the banner explains
 * what signing in adds (history, profile, reminders, outcomes).
 */
export function AuthBanner() {
  const { status } = useSession();
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const isRtl = uiLang === 'ur';
  const [dismissed, setDismissed] = useState(false);

  if (status !== 'unauthenticated' || dismissed) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      aria-label={t(uiLang, 'auth.bannerTitle')}
      className={cn(
        'border-b border-primary/20 bg-primary/8 px-3 py-2.5 sm:px-4',
        isRtl && 'font-urdu',
      )}
    >
      <div className="mx-auto flex max-w-4xl items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <LogIn className="h-4 w-4" aria-hidden />
        </span>
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-foreground/85">
          <span className="font-bold text-foreground">{t(uiLang, 'auth.bannerTitle')}</span>{' '}
          <span className="text-muted-foreground">{t(uiLang, 'auth.bannerDesc')}</span>
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex min-h-9 shrink-0 items-center rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          {t(uiLang, 'auth.bannerCta')}
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
          aria-label={t(uiLang, 'auth.bannerDismiss')}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </motion.section>
  );
}
