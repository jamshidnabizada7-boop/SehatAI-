'use client';

import { CloudOff } from 'lucide-react';
import { useOffline } from '@/hooks/use-offline';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';

/** Amber banner shown when really offline or simulating offline. */
export function OfflineBanner() {
  const { isOffline } = useOffline();
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 border-b border-amber-500/40 bg-amber-500/12 px-4 py-2"
    >
      <CloudOff className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden />
      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
        {t(uiLang, 'offlineBanner.title')}
      </p>
    </div>
  );
}
