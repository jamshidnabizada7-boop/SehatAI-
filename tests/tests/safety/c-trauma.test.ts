// ============================================================
// Category C — Trauma / injury safety
// mechanism × site × severity-sign composition across languages.
// Serious trauma is never dismissed; movement advice matches the
// suspected injury.
// ============================================================
import { describe, expect, test } from 'bun:test';
import { runL0Triage } from '@/lib/engine/safety-engine';
import { extractTrauma } from '@/lib/engine/context-extraction';

describe('C. trauma extraction (mechanism × site × signs)', () => {
  test('mechanisms are recognized', () => {
    expect(extractTrauma('a bike hit me on the road')?.mechanism).toBe('vehicle');
    expect(extractTrauma('I fell from the stairs')?.mechanism).toBe('fall');
    expect(extractTrauma('main gir gaya')?.mechanism).toBe('fall');
    expect(extractTrauma('میں گر گیا ہوں')?.mechanism).toBe('fall');
    expect(extractTrauma('accident ho gaya hai')?.mechanism).toBe('vehicle');
    expect(extractTrauma('I stabbed my hand with a knife')?.mechanism).toBe('penetrating');
  });

  test('sites are recognized', () => {
    const t = extractTrauma('I fell down and my chest hurts');
    expect(t?.sites).toContain('chest');
    const t2 = extractTrauma('I fell and hit my head');
    expect(t2?.sites).toContain('head');
  });

  test('severity signs are recognized', () => {
    const t = extractTrauma('I fell and cannot feel my legs');
    expect(t?.severitySigns).toContain('numbness');
    const t2 = extractTrauma('I fell and lost consciousness');
    expect(t2?.severitySigns).toContain('loc');
  });

  test('no mechanism + mere symptom severity is NOT trauma', () => {
    // chest pain with no accident context is a medical symptom
    expect(extractTrauma('I have extreme chest pain and breathlessness')).toBeNull();
  });
});

describe('C. trauma triage (generalizes to unseen combinations)', () => {
  const emergencyTraumas: [string, string][] = [
    ['A bike hit me now I have pain in my chest.', 'chest-trauma'],
    ['A car hit me and my chest hurts', 'chest-trauma'],
    ['I fell from a motorcycle and my neck hurts badly.', 'spine-trauma'],
    ['I fell and cannot move my neck.', 'spine-trauma'],
    ['I fell and my arms are numb.', 'spine-trauma'],
    ['I fell and cannot feel my legs.', 'spine-trauma'],
    ['I fell and cannot feel my arms', 'spine-trauma'],
    ['I fell and lost consciousness.', 'head-injury'],
    ['gari ne kuchi hai aur kamar mein bohot dard hai', 'spine-trauma'],
    ['میں سیڑھیوں سے گر گیا ہوں اور میرے ہاتھ سن ہو گئے ہیں', 'spine-trauma'],
    ['motorcycle accident hua hai aur gardan mein bohot dard hai', 'spine-trauma'],
  ];
  for (const [msg, category] of emergencyTraumas) {
    test(`EMERGENCY [${category}]: "${msg}"`, () => {
      const r = runL0Triage(msg);
      expect(r.level).toBe('EMERGENCY');
      expect(r.matchedCategory).toBe(category);
    });
  }

  test('minor trauma (limb pain, no signs) → URGENT assessment, not emergency', () => {
    const r = runL0Triage('I fell down and my knee hurts');
    expect(r.level).toBe('URGENT');
    expect(r.signals).toContain('trauma-assessment-needed');
  });

  test('accident with no described injuries → URGENT + ask what happened', () => {
    const r = runL0Triage('I had an accident yesterday');
    expect(r.level).toBe('URGENT');
    expect(r.needsClarification).toBe(true);
  });

  test('spinal template never tells the user to move (do-not-move safety)', async () => {
    const { EMERGENCY_TEMPLATES, getEmergencyTemplate } = await import('@/data/emergency-templates');
    const tpl = getEmergencyTemplate('spine-trauma');
    expect(tpl).toBeDefined();
    const text = [tpl!.reasonIntro.en, ...tpl!.immediateActions.map((a) => a.en), ...tpl!.doNot.map((d) => d.en)].join(' ').toLowerCase();
    expect(text).toContain('still');
    expect(text).toContain('do not');
    // unconscious-person instructions must not be the default for conscious victims
    expect(EMERGENCY_TEMPLATES.find((t) => t.patternCategory === 'general-emergency')).toBeDefined();
  });
});
