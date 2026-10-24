'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  HeartPulse,
  HelpCircle,
  ImagePlus,
  Lightbulb,
  ListChecks,
  MapPin,
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
  History as HistoryIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { FirstAidCards } from './first-aid-cards';
import { SymptomCheckerWizard } from './symptom-checker-wizard';
import { ChatExportMenu } from './chat-export-menu';
import { MedPreSendChecker } from './med-pre-send-checker';
import { cn } from '@/lib/utils';
import { careActionsFor } from '@/lib/care-actions';

const EXAMPLE_ICONS = [Thermometer, HeartPulse, Sparkles, Baby, Brain, ShieldPlus] as const;

const TRIAGE_LEGEND: { level: 'EMERGENCY' | 'URGENT' | 'ROUTINE' | 'SELF_CARE'; dot: string; labelKey: 'chat.triageLegendEmergency' | 'chat.triageLegendUrgent' | 'chat.triageLegendRoutine' | 'chat.triageLegendSelfCare' }[] = [
  { level: 'EMERGENCY', dot: 'bg-red-700', labelKey: 'chat.triageLegendEmergency' },
  { level: 'URGENT', dot: 'bg-orange-600', labelKey: 'chat.triageLegendUrgent' },
  { level: 'ROUTINE', dot: 'bg-yellow-400', labelKey: 'chat.triageLegendRoutine' },
  { level: 'SELF_CARE', dot: 'bg-emerald-600', labelKey: 'chat.triageLegendSelfCare' },
];

/** Starter questions: short label on the chip, full question sent on tap. */
function starterQuestions(lang: Lang) {
  const ur = lang === 'ur';
  const roman = lang === 'roman';
  return [
    {
      icon: Thermometer,
      label: ur ? 'ہلکا بخار اور کھانسی' : roman ? 'Halka bukhar aur khansi' : 'Mild fever and dry cough',
      query: ur ? 'مجھے دو دن سے ہلکی کھانسی اور بخار ہے، مجھے کیا کرنا چاہیے؟' : roman ? 'Mujhe do din se halki khansi aur bukhar hai, kya karun?' : 'I have had a mild dry cough and slight fever for 2 days. What should I do?',
    },
    {
      icon: Baby,
      label: ur ? 'بچوں کے حفاظتی ٹیکے (EPI)' : roman ? 'Bachon ke teekay (EPI)' : 'Child vaccine schedule (EPI)',
      query: ur ? 'بچوں کے حفاظتی ٹیکوں کا شیڈول کیا ہے؟' : roman ? 'Bachon ke teekon ka schedule kya hai?' : 'What is the standard EPI child vaccination schedule in Pakistan?',
    },
    {
      icon: ShieldPlus,
      label: ur ? 'ابتدائی طبی امداد (جلنے پر)' : roman ? 'Ibtidai tibbi imdaad (Jalna)' : 'First aid for mild burns',
      query: ur ? 'ہلکا ہاتھ جلنے پر فوری ابتدائی طبی امداد کیا ہے؟' : roman ? 'Halka haath jalne par fori ibtidai tibbi imdaad kya hai?' : 'What is the immediate first aid for a mild burn?',
    },
    {
      icon: HeartPulse,
      label: ur ? 'سر درد اور تھکن' : roman ? 'Sar dard aur thakan' : 'Headache and fatigue',
      query: ur ? 'مجھے شدید سر درد اور تھکن ہے، کیا احتیاط کروں؟' : roman ? 'Mujhe sar dard aur thakan hai, kya ehtiyat karun?' : 'I have had a persistent headache and fatigue for 2 days. What should I monitor?',
    },
    {
      icon: HelpCircle,
      label: ur ? 'ڈاکٹر کو کب دکھائیں؟' : roman ? 'Doctor ko kab dikhayein?' : 'When to see a doctor?',
      query: ur ? 'عام نزلہ زکام میں ڈاکٹر کے پاس کب جانا ضروری ہوتا ہے؟' : roman ? 'Aam nazla zukam mein doctor ke paas kab jana chahiye?' : 'When should someone see a doctor for respiratory symptoms?',
    },
  ];
}

