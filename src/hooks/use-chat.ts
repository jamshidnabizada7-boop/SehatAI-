'use client';

import { useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store/app-store';
import { useChatStore } from '@/lib/store/chat-store';
import { detectMessageLang, t } from '@/lib/i18n';
import { runOfflineEngine } from '@/lib/engine/safety-engine';
import { getEmergencyTemplate } from '@/data/emergency-templates';
import { EMERGENCY_NUMBERS } from '@/data/lexicon';
import type {
  ChatMessage,
  Citation,
  DoneStageData,
  EmergencyStageData,
  Lang,
  LanguageStageData,
  SSEEvent,
  TriageStageData,
  ValidationStageData,
} from '@/lib/types';

function genId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** UI language for toasts (auto → English chrome). */
function uiLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  const pref = useAppStore.getState().langPref;
  return pref === 'auto' ? 'en' : pref;
}

/** Build an EmergencyStageData locally (offline-engine path). */
function buildEmergencyData(
  category: string,
  lang: Lang,
  reason: string,
  matchedPatternId?: string,
): EmergencyStageData | null {
  const tpl = getEmergencyTemplate(category);
  if (!tpl) return null;
  return {
    templateCategory: category,
    title: tpl.title[lang],
    reason,
    matchedPatternId: matchedPatternId ?? '',
    actions: tpl.immediateActions.map((a) => a[lang]),
    doNot: tpl.doNot.map((d) => d[lang]),
    numbers: EMERGENCY_NUMBERS,
    sources: tpl.sources,
  };
}

