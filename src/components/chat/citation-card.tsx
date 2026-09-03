'use client';

import { useState } from 'react';
import { ChevronDown, ExternalLink, ShieldCheck } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Citation, Lang } from '@/lib/types';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface CitationCardProps {
  citation: Citation;
  index: number;
  lang: Lang;
}

/** Collapsible source card under an assistant message. */
export function CitationCard({ citation, index, lang }: CitationCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-border bg-card">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start transition-colors hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-ring"
            aria-expanded={open}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {citation.title}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                open && 'rotate-180',
              )}
              aria-hidden
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {citation.publisher}
            </span>
            {citation.verifiedAt ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                {t(lang, 'citation.verifiedOn')} {citation.verifiedAt}
              </span>
            ) : null}
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ms-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
              aria-label={`${t(lang, 'citation.viewSource')}: ${citation.title}`}
            >
              {t(lang, 'citation.viewSource')}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/** "Sources: WHO × 2" style summary for a message footer. */
export function citationSummary(citations: Citation[]): string {
  const counts = new Map<string, number>();
  for (const c of citations) {
    counts.set(c.publisher, (counts.get(c.publisher) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([publisher, count]) => (count > 1 ? `${publisher} × ${count}` : publisher))
    .join(' · ');
}
