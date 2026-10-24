'use client';

import { Phone } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Slim footer: disclaimer + tappable emergency numbers. One line on
 *  desktop, two short lines on phones so the chat composer keeps its room. */
export function AppFooter() {
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const isUr = uiLang === 'ur';

  const numbers = [
    { number: '1122', label: t(uiLang, 'ui.rescue') },
    { number: '1166', label: t(uiLang, 'ui.healthHelpline') },
    { number: '115', label: t(uiLang, 'ui.edhi') },
  ];

  return (
    <footer className="shrink-0 border-t border-border bg-card">
      <div
        className={cn(
          'mx-auto flex max-w-6xl flex-col items-center gap-x-4 gap-y-1 px-4 py-1.5 text-center lg:flex-row lg:justify-center lg:py-2',
          isUr && 'font-urdu',
        )}
      >
        <p className="text-2xs text-muted-foreground">
          <span className="sm:hidden">{t(uiLang, 'ui.notADoctor')}</span>
          <span className="hidden sm:inline">{t(uiLang, 'footer.disclaimer')}</span>
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-1.5" aria-label={t(uiLang, 'ui.emergencyNumbers')}>
          {numbers.map((em) => (
            <a
              key={em.number}
              href={`tel:${em.number}`}
              className="inline-flex min-h-7 items-center gap-1 rounded-full border border-danger/20 bg-danger-soft px-2.5 text-2xs font-bold text-danger transition-colors hover:border-danger/45 focus-visible:outline-2 focus-visible:outline-danger"
            >
              <Phone className="h-3 w-3 shrink-0" aria-hidden />
              <span dir="ltr">{em.number}</span>
              <span className="hidden font-medium sm:inline">{em.label}</span>
            </a>
          ))}
        </nav>
        <p className="hidden text-2xs text-muted-foreground xl:block">{t(uiLang, 'footer.sources')}</p>
      </div>
    </footer>
  );
}
