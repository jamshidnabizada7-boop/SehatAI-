'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  CloudOff,
  Copy,
  HeartPulse,
  Languages,
  RefreshCw,
  Share2,
  Square,
  ThumbsDown,
  ThumbsUp,
  TriangleAlert,
  Volume2,
} from 'lucide-react';
import type { ChatMessage, Lang, PipelineStage } from '@/lib/types';
import { t } from '@/lib/i18n';
import { answerPlainText } from '@/lib/speech';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store/app-store';
import { useChatStore } from '@/lib/store/chat-store';
import { MarkdownContent } from './markdown-content';
import { TriageBadge } from './triage-badge';
import { CitationCard, citationSummary } from './citation-card';
import { PipelineTicker } from './pipeline-ticker';
import { Button } from '@/components/ui/button';

/** "HH:MM" from a message timestamp (12h clock, locale-safe fallback). */
function timeLabel(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

interface MessageBubbleProps {
  message: ChatMessage;
  urduVersion?: string;
  feedback?: 1 | 0;
  streamError?: string;
  isStreaming: boolean;
  completedStages: PipelineStage[];
  currentStage: PipelineStage | null;
  uiLang: Lang;
  /** message id currently being read aloud (shared across bubbles) */
  speakingId: string | null;
  /** whether this message is the last assistant answer (regenerate target) */
  isLastAssistant: boolean;
  onFeedback: (messageId: string, rating: 1 | 0) => void;
  onSpeak: (messageId: string, content: string, lang: Lang) => void;
  onRegenerate: (messageId: string) => void;
}

/** Small icon action button with consistent styling across the action row. */
function ActionIcon({
  label,
  onClick,
  active,
  children,
  disabled,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40',
        active ? 'text-primary' : 'text-muted-foreground/60 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

export function MessageBubble({
  message,
  urduVersion,
  feedback,
  streamError,
  isStreaming,
  completedStages,
  currentStage,
  uiLang,
  speakingId,
  isLastAssistant,
  onFeedback,
  onSpeak,
  onRegenerate,
}: MessageBubbleProps) {
  const [showingUrdu, setShowingUrdu] = useState(false);
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  // content language of THIS message (kept regardless of UI language)
  const msgLang: Lang = message.language ?? 'en';
  const isUrduContent = msgLang === 'ur';
  const setView = useAppStore((s) => s.setView);
  const setPendingReminderDraft = useChatStore((s) => s.setPendingReminderDraft);

  const isSpeaking = speakingId === message.id;

  /** Pull the first non-empty paragraph/line of the answer as the reminder
   *  title, with a sensible length cap. Falls back to a generic label. */
  const saveAsReminder = () => {
    const text = (message.content || '').trim();
    if (!text) return;
    const firstBlock = text.split(/\n+/).find((line) => line.trim().length > 0) ?? text;
    const title = firstBlock.replace(/^[-•*]\s*/, '').slice(0, 100) || (uiLang === 'ur' ? 'سیۃ اے آئی رہنمائی' : 'SehatAI guidance');
    setPendingReminderDraft({ title, notes: text.slice(0, 280) });
    setView('reminders');
  };

  const copyAnswer = async () => {
    const text = answerPlainText(message.content || '');
    if (!text) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      // older Android WebViews lack the async clipboard API — use the
      // legacy hidden-textarea + execCommand path instead
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  /** Share the answer: native share sheet when available (Android),
   *  WhatsApp compose link otherwise — Pakistan's default channel for
   *  forwarding health guidance to family. */
  const shareAnswer = async () => {
    const text = answerPlainText(message.content || '');
    if (!text) return;
    const shared = `${t(uiLang, 'app.name')} — ${t(uiLang, 'chat.assistant')}\n\n${text.slice(0, 1500)}`;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ text: shared });
        return;
      }
    } catch {
      // user dismissed the native sheet, or share failed → fall through
      // to WhatsApp only if the share promise rejected before showing
    }
    try {
      window.open(`https://wa.me/?text=${encodeURIComponent(shared)}`, '_blank', 'noopener');
    } catch {
      // popups blocked — nothing more we can do here; copy button is the fallback
    }
  };

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-end"
      >
        <div
          className={cn(
            'max-w-[85%] rounded-2xl rounded-ee-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm transition-shadow hover:shadow-md sm:max-w-[75%]',
            isUrduContent && 'font-urdu',
          )}
          dir={isUrduContent ? 'rtl' : 'ltr'}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <span className="mt-1 pe-1 text-[10px] font-medium text-muted-foreground/70" aria-hidden>
          {timeLabel(message.createdAt)}
        </span>
      </motion.div>
    );
  }

  // ---------- assistant ----------
  const displayContent =
    showingUrdu && urduVersion ? urduVersion : message.content;
  const displayIsUrdu = showingUrdu && urduVersion ? true : isUrduContent;
  const isEmergency = message.triage?.level === 'EMERGENCY';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex justify-start gap-2.5"
    >
      {/* SehatAI identity avatar — stable anchor that makes the thread
       *  read like a conversation, not a document */}
      <span
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20 transition-shadow',
          isSpeaking && 'ring-2 ring-primary/40',
        )}
        aria-hidden
      >
        <HeartPulse className={cn('h-4 w-4 text-primary', isSpeaking && 'animate-pulse')} />
      </span>

      <div className="min-w-0 w-full max-w-[92%] sm:max-w-[85%]">
        {/* pipeline ticker while this reply streams */}
        {message.streaming && isStreaming ? (
          <div className="mb-2 rounded-xl border border-border bg-card px-3 py-2">
            <PipelineTicker
              completedStages={completedStages}
              currentStage={currentStage}
              lang={msgLang}
            />
          </div>
        ) : null}

        <div
          className={cn(
            'rounded-2xl rounded-es-md border px-4 py-3 shadow-sm',
            message.offline
              ? 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/40'
              : 'bg-card',
            isEmergency && !message.offline && 'border-red-600/40',
            isSpeaking && 'ring-2 ring-primary/25',
          )}
        >
          {/* offline label */}
          {message.offline ? (
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <CloudOff className="h-3.5 w-3.5" aria-hidden />
              {t(uiLang, 'chat.offlineLabel')}
            </div>
          ) : null}

          {/* triage badge */}
          {message.triage ? (
            <TriageBadge
              level={message.triage.level}
              lang={msgLang}
              reason={message.triage.reason}
              className="mb-2"
            />
          ) : null}

          {/* content */}
          {displayContent ? (
            <div dir={displayIsUrdu ? 'rtl' : 'ltr'} className={cn(displayIsUrdu && 'font-urdu')}>
              <MarkdownContent content={displayContent} citations={message.citations} />
              {message.streaming && isStreaming ? (
                <span className="ms-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-primary align-middle" />
              ) : null}
            </div>
          ) : message.streaming && isStreaming ? (
            <div className="flex gap-1 py-1" aria-hidden>
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:120ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:240ms]" />
            </div>
          ) : null}

          {/* read-aloud live indicator */}
          {isSpeaking ? (
            <div
              className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-primary"
              role="status"
            >
              <span className="flex h-3.5 items-end gap-[3px]" aria-hidden>
                <span className="speech-eq-bar h-3.5 w-[3px] rounded-full bg-primary" />
                <span className="speech-eq-bar h-3.5 w-[3px] rounded-full bg-primary" />
                <span className="speech-eq-bar h-3.5 w-[3px] rounded-full bg-primary" />
              </span>
              {t(uiLang, 'chat.readingAloud')}
            </div>
          ) : null}

          {/* stream error note */}
          {streamError ? (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
              <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t(uiLang, 'chat.errorTitle')} — {streamError}
            </div>
          ) : null}

          {/* Roman ↔ script toggle */}
          {urduVersion && !message.streaming ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowingUrdu((v) => !v)}
              className="mt-2 h-8 gap-1.5 px-2.5 text-xs font-medium text-emerald-700 hover:bg-emerald-600/10 dark:text-emerald-400"
              aria-label={showingUrdu ? t(uiLang, 'chat.viewRoman') : t(uiLang, 'chat.viewUrdu')}
            >
              <Languages className="h-3.5 w-3.5" aria-hidden />
              {showingUrdu ? t(uiLang, 'chat.viewRoman') : t(uiLang, 'chat.viewUrdu')}
            </Button>
          ) : null}
        </div>

        {/* citations */}
        {message.citations && message.citations.length > 0 && !message.streaming ? (
          <div className="mt-2 space-y-1.5">
            {message.citations.map((citation, i) => (
              <CitationCard key={`${citation.id}-${i}`} citation={citation} index={i} lang={uiLang} />
            ))}
          </div>
        ) : null}

        {/* Offline Guided Action Chips for instant follow-up without typing */}
        {message.offline && !message.streaming && isLastAssistant ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => useChatStore.getState().setPendingChatDraft(uiLang === 'ur' ? 'گھر پر دیکھ بھال اور علاج کے طریقے بتائیں' : uiLang === 'roman' ? 'Ghar par dekh bhaal aur bachao ke tareeqay batayein' : 'How can I treat and prevent this at home?')}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-600/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-800 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300"
            >
              📋 {uiLang === 'ur' ? 'گھریلو دیکھ بھال' : uiLang === 'roman' ? 'Home Care Steps' : 'Home Care Steps'}
            </button>
            <button
              type="button"
              onClick={() => useChatStore.getState().setPendingChatDraft(uiLang === 'ur' ? 'ڈاکٹر کو کب دکھانا چاہیے؟' : uiLang === 'roman' ? 'Doctor ko kab dikhana chahiye?' : 'When should I see a doctor for this?')}
              className="inline-flex items-center gap-1 rounded-full border border-amber-600/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-800 transition-colors hover:bg-amber-500/20 dark:text-amber-300"
            >
              ⚠️ {uiLang === 'ur' ? 'ڈاکٹر کے پاس کب جائیں' : uiLang === 'roman' ? 'When to See Doctor' : 'When to See Doctor'}
            </button>
            <button
              type="button"
              onClick={() => useChatStore.getState().setPendingChatDraft(uiLang === 'ur' ? 'خطرناک علامات کون سی ہیں؟' : uiLang === 'roman' ? 'Khatray ki alamaat kaun si hain?' : 'What are the danger signs to watch for?')}
              className="inline-flex items-center gap-1 rounded-full border border-red-600/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-800 transition-colors hover:bg-red-500/20 dark:text-red-300"
            >
              🚨 {uiLang === 'ur' ? 'خطرناک علامات' : uiLang === 'roman' ? 'Danger Signs' : 'Danger Signs'}
            </button>
          </div>
        ) : null}

        {/* message footer: sources summary + actions */}
        {!message.streaming ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span
              className="text-[10px] font-medium text-muted-foreground/70"
              aria-hidden
              suppressHydrationWarning
            >
              {timeLabel(message.createdAt)}
            </span>
            {message.citations && message.citations.length > 0 ? (
              <span className="text-[11px] text-muted-foreground">
                {t(uiLang, 'citation.sources')}: {citationSummary(message.citations)}
              </span>
            ) : null}
            <span className="ms-auto flex items-center gap-0.5">
              {/* read aloud — accessibility for low-literacy users */}
              <ActionIcon
                label={isSpeaking ? t(uiLang, 'chat.stopReading') : t(uiLang, 'chat.readAloud')}
                onClick={() => onSpeak(message.id, displayContent, displayIsUrdu ? 'ur' : msgLang)}
                active={isSpeaking}
              >
                {isSpeaking ? <Square className="h-3.5 w-3.5 fill-current" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
              </ActionIcon>
              {/* copy answer for sharing with family / a doctor */}
              <ActionIcon
                label={copied ? t(uiLang, 'chat.copiedAnswer') : t(uiLang, 'chat.copyAnswer')}
                onClick={() => void copyAnswer()}
                active={copied}
              >
                <Copy className="h-4 w-4" aria-hidden />
              </ActionIcon>
              {/* share — native sheet, else WhatsApp */}
              <ActionIcon
                label={t(uiLang, 'chat.shareAnswer')}
                onClick={() => void shareAnswer()}
              >
                <Share2 className="h-4 w-4" aria-hidden />
              </ActionIcon>
              {/* regenerate — only on the latest assistant answer */}
              {isLastAssistant ? (
                <ActionIcon
                  label={t(uiLang, 'chat.regenerate')}
                  onClick={() => onRegenerate(message.id)}
                  disabled={isStreaming}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden />
                </ActionIcon>
              ) : null}
              <ActionIcon label={t(uiLang, 'chat.saveAsReminder')} onClick={saveAsReminder}>
                <Bell className="h-4 w-4" aria-hidden />
              </ActionIcon>
              <ActionIcon
                label={t(uiLang, 'chat.helpful')}
                onClick={() => onFeedback(message.id, 1)}
                active={feedback === 1}
              >
                <ThumbsUp className="h-4 w-4" aria-hidden />
              </ActionIcon>
              <ActionIcon
                label={t(uiLang, 'chat.notHelpful')}
                onClick={() => onFeedback(message.id, 0)}
                active={feedback === 0}
              >
                <ThumbsDown className="h-4 w-4" aria-hidden />
              </ActionIcon>
            </span>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
