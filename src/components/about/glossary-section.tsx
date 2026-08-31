'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BookMarked, ClipboardCopy, Search, X } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import { GLOSSARY } from '@/data/glossary';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/** Searchable trilingual medical glossary (114 curated terms).
 *  Pure presentation over src/data/glossary.ts — the same data
 *  injected into LLM prompts, here exposed for users. */
export function GlossarySection() {
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const isUr = uiLang === 'ur';
  const pendingAboutQuery = useAppStore((s) => s.pendingAboutQuery);
  const setPendingAboutQuery = useAppStore((s) => s.setPendingAboutQuery);

  // Consume a pending query set by the global search dialog (one-shot):
  // pre-filter the glossary, then clear the pending state. Same documented
  // escape hatch as ReminderDialog's initialDraft — setState-in-effect
  // guarded by a ref so each unique query is applied exactly once.
  const lastAppliedQuery = useRef<string | null>(null);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const incoming = pendingAboutQuery?.glossary ?? null;
    if (incoming && incoming !== lastAppliedQuery.current) {
      lastAppliedQuery.current = incoming;
      setQuery(incoming);
      setPendingAboutQuery(null);
    }
  }, [pendingAboutQuery, setPendingAboutQuery]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY;
    const qRaw = query.trim();
    return GLOSSARY.filter(
      (term) =>
        term.en.toLowerCase().includes(q) ||
        term.ur.includes(qRaw) ||
        term.roman.toLowerCase().includes(q),
    );
  }, [query]);

  const copyTerm = async (en: string, ur: string, roman: string) => {
    try {
      await navigator.clipboard.writeText(`${en} — ${ur} — ${roman}`);
      toast({ description: t(uiLang, 'summary.copied') });
    } catch {
      // clipboard unavailable (e.g. insecure context) — silent fail is fine
    }
  };

  return (
    <section
      className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
      aria-label={t(uiLang, 'about.glossaryTitle')}
    >
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <BookMarked className="h-4 w-4 text-primary" aria-hidden />
        </span>
        {t(uiLang, 'about.glossaryTitle')}
        <span className="ms-auto shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-muted-foreground tabular-nums">
          {filtered.length} {t(uiLang, 'about.glossaryTerms')}
        </span>
      </h2>
      <p className="text-sm leading-relaxed text-foreground/90">
        {t(uiLang, 'about.glossaryBody')}
      </p>

      {/* search */}
      <div className="relative mt-3">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(uiLang, 'about.glossarySearch')}
          aria-label={t(uiLang, 'about.glossarySearch')}
          dir="auto"
          className="h-11 w-full rounded-xl border border-border bg-background ps-9 pe-9 text-sm text-foreground shadow-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label={t(uiLang, 'chat.cancel')}
            className="absolute end-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {/* terms list */}
      {filtered.length === 0 ? (
        <p className="mt-4 rounded-xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
          {t(uiLang, 'about.glossaryEmpty')}
        </p>
      ) : (
        <motion.dl
          initial={false}
          className="custom-scrollbar mt-3 max-h-96 overflow-y-auto rounded-xl border border-border bg-background/60"
          dir="ltr"
        >
          {filtered.map((term, i) => (
            <div
              key={`${term.en}-${i}`}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent/40',
                i > 0 && 'border-t border-border/60',
              )}
            >
              <div className="min-w-0 flex-1 grid gap-0.5 sm:grid-cols-3 sm:items-center sm:gap-2">
                <dt className="truncate text-sm font-bold text-foreground" title={term.en}>
                  {term.en}
                </dt>
                <dd className="font-urdu text-sm text-foreground/90" dir="rtl">
                  {term.ur}
                </dd>
                <dd className="text-sm text-muted-foreground">{term.roman}</dd>
              </div>
              <button
                type="button"
                onClick={() => void copyTerm(term.en, term.ur, term.roman)}
                aria-label={`${t(uiLang, 'about.glossaryCopy')}: ${term.en}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/70 opacity-60 transition-all sm:opacity-0 sm:group-hover:opacity-100 hover:bg-primary/10 hover:text-primary focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring"
              >
                <ClipboardCopy className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </motion.dl>
      )}
      {isUr ? (
        <p className="mt-2 font-urdu text-[11px] text-muted-foreground" dir="rtl">
          {t(uiLang, 'about.glossaryBody')}
        </p>
      ) : null}
    </section>
  );
}
