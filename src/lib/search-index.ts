// ============================================================
// SehatAI — Unified global search index (pure module)
//
// One search box across everything SehatAI knows:
//   • First-aid protocols (23 reviewed emergency templates)
//   • Glossary terms (~114 trilingual medical words)
//   • Health topics (47 verified corpus documents)
//
// Matching reuses the exact same logic the individual
// sections use (matchesFirstAidQuery / glossary contains /
// title+tags contains), so a query that matches here ALSO
// re-matches when the user lands in the target view with the
// query pre-filled — no dead ends.
// ============================================================

import { CORPUS } from '@/data/corpus';
import { GLOSSARY } from '@/data/glossary';
import { EMERGENCY_TEMPLATES } from '@/data/emergency-templates';
import type { CorpusItem, EmergencyTemplate, GlossaryTerm, Lang, TriText } from '@/lib/types';

export type SearchKind = 'first-aid' | 'glossary' | 'topic';

export interface SearchResult {
  kind: SearchKind;
  /** stable id: template patternCategory | glossary en | corpus item id */
  id: string;
  /** trilingual display title */
  title: TriText;
  /** short secondary line (e.g. corpus publisher or the other-language term) */
  subtitle?: string;
  /** for topics: the corpus item (so callers can build a chat question) */
  corpusId?: string;
}

const FIRST_AID_CAP = 4;
const GLOSSARY_CAP = 6;
const TOPIC_CAP = 5;

/** Corpus lookup by id (used by the search dialog to build topic questions). */
export const CORPUS_BY_ID: Record<string, CorpusItem> = Object.fromEntries(
  CORPUS.map((item) => [item.id, item]),
);

/** Same matching rule as matchesFirstAidQuery (first-aid-section.tsx). */
function matchesFirstAid(
  tpl: EmergencyTemplate,
  qLower: string,
  qRaw: string,
): boolean {
  return (
    tpl.title.en.toLowerCase().includes(qLower) ||
    tpl.title.ur.includes(qRaw) ||
    tpl.title.roman.toLowerCase().includes(qLower) ||
    tpl.patternCategory.includes(qLower)
  );
}

/** Same matching rule as GlossarySection's filter. */
function matchesGlossary(term: GlossaryTerm, qLower: string, qRaw: string): boolean {
  return (
    term.en.toLowerCase().includes(qLower) ||
    term.ur.includes(qRaw) ||
    term.roman.toLowerCase().includes(qLower)
  );
}

/** Topics match title (all languages) or tags — same spirit as retrieval. */
function matchesTopic(item: CorpusItem, qLower: string, qRaw: string): boolean {
  return (
    item.title.en.toLowerCase().includes(qLower) ||
    item.title.ur.includes(qRaw) ||
    item.title.roman.toLowerCase().includes(qLower) ||
    item.topic.includes(qLower) ||
    item.tags.some((tag) => tag.toLowerCase().includes(qLower) || tag.includes(qRaw))
  );
}

export interface SearchResults {
  firstAid: SearchResult[];
  glossary: SearchResult[];
  topics: SearchResult[];
  total: number;
}

/** Search everything. Empty query returns empty results (the dialog shows
 *  guidance instead of an overwhelming wall of 180 items). */
export function searchAll(rawQuery: string): SearchResults {
  const qRaw = rawQuery.trim();
  const q = qRaw.toLowerCase();
  if (!q) return { firstAid: [], glossary: [], topics: [], total: 0 };

  const firstAid: SearchResult[] = [];
  for (const tpl of EMERGENCY_TEMPLATES) {
    if (matchesFirstAid(tpl, q, qRaw) && firstAid.length < FIRST_AID_CAP) {
      firstAid.push({
        kind: 'first-aid',
        id: tpl.patternCategory,
        title: tpl.title,
      });
    }
  }

  const glossary: SearchResult[] = [];
  for (const term of GLOSSARY) {
    if (matchesGlossary(term, q, qRaw) && glossary.length < GLOSSARY_CAP) {
      glossary.push({
        kind: 'glossary',
        id: term.en,
        title: { en: term.en, ur: term.ur, roman: term.roman },
      });
    }
  }

  const topics: SearchResult[] = [];
  for (const item of CORPUS) {
    if (matchesTopic(item, q, qRaw) && topics.length < TOPIC_CAP) {
      topics.push({
        kind: 'topic',
        id: item.id,
        title: item.title,
        subtitle: item.source.publisher,
        corpusId: item.id,
      });
    }
  }

  return {
    firstAid,
    glossary,
    topics,
    total: firstAid.length + glossary.length + topics.length,
  };
}

/** Build the chat question for a topic result in the given UI language.
 *  Deterministic trilingual template — no LLM involved. */
export function topicQuestion(item: CorpusItem, lang: Lang): string {
  switch (lang) {
    case 'ur':
      return `${item.title.ur} کے بارے میں بتائیں`;
    case 'roman':
      return `${item.title.roman} ke baray mein batayein`;
    default:
      return `Tell me about ${item.title.en}`;
  }
}
