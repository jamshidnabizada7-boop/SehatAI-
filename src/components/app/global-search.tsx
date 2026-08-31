'use client';

// ============================================================
// SehatAI — Global search dialog (Ctrl/Cmd+K or header button)
//
// One search box across everything SehatAI knows:
//   • First aid → opens About view, first-aid section pre-filtered
//   • Glossary  → opens About view, glossary pre-filtered
//   • Topics    → opens Chat with a grounded question pre-filled
//
// Pure client-side search over the verified pack (search-index.ts)
// — works offline, deterministic, never an LLM call.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import {
  BookMarked,
  HeartPulse,
  MessageCircleQuestion,
  Siren,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useAppStore } from '@/lib/store/app-store';
import { useChatStore } from '@/lib/store/chat-store';
import { resolveUiLang, t } from '@/lib/i18n';
import { CORPUS_BY_ID, searchAll, topicQuestion } from '@/lib/search-index';
import { cn } from '@/lib/utils';

export function GlobalSearch() {
  const searchOpen = useAppStore((s) => s.searchOpen);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const setView = useAppStore((s) => s.setView);
  const setPendingAboutQuery = useAppStore((s) => s.setPendingAboutQuery);
  const setPendingChatDraft = useChatStore((s) => s.setPendingChatDraft);

  const [query, setQuery] = useState('');

  /** Close + reset: every close path (user ESC/backdrop, or picking a
   *  result) funnels through here so the query always starts fresh. */
  const close = () => {
    setQuery('');
    setSearchOpen(false);
  };

  // Ctrl/Cmd+K opens the dialog from anywhere in the app
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSearchOpen]);

  const results = useMemo(() => searchAll(query), [query]);
  const isUr = uiLang === 'ur';

  /** first-aid result → About view with the first-aid list pre-filtered */
  const openFirstAid = (rawQuery: string) => {
    setPendingAboutQuery({ firstAid: rawQuery });
    setView('about');
    close();
  };

  /** glossary result → About view with the glossary pre-filtered */
  const openGlossary = (rawQuery: string) => {
    setPendingAboutQuery({ glossary: rawQuery });
    setView('about');
    close();
  };

  /** topic result → Chat view with a grounded question pre-filled */
  const askTopic = (corpusId: string) => {
    const item = CORPUS_BY_ID[corpusId];
    if (!item) return;
    setPendingChatDraft(topicQuestion(item, uiLang));
    setView('chat');
    close();
  };

  const hasQuery = query.trim().length > 0;

  return (
    <CommandDialog
      open={searchOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      title={t(uiLang, 'header.search')}
      description={t(uiLang, 'search.hint')}
      className="sm:max-w-lg"
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={t(uiLang, 'search.placeholder')}
      />
      <CommandList className="custom-scrollbar">
        {hasQuery && results.total === 0 ? (
          <CommandEmpty>{t(uiLang, 'search.empty')}</CommandEmpty>
        ) : null}
        {!hasQuery ? (
          <div
            className={cn(
              'flex items-center gap-2.5 px-4 py-6 text-sm text-muted-foreground',
              isUr && 'font-urdu',
            )}
            dir={isUr ? 'rtl' : 'ltr'}
          >
            <MessageCircleQuestion className="h-4 w-4 shrink-0" aria-hidden />
            {t(uiLang, 'search.hint')}
          </div>
        ) : null}

        {results.firstAid.length > 0 ? (
          <CommandGroup
            heading={t(uiLang, 'search.firstAidGroup')}
          >
            {results.firstAid.map((r) => (
              <CommandItem
                key={`fa-${r.id}`}
                value={`${r.title.en} ${r.title.ur} ${r.title.roman} ${r.id}`}
                onSelect={() => openFirstAid(query.trim())}
                className="gap-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-600/10">
                  <Siren className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden />
                </span>
                <span className={cn('min-w-0 flex-1', isUr && 'font-urdu')}>
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {r.title[uiLang]}
                  </span>
                  <span className="block text-[11px] text-muted-foreground" dir="ltr">
                    {t(uiLang, 'search.openFirstAid')}
                  </span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {results.glossary.length > 0 ? (
          <CommandGroup heading={t(uiLang, 'search.glossaryGroup')}>
            {results.glossary.map((r) => (
              <CommandItem
                key={`gl-${r.id}`}
                value={`${r.title.en} ${r.title.ur} ${r.title.roman}`}
                onSelect={() => openGlossary(query.trim())}
                className="gap-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <BookMarked className="h-4 w-4 text-primary" aria-hidden />
                </span>
                <span className="min-w-0 flex-1" dir="ltr">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {r.title.en}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    <span className="font-urdu">{r.title.ur}</span>
                    {' · '}
                    {r.title.roman}
                  </span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {results.topics.length > 0 ? (
          <CommandGroup heading={t(uiLang, 'search.topicsGroup')}>
            {results.topics.map((r) => (
              <CommandItem
                key={`tp-${r.id}`}
                value={`${r.title.en} ${r.title.ur} ${r.title.roman} ${r.id}`}
                onSelect={() => askTopic(r.corpusId ?? r.id)}
                className="gap-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10">
                  <HeartPulse className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                </span>
                <span className={cn('min-w-0 flex-1', isUr && 'font-urdu')}>
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {r.title[uiLang]}
                  </span>
                  <span className="block text-[11px] text-muted-foreground" dir="ltr">
                    {r.subtitle} · {t(uiLang, 'search.askTopic')}
                  </span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
