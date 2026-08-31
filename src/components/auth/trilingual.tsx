'use client';

import { cn } from '@/lib/utils';

/**
 * Trilingual text helpers for pre-auth pages (sign-in / sign-up / onboarding),
 * where the user has not picked a UI language yet. Urdu is rendered RTL in the
 * Nastaliq font (`.font-urdu`), matching the app-wide pattern.
 */

export interface TriStrings {
  en: string;
  ur: string;
  roman: string;
}

/** One compact inline line: "EN · اردو · Roman" */
export function TriInline({ strings, className }: { strings: TriStrings; className?: string }) {
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5', className)}>
      <span>{strings.en}</span>
      <span aria-hidden className="text-muted-foreground/60">
        ·
      </span>
      <span dir="rtl" className="font-urdu">
        {strings.ur}
      </span>
      <span aria-hidden className="text-muted-foreground/60">
        ·
      </span>
      <span>{strings.roman}</span>
    </span>
  );
}

/** Three stacked lines with language tags, mirroring the chat welcome card. */
export function TriStack({
  strings,
  className,
  size = 'base',
}: {
  strings: TriStrings;
  className?: string;
  size?: 'base' | 'sm';
}) {
  const textCls = size === 'sm' ? 'text-xs leading-relaxed' : 'text-sm leading-relaxed';
  const tagCls =
    size === 'sm'
      ? 'h-5 px-1.5 text-[9px]'
      : 'h-6 px-2 text-[10px]';
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <p
        className={cn(
          'flex items-center gap-2.5 rounded-xl bg-muted/50 px-3 py-2 text-foreground/90',
          textCls,
        )}
        dir="ltr"
      >
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/10 font-bold tracking-wider text-primary uppercase',
            tagCls,
          )}
        >
          EN
        </span>
        <span className="min-w-0 flex-1">{strings.en}</span>
      </p>
      <p
        className={cn(
          'flex items-center gap-2.5 rounded-xl bg-primary/5 px-3 py-2 text-foreground/90',
          textCls,
        )}
        dir="rtl"
      >
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/10 font-bold tracking-wider text-primary uppercase',
            tagCls,
          )}
        >
          اردو
        </span>
        <span className="min-w-0 flex-1 font-urdu">{strings.ur}</span>
      </p>
      <p
        className={cn(
          'flex items-center gap-2.5 rounded-xl bg-muted/50 px-3 py-2 text-foreground/90',
          textCls,
        )}
        dir="ltr"
      >
        <span
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/10 font-bold tracking-wider text-primary uppercase',
            tagCls,
          )}
        >
          ROMAN
        </span>
        <span className="min-w-0 flex-1">{strings.roman}</span>
      </p>
    </div>
  );
}
