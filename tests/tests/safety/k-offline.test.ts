// ============================================================
// Category K — Offline mode
// The offline engine (browser-side, no LLM) exhibits the same
// generalized behaviors: scenario-correct emergencies, medication
// refusal, clarification instead of reassurance, honest labeling.
// ============================================================
import { describe, expect, test } from 'bun:test';
import { runOfflineEngine } from '@/lib/engine/safety-engine';

describe('K. offline emergency behavior', () => {
  test('trauma chest → chest-trauma template (not unconscious instructions)', () => {
    const r = runOfflineEngine('A bike hit me now I have pain in my chest.');
    expect(r.triage.level).toBe('EMERGENCY');
    expect(r.emergencyCategory).toBe('chest-trauma');
    expect(r.content).not.toContain('Unresponsive person');
  });

  test('spinal trauma → do-not-move template', () => {
    const r = runOfflineEngine('I fell from a motorcycle and my neck hurts badly.');
    expect(r.emergencyCategory).toBe('spine-trauma');
    expect(r.content.toLowerCase()).toContain('still');
  });

  test('diabetic emergency works offline', () => {
    const r = runOfflineEngine('I have diabetes and I am confused and extremely sleepy');
    expect(r.triage.level).toBe('EMERGENCY');
    expect(r.emergencyCategory).toBe('diabetic-emergency');
  });

  test('Urdu emergencies use Urdu templates offline', () => {
    const r = runOfflineEngine('مجھے سینے میں درد ہے اور سانس لینے میں مشکل');
    expect(r.triage.level).toBe('EMERGENCY');
    expect(r.content).toMatch(/[\u0600-\u06FF]/);
  });

  test('offline citations use honest publisher URLs (no fake WHO deep links)', () => {
    const r = runOfflineEngine('seene mein dard aur saans nahi aa rahi');
    for (const c of r.citations) {
      if (c.publisher.toLowerCase().startsWith('who')) {
        expect(c.url).toBe('https://www.who.int');
      } else {
        expect(c.url).not.toBe('https://www.who.int'); // never claim WHO for non-WHO sources
      }
    }
  });
});

describe('K. offline medication refusal (no LLM needed)', () => {
  test('prescribing requests get a deterministic refusal', () => {
    const r = runOfflineEngine('Give me the dose of amoxicillin.');
    expect(r.triage.level).toBe('ROUTINE');
    expect(r.content).toContain('doctor or pharmacist');
    expect(r.content).not.toMatch(/\d+\s*mg/i);
  });

  test('Urdu prescribing requests refuse in Urdu', () => {
    const r = runOfflineEngine('مجھے اموکسسیلین کی خوراک بتائیں');
    expect(r.content).toMatch(/ڈاکٹر یا فارماسسٹ/);
  });

  test('child antibiotic requests refuse offline too', () => {
    const r = runOfflineEngine('What antibiotic should my child take?');
    expect(r.triage.level).toBe('ROUTINE');
    expect(r.content.toLowerCase()).toContain('pharmacist');
  });
});

describe('K. offline uncertainty handling', () => {
  test('vague distress asks questions instead of reassuring', () => {
    const r = runOfflineEngine("I don't know what's wrong.");
    expect(r.triage.level).toBe('URGENT');
    expect(r.content).toContain('Please tell me');
    expect(r.content).toContain('?');
    expect(r.content.toLowerCase()).not.toContain('nothing to worry');
  });

  test('Roman Urdu vague distress asks in Roman Urdu', () => {
    const r = runOfflineEngine('Mujhe bohat ajeeb lag raha hai.');
    expect(r.content).toContain('batayein');
  });

  test('pregnancy statement asks for context, assumes nothing', () => {
    const r = runOfflineEngine('I AM PREGNANT');
    expect(r.triage.level).toBe('ROUTINE');
    expect(r.content).toContain('How many weeks or months pregnant');
  });
});

describe('K. offline honesty', () => {
  test('answers are labeled as offline guidance, not AI chat', () => {
    const r = runOfflineEngine('mujhe do din se bukhar hai aur sar dard');
    expect(r.content).toContain('Offline guidance');
  });

  test('uncovered topics admit it honestly (escalated, never "no concern")', () => {
    const r = runOfflineEngine('zzz qwerty unrelated xyzzy');
    expect(r.triage.level).not.toBe('SELF_CARE');
    expect(r.content).toContain('offline pack does not cover');
  });

  test('established conditions acknowledged without re-confirmation', () => {
    const r = runOfflineEngine('I have diabetes');
    expect(r.content).toContain('Acknowledging the condition');
    expect(r.triage.level).toBe('ROUTINE');
  });
});
