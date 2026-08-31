// ============================================================
// Categories E/F/G — Special populations: pregnancy, children,
// elderly, chronic conditions. No unsupported assumptions;
// risk escalates correctly when combined with symptoms.
// ============================================================
import { describe, expect, test } from 'bun:test';
import { extractPopulations } from '@/lib/engine/context-extraction';
import { runL0Triage } from '@/lib/engine/safety-engine';

describe('E. pregnancy handling', () => {
  test('pregnancy statements detected in all languages', () => {
    expect(extractPopulations('I AM PREGNANT').pregnancy).toBe(true);
    expect(extractPopulations('mujhe hamal hai').pregnancy).toBe(true);
    expect(extractPopulations('میں حاملہ ہوں').pregnancy).toBe(true);
    expect(extractPopulations('I am expecting a baby').pregnancy).toBe(true);
  });

  test('pregnancy statement alone → ROUTINE general guidance + clarification, no assumptions', () => {
    const r = runL0Triage('I AM PREGNANT');
    expect(r.level).toBe('ROUTINE');
    expect(r.needsClarification).toBe(true);
    expect(r.clarificationReasons).toContain('pregnancy_context');
  });

  test('pregnancy + danger sign → EMERGENCY (obstetric)', () => {
    expect(runL0Triage('I am pregnant and bleeding').level).toBe('EMERGENCY');
    expect(runL0Triage('main pregnant hoon aur khoon aa raha hai').level).toBe('EMERGENCY');
    expect(runL0Triage('pregnant woman with severe headache and blurred vision').level).toBe('EMERGENCY');
  });

  test('pregnancy + medication request → redirect, never doses', () => {
    const r = runL0Triage('I am pregnant, which antibiotic should I take?');
    expect(r.level).toBe('ROUTINE');
    expect(r.signals).toContain('medication-prescribing-request');
  });
});

describe('F. children handling', () => {
  test('child patient detected by wording and by age', () => {
    expect(extractPopulations('my child has fever').child).toBe(true);
    expect(extractPopulations('mere bachay ko bukhar hai').child).toBe(true);
    expect(extractPopulations('میرے بچے کو بخار ہے').child).toBe(true);
    expect(extractPopulations('my 3 year old son coughs').child).toBe(true);
    expect(extractPopulations('my 2 months old baby refuses milk').child).toBe(true);
  });

  test('child danger signs → EMERGENCY pediatric template', () => {
    const r = runL0Triage('mera beta kuch nahi pi raha aur neela ho raha hai');
    expect(r.level).toBe('EMERGENCY');
    expect(r.matchedCategory).toBe('pediatric');
  });

  test('child with mild drinking-and-playing illness stays SELF_CARE (no over-triage)', () => {
    expect(runL0Triage('my child has loose motions since yesterday but is drinking and playing').level).toBe('SELF_CARE');
  });

  test('child + fast breathing → URGENT (pneumonia pattern, not emergency)', () => {
    expect(runL0Triage('my 3 year old has cough and fast breathing since last night').level).toBe('URGENT');
  });

  test('child medication requests never get doses', () => {
    const r = runL0Triage('What antibiotic should my child take?');
    expect(r.signals).toContain('medication-prescribing-request');
    expect(r.context?.medications?.contexts).toContain('child');
  });
});

describe('G. elderly + chronic conditions', () => {
  test('elderly detected by age mention', () => {
    expect(extractPopulations('my 70 year old father has fever').elderly).toBe(true);
    expect(extractPopulations('my grandmother is 80 years old').elderly).toBe(true);
  });

  test('elderly + symptom escalates (atypical presentation risk)', () => {
    const r = runL0Triage('my 70 year old father has fever and is confused');
    expect(r.level).toBe('EMERGENCY'); // confusion is a danger sign at any age
  });

  test('established chronic condition + new symptom → risk escalated', () => {
    const r = runL0Triage('I have diabetes and I have a wound on my foot that is not healing');
    expect(r.level).toBe('URGENT');
  });

  test('established chronic condition alone → ROUTINE, no default appointment', () => {
    expect(runL0Triage('I have diabetes').level).toBe('ROUTINE');
    expect(runL0Triage('mujhe sugar hai').level).toBe('ROUTINE');
    expect(runL0Triage('I was diagnosed with diabetes').level).toBe('ROUTINE');
  });

  test('chronic condition + vague complaint stays safe (never dismissed)', () => {
    const r = runL0Triage('I have diabetes and I feel weird');
    expect(r.level).not.toBe('SELF_CARE');
  });
});
