'use client';

import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang } from '@/lib/i18n';
import type { Lang } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Trilingual text helpers for pre-auth pages (sign-in / sign-up / onboarding).
 *
 * These pages used to print every label, button and paragraph three times.
 * Now they follow the language preference: once the visitor picks English,
 * اردو or Roman Urdu (header menu or <AuthLanguageSwitch/>), only that
 * language shows. On "Auto" (first visit) the page title still shows all
 * three, so a reader of any of them can find their way, and everything else
 * uses the resolved language. Urdu renders RTL in Nastaliq (`.font-urdu`).
 */

export interface TriStrings {
  en: string;
  ur: string;
  roman: string;
}

/** The language pre-auth copy should render in, and whether it was chosen. */
export function useAuthLang(): { lang: Lang; chosen: boolean } {
  const langPref = useAppStore((s) => s.langPref);
  return { lang: resolveUiLang(langPref), chosen: langPref !== 'auto' };
}

/** One string in the active language (RTL + Nastaliq for Urdu). */
export function Tri({ strings, className }: { strings: TriStrings; className?: string }) {
  const { lang } = useAuthLang();
  if (lang === 'ur') {
    return (
      <span dir="rtl" className={cn('font-urdu', className)}>
        {strings.ur}
      </span>
    );
  }
  return <span className={className}>{strings[lang]}</span>;
}

/** Plain string in the active language, for attributes like aria-label/placeholder. */
export function useTri() {
  const { lang } = useAuthLang();
  return (strings: TriStrings) => strings[lang];
}

/** Labels and buttons: the active language only. */
export function TriInline({ strings, className }: { strings: TriStrings; className?: string }) {
  return <Tri strings={strings} className={className} />;
}

/**
 * Titles: the active language large; on "Auto" the other two languages follow
 * on one quiet line instead of three boxed rows.
 */
export function TriStack({
  strings,
  className,
}: {
  strings: TriStrings;
  className?: string;
  size?: 'base' | 'sm';
}) {
  const { lang, chosen } = useAuthLang();
  const others = (['en', 'ur', 'roman'] as const).filter((l) => l !== lang);
  return (
    <span className={cn('flex flex-col gap-1', className)}>
      <Tri strings={strings} />
      {!chosen ? (
        <span className="flex flex-wrap items-center gap-x-2 text-sm font-normal text-muted-foreground">
          {others.map((l, i) => (
            <span key={l} className="inline-flex items-center gap-2">
              {i > 0 ? <span aria-hidden>·</span> : null}
              <span dir={l === 'ur' ? 'rtl' : 'ltr'} className={cn(l === 'ur' && 'font-urdu')} lang={l === 'ur' ? 'ur' : undefined}>
                {strings[l]}
              </span>
            </span>
          ))}
        </span>
      ) : null}
    </span>
  );
}

/** Segmented English / اردو / Roman switch shown at the top of auth pages. */
export function AuthLanguageSwitch({ className }: { className?: string }) {
  const langPref = useAppStore((s) => s.langPref);
  const setLangPref = useAppStore((s) => s.setLangPref);
  const active = resolveUiLang(langPref);
  const options: { value: Lang; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'ur', label: 'اردو' },
    { value: 'roman', label: 'Roman Urdu' },
  ];
  return (
    <div className={cn('tabrow mx-auto w-fit', className)} role="radiogroup" aria-label="Language / زبان / Zuban">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={langPref !== 'auto' && active === o.value}
          data-active={langPref !== 'auto' && active === o.value}
          onClick={() => setLangPref(o.value)}
          className={cn('tab-custom min-h-9 px-3 text-xs', o.value === 'ur' && 'font-urdu')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
