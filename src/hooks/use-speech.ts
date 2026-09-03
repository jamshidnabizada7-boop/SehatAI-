'use client';

// ============================================================
// SehatAI — Read-aloud hook (Web Speech API)
// Plays assistant answers through the browser's built-in
// speechSynthesis: zero backend dependency, works offline when
// the device has a local voice. Gracefully reports when no
// suitable voice exists for the answer's language.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  chunkTextForSpeech,
  hasVoiceForLang,
  pickVoiceForLang,
  resolveSpeechTag,
  stripMarkdownForSpeech,
} from '@/lib/speech';
import type { Lang } from '@/lib/types';

export function useSpeech() {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const cancelledRef = useRef(false);

  // load voices (async on Chrome; voiceschanged event)
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    cancelledRef.current = true;
    window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  /**
   * Read a message aloud. Returns 'ok' when playback started,
   * 'no-voice' when the device has no usable voice for the language,
   * 'unsupported' when the browser lacks speechSynthesis.
   */
  const speak = useCallback(
    (messageId: string, content: string, lang: Lang): 'ok' | 'no-voice' | 'unsupported' => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return 'unsupported';
      }
      // speaking the same message again → toggle off
      if (speakingId === messageId) {
        stop();
        return 'ok';
      }
      stop();
      const text = stripMarkdownForSpeech(content);
      if (!text) return 'ok';

      const voices = window.speechSynthesis.getVoices().length
        ? window.speechSynthesis.getVoices()
        : voicesRef.current;
      if (!hasVoiceForLang(voices, lang)) return 'no-voice';

      const tag = resolveSpeechTag(voices, lang);
      const voice = pickVoiceForLang(voices, tag) ?? undefined;
      const rate = 0.95; // slightly slower than default for medical clarity

      cancelledRef.current = false;
      const chunks = chunkTextForSpeech(text);
      const speakNext = (index: number) => {
        if (cancelledRef.current) return;
        if (index >= chunks.length) {
          setSpeakingId(null);
          return;
        }
        const utter = new SpeechSynthesisUtterance(chunks[index]);
        utter.lang = tag;
        if (voice) utter.voice = voice;
        utter.rate = rate;
        utter.onend = () => speakNext(index + 1);
        utter.onerror = () => setSpeakingId(null);
        window.speechSynthesis.speak(utter);
      };
      setSpeakingId(messageId);
      speakNext(0);
      return 'ok';
    },
    [speakingId, stop],
  );

  return { speak, stop, speakingId };
}
