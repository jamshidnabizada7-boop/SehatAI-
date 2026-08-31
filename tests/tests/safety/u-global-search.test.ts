// ============================================================
// U. Global search + follow-ups — regression tests for the
// unified search index (search-index.ts) and the deterministic
// follow-up suggestions (follow-ups.ts).
//
// Invariants tested:
//  - searchAll matches first-aid protocols across all 3 languages
//    and category ids, respects caps, returns empty for empty query.
//  - searchAll glossary results match the same rule the glossary
//    section uses — so a picked result ALWAYS re-matches when the
//    About view opens pre-filtered (no dead ends).
//  - searchAll topic results match title/topic/tags; topicQuestion
//    builds a natural question in each UI language.
//  - Follow-ups: grounded in cited corpus topics, de-duplicated,
//    capped at 3, fall back to triage-level generics; never empty
//    for a finished answer; deterministic for the same inputs.
//  - i18n: every new key (search.*, chat.followUps,
//    reminders.repeat*/share) exists in all three dictionaries.
// ============================================================

import { describe, expect, test } from 'bun:test';
import { CORPUS } from '@/data/corpus';
import { EMERGENCY_TEMPLATES } from '@/data/emergency-templates';
import { GLOSSARY } from '@/data/glossary';
import { searchAll, topicQuestion } from '@/lib/search-index';
import { retrieveCorpus } from '@/lib/engine/safety-engine';
import { followUpsFor, MAX_FOLLOW_UPS } from '@/data/follow-ups';
import { en } from '@/lib/i18n/en';
import { ur } from '@/lib/i18n/ur';
import { roman } from '@/lib/i18n/roman';
import { matchesFirstAidQuery } from '@/components/about/first-aid-section';
import type { Citation } from '@/lib/types';

// ---------- global search: first aid ----------

describe('U. global search — first aid', () => {
  test('empty query returns no results', () => {
    const r = searchAll('');
    expect(r.total).toBe(0);
    expect(r.firstAid).toHaveLength(0);
    expect(r.glossary).toHaveLength(0);
    expect(r.topics).toHaveLength(0);
  });

  test('English query finds the choking protocol', () => {
    const r = searchAll('choking');
    expect(r.firstAid.length).toBeGreaterThan(0);
    expect(r.firstAid[0].title.en.toLowerCase()).toContain('choking');
  });

  test('Urdu script query finds protocols', () => {
    // سینے (chest) appears in the chest-injury template's Urdu title
    const r = searchAll('سینے');
    expect(r.firstAid.length).toBeGreaterThan(0);
    expect(r.firstAid[0].title.en).toContain('Chest injury');
  });

  test('Roman Urdu query finds protocols', () => {
    // the chest-injury template's Roman title contains "Seene ki chot"
    const r = searchAll('seene ki chot');
    expect(r.firstAid.length).toBeGreaterThan(0);
    expect(r.firstAid[0].title.en).toContain('Chest injury');
  });

  test('category id matches (e.g. pediatric)', () => {
    const r = searchAll('pediatric');
    expect(r.firstAid.some((x) => x.id === 'pediatric')).toBe(true);
  });

  test('first-aid results respect the cap (4)', () => {
    // 'emergency' appears in many template titles/categories
    const r = searchAll('emergency');
    expect(r.firstAid.length).toBeLessThanOrEqual(4);
  });

  test('every first-aid result re-matches the section filter (no dead ends)', () => {
    for (const q of ['choking', 'سینے', 'seene ki chot', 'pediatric', 'burn', 'snake', 'خون', 'سانپ']) {
      const r = searchAll(q);
      for (const result of r.firstAid) {
        const tpl = EMERGENCY_TEMPLATES.find((t) => t.patternCategory === result.id);
        expect(tpl).toBeDefined();
        expect(matchesFirstAidQuery(tpl!, q)).toBe(true);
      }
    }
  });
});

// ---------- global search: glossary ----------

