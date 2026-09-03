'use client';

import { Phone } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const EMERGENCY_NUMBERS = [
  { number: '1122', label: 'Rescue' },
  { number: '1166', label: 'Health Helpline' },
  { number: '115', label: 'Edhi' },
] as const;

/** Sticky footer: disclaimer, emergency numbers (tappable), sources note.
 *  Compact on mobile to prevent overlap with chat input. */
export function AppFooter() {
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const isUr = uiLang === 'ur';

  return (
    <footer className="mt-auto shrink-0 border-t border-border bg-card/95 backdrop-blur-sm">
      <div
        className={cn(
          'mx-auto flex max-w-4xl flex-col items-center gap-0.5 px-4 py-1.5 text-center sm:gap-1.5 sm:py-2.5',
          isUr && 'font-urdu',
        )}
      >
        <p className="text-[10px] leading-snug text-muted-foreground sm:text-[11px] sm:leading-relaxed">
          {t(uiLang, 'footer.disclaimer')}
        </p>
        <nav
          className="flex flex-wrap items-center justify-center gap-1 sm:gap-2"
          dir="ltr"
          aria-label="Emergency numbers"
        >
          {EMERGENCY_NUMBERS.map((em, i) => (
            <span key={em.number} className="flex items-center gap-1 sm:gap-2">
              {i > 0 ? <span aria-hidden className="text-muted-foreground/50">·</span> : null}
              <a
                href={`tel:${em.number}`}
                className="group inline-flex items-center gap-1 rounded-full border border-red-600/20 bg-red-600/8 px-2 py-0.5 text-[10px] font-bold text-red-700 transition-colors hover:bg-red-600/15 focus-visible:outline-2 focus-visible:outline-red-600 sm:px-2.5 sm:py-1 sm:text-[11px] sm:font-extrabold dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-400 dark:hover:bg-red-400/20"
              >
                <Phone className="h-2.5 w-2.5 shrink-0 text-red-600 sm:h-3 sm:w-3 dark:text-red-400" aria-hidden />
                {em.number}
                <span className="hidden font-normal text-muted-foreground sm:inline">{em.label}</span>
              </a>
            </span>
          ))}
        </nav>
        <p className="hidden text-[10px] text-muted-foreground/80 sm:block">
          {t(uiLang, 'footer.sources')}
        </p>
      </div>
    </footer>
  );
}
