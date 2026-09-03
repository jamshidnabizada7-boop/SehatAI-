'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCopy,
  HeartPulse,
  HelpCircle,
  ImagePlus,
  Lightbulb,
  MessageCircleQuestion,
  RotateCcw,
  Send,
  ShieldPlus,
  Sparkles,
  Square,
  Stethoscope,
  Thermometer,
  Baby,
  Brain,
  TriangleAlert,
  X,
  History as HistoryIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store/app-store';
import { useChatStore } from '@/lib/store/chat-store';
import { useChat } from '@/hooks/use-chat';
import { useSpeech } from '@/hooks/use-speech';
import { useOffline } from '@/hooks/use-offline';
import { useToast } from '@/hooks/use-toast';
import { resolveUiLang, t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';
import { getDailyTip } from '@/data/health-tips';
import { followUpsFor } from '@/data/follow-ups';
import { MessageBubble } from './message-bubble';
import { VoiceInput } from './voice-input';
import { ImageAnalysisModal } from './image-analysis-modal';
import { VoiceStatusIndicator } from './voice-status-indicator';
import { SummaryModal } from './summary-modal';
import { ConversationHistoryDrawer } from './conversation-history-drawer';
import { OutcomeFollowupCard } from '@/components/outcomes/outcome-followup-card';
import { ReferralRails } from './referral-rails';
import { FirstAidCards } from './first-aid-cards';
import { SymptomCheckerWizard } from './symptom-checker-wizard';
import { ChatExportMenu } from './chat-export-menu';
import { MedPreSendChecker } from './med-pre-send-checker';
import { cn } from '@/lib/utils';

const WELCOME_TRILINGUAL: { tag: string; text: string; lang: Lang }[] = [
  { tag: 'EN', text: 'Assalam-o-Alaikum! I am SehatAI — your safety-first health guide.', lang: 'en' },
  { tag: 'اردو', text: 'السلام علیکم! میں سیۃ اے آئی ہوں — آپ کا محفوظ صحت رہنما۔', lang: 'ur' },
  { tag: 'ROMAN', text: 'Assalam-o-Alaikum! Main SehatAI hoon — aap ka mehfooz sehat rahnuma.', lang: 'roman' },
];

const EXAMPLE_ICONS = [Thermometer, HeartPulse, Sparkles, Baby, Brain, ShieldPlus] as const;

const TRIAGE_LEGEND: { level: 'EMERGENCY' | 'URGENT' | 'ROUTINE' | 'SELF_CARE'; dot: string; labelKey: 'chat.triageLegendEmergency' | 'chat.triageLegendUrgent' | 'chat.triageLegendRoutine' | 'chat.triageLegendSelfCare' }[] = [
  { level: 'EMERGENCY', dot: 'bg-red-600', labelKey: 'chat.triageLegendEmergency' },
  { level: 'URGENT', dot: 'bg-orange-500', labelKey: 'chat.triageLegendUrgent' },
  { level: 'ROUTINE', dot: 'bg-amber-500', labelKey: 'chat.triageLegendRoutine' },
  { level: 'SELF_CARE', dot: 'bg-emerald-600', labelKey: 'chat.triageLegendSelfCare' },
];

export function ChatView() {
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const { isOffline } = useOffline();
  const { send, stop, reset, submitFeedback, regenerate } = useChat();
  const { speak, stop: stopSpeech, speakingId } = useSpeech();
  const { toast } = useToast();

  const messages = useChatStore((s) => s.messages);
  const streaming = useChatStore((s) => s.streaming);
  const completedStages = useChatStore((s) => s.completedStages);
  const currentStage = useChatStore((s) => s.currentStage);
  const urduVersions = useChatStore((s) => s.urduVersions);
  const feedbackGiven = useChatStore((s) => s.feedbackGiven);
  const streamErrors = useChatStore((s) => s.streamErrors);
  const pendingChatDraft = useChatStore((s) => s.pendingChatDraft);
  const setPendingChatDraft = useChatStore((s) => s.setPendingChatDraft);

  const [input, setInput] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [symptomCheckerOpen, setSymptomCheckerOpen] = useState(false);
  const [firstAidOpen, setFirstAidOpen] = useState(false);
  const [tryAskingOpen, setTryAskingOpen] = useState(false);
  const [imageAnalysisOpen, setImageAnalysisOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const setHistoryOpen = useChatStore((s) => s.setHistoryOpen);

  const hasAssistantReply = messages.some((m) => m.role === 'assistant');

  // deterministic daily tip (rotates once a day, stable per session)
  const dailyTip = useMemo(() => getDailyTip(), []);

  // auto-scroll to the newest message
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [input]);

  // Consume a pending chat draft set by the global search dialog
  // ("Ask in chat" on a topic result) — pre-fill the input once.
  // Same documented escape hatch as ReminderDialog's initialDraft:
  // setState-in-effect guarded by a ref so each unique draft applies once.
  const lastAppliedDraft = useRef<string | null>(null);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (pendingChatDraft && pendingChatDraft !== lastAppliedDraft.current) {
      lastAppliedDraft.current = pendingChatDraft;
      setInput(pendingChatDraft);
      setPendingChatDraft(null);
      textareaRef.current?.focus();
    }
  }, [pendingChatDraft, setPendingChatDraft]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Grounded follow-up suggestions for the latest assistant answer —
  // deterministic (never LLM text), derived from its citations.
  const followUps = useMemo(() => {
    if (streaming || messages.length === 0) return [];
    const last = messages[messages.length - 1];
    if (last.role !== 'assistant' || last.streaming) return [];
    if (streamErrors[last.id]) return [];
    return followUpsFor(last.citations, last.triage?.level, uiLang);
  }, [messages, streaming, streamErrors, uiLang]);

  // Closed-loop outcome follow-up: after an URGENT/ROUTINE response, signed-in
  // users with pending outcome entries get a "How are you feeling?" card.
  const assistantTurns = useMemo(
    () => messages.filter((m) => m.role === 'assistant').length,
    [messages],
  );
  const outcomeCardActive = useMemo(() => {
    if (streaming || messages.length === 0) return false;
    const last = messages[messages.length - 1];
    if (last.role !== 'assistant') return false;
    const level = last.triage?.level;
    return level === 'URGENT' || level === 'ROUTINE';
  }, [messages, streaming]);

  // Phase 2 — referral rails: show when last assistant message is URGENT/EMERGENCY
  const lastTriageLevel = useMemo(() => {
    if (messages.length === 0) return null;
    const last = messages[messages.length - 1];
    if (last.role !== 'assistant' || streaming) return null;
    return last.triage?.level ?? null;
  }, [messages, streaming]);

  const doSend = useCallback(
    (text: string) => {
      if (streaming) return;
      stopSpeech();
      void send(text, { offline: isOffline });
      setInput('');
    },
    [isOffline, send, streaming, stopSpeech],
  );

  /** Read-aloud handler with honest toasts when the device/browser
   *  cannot speak the answer's language. */
  const handleSpeak = useCallback(
    (messageId: string, content: string, lang: Lang) => {
      const result = speak(messageId, content, lang);
      if (result === 'no-voice') {
        toast({ description: t(uiLang, 'chat.speechNoVoice') });
      } else if (result === 'unsupported') {
        toast({ description: t(uiLang, 'chat.speechUnsupported') });
      }
    },
    [speak, toast, uiLang],
  );

  const handleRegenerate = useCallback(
    (messageId: string) => {
      stopSpeech();
      void regenerate(messageId);
    },
    [regenerate, stopSpeech],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const text = input.trim();
        if (text) doSend(text);
      }
    },
    [doSend, input],
  );

  const fillExample = useCallback((text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  }, []);

  const copyTranscript = useCallback(async () => {
    if (messages.length === 0) {
      toast({ description: t(uiLang, 'chat.transcriptEmpty') });
      return;
    }
    const lines = messages.map((m) => {
      const who = m.role === 'user' ? t(uiLang, 'chat.you') : t(uiLang, 'chat.assistant');
      return `${who}: ${m.content}`;
    });
    const header = 'SehatAI — conversation transcript\n\n';
    try {
      await navigator.clipboard.writeText(header + lines.join('\n\n'));
      toast({ description: t(uiLang, 'chat.transcriptCopied') });
    } catch {
      toast({ description: t(uiLang, 'chat.transcriptCopyFailed') });
    }
  }, [messages, toast, uiLang]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* messages */}
      <div
        ref={scrollRef}
        className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-4 pt-4 pb-2 sm:px-6"
        role="log"
        aria-live="polite"
        aria-label={t(uiLang, 'nav.chat')}
      >
        <OutcomeFollowupCard refreshKey={assistantTurns} active={outcomeCardActive} />
        {messages.length === 0 ? (
          <div className="custom-scrollbar mx-auto flex w-full max-w-lg flex-col gap-3 overflow-y-auto px-4 py-4 sm:gap-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="w-full overflow-hidden rounded-2xl border border-border bg-card text-center shadow-sm"
            >
              {/* gradient accent strip */}
              <div className="h-1.5 w-full bg-gradient-to-r from-primary via-emerald-500 to-primary" aria-hidden />
              <div className="p-6">
                <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                  <HeartPulse className="h-8 w-8 text-primary" aria-hidden />
                </span>

                {/* language showcase — each greeting in its own visually separated row */}
                <div className="space-y-1.5" dir="ltr">
                  {WELCOME_TRILINGUAL.map((line) => (
                    <p
                      key={line.tag}
                      className={cn(
                        'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm leading-relaxed text-foreground/90',
                        line.lang === 'ur' ? 'bg-primary/5 font-urdu' : 'bg-muted/50',
                      )}
                      dir={line.lang === 'ur' ? 'rtl' : 'ltr'}
                    >
                      <span
                        className="inline-flex h-6 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/10 px-2 text-[10px] font-bold tracking-wider text-primary uppercase"
                      >
                        {line.tag}
                      </span>
                      <span className="min-w-0 flex-1 text-start">{line.text}</span>
                    </p>
                  ))}
                </div>

                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  {t(uiLang, 'chat.welcomeDesc')}
                </p>
              </div>
            </motion.div>

            {/* daily health tip */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.12 }}
              className="w-full rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/8 via-card to-card p-4 shadow-sm"
              role="note"
              aria-label={t(uiLang, 'chat.dailyTip')}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/25">
                  <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 text-start">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-[11px] font-bold tracking-wider text-amber-700 uppercase dark:text-amber-400">
                      {t(uiLang, 'chat.dailyTip')}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground">· {dailyTip.publisher}</span>
                  </p>
                  <p
                    className={cn(
                      'mt-1 text-sm font-bold text-foreground',
                      uiLang === 'ur' && 'font-urdu',
                    )}
                    dir={uiLang === 'ur' ? 'rtl' : 'ltr'}
                  >
                    {dailyTip.title[uiLang]}
                  </p>
                  <p
                    className={cn(
                      'mt-0.5 text-xs leading-relaxed text-foreground/80',
                      uiLang === 'ur' && 'font-urdu',
                    )}
                    dir={uiLang === 'ur' ? 'rtl' : 'ltr'}
                  >
                    {dailyTip.text[uiLang]}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* 3 quick-access buttons — side by side in a row to save vertical space */}
            <div className="grid grid-cols-3 gap-2">
              {/* First-aid */}
              <button
                type="button"
                onClick={() => setFirstAidOpen(true)}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-2.5 text-center shadow-sm transition-all hover:border-orange-500/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring sm:p-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400">
                  <ShieldPlus className="h-4.5 w-4.5" />
                </span>
                <span className="text-[10px] font-bold leading-tight text-foreground sm:text-[11px]">
                  {uiLang === 'ur' ? 'ابتدائی امداد' : uiLang === 'roman' ? 'Ibtidai imdaad' : 'First aid'}
                </span>
              </button>

              {/* Symptom checker */}
              <button
                type="button"
                onClick={() => setSymptomCheckerOpen(true)}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-2.5 text-center shadow-sm transition-all hover:border-violet-500/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring sm:p-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400">
                  <HelpCircle className="h-4.5 w-4.5" />
                </span>
                <span className="text-[10px] font-bold leading-tight text-foreground sm:text-[11px]">
                  {uiLang === 'ur' ? 'علامات کی جانچ' : uiLang === 'roman' ? 'Alaamaat ki jaanch' : 'Symptoms'}
                </span>
              </button>

              {/* Try asking */}
              <button
                type="button"
                onClick={() => setTryAskingOpen(true)}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-2.5 text-center shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring sm:p-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <MessageCircleQuestion className="h-4.5 w-4.5" />
                </span>
                <span className="text-[10px] font-bold leading-tight text-foreground sm:text-[11px]">
                  {uiLang === 'ur' ? 'مثالیں' : uiLang === 'roman' ? 'Misaalein' : 'Examples'}
                </span>
              </button>
            </div>

            {/* triage legend — sets expectations on the 4-level safety model */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="w-full rounded-2xl border border-border bg-card/70 p-4 shadow-sm"
              aria-label={t(uiLang, 'chat.triageLegend')}
            >
              <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
                {t(uiLang, 'chat.triageLegend')}
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {TRIAGE_LEGEND.map((entry) => (
                  <li key={entry.level} className="flex items-center gap-2 text-xs leading-relaxed text-foreground/85">
                    <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', entry.dot)} aria-hidden />
                    <span>{t(uiLang, entry.labelKey)}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        ) : (
          messages.map((m, i) => (
            <MessageBubble
              key={m.id}
              message={m}
              urduVersion={urduVersions[m.id]}
              feedback={feedbackGiven[m.id]}
              streamError={streamErrors[m.id]}
              isStreaming={streaming}
              completedStages={completedStages}
              currentStage={currentStage}
              uiLang={uiLang}
              speakingId={speakingId}
              isLastAssistant={
                m.role === 'assistant' &&
                i === messages.length - 1
              }
              onFeedback={(id, rating) => void submitFeedback(id, rating)}
              onSpeak={handleSpeak}
              onRegenerate={handleRegenerate}
            />
          ))
        )}
      </div>

      {/* grounded follow-up suggestions (deterministic, from citations) */}
      {followUps.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="px-4 pt-3 sm:px-6"
          aria-label={t(uiLang, 'chat.followUps')}
        >
          <p
            className={cn(
              'mb-1.5 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase',
              uiLang === 'ur' && 'font-urdu',
            )}
          >
            <MessageCircleQuestion className="h-3.5 w-3.5" aria-hidden />
            {t(uiLang, 'chat.followUps')}
          </p>
          <div className="flex flex-wrap gap-2">
            {followUps.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => doSend(question)}
                dir="auto"
                className={cn(
                  'rounded-full border border-primary/25 bg-primary/5 px-3.5 py-2 text-xs font-medium text-foreground/90 shadow-sm transition-all hover:border-primary/50 hover:bg-primary/10 hover:shadow focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.98]',
                  uiLang === 'ur' && 'font-urdu',
                )}
              >
                {question}
              </button>
            ))}
          </div>
        </motion.div>
      ) : null}

      {/* Phase 2 — referral rails: one-tap emergency + hospital + telemedicine deep-links */}
      <ReferralRails triageLevel={lastTriageLevel} lang={uiLang} />

      {/* chat toolbar */}
      <div className="flex items-center gap-2 px-4 pt-1 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            reset();
            setInput('');
          }}
          className="h-8 gap-1.5 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          aria-label={t(uiLang, 'chat.newChat')}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          {t(uiLang, 'chat.newChat')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setHistoryOpen(true)}
          disabled={streaming}
          className="h-8 gap-1.5 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          aria-label={t(uiLang, 'chat.history')}
        >
          <HistoryIcon className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">{t(uiLang, 'chat.history')}</span>
        </Button>
        {messages.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void copyTranscript()}
            disabled={streaming}
            className="h-8 gap-1.5 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            aria-label={t(uiLang, 'chat.copyTranscript')}
          >
            <ClipboardCopy className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">{t(uiLang, 'chat.copyTranscript')}</span>
          </Button>
        ) : null}
        {/* Phase 2 — Enhanced Chat Export (WhatsApp + Print/PDF) */}
        {messages.length > 0 && !streaming ? (
          <ChatExportMenu messages={messages} lang={uiLang} />
        ) : null}
        {hasAssistantReply ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSummaryOpen(true)}
            className="ms-auto h-8 gap-1.5 rounded-lg border-primary/40 px-3 text-xs font-semibold text-primary hover:bg-primary/10"
            aria-label={t(uiLang, 'chat.doctorSummary')}
          >
            <Stethoscope className="h-3.5 w-3.5" aria-hidden />
            {t(uiLang, 'chat.doctorSummary')}
          </Button>
        ) : null}
        {/* Phase 2 — voice status indicator (honest about device capabilities) */}
        {messages.length === 0 ? (
          <div className="ms-auto hidden sm:block">
            <VoiceStatusIndicator />
          </div>
        ) : null}
      </div>

      {/* input bar */}
      <div className="relative z-10 shrink-0 px-4 pt-2 pb-3 sm:px-6">
        {/* Phase 2 — Medication pre-send checker (client-side drug detection) */}
        <div className="mb-1.5">
          <MedPreSendChecker text={input} lang={uiLang} />
        </div>
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t(uiLang, 'chat.inputPlaceholder')}
            rows={1}
            dir="auto"
            className="custom-scrollbar max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
            aria-label={t(uiLang, 'chat.inputPlaceholder')}
            aria-describedby="chat-send-hint"
          />
          <span id="chat-send-hint" className="sr-only">
            {t(uiLang, 'chat.inputPlaceholder')}
          </span>
          <VoiceInput
            lang={uiLang}
            disabled={streaming}
            offline={isOffline}
            onSend={doSend}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setImageAnalysisOpen(true)}
            disabled={streaming}
            className="h-11 w-11 shrink-0 rounded-xl hover:border-violet-500/50 hover:text-violet-600"
            aria-label={uiLang === 'ur' ? 'AI تصویری تجزیہ' : uiLang === 'roman' ? 'AI tasveeri tajziya' : 'AI image analysis'}
          >
            <ImagePlus className="h-5 w-5" aria-hidden />
          </Button>
          {streaming ? (
            <Button
              type="button"
              size="icon"
              onClick={stop}
              className="h-11 w-11 shrink-0 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80"
              aria-label={t(uiLang, 'chat.stop')}
            >
              <Square className="h-4 w-4 fill-current" aria-hidden />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              onClick={() => {
                const text = input.trim();
                if (text) doSend(text);
              }}
              disabled={!input.trim()}
              className="h-11 w-11 shrink-0 rounded-xl bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
              aria-label={t(uiLang, 'chat.send')}
            >
              <Send className="h-5 w-5" aria-hidden />
            </Button>
          )}
        </div>
      </div>

      <SummaryModal open={summaryOpen} onOpenChange={setSummaryOpen} lang={uiLang} />
      <ImageAnalysisModal open={imageAnalysisOpen} onOpenChange={setImageAnalysisOpen} lang={uiLang} />
      <ConversationHistoryDrawer />

      {/* First-aid Modal */}
      <AnimatePresence>
        {firstAidOpen ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setFirstAidOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto custom-scrollbar rounded-2xl bg-card p-4 shadow-2xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400">
                    <ShieldPlus className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-bold text-foreground">
                    {uiLang === 'ur' ? 'ابتدائی طبی امداد' : uiLang === 'roman' ? 'Ibtidai tibbi imdaad' : 'First-aid quick access'}
                  </h3>
                </div>
                <button type="button" onClick={() => setFirstAidOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <FirstAidCards lang={uiLang} onSelect={(q) => { fillExample(q); setFirstAidOpen(false); }} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Symptom Checker Modal */}
      <AnimatePresence>
        {symptomCheckerOpen ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setSymptomCheckerOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto custom-scrollbar rounded-2xl bg-card p-4 shadow-2xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400">
                    <HelpCircle className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-bold text-foreground">
                    {uiLang === 'ur' ? 'علامات کی جانچ' : uiLang === 'roman' ? 'Alaamaat ki jaanch' : 'Symptom checker'}
                  </h3>
                </div>
                <button type="button" onClick={() => setSymptomCheckerOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SymptomCheckerWizard lang={uiLang} onSend={(q) => { doSend(q); setSymptomCheckerOpen(false); }} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Try Asking Modal */}
      <AnimatePresence>
        {tryAskingOpen ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setTryAskingOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto custom-scrollbar rounded-2xl bg-card p-4 shadow-2xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <MessageCircleQuestion className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-bold text-foreground">{t(uiLang, 'chat.tryAsking')}</h3>
                </div>
                <button type="button" onClick={() => setTryAskingOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {(['chat.example1', 'chat.example2', 'chat.example3', 'chat.example4', 'chat.example5', 'chat.example6'] as const).map((key, i) => {
                  const Icon = EXAMPLE_ICONS[i];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { fillExample(t(uiLang, key)); setTryAskingOpen(false); }}
                      className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-start text-sm text-foreground/90 shadow-sm transition-all hover:border-primary/40 hover:bg-accent/50 hover:shadow focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 leading-snug">{t(uiLang, key)}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