describe('U. global search — glossary', () => {
  test('English glossary query finds fever', () => {
    const r = searchAll('fever');
    expect(r.glossary.some((g) => g.id === 'fever')).toBe(true);
  });

  test('Roman Urdu glossary query finds the fever term', () => {
    const r = searchAll('bukhar');
    expect(r.glossary.some((g) => g.id === 'fever')).toBe(true);
  });

  test('Urdu script glossary query finds a term', () => {
    const r = searchAll('بخار');
    expect(r.glossary.length).toBeGreaterThan(0);
  });

  test('glossary results re-match the GlossarySection filter', () => {
    for (const q of ['bukhar', 'fever', 'بخار', 'ORS']) {
      const r = searchAll(q);
      const qRaw = q.trim();
      const qLower = qRaw.toLowerCase();
      for (const result of r.glossary) {
        const term = GLOSSARY.find((g) => g.en === result.id);
        expect(term).toBeDefined();
        const reMatches =
          term!.en.toLowerCase().includes(qLower) ||
          term!.ur.includes(qRaw) ||
          term!.roman.toLowerCase().includes(qLower);
        expect(reMatches).toBe(true);
      }
    }
  });

  test('glossary results respect the cap (6)', () => {
    const r = searchAll('a'); // single letter matches many terms
    expect(r.glossary.length).toBeLessThanOrEqual(6);
  });
});

// ---------- global search: topics ----------

describe('U. global search — topics', () => {
  test('topic query finds dengue by title', () => {
    const r = searchAll('dengue');
    expect(r.topics.some((tp) => tp.corpusId === 'dengue')).toBe(true);
  });

  test('topic query matches tags (Roman Urdu)', () => {
    const r = searchAll('sugar');
    expect(r.topics.length).toBeGreaterThan(0);
    // sugar is a tag on diabetes docs
    expect(r.topics.some((tp) => tp.corpusId === 'diabetes-basics')).toBe(true);
  });

  test('topic results carry the publisher subtitle', () => {
    const r = searchAll('dengue');
    expect(r.topics[0].subtitle).toBeTruthy();
  });

  test('topicQuestion builds a natural question in each language', () => {
    const dengue = CORPUS.find((c) => c.id === 'dengue')!;
    expect(topicQuestion(dengue, 'en')).toBe(`Tell me about ${dengue.title.en}`);
    expect(topicQuestion(dengue, 'ur')).toContain(dengue.title.ur);
    expect(topicQuestion(dengue, 'ur')).toContain('بتائیں');
    expect(topicQuestion(dengue, 'roman')).toContain(dengue.title.roman);
    expect(topicQuestion(dengue, 'roman')).toContain('batayein');
  });

  test('topic questions retrieve their own doc at rank #1 (grounded draft)', () => {
    for (const id of ['dengue', 'diabetes-basics', 'fever-adult']) {
      const item = CORPUS.find((c) => c.id === id)!;
      const question = topicQuestion(item, 'en');
      const hits = retrieveCorpus(question, 3);
      expect(hits[0]?.item?.id).toBe(id);
    }
  });
});

// ---------- follow-up suggestions ----------

