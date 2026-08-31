// ============================================================
// T. First-aid gallery + golden-set v3 — regression tests
//
// Invariants tested:
//  - matchesFirstAidQuery finds templates by title in ALL 3 languages
//    and by category id; empty query matches everything; case-
//    insensitive for Latin script; no match on unrelated words.
//  - Every emergency template renders a usable card (title, intro,
//    ≥1 action, ≥1 do-not, ≥1 source in all 3 languages).
//  - Golden set v3: the 11 new chronic-disease cases exist exactly
//    once, the suite version is bumped, and every case's expected
//    triage matches the deterministic L0 engine (so the eval harness
//    cannot silently drift from the engine).
//  - Triage fixes: English "sugar dropped" phrasing → URGENT;
//    Ramadan planning questions from established diabetics stay
//    ROUTINE while active complaints still escalate.
// ============================================================

import { describe, expect, test } from 'bun:test';
import { matchesFirstAidQuery } from '@/components/about/first-aid-section';
import { EMERGENCY_TEMPLATES } from '@/data/emergency-templates';
import { GOLDEN_SET, GOLDEN_SUITE_VERSION } from '@/data/eval-golden';
import { runL0Triage } from '@/lib/engine/safety-engine';

// ---------- first-aid search ----------

describe('T. first-aid gallery — search matching', () => {
  test('empty query matches every template', () => {
    for (const tpl of EMERGENCY_TEMPLATES) {
      expect(matchesFirstAidQuery(tpl, '')).toBe(true);
      expect(matchesFirstAidQuery(tpl, '   ')).toBe(true);
    }
  });

  test('English title search is case-insensitive', () => {
    const choking = EMERGENCY_TEMPLATES.find((t) => t.patternCategory === 'choking')!;
    expect(matchesFirstAidQuery(choking, 'choking')).toBe(true);
    expect(matchesFirstAidQuery(choking, 'CHOKING')).toBe(true);
    expect(matchesFirstAidQuery(choking, 'ChOkInG')).toBe(true);
  });

  test('Urdu title search matches (script-exact)', () => {
    const cardiac = EMERGENCY_TEMPLATES.find((t) => t.patternCategory === 'cardiac')!;
    expect(matchesFirstAidQuery(cardiac, cardiac.title.ur.slice(0, 8))).toBe(true);
  });

  test('Roman title search matches', () => {
    const cardiac = EMERGENCY_TEMPLATES.find((t) => t.patternCategory === 'cardiac')!;
    expect(matchesFirstAidQuery(cardiac, 'dil ki emergency')).toBe(true);
  });

  test('category id search matches', () => {
    const asthma = EMERGENCY_TEMPLATES.find((t) => t.patternCategory === 'anaphylaxis')!;
    expect(matchesFirstAidQuery(asthma, 'anaphylaxis')).toBe(true);
  });

  test('unrelated words do not match', () => {
    const choking = EMERGENCY_TEMPLATES.find((t) => t.patternCategory === 'choking')!;
    expect(matchesFirstAidQuery(choking, 'birthday party')).toBe(false);
  });
});

describe('T. first-aid gallery — template card completeness', () => {
  test('all 23 templates have full trilingual card content', () => {
    expect(EMERGENCY_TEMPLATES.length).toBe(23);
    for (const tpl of EMERGENCY_TEMPLATES) {
      for (const lang of ['en', 'ur', 'roman'] as const) {
        expect(tpl.title[lang].length).toBeGreaterThan(3);
        expect(tpl.reasonIntro[lang].length).toBeGreaterThan(10);
        expect(tpl.immediateActions.length).toBeGreaterThan(0);
        expect(tpl.doNot.length).toBeGreaterThan(0);
        for (const a of tpl.immediateActions) expect(a[lang].length).toBeGreaterThan(5);
        for (const d of tpl.doNot) expect(d[lang].length).toBeGreaterThan(5);
      }
      expect(tpl.sources.length).toBeGreaterThan(0);
    }
  });
});

// ---------- golden set v3 ----------