export function useChat() {
  const { toast } = useToast();
  const abortRef = useRef<AbortController | null>(null);

  /** Offline path — deterministic verified pack, runs fully client-side. */
  const sendOffline = useCallback(
    async (text: string, lang: Lang, assistantId: string) => {
      // small delay so the offline path feels deliberate, not a glitch
      await sleep(500);
      const history = useChatStore.getState().messages;
      const result = runOfflineEngine(text, lang, history);
      const triage: TriageStageData = {
        level: result.triage.level,
        reason: result.triage.reason,
        signals: result.triage.signals,
        engine: result.triage.engine,
        shortCircuited: result.triage.shortCircuited,
      };
      const citations: Citation[] = result.citations.map((c) => ({
        id: c.id,
        title: c.title,
        publisher: c.publisher,
        url: c.url,
      }));
      useChatStore.getState().finishStream(assistantId, {
        content: result.content,
        language: lang,
        triage,
        citations,
        offline: true,
      });

      if (result.emergencyCategory) {
        const em = buildEmergencyData(
          result.emergencyCategory,
          lang,
          result.triage.reason,
          result.triage.matchedPatternId,
        );
        if (em) useChatStore.getState().setEmergency(em, lang);
      }
    },
    [],
  );

  /** Online path — POST /api/chat and parse the SSE stream. */
  const sendOnline = useCallback(
    async (text: string, lang: Lang, assistantId: string) => {
      const app = useAppStore.getState();
      const controller = new AbortController();
      abortRef.current = controller;

      let res: Response;
      try {
        res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            language: app.langPref,
            sessionId: app.sessionId,
            conversationId: app.conversationId ?? undefined,
          }),
          signal: controller.signal,
        });
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        // Network failure → honest offline fallback
        toast({
          description: t(uiLang(), 'chat.fallbackNotice'),
          variant: 'destructive',
        });
        await sendOffline(text, lang, assistantId);
        return;
      }

      if (!res.ok || !res.body) {
        // API unreachable → verified offline fallback keeps the product usable
        toast({
          description: `${t(uiLang(), 'chat.fallbackNotice')} (${res.status})`,
          variant: 'destructive',
        });
        await sendOffline(text, lang, assistantId);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalContent = '';

      const handleEvent = (evt: SSEEvent) => {
        const chat = useChatStore.getState();
        const data = (evt.data ?? {}) as Record<string, unknown>;
        switch (evt.stage) {
          case 'safety':
            chat.markStage('safety');
            break;
          case 'language': {
            chat.markStage('language');
            const langData = data as unknown as LanguageStageData;
            if (langData?.language) {
              chat.updateMessage(assistantId, { language: langData.language });
            }
            break;
          }
          case 'triage':
            chat.markStage('triage');
            chat.updateMessage(assistantId, {
              triage: data as unknown as TriageStageData,
            });
            break;
          case 'emergency': {
            const em = data as unknown as EmergencyStageData;
            chat.updateMessage(assistantId, { emergency: em });
            const emLang = (data as { language?: Lang }).language ?? lang;
            chat.setEmergency(em, emLang);
            chat.markStage('emergency');
            break;
          }
          case 'retrieval':
            chat.markStage('retrieval');
            break;
          case 'generation': {
            chat.markStage('generation');
            const delta =
              (data.delta as string | undefined) ??
              (data.text as string | undefined) ??
              (data.content as string | undefined) ??
              '';
            if (delta) chat.appendDelta(assistantId, delta);
            break;
          }
          case 'validation':
            chat.markStage('validation');
            chat.updateMessage(assistantId, {
              validation: data as unknown as ValidationStageData,
            });
            break;
          case 'done': {
            const done = data as unknown as DoneStageData & {
              urduVersion?: string;
            };
            const messageId = done.messageId || assistantId;
            finalContent = done.content || finalContent;
            chat.finishStream(assistantId, {
              id: messageId,
              content: finalContent,
              language: done.language ?? lang,
              triage: done.triage,
              citations: done.citations,
              validation: done.validation,
              offline: false,
              confidence: done.confidence ?? null,
              drugCheck: done.drugCheck ?? null,
              differential: done.differential ?? null,
            });
            if (done.conversationId) {
              useAppStore.getState().setConversationId(done.conversationId);
            }
            if (done.urduVersion) {
              chat.setUrduVersion(messageId, done.urduVersion);
            }
            break;
          }
          case 'error': {
            const message =
              (data.message as string | undefined) ?? 'stream error';
            const fallback = data.fallbackContent as string | undefined;
            if (fallback && fallback.trim().length > 0) {
              chat.finishStream(assistantId, {
                content: fallback,
                offline: true,
              });
            } else {
              chat.finishStream(assistantId, {
                content: '',
                offline: false,
              });
              useChatStore.getState().setStreamError(assistantId, message);
              toast({
                description: t(uiLang(), 'chat.streamError'),
                variant: 'destructive',
              });
            }
            break;
          }
          default:
            break;
        }
      };

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              handleEvent(JSON.parse(payload) as SSEEvent);
            } catch {
              // ignore malformed keepalive/partial lines
            }
          }
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          useChatStore.getState().finishStream(assistantId, {});
          return;
        }
        throw err;
      } finally {
        abortRef.current = null;
      }

      // Stream ended without an explicit done/error event → close gracefully.
      const chatState = useChatStore.getState();
      if (chatState.messages.some((m) => m.id === assistantId && m.streaming)) {
        chatState.finishStream(assistantId, {});
      }
    },
    [sendOffline, toast],
  );

  const send = useCallback(
    async (text: string, opts: { offline: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const app = useAppStore.getState();
      const chat = useChatStore.getState();
      if (chat.streaming) return;

      app.ensureSession();
      const lang = detectMessageLang(trimmed, app.langPref);
      const now = Date.now();

      const userMessage: ChatMessage = {
        id: genId('user'),
        role: 'user',
        content: trimmed,
        language: lang,
        createdAt: now,
      };
      const assistantId = genId('assistant');
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        language: lang,
        createdAt: now + 1,
        streaming: true,
      };

      chat.addMessage(userMessage);
      chat.addMessage(assistantMessage);
      chat.startStream();

      try {
        if (opts.offline) {
          await sendOffline(trimmed, lang, assistantId);
        } else {
          await sendOnline(trimmed, lang, assistantId);
        }
      } catch {
        useChatStore.getState().finishStream(assistantId, {});
        useChatStore.getState().setStreamError(assistantId, 'stream failed');
        toast({
          description: t(uiLang(), 'chat.streamError'),
          variant: 'destructive',
        });
      }
    },
    [sendOffline, sendOnline, toast],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  /** Re-run the pipeline for the user message that preceded the given
   *  assistant message. The old assistant answer (and anything after it)
   *  is removed first, together with the user message itself — send()
   *  re-adds both fresh. No-op when already streaming. */
  const regenerate = useCallback(
    async (assistantMessageId: string) => {
      const chat = useChatStore.getState();
      if (chat.streaming) return;
      chat.truncateFrom(assistantMessageId);
      // a stale emergency takeover from the removed answer must not linger
      // — the fresh pipeline run re-raises it if still warranted
      chat.setEmergency(null, 'en');
      // the message now preceding the cut must be the user turn — remove
      // it too so send() re-adds it exactly once
      const after = useChatStore.getState().messages;
      const lastUser = after.length > 0 ? after[after.length - 1] : undefined;
      if (!lastUser || lastUser.role !== 'user') return;
      chat.truncateFrom(lastUser.id);
      const offline =
        useAppStore.getState().simulatedOffline ||
        (typeof navigator !== 'undefined' && !navigator.onLine);
      await send(lastUser.content, { offline });
    },
    [send],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    useChatStore.getState().resetChat();
    useAppStore.getState().setConversationId(null);
  }, []);

  const submitFeedback = useCallback(
    async (messageId: string, rating: 1 | 0) => {
      const lang = uiLang();
      useChatStore.getState().setFeedback(messageId, rating);
      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId, rating }),
        });
        toast({ description: t(lang, 'chat.thanksFeedback') });
      } catch {
        toast({
          description: t(lang, 'chat.feedbackFailed'),
          variant: 'destructive',
        });
      }
    },
    [toast],
  );

  return { send, stop, reset, submitFeedback, regenerate };
}
