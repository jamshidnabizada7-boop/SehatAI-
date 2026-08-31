// ============================================================
// Category A — Established vs suspected vs asked conditions
// The system must distinguish an ESTABLISHED diagnosis from a
// SUSPECTED one, a QUESTION about it, or SYMPTOM-association —
// in all three languages, for wording variations and typos.
// ============================================================
import { describe, expect, test } from 'bun:test';
import { extractClinicalContext } from '@/lib/engine/context-extraction';
import { runL0Triage } from '@/lib/engine/safety-engine';

function cond(msg: string) {
  return extractClinicalContext(msg).conditions;
}

describe('A. condition-state extraction', () => {
  test('explicit statement → ESTABLISHED', () => {
    expect(cond('I have diabetes')[0]?.state).toBe('ESTABLISHED');
    expect(cond('I have had asthma for years')[0]?.state).toBe('ESTABLISHED');
    expect(cond('I am a heart patient')[0]?.state).toBe('ESTABLISHED');
    expect(cond('I suffer from epilepsy')[0]?.state).toBe('ESTABLISHED');
  });

  test('diagnosis wording → ESTABLISHED', () => {
    expect(cond('I was diagnosed with diabetes')[0]?.state).toBe('ESTABLISHED');
    expect(cond('my doctor said I have hypertension')[0]?.state).toBe('ESTABLISHED');
    expect(cond('doctor ne bataya mujhe sugar hai')[0]?.state).toBe('ESTABLISHED');
  });

  test('uncertainty wording → SUSPECTED', () => {
    expect(cond('I think I have diabetes')[0]?.state).toBe('SUSPECTED');
    expect(cond('maybe I have dengue')[0]?.state).toBe('SUSPECTED');
    expect(cond('I might have malaria')[0]?.state).toBe('SUSPECTED');
    expect(cond('shayad mujhe sugar hai')[0]?.state).toBe('SUSPECTED');
    expect(cond('لگتا ہے مجھے ذیابیطس ہے')[0]?.state).toBe('SUSPECTED');
  });

  test('question form → QUESTION', () => {
    expect(cond('Could I have diabetes?')[0]?.state).toBe('QUESTION');
    expect(cond('do I have diabetes?')[0]?.state).toBe('QUESTION');
    expect(cond('kya mujhe sugar ho sakta hai?')[0]?.state).toBe('QUESTION');
    expect(cond('کیا مجھے ذیابیطس ہو سکتی ہے؟')[0]?.state).toBe('QUESTION');
  });

  test('symptom association → SYMPTOM_ASSOCIATED', () => {
    expect(cond('I have symptoms of diabetes')[0]?.state).toBe('SYMPTOM_ASSOCIATED');
    expect(cond('what are the signs of dengue?')[0]?.state).toBe('SYMPTOM_ASSOCIATED');
  });

  test('condition lexicon covers multiple chronic diseases', () => {
    expect(cond('I have hypertension')[0]?.condition).toBe('hypertension');
    expect(cond('mujhe damha hai')[0]?.condition).toBe('asthma');
    expect(cond('meri mirgi hai')[0]?.condition).toBe('epilepsy');
    expect(cond('I have hepatitis b')[0]?.condition).toBe('hepatitis');
    expect(cond('مجھے تھائیرائیڈ ہے')[0]?.condition).toBe('thyroid');
  });

  test('spelling mistakes still extract', () => {
    expect(cond('I have diabetis')[0]?.condition).toBe('diabetes');
    expect(cond('I think I have diabeties')[0]?.state).toBe('SUSPECTED');
  });

  test('symptoms are never confused with conditions', () => {
    // fever/cough/pain are not chronic-condition claims
    const c = cond('mujhe do din se bukhar hai aur khansi');
    expect(c.find((x) => x.condition === 'diabetes')).toBeUndefined();
  });
});

describe('A. condition-state triage behavior', () => {
  test('established condition statement alone is never over-triaged', () => {
    const r = runL0Triage('I have diabetes');
    expect(r.level).toBe('ROUTINE');
    expect(r.signals).toContain('condition-established');
  });

  test('established condition in Urdu/Roman behaves the same', () => {
    expect(runL0Triage('مجھے ذیابیطس ہے').level).toBe('ROUTINE');
    expect(runL0Triage('mujhe sugar hai').level).toBe('ROUTINE');
  });

  test('suspected/question condition → ROUTINE, never diagnosed', () => {
    expect(runL0Triage('I think I have diabetes').level).toBe('ROUTINE');
    expect(runL0Triage('Could I have diabetes?').level).toBe('ROUTINE');
    expect(runL0Triage('shayad mujhe sugar hai').level).toBe('ROUTINE');
  });

  test('established condition + complaint still escalates', () => {
    const r = runL0Triage('I have diabetes and I have a wound on my foot that is not healing');
    expect(r.level).toBe('URGENT');
    expect(r.signals).toContain('chronic-complication-sign');
  });

  test('suspected condition never boosts risk like an established one', () => {
    // "I think I have diabetes" must not trigger the high-risk-person modifier
    const r = runL0Triage('I think I have diabetes');
    expect(r.signals).not.toContain('modifier:high_risk_person');
  });
});
