import type { Lang } from '@/lib/types';
import { detectLanguage } from '@/lib/engine/safety-engine';
import { en, type Dict } from './en';
import { ur } from './ur';
import { roman } from './roman';

export type LangPref = Lang | 'auto';
export type { Dict };

const DICTS: Record<Lang, Dict> = { en, ur, roman };

type Prev = [never, 0, 1, 2, 3, 4];

/** Dotted key paths that resolve to a string leaf, e.g. 'nav.chat' */
export type TKey = Paths<Dict>;

type Paths<T, D extends number = 4> = [D] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T & string]: T[K] extends string
          ? K
          : `${K}.${Paths<T[K], Prev[D]>}`;
      }[keyof T & string]
    : never;

/** Resolve a translation key for a language, falling back to English. */
export function t(lang: Lang, key: TKey): string {
  const dict = DICTS[lang] ?? en;
  const value = resolveKey(dict, key);
  if (value !== undefined) return value;
  const fallback = resolveKey(en, key);
  return fallback ?? key;
}

function resolveKey(dict: Dict, key: TKey): string | undefined {
  const value = key
    .split('.')
    .reduce<unknown>(
      (acc, part) => (acc as Record<string, unknown> | undefined)?.[part],
      dict,
    );
  return typeof value === 'string' ? value : undefined;
}

/** Resolve UI chrome language: 'auto' → English for chrome (message language is per-message). */
export function resolveUiLang(pref: LangPref): Lang {
  return pref === 'auto' ? 'en' : pref;
}

/** Convert a language preference to a concrete message Lang ('auto' → heuristic detect). */
export function detectMessageLang(text: string, pref: LangPref): Lang {
  if (pref !== 'auto') return pref;
  return detectLanguage(text).language;
}

export const LANG_PREF_LABEL: Record<LangPref, string> = {
  auto: 'Auto',
  en: 'English',
  ur: 'اردو',
  roman: 'Roman Urdu',
};

export { en, ur, roman };