export function ChatView() {
  const langPref = useAppStore((s) => s.langPref);
  const setView = useAppStore((s) => s.setView);
  const uiLang = resolveUiLang(langPref);
  const isUr = uiLang === 'ur';
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
  // Sidebar doctor/facility prompts follow the same care-action policy as answers.
  const recentAssistant = messages.findLast((m) => m.role === 'assistant');
  const recentUser = messages.findLast((m) => m.role === 'user');
  const sidebarActions = careActionsFor(recentAssistant?.triage?.level, recentUser?.content ?? '');

  // deterministic daily tip (rotates once a day, stable per session)
  const dailyTip = useMemo(() => getDailyTip(), []);
  const starters = useMemo(() => starterQuestions(uiLang), [uiLang]);

  // auto-scroll to the newest message
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Touch keyboards have their own send key, so drop the "(Enter to send)"
  // hint on phones — it made the placeholder wrap and clip.
  const [compactPlaceholder, setCompactPlaceholder] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px), (pointer: coarse)');
    const apply = () => setCompactPlaceholder(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

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

  const toolBtn =
    'inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring';

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      {/* Main conversation column */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {/* messages */}
        <div
          ref={scrollRef}
          className="custom-scrollbar flex-1 overflow-y-auto"
          role="log"
          aria-live="polite"
          aria-label={t(uiLang, 'nav.chat')}
        >
          <div className="mx-auto w-full max-w-3xl space-y-5 px-4 pt-5 pb-3 sm:px-6">
            <OutcomeFollowupCard refreshKey={assistantTurns} active={outcomeCardActive} />
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={cn('flex flex-col gap-6 py-4 sm:py-8', isUr && 'font-urdu')}
              >
                {/* Greeting */}
                <div className="flex flex-col items-center text-center">
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
                    <HeartPulse className="h-6 w-6" aria-hidden />
                  </span>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
                    {t(uiLang, 'chat.welcomeTitle')}
                  </h1>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                    {t(uiLang, 'ui.welcomeBody')}
                  </p>
                </div>

                {/* Starter questions */}
                <section aria-labelledby="starter-heading" className="space-y-2.5">
                  <h2 id="starter-heading" className="text-sm font-semibold text-foreground">
                    {t(uiLang, 'ui.suggestionsTitle')}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {starters.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => doSend(item.query)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <button type="button" onClick={() => setSymptomCheckerOpen(true)} className={toolBtn}>
                      <ListChecks className="h-4 w-4" aria-hidden />
                      {t(uiLang, 'ui.symptomChecker')}
                    </button>
                    <button type="button" onClick={() => setFirstAidOpen(true)} className={toolBtn}>
                      <ShieldPlus className="h-4 w-4" aria-hidden />
                      {t(uiLang, 'ui.firstAidGuide')}
                    </button>
                    <button type="button" onClick={() => setTryAskingOpen(true)} className={toolBtn}>
                      <MessageCircleQuestion className="h-4 w-4" aria-hidden />
                      {t(uiLang, 'chat.tryAsking')}
                    </button>
                  </div>
                </section>

                {/* Triage legend + daily tip, one container */}
                <div className="grid overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-2">
                  <section className="space-y-2.5 p-4" aria-labelledby="legend-heading">
                    <h2 id="legend-heading" className="text-sm font-semibold text-foreground">
                      {t(uiLang, 'chat.triageLegend')}
                    </h2>
                    <ul className="space-y-1.5">
                      {TRIAGE_LEGEND.map((entry) => (
                        <li key={entry.level} className="flex items-center gap-2.5 text-sm text-foreground">
                          <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', entry.dot)} aria-hidden />
                          <span>{t(uiLang, entry.labelKey)}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section
                    className="space-y-1.5 border-t border-border p-4 sm:border-s sm:border-t-0"
                    aria-labelledby="tip-heading"
                  >
                    <h2 id="tip-heading" className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <Lightbulb className="h-4 w-4 shrink-0 text-warning" aria-hidden />
                      {t(uiLang, 'chat.dailyTip')}
                    </h2>
                    <p className="text-sm font-medium text-foreground">{dailyTip.title[uiLang]}</p>
                    <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{dailyTip.text[uiLang]}</p>
                    <p className="text-2xs text-muted-foreground">{dailyTip.publisher}</p>
                  </section>
                </div>
              </motion.div>
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
        </div>

        <div className="mx-auto w-full max-w-3xl shrink-0">
          {/* grounded follow-up suggestions (deterministic, from citations) */}
          {followUps.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn('px-4 pt-2 sm:px-6', isUr && 'font-urdu')}
              aria-label={t(uiLang, 'chat.followUps')}
            >
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t(uiLang, 'chat.followUps')}</p>
              <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar sm:flex-wrap sm:overflow-visible">
                {followUps.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => doSend(question)}
                    dir="auto"
                    className="min-h-9 shrink-0 rounded-full border border-primary/25 bg-accent/60 px-3.5 py-1.5 text-start text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : null}


          {/* chat toolbar */}
          <div className="flex items-center gap-0.5 px-3 pt-1.5 sm:px-5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                reset();
                setInput('');
              }}
              className="h-9 gap-1.5 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              {t(uiLang, 'chat.newChat')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHistoryOpen(true)}
              disabled={streaming}
              className="h-9 gap-1.5 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              aria-label={t(uiLang, 'chat.history')}
            >
              <HistoryIcon className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">{t(uiLang, 'chat.history')}</span>
            </Button>
            {/* Export: copy transcript, WhatsApp, print/PDF */}
            {messages.length > 0 && !streaming ? (
              <ChatExportMenu messages={messages} lang={uiLang} />
            ) : null}
            {hasAssistantReply ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSummaryOpen(true)}
                className="ms-auto h-9 gap-1.5 rounded-lg px-3 text-xs font-semibold"
              >
                <Stethoscope className="h-3.5 w-3.5 text-primary" aria-hidden />
                {t(uiLang, 'chat.doctorSummary')}
              </Button>
            ) : (
              <div className="ms-auto hidden sm:block">
                <VoiceStatusIndicator />
              </div>
            )}
          </div>

          {/* input bar */}
          <div className="relative z-10 px-3 pt-1.5 pb-3 sm:px-5">
            <div className="mb-1.5 empty:hidden">
              <MedPreSendChecker text={input} lang={uiLang} />
            </div>
            <div className="flex items-end gap-1.5 rounded-2xl border border-input bg-card p-1.5 shadow-[var(--soft-shadow)] transition-colors focus-within:border-primary/60 focus-within:ring-3 focus-within:ring-primary/15">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={compactPlaceholder ? t(uiLang, 'chat.inputPlaceholder').replace(/\s*\([^)]*\)\s*$/, '') : t(uiLang, 'chat.inputPlaceholder')}
                rows={1}
                dir="auto"
                className={cn(
                  'max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2.5 py-2.5 text-[15px] leading-6 text-foreground outline-none placeholder:text-muted-foreground sm:text-sm',
                  // An empty box never scrolls; a wrapped placeholder used to show scroll arrows.
                  input ? 'custom-scrollbar' : 'overflow-hidden',
                )}
                aria-label={t(uiLang, 'chat.inputPlaceholder')}
              />
              <VoiceInput
                lang={uiLang}
                disabled={streaming}
                offline={isOffline}
                onSend={doSend}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setImageAnalysisOpen(true)}
                disabled={streaming}
                className="h-11 w-11 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
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
                  className="h-11 w-11 shrink-0 rounded-xl"
                  aria-label={t(uiLang, 'chat.send')}
                >
                  <Send className="h-5 w-5 rtl:-scale-x-100" aria-hidden />
                </Button>
              )}
            </div>
          </div>
        </div>

        <SummaryModal open={summaryOpen} onOpenChange={setSummaryOpen} lang={uiLang} />
        <ImageAnalysisModal open={imageAnalysisOpen} onOpenChange={setImageAnalysisOpen} lang={uiLang} />
        <ConversationHistoryDrawer />

        {/* First aid */}
        <Dialog open={firstAidOpen} onOpenChange={setFirstAidOpen}>
          <DialogContent closeLabel={t(uiLang, 'ui.close')} className={cn('sm:max-w-lg', isUr && 'font-urdu')} dir={isUr ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <ShieldPlus className="h-4.5 w-4.5 text-warning" aria-hidden />
                {t(uiLang, 'ui.firstAidGuide')}
              </DialogTitle>
            </DialogHeader>
            <FirstAidCards lang={uiLang} onSelect={(q) => { fillExample(q); setFirstAidOpen(false); }} />
          </DialogContent>
        </Dialog>

        {/* Symptom checker */}
        <Dialog open={symptomCheckerOpen} onOpenChange={setSymptomCheckerOpen}>
          <DialogContent closeLabel={t(uiLang, 'ui.close')} className={cn('sm:max-w-lg', isUr && 'font-urdu')} dir={isUr ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <ListChecks className="h-4.5 w-4.5 text-primary" aria-hidden />
                {t(uiLang, 'ui.symptomChecker')}
              </DialogTitle>
            </DialogHeader>
            <SymptomCheckerWizard lang={uiLang} onSend={(q) => { doSend(q); setSymptomCheckerOpen(false); }} />
          </DialogContent>
        </Dialog>

        {/* Example questions */}
        <Dialog open={tryAskingOpen} onOpenChange={setTryAskingOpen}>
          <DialogContent closeLabel={t(uiLang, 'ui.close')} className={cn('sm:max-w-lg', isUr && 'font-urdu')} dir={isUr ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <MessageCircleQuestion className="h-4.5 w-4.5 text-primary" aria-hidden />
                {t(uiLang, 'chat.tryAsking')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              {(['chat.example1', 'chat.example2', 'chat.example3', 'chat.example4', 'chat.example5', 'chat.example6'] as const).map((key, i) => {
                const Icon = EXAMPLE_ICONS[i];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { fillExample(t(uiLang, key)); setTryAskingOpen(false); }}
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-border px-3 py-2 text-start text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                    dir="auto"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span className="min-w-0 flex-1 leading-snug">{t(uiLang, key)}</span>
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Context rail (wide screens): safety promises + next steps, one panel */}
      <aside
        className={cn(
          'custom-scrollbar hidden w-72 shrink-0 flex-col overflow-y-auto border-s border-border bg-card xl:flex',
          isUr && 'font-urdu',
        )}
        aria-label={t(uiLang, 'ui.railSafetyTitle')}
      >
        <section className="space-y-3 p-5">
          <h2 className="text-sm font-semibold text-foreground">{t(uiLang, 'ui.railSafetyTitle')}</h2>
          <ul className="space-y-2">
            {(['ui.railSafety1', 'ui.railSafety2', 'ui.railSafety3', 'ui.railSafety4'] as const).map((key) => (
              <li key={key} className="flex items-start gap-2 text-sm text-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{t(uiLang, key)}</span>
              </li>
            ))}
          </ul>
        </section>

        {sidebarActions.bookDoctor ? (
        <section className="space-y-2 border-t border-border p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Stethoscope className="h-4 w-4 text-primary" aria-hidden />
            {t(uiLang, 'ui.railDoctorTitle')}
          </h2>
          <p className="text-xs leading-relaxed text-muted-foreground">{t(uiLang, 'ui.railDoctorBody')}</p>
          <Button size="sm" onClick={() => setView('care')} className="mt-1 h-9 w-full rounded-lg font-semibold">
            {t(uiLang, 'ui.talkToDoctor')}
          </Button>
        </section>
        ) : null}

        {sidebarActions.facilities ? (
        <section className="space-y-2 border-t border-border p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-primary" aria-hidden />
            {t(uiLang, 'ui.nearbyFacilities')}
          </h2>
          <p className="text-xs leading-relaxed text-muted-foreground">{t(uiLang, 'ui.railFacilitiesBody')}</p>
          <Button variant="outline" size="sm" onClick={() => setView('facilities')} className="mt-1 h-9 w-full rounded-lg font-semibold">
            {t(uiLang, 'ui.railFacilitiesCta')}
          </Button>
        </section>
        ) : null}

        <section className="space-y-2 border-t border-border p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldPlus className="h-4 w-4 text-primary" aria-hidden />
            {t(uiLang, 'ui.firstAidGuide')}
          </h2>
          <p className="text-xs leading-relaxed text-muted-foreground">{t(uiLang, 'ui.railFirstAidBody')}</p>
          <Button variant="outline" size="sm" onClick={() => setFirstAidOpen(true)} className="mt-1 h-9 w-full rounded-lg font-semibold">
            {t(uiLang, 'ui.railFirstAidCta')}
          </Button>
        </section>
      </aside>
    </div>
  );
}