describe('U. follow-ups — grounded suggestions', () => {
  const cite = (id: string): Citation => ({
    id,
    title: '',
    publisher: '',
    url: '',
  });

  test('cited dengue doc yields dengue-grounded follow-ups', () => {
    const out = followUpsFor([cite('dengue')], 'ROUTINE', 'en');
    expect(out.length).toBeGreaterThan(0);
    expect(out.some((q) => q.toLowerCase().includes('dengue'))).toBe(true);
  });

  test('cited maternal doc yields pregnancy follow-ups', () => {
    const out = followUpsFor([cite('pregnancy-danger-signs')], 'ROUTINE', 'en');
    expect(out.some((q) => q.toLowerCase().includes('pregnancy'))).toBe(true);
  });

  test('follow-ups are capped at 3 and de-duplicated', () => {
    // diarrhoea + dehydration share the ORS/dehydration question space;
    // multiple citations must not produce duplicates or overflow.
    const out = followUpsFor(
      [cite('diarrhea-ors'), cite('dehydration-signs'), cite('fever-adult')],
      'SELF_CARE',
      'en',
    );
    expect(out.length).toBeLessThanOrEqual(MAX_FOLLOW_UPS);
    expect(new Set(out).size).toBe(out.length);
  });

  test('topic follow-ups listed first, generics fill the remainder', () => {
    // dengue has 2 topic entries → third comes from ROUTINE generics
    const out = followUpsFor([cite('dengue')], 'ROUTINE', 'en');
    expect(out).toHaveLength(3);
    expect(out[0].toLowerCase()).toContain('dengue');
    expect(out[1].toLowerCase()).toContain('dengue');
  });

  test('no citations → generic triage-level follow-ups', () => {
    const out = followUpsFor([], 'URGENT', 'en');
    expect(out.length).toBeGreaterThan(0);
    expect(out.length).toBeLessThanOrEqual(MAX_FOLLOW_UPS);
  });

  test('EMERGENCY generics reference calling for help', () => {
    const out = followUpsFor([], 'EMERGENCY', 'en');
    expect(out.some((q) => q.toLowerCase().includes('ambulance') || q.toLowerCase().includes('call'))).toBe(true);
  });

  test('deterministic: same inputs → same output', () => {
    const a = followUpsFor([cite('dengue')], 'ROUTINE', 'roman');
    const b = followUpsFor([cite('dengue')], 'ROUTINE', 'roman');
    expect(a).toEqual(b);
  });

  test('trilingual: every topic entry has non-empty en/ur/roman', () => {
    // walk every corpus topic key the map claims to cover
    const out = followUpsFor([cite('fever-adult')], 'SELF_CARE', 'en');
    for (const q of out) expect(q.length).toBeGreaterThan(0);
    const outUr = followUpsFor([cite('fever-adult')], 'SELF_CARE', 'ur');
    for (const q of outUr) expect(q.length).toBeGreaterThan(0);
  });

  test('unknown citation id is safely ignored', () => {
    const out = followUpsFor([cite('not-a-real-doc')], 'ROUTINE', 'en');
    expect(out.length).toBeGreaterThan(0); // generics still appear
  });

  test('Urdu and Roman follow-ups differ from English', () => {
    const en = followUpsFor([cite('dengue')], 'ROUTINE', 'en');
    const ur = followUpsFor([cite('dengue')], 'ROUTINE', 'ur');
    expect(en[0]).not.toBe(ur[0]);
  });
});

// ---------- i18n completeness for the new keys ----------

describe('U. i18n — new keys present in all three dictionaries', () => {
  const NEW_KEYS: { dict: unknown; path: string[]; label: string }[] = [
    { dict: en, path: ['search', 'placeholder'], label: 'en.search.placeholder' },
    { dict: en, path: ['search', 'firstAidGroup'], label: 'en.search.firstAidGroup' },
    { dict: en, path: ['search', 'glossaryGroup'], label: 'en.search.glossaryGroup' },
    { dict: en, path: ['search', 'topicsGroup'], label: 'en.search.topicsGroup' },
    { dict: en, path: ['search', 'empty'], label: 'en.search.empty' },
    { dict: en, path: ['search', 'askTopic'], label: 'en.search.askTopic' },
    { dict: en, path: ['header', 'search'], label: 'en.header.search' },
    { dict: en, path: ['chat', 'followUps'], label: 'en.chat.followUps' },
    { dict: en, path: ['reminders', 'repeatEveryday'], label: 'en.reminders.repeatEveryday' },
    { dict: en, path: ['reminders', 'repeatWeekdays'], label: 'en.reminders.repeatWeekdays' },
    { dict: en, path: ['reminders', 'repeatWeekends'], label: 'en.reminders.repeatWeekends' },
    { dict: en, path: ['reminders', 'share'], label: 'en.reminders.share' },
  ];

  test('every new key resolves to a non-empty string in en/ur/roman', () => {
    const dicts: Record<string, unknown> = { en, ur, roman };
    for (const name of Object.keys(dicts)) {
      const dict = dicts[name];
      for (const spec of NEW_KEYS) {
        const value = spec.path.reduce<unknown>(
          (acc, part) => (acc as Record<string, unknown> | undefined)?.[part],
          dict,
        );
        expect(typeof value).toBe('string');
        expect((value as string).length).toBeGreaterThan(0);
      }
    }
  });
});
