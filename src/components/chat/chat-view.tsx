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
  Check,
  MapPin,
  BookOpen,
  ShieldCheck,
  FileText,
  Languages,
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
import { SosButton } from './sos-button';
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
  const setView = useAppStore((s) => s.setView);
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
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      {/* Main conversation column */}
      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
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
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-4 py-1"
            >
              {/* User intake message bubble */}
              <div className="surface pad20">
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-ee-md bg-[#007958] text-white p-4 max-w-[620px] shadow-sm">
                    <p className="text-sm font-semibold leading-relaxed">
                      {uiLang === 'ur'
                        ? 'مجھے دو دن سے ہلکی خشک کھانسی اور ہلکا بخار ہے۔ مجھے کیا کرنا چاہیے؟'
                        : uiLang === 'roman'
                        ? 'Mujhe 2 din se halki khushk khansi aur halka bukhar hai. Mujhe kya karna chahiye?'
                        : 'I have had a mild dry cough and slight fever for 2 days. What should I do?'}
                    </p>
                    <div className="mt-2 text-right text-[11px] text-white/80">
                      10:42 PM · Sample intake
                    </div>
                  </div>
                </div>
                {/* Symptom chips */}
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  {[
                    { label: 'Dry cough' },
                    { label: 'Mild fever' },
                    { label: '2 days' },
                    { label: '+ Add details', isAdd: true },
                  ].map((chipItem, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (chipItem.isAdd) {
                          textareaRef.current?.focus();
                        } else {
                          doSend(chipItem.label);
                        }
                      }}
                      className="chip green text-xs font-semibold hover:brightness-95 cursor-pointer transition-all"
                    >
                      {chipItem.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assistant structured response card */}
              <div className="surface pad20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="iconbox">
                      <HeartPulse className="h-5 w-5 text-[#009b78]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">SehatAI</span>
                        <span className="chip green">Evidence-based guidance</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        AI health assistant · educational sample
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">10:42 PM</span>
                </div>

                <p className="text-sm text-foreground/90 leading-relaxed">
                  {uiLang === 'ur'
                    ? 'السلام علیکم! آپ کی تفصیل کے مطابق (دو دن سے ہلکی خشک کھانسی اور معمولی بخار بغیر سانس لینے میں دشواری کے)، یہاں عمومی معلوماتی رہنمائی پیش ہے:'
                    : 'Assalam-o-Alaikum! Based on your description of a mild dry cough and slight fever for 2 days without difficulty breathing, here is some general guidance:'}
                </p>

                {/* Likely Assessment strip with cough_illustration.png */}
                <div className="inset inset-green flex flex-col sm:flex-row items-center gap-4 overflow-hidden border border-[#91d7c3]/40">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[#007b61] font-bold text-sm">
                      <FileText className="h-4 w-4" />
                      <h4>Likely Assessment</h4>
                    </div>
                    <p className="text-xs text-foreground/80 mt-1.5 leading-relaxed">
                      These symptoms can be consistent with a mild respiratory infection, such as a common cold. A clinician can assess other possible causes.
                    </p>
                  </div>
                  <img
                    src="/assets/cough_illustration.png"
                    alt="Respiratory illustration"
                    className="w-32 h-24 object-cover object-bottom rounded-xl shrink-0 border border-emerald-600/10 shadow-2xs"
                  />
                </div>

                {/* 2-column Next Steps / Watch Out */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Next steps */}
                  <div className="inset inset-blue border border-blue-200/60 space-y-2.5">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wide">
                      <Check className="h-4 w-4" />
                      <h4>Recommended Next Steps</h4>
                    </div>
                    <div className="space-y-2 text-xs text-foreground/85">
                      <div className="flex items-start gap-2">
                        <span className="chip blue px-1.5 py-0.5 text-[10px]">1</span>
                        <span><b>Hydration:</b> Drink warm fluids regularly.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="chip blue px-1.5 py-0.5 text-[10px]">2</span>
                        <span><b>Rest:</b> Get adequate sleep.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="chip blue px-1.5 py-0.5 text-[10px]">3</span>
                        <span><b>Monitor:</b> Check symptoms and temperature.</span>
                      </div>
                    </div>
                  </div>

                  {/* Watch for */}
                  <div className="inset inset-amber border border-amber-200/60 space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-xs uppercase tracking-wide">
                      <TriangleAlert className="h-4 w-4 text-amber-600" />
                      <h4>Watch For</h4>
                    </div>
                    <p className="text-xs text-foreground/85 leading-relaxed">
                      Seek medical care if symptoms worsen, fever persists beyond 3 days, or new concerning symptoms appear.
                    </p>
                    <p className="text-xs text-amber-900/90 dark:text-amber-300 font-medium">
                      For severe trouble breathing or chest pain, seek emergency care immediately.
                    </p>
                  </div>
                </div>

                {/* Escalate Now red box */}
                <div className="inset inset-red border border-red-200/60">
                  <div className="flex items-start gap-3">
                    <div className="iconbox iconbox-red h-8 w-8 rounded-lg mt-0.5">
                      <TriangleAlert className="h-4 w-4" />
                    </div>
                    <div className="text-xs">
                      <b className="text-red-700 dark:text-red-400 text-sm">Escalate Now</b>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">
                        Severe breathlessness, chest pain, or confusion require urgent medical help. Call <b>1122</b> in Pakistan if appropriate.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metadata & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/60 text-xs">
                  <span className="text-[11px] text-muted-foreground">
                    Sources must be linked to verified guidance when live.
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast({ description: 'Viewing Urdu translation sample' })}
                      className="h-8 gap-1.5 text-xs font-semibold rounded-lg"
                    >
                      <Languages className="h-3.5 w-3.5" />
                      View Urdu translation
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void copyTranscript()}
                      className="h-8 gap-1.5 text-xs font-semibold rounded-lg"
                    >
                      <ClipboardCopy className="h-3.5 w-3.5" />
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Navigation CTA row */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <Button
                    size="sm"
                    onClick={() => setView('care')}
                    className="h-9 gap-1.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90"
                  >
                    <Stethoscope className="h-4 w-4" />
                    Book a doctor →
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setView('facilities')}
                    className="h-9 gap-1.5 rounded-xl border-border font-bold hover:bg-accent"
                  >
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    Nearby facilities
                  </Button>
                </div>
              </div>

              {/* Suggested quick pills */}
              <div className="surface pad p-3.5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Suggested follow-up questions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Can I take paracetamol?',
                    'How long will this last?',
                    'When should I see a doctor?',
                  ].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => doSend(q)}
                      className="rounded-full border border-border/80 bg-background px-3.5 py-1.5 text-xs font-medium text-foreground/90 shadow-2xs transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:scale-[0.98]"
                    >
                      {q}
                    </button>
                  ))}
                </div>
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
      <SosButton />
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

      {/* High-Fidelity Right Rail (§ references/01_AI_Health_Guide.png) */}
      <aside className="hidden xl:flex w-72 shrink-0 flex-col gap-3.5 border-s border-border/80 bg-card/25 p-4 overflow-y-auto custom-scrollbar">
        {/* Safe. Trusted. For You. */}
        <div className="surface pad p-4 space-y-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-wide">
            <div className="iconbox h-8 w-8 rounded-lg bg-emerald-500/15 text-[#009b78]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span>Safe. Trusted. For You.</span>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            {[
              'Source-supported information',
              'Reviewed Pakistan context',
              'Not a replacement for a doctor',
              'Protect your private data',
            ].map((text, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-[#009b78] text-[10px] font-bold shrink-0">✓</span>
                <span className="text-foreground/85 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Need a doctor's opinion */}
        <div className="surface pad p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-wide">
            <div className="iconbox iconbox-blue h-8 w-8 rounded-lg">
              <Stethoscope className="h-4 w-4" />
            </div>
            <span>Need a doctor’s opinion?</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Compare consultation options and connect to a verified clinician when live.
          </p>
          <Button
            size="sm"
            onClick={() => setView('care')}
            className="w-full h-9 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 mt-1"
          >
            Talk to a Doctor →
          </Button>
        </div>

        {/* Nearby Healthcare Facilities */}
        <div className="surface pad p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-wide">
            <div className="iconbox iconbox-gold h-8 w-8 rounded-lg">
              <MapPin className="h-4 w-4" />
            </div>
            <span>Nearby Healthcare Facilities</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Find clinics and emergency services near you.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView('facilities')}
            className="w-full h-9 rounded-xl border-border font-bold hover:bg-accent mt-1"
          >
            Search Nearby →
          </Button>
        </div>

        {/* Stay Informed */}
        <div className="surface pad p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-wide">
            <div className="iconbox iconbox-purple h-8 w-8 rounded-lg">
              <BookOpen className="h-4 w-4" />
            </div>
            <span>Stay Informed</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Learn more about common cough and fever care in our medical library.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFirstAidOpen(true)}
            className="w-full h-9 rounded-xl border-border font-bold hover:bg-accent mt-1"
          >
            Read Health Guide →
          </Button>
        </div>
      </aside>
    </div>
  );
}
