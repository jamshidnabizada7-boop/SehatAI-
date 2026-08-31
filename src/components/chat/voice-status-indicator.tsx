'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Voice Status Indicator (Phase 2)
// A small badge in the chat footer that shows:
//   - Whether the browser supports voice input (SpeechRecognition)
//   - Whether TTS is available (speechSynthesis)
//   - The detected language of the last message
//   - A tap to test TTS with a sample Urdu phrase
//
// Designed for the target user: low-end Pakistani Androids where
// Urdu TTS voices are often missing. The badge honestly shows
// "Voice unavailable" instead of silently failing.
// ============================================================

type VoiceSupport = 'full' | 'stt-only' | 'tts-only' | 'none';

function detectVoiceSupport(): VoiceSupport {
  if (typeof window === 'undefined') return 'none';
  const hasSTT =
    typeof window.SpeechRecognition !== 'undefined' ||
    typeof window.webkitSpeechRecognition !== 'undefined';
  const hasTTS = typeof window.speechSynthesis !== 'undefined';
  if (hasSTT && hasTTS) return 'full';
  if (hasSTT) return 'stt-only';
  if (hasTTS) return 'tts-only';
  return 'none';
}

function detectUrduVoice(): boolean {
  if (typeof window === 'undefined' || typeof window.speechSynthesis === 'undefined') return false;
  const voices = window.speechSynthesis.getVoices();
  return voices.some(
    (v) => v.lang.startsWith('ur') || v.name.toLowerCase().includes('urdu'),
  );
}

