// ============================================================
// P. New deterministic UI features — regression tests
//  - Daily health tips: complete trilingual data, deterministic
//    rotation, safety invariants (no doses/diagnosis language).
//  - First-aid quick reference: every referenced category exists
//    in EMERGENCY_TEMPLATES with complete trilingual content.
// ============================================================

import { describe, expect, test } from 'bun:test';
import { HEALTH_TIPS, getDailyTip } from '@/data/health-tips';
import { EMERGENCY_TEMPLATES } from '@/data/emergency-templates';

describe('P. daily health tips — data integrity', () => {
  test('tip pack is non-trivial (>= 10 tips)', () => {
    expect(HEALTH_TIPS.length).toBeGreaterThanOrEqual(10);
  });

  test('every tip has a unique id', () => {
    const ids = HEALTH_TIPS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every tip has non-empty title/text in all 3 languages', () => {
    for (const tip of HEALTH_TIPS) {
      expect(tip.title.en.trim().length).toBeGreaterThan(3);
      expect(tip.title.ur.trim().length).toBeGreaterThan(3);
      expect(tip.title.roman.trim().length).toBeGreaterThan(3);
      expect(tip.text.en.trim().length).toBeGreaterThan(20);
      expect(tip.text.ur.trim().length).toBeGreaterThan(20);
      expect(tip.text.roman.trim().length).toBeGreaterThan(20);
    }
  });

  test('every tip cites a publisher', () => {
    for (const tip of HEALTH_TIPS) {
      expect(tip.publisher.trim().length).toBeGreaterThan(3);
    }
  });
});

describe('P. daily health tips — safety invariants', () => {
  // Tips are general wellness guidance — they must never read as
  // medical instructions with doses or diagnosis promises.
  const DOSE_PATTERNS = [
    /\b\d+\s*(mg|ml|milligram|tablet|tablets|goli|capsule)\b/i,
    /\btake\s+\d+\b/i,
  ];

  test('no tip contains dose-like instructions', () => {
    for (const tip of HEALTH_TIPS) {
      const all = `${tip.text.en} ${tip.text.ur} ${tip.text.roman}`;
      for (const re of DOSE_PATTERNS) {
        expect(re.test(all)).toBe(false);
      }
    }
  });

  test('no tip claims to diagnose', () => {
    for (const tip of HEALTH_TIPS) {
      const all = `${tip.title.en} ${tip.text.en}`.toLowerCase();
      expect(all.includes('diagnos')).toBe(false);
    }
  });
});

describe('P. daily health tips — deterministic rotation', () => {
  test('same date always returns the same tip', () => {
    const date = new Date('2026-08-27T10:00:00Z');
    const a = getDailyTip(date);
    const b = getDailyTip(date);
    expect(a.id).toBe(b.id);
  });

  test('rotation covers every tip across the pack length', () => {
    const seen = new Set<string>();
    for (let d = 0; d < HEALTH_TIPS.length; d++) {
      const date = new Date(Date.UTC(2026, 0, 1 + d));
      seen.add(getDailyTip(date).id);
    }
    expect(seen.size).toBe(HEALTH_TIPS.length);
  });

  test('consecutive days give different tips (pack > 1)', () => {
    expect(HEALTH_TIPS.length).toBeGreaterThan(1);
    const day1 = getDailyTip(new Date(Date.UTC(2026, 0, 1)));
    const day2 = getDailyTip(new Date(Date.UTC(2026, 0, 2)));
    expect(day1.id).not.toBe(day2.id);
  });

  test('getDailyTip with no argument works (current date)', () => {
    const tip = getDailyTip();
    expect(HEALTH_TIPS.some((t) => t.id === tip.id)).toBe(true);
  });
});

describe('P. first-aid quick reference — template integrity', () => {
  const FIRST_AID_CATEGORIES = [
    'choking',
    'bleeding',
    'burns',
    'snakebite',
    'unconscious',
    'anaphylaxis',
  ];

  test('every first-aid category resolves to an emergency template', () => {
    for (const category of FIRST_AID_CATEGORIES) {
      const tpl = EMERGENCY_TEMPLATES.find((tp) => tp.patternCategory === category);
      expect(tpl).toBeDefined();
    }
  });

  test('every first-aid template has complete trilingual actions and do-nots', () => {
    for (const category of FIRST_AID_CATEGORIES) {
      const tpl = EMERGENCY_TEMPLATES.find((tp) => tp.patternCategory === category)!;
      expect(tpl.title.en.length).toBeGreaterThan(3);
      expect(tpl.title.ur.length).toBeGreaterThan(3);
      expect(tpl.title.roman.length).toBeGreaterThan(3);
      expect(tpl.immediateActions.length).toBeGreaterThanOrEqual(3);
      expect(tpl.doNot.length).toBeGreaterThanOrEqual(1);
      for (const action of tpl.immediateActions) {
        expect(action.en.trim().length).toBeGreaterThan(10);
        expect(action.ur.trim().length).toBeGreaterThan(10);
        expect(action.roman.trim().length).toBeGreaterThan(10);
      }
      for (const item of tpl.doNot) {
        expect(item.en.trim().length).toBeGreaterThan(10);
        expect(item.ur.trim().length).toBeGreaterThan(10);
        expect(item.roman.trim().length).toBeGreaterThan(10);
      }
      expect(tpl.sources.length).toBeGreaterThan(0);
    }
  });

  test('all emergency templates referenced by the UI exist exactly once', () => {
    for (const category of FIRST_AID_CATEGORIES) {
      const matches = EMERGENCY_TEMPLATES.filter(
        (tp) => tp.patternCategory === category,
      );
      expect(matches.length).toBe(1);
    }
  });
});