describe('T. golden set v3 — chronic-disease depth cases', () => {
  const NEW_IDS = [
    't22', 't23', 'r22',
    't24', 't25', 't26',
    't27', 't28',
    'p07-en', 'p07-ur', 'p07-roman',
  ];

  test('suite version bumped to golden-v3', () => {
    expect(GOLDEN_SUITE_VERSION).toBe('golden-v3');
  });

  test('all 11 new case ids exist exactly once', () => {
    for (const id of NEW_IDS) {
      const matches = GOLDEN_SET.filter((c) => c.id === id);
      expect(matches).toHaveLength(1);
    }
  });

  test('golden set is 139 cases with fully unique ids (v2 g01 dup fixed)', () => {
    expect(GOLDEN_SET.length).toBe(139);
    expect(new Set(GOLDEN_SET.map((c) => c.id)).size).toBe(139);
  });

  test('every golden triage case agrees with the deterministic L0 engine', () => {
    // the eval harness must never drift from the deterministic floor:
    // any case whose expectation the offline engine contradicts would
    // flip from pass (LLM up) to fail (LLM down) depending on mode
    const drift: string[] = [];
    for (const c of GOLDEN_SET) {
      if (c.category !== 'triage' && c.category !== 'multilingual-parity') continue;
      if (!c.expected.triage) continue;
      const actual = runL0Triage(c.input, c.language).level;
      if (actual !== c.expected.triage) drift.push(`${c.id}: want ${c.expected.triage} got ${actual}`);
    }
    expect(drift).toEqual([]);
  });

  test('hypoglycaemia golden cases expect URGENT (never ROUTINE)', () => {
    for (const id of ['t22', 't23', 'p07-en', 'p07-ur', 'p07-roman']) {
      const c = GOLDEN_SET.find((g) => g.id === id)!;
      expect(c.expected.triage).toBe('URGENT');
    }
  });

  test('Ramadan planning cases expect ROUTINE (planning, not acute)', () => {
    for (const id of ['t24', 't25', 't26']) {
      const c = GOLDEN_SET.find((g) => g.id === id)!;
      expect(c.expected.triage).toBe('ROUTINE');
    }
  });
});

// ---------- triage behaviour fixes ----------

describe('T. triage fixes — glucose verbs + planning questions', () => {
  test('English "sugar dropped" phrasing hits the qualitative URGENT floor', () => {
    const r = runL0Triage('my sugar dropped suddenly and I am sweating and shaky', 'en');
    expect(r.level).toBe('URGENT');
    expect(r.signals).toContain('abnormal-glucose:qualitative');
  });

  test('more English hypo verb forms are covered', () => {
    expect(runL0Triage('my sugar is falling fast', 'en').level).toBe('URGENT');
    expect(runL0Triage('glucose crashing, feel weak', 'en').level).toBe('URGENT');
  });

  test('Ramadan planning question from an established diabetic stays ROUTINE', () => {
    expect(runL0Triage('main sugar ka mareez hoon, ramzan mein roza rakh sakta hoon?', 'roman').level).toBe('ROUTINE');
    expect(runL0Triage('I have diabetes, can I fast in Ramadan?', 'en').level).toBe('ROUTINE');
    expect(runL0Triage('میں شوگر کا مریض ہوں، رمضان میں روزہ رکھ سکتا ہوں؟', 'ur').level).toBe('ROUTINE');
  });

  test('active complaints from chronic patients STILL escalate (fix did not over-skip)', () => {
    const r = runL0Triage('I have diabetes and I have a wound on my foot that is not healing', 'en');
    expect(r.level).toBe('URGENT');
    expect(r.signals).toContain('modifier:high_risk_person');
  });

  test('active hypo complaint from chronic patient still escalates', () => {
    const r = runL0Triage('main sugar ka mareez hoon aur meri sugar gir rahi hai, kanp raha hoon', 'roman');
    expect(['URGENT', 'EMERGENCY']).toContain(r.level);
  });

  test('question WITH symptoms still escalates (not skipped)', () => {
    const r = runL0Triage('I have diabetes and I feel dizzy since morning, what should I do?', 'en');
    expect(['URGENT', 'EMERGENCY']).toContain(r.level);
  });
});
