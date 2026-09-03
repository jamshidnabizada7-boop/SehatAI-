'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  History,
  Loader2,
  MessageCircle,
  Phone,
  Siren,
  Trash2,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store/app-store';
import { useChatStore } from '@/lib/store/chat-store';
import { resolveUiLang, t } from '@/lib/i18n';
import type { Lang, TriageLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ConversationListItem {
  id: string;
  language: string;
  offline: boolean;
  startedAt: string;
  updatedAt: string;
  messageCount: number;
  preview: string;
  triageLevel: string | null;
  emergency: boolean;
}

interface ConversationMessageDto {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  language: string;
  triageLevel: string | null;
  emergency: boolean;
  createdAt: number;
}

const TRIAGE_DOT: Record<TriageLevel, string> = {
  EMERGENCY: 'bg-red-600',
  URGENT: 'bg-orange-500',
  ROUTINE: 'bg-amber-500',
  SELF_CARE: 'bg-emerald-600',
};

const TRIAGE_LABEL: Record<TriageLevel, 'triage.EMERGENCY' | 'triage.URGENT' | 'triage.ROUTINE' | 'triage.SELF_CARE'> = {
  EMERGENCY: 'triage.EMERGENCY',
  URGENT: 'triage.URGENT',
  ROUTINE: 'triage.ROUTINE',
  SELF_CARE: 'triage.SELF_CARE',
};

function formatRelative(iso: string, lang: Lang): string {
  const L = {
    en: {
      now: 'just now',
      min: (n: number) => `${n} min ago`,
      h: (n: number) => `${n} h ago`,
      d: (n: number) => `${n} d ago`,
    },
    roman: {
      now: 'abhi',
      min: (n: number) => `${n} minute pehle`,
      h: (n: number) => `${n} ghantay pehle`,
      d: (n: number) => `${n} din pehle`,
    },
    ur: {
      now: 'ابھی',
      min: (n: number) => `${n} منٹ پہلے`,
      h: (n: number) => `${n} گھنٹے پہلے`,
      d: (n: number) => `${n} دن پہلے`,
    },
  }[lang];
  try {
    const date = new Date(iso);
    const now = Date.now();
    const diffMs = now - date.getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return L.now;
    if (mins < 60) return L.min(mins);
    const hours = Math.floor(mins / 60);
    if (hours < 24) return L.h(hours);
    const days = Math.floor(hours / 24);
    if (days < 7) return L.d(days);
    return new Intl.DateTimeFormat(lang === 'ur' ? 'ur-PK' : undefined, {
      day: 'numeric',
      month: 'short',
    }).format(date);
  } catch {
    return iso;
  }
}

/**
 * Right-side drawer that lists past conversations for the current session
 * and restores one into the chat view on demand. Pure data-loading component;
 * does NOT touch the safety pipeline.
 */
export function ConversationHistoryDrawer() {
  const open = useChatStore((s) => s.historyOpen);
  const setOpen = useChatStore((s) => s.setHistoryOpen);
  const loadConversation = useChatStore((s) => s.loadConversation);
  const langPref = useAppStore((s) => s.langPref);
  const ensureSession = useAppStore((s) => s.ensureSession);
  const setConversationId = useAppStore((s) => s.setConversationId);
  const uiLang = resolveUiLang(langPref);

  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const sessionId = ensureSession();
      const res = await fetch(`/api/conversations?sessionId=${encodeURIComponent(sessionId)}`);
      if (!res.ok) throw new Error(`history ${res.status}`);
      const data = (await res.json()) as { conversations?: ConversationListItem[] };
      setItems(data.conversations ?? []);
    } catch {
      setError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [ensureSession]);

  useEffect(() => {
    if (open) {
      setConfirmDeleteId(null);
      void load();
    }
  }, [open, load]);

  const openConversation = useCallback(
    async (id: string) => {
      setOpeningId(id);
      try {
        const sessionId = ensureSession();
        const res = await fetch(`/api/conversations/${encodeURIComponent(id)}?sessionId=${encodeURIComponent(sessionId)}`);
        if (!res.ok) throw new Error(`load ${res.status}`);
        const data = (await res.json()) as {
          conversation?: { id: string; language: string; messages: ConversationMessageDto[] };
        };
        const conv = data.conversation;
        if (!conv) throw new Error('no conversation');
        const convLang: Lang = (['en', 'ur', 'roman'] as const).includes(conv.language as never)
          ? (conv.language as Lang)
          : 'en';
        const chatMessages = conv.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          language: (['en', 'ur', 'roman'] as const).includes(m.language as never)
            ? (m.language as Lang)
            : 'en',
          createdAt: m.createdAt,
          ...(m.triageLevel && ['EMERGENCY', 'URGENT', 'ROUTINE', 'SELF_CARE'].includes(m.triageLevel)
            ? { triage: { level: m.triageLevel as TriageLevel, reason: '', signals: [], engine: 'L0' as const, shortCircuited: false } }
            : {}),
          ...(m.emergency ? { emergency: true as const } : {}),
        }));
        loadConversation(chatMessages, conv.id, convLang);
        setConversationId(conv.id);
      } catch {
        setError(true);
      } finally {
        setOpeningId(null);
      }
    },
    [ensureSession, loadConversation, setConversationId],
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      // optimistic removal
      const prev = items;
      setItems((curr) => curr.filter((c) => c.id !== id));
      setConfirmDeleteId(null);
      try {
        const sessionId = ensureSession();
        const res = await fetch(
          `/api/conversations/${encodeURIComponent(id)}?sessionId=${encodeURIComponent(sessionId)}`,
          { method: 'DELETE' },
        );
        if (!res.ok) throw new Error(`delete ${res.status}`);
      } catch {
        // rollback
        setItems(prev);
        setError(true);
      }
    },
    [ensureSession, items],
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md" aria-label={t(uiLang, 'chat.historyTitle')}>
        <SheetHeader className="border-b border-border px-4 py-3 text-left">
          <SheetTitle className="flex items-center gap-2 text-base font-bold">
            <History className="h-4 w-4" aria-hidden />
            {t(uiLang, 'chat.historyTitle')}
          </SheetTitle>
          <SheetDescription className="sr-only">{t(uiLang, 'chat.historyTitle')}</SheetDescription>
        </SheetHeader>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {loading ? (
            <div className="space-y-2 px-1">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-red-50 px-5 py-8 text-center dark:bg-red-950/40">
              <p className="text-sm text-red-700 dark:text-red-300">{t(uiLang, 'chat.historyFailed')}</p>
              <Button variant="outline" size="sm" onClick={() => void load()} className="h-9">
                {t(uiLang, 'facilities.retry')}
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 px-5 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <MessageCircle className="h-6 w-6 text-primary" aria-hidden />
              </span>
              <p className="text-sm text-muted-foreground">{t(uiLang, 'chat.historyEmpty')}</p>
            </div>
          ) : (
            <ul className="space-y-2" aria-label={t(uiLang, 'chat.historyTitle')}>
              {items.map((c) => {
                const triageLevel = (c.triageLevel && ['EMERGENCY', 'URGENT', 'ROUTINE', 'SELF_CARE'].includes(c.triageLevel)
                  ? c.triageLevel
                  : null) as TriageLevel | null;
                const isOpening = openingId === c.id;
                const isConfirming = confirmDeleteId === c.id;
                return (
                  <motion.li
                    key={c.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div className="rounded-2xl border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary/30">
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                            c.emergency
                              ? 'bg-red-600/10 text-red-600 dark:text-red-400'
                              : 'bg-primary/10 text-primary',
                          )}
                          aria-hidden
                        >
                          {c.emergency ? <Siren className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            {triageLevel ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase text-secondary-foreground">
                                <span className={cn('h-1.5 w-1.5 rounded-full', TRIAGE_DOT[triageLevel])} aria-hidden />
                                {t(uiLang, TRIAGE_LABEL[triageLevel])}
                              </span>
                            ) : null}
                            {c.emergency ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-600/10 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-400">
                                <Phone className="h-3 w-3" aria-hidden />
                                1122
                              </span>
                            ) : null}
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {formatRelative(c.updatedAt, uiLang)}
                            </span>
                          </div>
                          <p
                            className={cn('mt-1 line-clamp-2 text-sm text-foreground/85', c.language === 'ur' && 'font-urdu')}
                            dir={c.language === 'ur' ? 'rtl' : 'ltr'}
                          >
                            {c.preview || (uiLang === 'ur' ? 'خالی گفتگو' : 'Empty conversation')}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {c.messageCount} {t(uiLang, 'chat.historyMessages')}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-2">
                        {isConfirming ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2.5 text-xs text-muted-foreground"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              {t(uiLang, 'chat.cancel')}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8 gap-1.5 px-2.5 text-xs"
                              onClick={() => void deleteConversation(c.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              {t(uiLang, 'chat.historyDelete')}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                              onClick={() => setConfirmDeleteId(c.id)}
                              aria-label={t(uiLang, 'chat.historyDelete')}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              {t(uiLang, 'chat.historyDelete')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 px-3 text-xs font-semibold text-primary hover:bg-primary/10"
                              disabled={isOpening}
                              onClick={() => void openConversation(c.id)}
                            >
                              {isOpening ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                              ) : (
                                <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                              )}
                              {t(uiLang, 'chat.historyOpen')}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