export function VoiceStatusIndicator() {
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  // SSR-safe: detect support lazily on first render (client-only via useSyncExternalStore pattern).
  // We use a lazy initializer + a one-time effect for the voiceschanged subscription.
  const [support] = useState<VoiceSupport>(() => detectVoiceSupport());
  const [hasUrduVoice, setHasUrduVoice] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.speechSynthesis === 'undefined') return;
    const check = () => setHasUrduVoice(detectUrduVoice());
    check();
    window.speechSynthesis.onvoiceschanged = check;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const testTts = useCallback(() => {
    if (typeof window === 'undefined' || typeof window.speechSynthesis === 'undefined') return;
    const utter = new SpeechSynthesisUtterance(
      uiLang === 'ur'
        ? 'السلام علیکم! میں سی ایچ اے آئی ہوں۔'
        : uiLang === 'roman'
          ? 'Assalam-o-Alaikum! Main SehatAI hoon.'
          : 'Hello, this is a voice test from SehatAI.',
    );
    utter.lang = uiLang === 'ur' ? 'ur-PK' : 'en-US';
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  }, [uiLang]);

  const config = {
    full: {
      icon: Mic,
      color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
      label: { en: 'Voice ready', ur: 'آواز تیار', roman: 'Aawaz tiyar' },
    },
    'stt-only': {
      icon: Mic,
      color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
      label: { en: 'Voice input only', ur: 'صرف آواز ان پٹ', roman: 'Sirf aawaz input' },
    },
    'tts-only': {
      icon: Volume2,
      color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
      label: { en: 'Voice output only', ur: 'صرف آواز آؤٹ پٹ', roman: 'Sirf aawaz output' },
    },
    none: {
      icon: MicOff,
      color: 'bg-red-500/15 text-red-700 dark:text-red-400',
      label: { en: 'Voice unavailable', ur: 'آواز دستیاب نہیں', roman: 'Aawaz dastiyab nahin' },
    },
  }[support];

  const Icon = config.icon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-foreground/[0.03] focus-visible:outline-2 focus-visible:outline-ring',
          config.color,
        )}
        aria-label={config.label[uiLang]}
        aria-expanded={expanded}
      >
        <Icon className="h-3 w-3" aria-hidden />
        <span className="hidden sm:inline">{config.label[uiLang]}</span>
      </button>

      <AnimatePresence>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 z-30 mb-2 w-64 rounded-xl border border-border bg-card p-3 shadow-lg"
            role="dialog"
            aria-label={uiLang === 'ur' ? 'آواز کی صورت' : uiLang === 'roman' ? 'Aawaz ki soorat' : 'Voice status'}
          >
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Mic className="h-3.5 w-3.5 text-primary" aria-hidden />
                {uiLang === 'ur' ? 'آواز کی صورتحال' : uiLang === 'roman' ? 'Aawaz ki soorat-e-haal' : 'Voice status'}
              </p>

              {/* STT support */}
              <div className="flex items-center gap-2 text-[11px]">
                {(support === 'full' || support === 'stt-only') ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" aria-hidden />
                )}
                <span className="text-muted-foreground">
                  {uiLang === 'ur' ? 'آواز سے ٹیکسٹ' : uiLang === 'roman' ? 'Aawaz se text' : 'Speech-to-text'}
                </span>
                <span className="ml-auto font-semibold text-foreground">
                  {(support === 'full' || support === 'stt-only')
                    ? (uiLang === 'ur' ? 'دستیاب' : uiLang === 'roman' ? 'Dastiyab' : 'Available')
                    : (uiLang === 'ur' ? 'نہیں' : uiLang === 'roman' ? 'Nahin' : 'Not available')}
                </span>
              </div>

              {/* TTS support */}
              <div className="flex items-center gap-2 text-[11px]">
                {(support === 'full' || support === 'tts-only') ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" aria-hidden />
                )}
                <span className="text-muted-foreground">
                  {uiLang === 'ur' ? 'ٹیکسٹ سے آواز' : uiLang === 'roman' ? 'Text se aawaz' : 'Text-to-speech'}
                </span>
                <span className="ml-auto font-semibold text-foreground">
                  {(support === 'full' || support === 'tts-only')
                    ? (uiLang === 'ur' ? 'دستیاب' : uiLang === 'roman' ? 'Dastiyab' : 'Available')
                    : (uiLang === 'ur' ? 'نہیں' : uiLang === 'roman' ? 'Nahin' : 'Not available')}
                </span>
              </div>

              {/* Urdu voice specifically */}
              {(support === 'full' || support === 'tts-only') ? (
                <div className="flex items-center gap-2 text-[11px]">
                  {hasUrduVoice ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden />
                  )}
                  <span className="text-muted-foreground">
                    {uiLang === 'ur' ? 'اردو آواز' : uiLang === 'roman' ? 'Urdu aawaz' : 'Urdu voice'}
                  </span>
                  <span className="ml-auto font-semibold text-foreground">
                    {hasUrduVoice
                      ? (uiLang === 'ur' ? 'دستیاب' : uiLang === 'roman' ? 'Dastiyab' : 'Available')
                      : (uiLang === 'ur' ? 'غیر موجود' : uiLang === 'roman' ? 'Ghair maujood' : 'Missing')}
                  </span>
                </div>
              ) : null}

              {/* Test button */}
              {(support === 'full' || support === 'tts-only') ? (
                <button
                  type="button"
                  onClick={testTts}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  <Volume2 className="h-3 w-3" aria-hidden />
                  {uiLang === 'ur' ? 'آواز ٹیسٹ کریں' : uiLang === 'roman' ? 'Aawaz test karein' : 'Test voice'}
                </button>
              ) : null}

              {/* Honest note for low-end devices */}
              <p className="border-t border-border pt-2 text-[10px] leading-relaxed text-muted-foreground">
                {uiLang === 'ur'
                  ? 'کم قیمت فونز پر اردو آواز اکثر غائب ہوتی ہے۔ بہترین تجربے کے لیے Chrome استعمال کریں۔'
                  : uiLang === 'roman'
                    ? 'Kam qeemat phones par Urdu aawaz aksar ghaib hoti hai. Behtareen tajrube ke liye Chrome istemal karein.'
                    : 'On low-end phones, Urdu voice is often missing. Use Chrome for the best experience.'}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
