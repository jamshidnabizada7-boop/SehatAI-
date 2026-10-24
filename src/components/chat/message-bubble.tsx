'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  BookOpen,
  Check,
  ClipboardList,
  CloudOff,
  Copy,
  Cpu,
  HeartPulse,
  Languages,
  MapPin,
  RefreshCw,
  Share2,
  Square,
  Stethoscope,
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
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { careActionsFor } from '@/lib/care-actions';
import { useNetworkOnline } from '@/hooks/use-network-online';
import { MarkdownContent } from './markdown-content';
import { TriageBadge } from './triage-badge';
import { DrugWarningCard } from './drug-warning-card';
import { DifferentialCard } from './differential-card';
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
        'flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40',
        active ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground',
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
  // The user report this answer replies to, for the shared care-action policy.
  const userText = useChatStore((state) => {
    const index = state.messages.findIndex((m) => m.id === message.id);
    for (let i = index - 1; i >= 0; i--) if (state.messages[i].role === 'user') return state.messages[i].content;
    return '';
  });
  const careActions = careActionsFor(message.triage?.level, userText);
  const networkOnline = useNetworkOnline();
  const { status: sessionStatus } = useSession();
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
    const title = firstBlock.replace(/^[-•*]\s*/, '').slice(0, 100) || (uiLang === 'ur' ? 'صحت اے آئی رہنمائی' : 'SehatAI guidance');
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
            'max-w-[85%] rounded-2xl rounded-ee-md bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground sm:max-w-[75%] sm:text-sm',
            isUrduContent && 'font-urdu',
          )}
          dir={isUrduContent ? 'rtl' : 'ltr'}
        >
          <p className="whitespace-pre-wrap font-medium">{message.content}</p>
        </div>
        <span className="mt-1 pe-1 text-2xs text-muted-foreground" aria-hidden suppressHydrationWarning>
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
  const isUrgent = message.triage?.level === 'URGENT';
  const showTriage = Boolean(message.triage && message.triage.level !== 'INFORMATIONAL');

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
          'mt-0.5 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent ring-1 ring-primary/20 transition-shadow sm:flex',
          isSpeaking && 'ring-2 ring-primary/40',
        )}
        aria-hidden
      >
        <HeartPulse className={cn('h-4 w-4 text-primary', isSpeaking && 'animate-pulse')} />
      </span>

      <div className="w-full min-w-0 sm:max-w-[88%]">
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
            'space-y-3 rounded-2xl rounded-es-md border px-4 py-3.5 shadow-[var(--soft-shadow)]',
            message.offline
              ? 'border-warning/30 bg-warning-soft'
              : 'border-border bg-card',
            isEmergency && !message.offline && 'border-red-700/45',
            isSpeaking && 'ring-2 ring-primary/25',
          )}
        >
          {/* Care urgency, only when the pipeline sent it. No confidence band or
              "evidence-based" boilerplate in the patient chat. */}
          {showTriage ? (
            <div className="flex flex-wrap items-start gap-2">
              {showTriage && message.triage ? (
                <TriageBadge
                  level={message.triage.level}
                  lang={msgLang}
                  reason={message.triage.reason}
                />
              ) : null}
            </div>
          ) : null}

          {/* Local (non-AI) guidance label. While the device is online this is
              the consent gate (AI processing needs sign-in + consent), not an
              outage, so say so and offer sign-in to guests. */}
          {message.offline ? (
            networkOnline ? (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-warning">
                <BookOpen className="h-3.5 w-3.5" aria-hidden />
                <span>{t(uiLang, 'ui.localGuidanceLabel')}</span>
                {sessionStatus === 'unauthenticated' ? (
                  <Link href="/auth/signin" className="font-semibold text-primary underline underline-offset-2 hover:no-underline">
                    {t(uiLang, 'auth.bannerCta')}
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-warning">
                <CloudOff className="h-3.5 w-3.5" aria-hidden />
                {t(uiLang, 'chat.offlineLabel')}
              </div>
            )
          ) : null}

          {/* medication safety alert — above the response text when present */}
          {message.drugCheck && message.drugCheck.severity !== 'NONE' ? (
            <DrugWarningCard
              drugCheck={message.drugCheck}
              lang={msgLang}
              className="mb-2"
            />
          ) : null}

          {/* Phase 2 — 3-tier differential (Glass-style, collapsible) */}
          {message.differential ? (
            <DifferentialCard
              differential={message.differential}
              lang={msgLang}
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
              <span className="stage-dot-pulse h-2 w-2 rounded-full bg-primary/70 [animation-delay:0ms]" />
              <span className="stage-dot-pulse h-2 w-2 rounded-full bg-primary/70 [animation-delay:180ms]" />
              <span className="stage-dot-pulse h-2 w-2 rounded-full bg-primary/70 [animation-delay:360ms]" />
            </div>
          ) : null}

          {/* read-aloud live indicator */}
          {isSpeaking ? (
            <div
              className="mt-2 flex items-center gap-2 text-2xs font-semibold text-primary"
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
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-danger-soft px-2.5 py-1.5 text-xs text-danger" role="alert">
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
              className="h-9 gap-1.5 px-2.5 text-xs font-medium text-primary hover:bg-accent hover:text-primary"
              aria-label={showingUrdu ? t(uiLang, 'chat.viewRoman') : t(uiLang, 'chat.viewUrdu')}
            >
              <Languages className="h-3.5 w-3.5" aria-hidden />
              {showingUrdu ? t(uiLang, 'chat.viewRoman') : t(uiLang, 'chat.viewUrdu')}
            </Button>
          ) : null}

          {/* Next steps: latest finished answer only, and only what the shared
              care-action policy allows (no booking push on greetings; emergencies
              get emergency-care navigation instead of booking). */}
          {!message.streaming && isLastAssistant && (careActions.bookDoctor || careActions.facilities) ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
              {careActions.bookDoctor ? (
                <Button
                  size="sm"
                  variant={isUrgent ? 'default' : 'outline'}
                  onClick={() => setView('care')}
                  className="h-9 gap-1.5 rounded-lg text-xs font-semibold"
                >
                  <Stethoscope className={cn('h-3.5 w-3.5', !isUrgent && 'text-primary')} aria-hidden />
                  {t(uiLang, 'ui.talkToDoctor')}
                </Button>
              ) : null}
              {careActions.facilities ? (
                <Button
                  variant={isEmergency ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setView('facilities')}
                  className={cn('h-9 gap-1.5 rounded-lg text-xs font-semibold', isEmergency && 'bg-red-700 text-white hover:bg-red-800')}
                >
                  <MapPin className={cn('h-3.5 w-3.5', !isEmergency && 'text-primary')} aria-hidden />
                  {t(uiLang, isEmergency ? 'ui.findEmergencyCare' : 'ui.nearbyFacilities')}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* citations */}
        {message.citations && message.citations.length > 0 && !message.streaming ? (
          <div className="mt-2 space-y-1.5">
            {message.citations.map((citation, i) => (
              <CitationCard key={citation.id + '-' + i} citation={citation} index={i} lang={uiLang} />
            ))}
          </div>
        ) : null}

        {/* Offline: one-tap follow-ups so nobody has to type without a connection */}
        {message.offline && !message.streaming && isLastAssistant && careActions.homeCare ? (
          <div className={cn('mt-2.5 flex flex-wrap gap-1.5', uiLang === 'ur' && 'font-urdu')}>
            {([
              { label: 'ui.homeCare', query: 'ui.homeCareQuery', icon: ClipboardList, cls: 'border-success/30 bg-success-soft text-success' },
              { label: 'ui.whenToSeeDoctor', query: 'ui.whenToSeeDoctorQuery', icon: Stethoscope, cls: 'border-warning/30 bg-warning-soft text-warning' },
              { label: 'ui.dangerSigns', query: 'ui.dangerSignsQuery', icon: TriangleAlert, cls: 'border-danger/30 bg-danger-soft text-danger' },
            ] as const).map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => useChatStore.getState().setPendingChatDraft(t(uiLang, chip.query))}
                className={cn('inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors hover:brightness-95', chip.cls)}
              >
                <chip.icon className="h-3.5 w-3.5" aria-hidden />
                {t(uiLang, chip.label)}
              </button>
            ))}
          </div>
        ) : null}

        {/* message footer: time, sources summary, actions */}
        {!message.streaming ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-2xs text-muted-foreground" aria-hidden suppressHydrationWarning>
              {timeLabel(message.createdAt)}
            </span>
            {message.citations && message.citations.length > 0 ? (
              <span className="min-w-0 truncate text-2xs text-muted-foreground">
                {t(uiLang, 'citation.sources')}: {citationSummary(message.citations)}
              </span>
            ) : null}
            <span className="-mx-1 flex w-full flex-wrap items-center gap-0.5 sm:ms-auto sm:w-auto">
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
                {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
              </ActionIcon>
              {/* share — native sheet, else WhatsApp */}
              <ActionIcon
                label={t(uiLang, 'chat.shareAnswer')}
                onClick={() => void shareAnswer()}
              >
                <Share2 className="h-4 w-4" aria-hidden />
              </ActionIcon>
              <ActionIcon label={t(uiLang, 'chat.saveAsReminder')} onClick={saveAsReminder}>
                <Bell className="h-4 w-4" aria-hidden />
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
              <span className="mx-1 h-4 w-px bg-border" aria-hidden />
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
