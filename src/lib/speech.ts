// ============================================================
// SehatAI — Read-aloud (text-to-speech) helpers
// Pure functions: no DOM, no browser APIs — unit-testable.
// The browser side (speechSynthesis) lives in use-speech.ts.
// ============================================================

import type { Lang } from '@/lib/types';

/** BCP-47 tags we request per SehatAI language. */
export const SPEECH_LANG_TAG: Record<Lang, string> = {
  en: 'en-US',
  ur: 'ur-PK',
  roman: 'ur-PK', // Roman Urdu text read with an Urdu voice where available;
  // callers may fall back to an English voice when no Urdu voice exists.
};

/** Minimal voice shape (SpeechSynthesisVoice is not available in tests). */
export interface VoiceLike {
  lang: string;
  name?: string;
  localService?: boolean;
  default?: boolean;
}

/**
 * Pick the best voice for a language.
 * Priority: exact lang match (en-US === en-US) > prefix match (ur-*)
 * > default voice. Ties broken by preferring local (offline) voices.
 * Returns null when the list is empty.
 */
export function pickVoiceForLang(voices: VoiceLike[], lang: string): VoiceLike | null {
  if (!voices || voices.length === 0) return null;
  const target = lang.toLowerCase();
  const exact = voices.filter((v) => v.lang.toLowerCase() === target);
  const prefix = voices.filter((v) => v.lang.toLowerCase().split('-')[0] === target.split('-')[0]);
  const preferLocal = (list: VoiceLike[]): VoiceLike | null =>
    list.find((v) => v.localService) ?? list[0] ?? null;
  return preferLocal(exact) ?? preferLocal(prefix) ?? voices.find((v) => v.default) ?? voices[0];
}

/**
 * Check whether a usable voice exists for a SehatAI language.
 * For Roman Urdu an Urdu voice is preferred but an English voice is
 * acceptable (the text is Latin-script; English voices read it
 * intelligibly).
 */
export function hasVoiceForLang(voices: VoiceLike[], lang: Lang): boolean {
  if (!voices || voices.length === 0) return false;
  if (lang === 'en') {
    return voices.some((v) => v.lang.toLowerCase().startsWith('en'));
  }
  const wantsUrdu = voices.some((v) => v.lang.toLowerCase().startsWith('ur'));
  if (wantsUrdu) return true;
  // Roman Urdu can fall back to English voices; Urdu script cannot.
  return lang === 'roman' && voices.some((v) => v.lang.toLowerCase().startsWith('en'));
}

/**
 * Speech tag for a language, given the voices actually available.
 * Roman Urdu keeps ur-PK when an Urdu voice exists, else falls back
 * to en-US so the Latin script is read aloud rather than nothing.
 */
export function resolveSpeechTag(voices: VoiceLike[], lang: Lang): string {
  if (lang === 'roman') {
    const hasUrdu = voices.some((v) => v.lang.toLowerCase().startsWith('ur'));
    if (!hasUrdu) return 'en-US';
  }
  return SPEECH_LANG_TAG[lang];
}

/**
 * Strip markdown / chat decorations so text-to-speech reads naturally.
 * - bullets (•, -, *) → pauses (comma)
 * - **bold**, *italic*, _underline_ markers removed
 * - [text](url) → text
 * - citation markers like [1] removed
 * - headings markers (#) removed
 * - collapses 3+ newlines to 2 (sentence pause)
 */
export function stripMarkdownForSpeech(text: string): string {
  if (!text) return '';
  let out = text;
  // links: [label](url) → label
  out = out.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  // citation markers: [1], [2] (but not [label] handled above)
  out = out.replace(/\[\d+\]/g, '');
  // bold / italic / underline markers
  out = out.replace(/(\*\*|__)(.*?)\1/g, '$2');
  out = out.replace(/(\*|_)([^*_\n]+)\1/g, '$2');
  // heading hashes
  out = out.replace(/^#{1,6}\s+/gm, '');
  // bullets → soft pause
  out = out.replace(/^\s*[•\-*]\s+/gm, '');
  // horizontal rules
  out = out.replace(/^\s*[-*_]{3,}\s*$/gm, '');
  // collapse excessive blank lines
  out = out.replace(/\n{3,}/g, '\n\n');
  return out.trim();
}

/** Maximum characters per utterance chunk — long utterances get
 *  cut off on several Android Web Speech implementations. */
export const SPEECH_CHUNK_MAX = 220;

/**
 * Split prepared text into utterance-sized chunks on sentence or
 * newline boundaries. Never splits mid-word; hard-splits only when a
 * single "sentence" exceeds SPEECH_CHUNK_MAX.
 */
export function chunkTextForSpeech(text: string, maxLen: number = SPEECH_CHUNK_MAX): string[] {
  const trimmed = (text || '').trim();
  if (!trimmed) return [];
  const pieces = trimmed
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?۔،؛])\s+/))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const chunks: string[] = [];
  let current = '';
  const pushCurrent = () => {
    if (current.trim().length > 0) chunks.push(current.trim());
    current = '';
  };
  for (const piece of pieces) {
    if (piece.length > maxLen) {
      // hard-split overlong piece on word boundaries
      pushCurrent();
      let rest = piece;
      while (rest.length > maxLen) {
        let cut = rest.lastIndexOf(' ', maxLen);
        if (cut <= 0) cut = maxLen;
        chunks.push(rest.slice(0, cut).trim());
        rest = rest.slice(cut).trim();
      }
      current = rest;
      continue;
    }
    if (current.length === 0) {
      current = piece;
    } else if (current.length + 1 + piece.length <= maxLen) {
      current += ` ${piece}`;
    } else {
      pushCurrent();
      current = piece;
    }
  }
  pushCurrent();
  return chunks;
}

/** Plain text used for clipboard copy of an assistant answer
 *  (richer than speech text: keeps structure, drops only markdown
 *  syntax noise that reads badly when pasted into WhatsApp etc). */
export function answerPlainText(text: string): string {
  if (!text) return '';
  let out = text;
  out = out.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  out = out.replace(/(\*\*|__)(.*?)\1/g, '$2');
  out = out.replace(/(\*|_)([^*_\n]+)\1/g, '$2');
  out = out.replace(/^#{1,6}\s+/gm, '');
  return out.trim();
}
