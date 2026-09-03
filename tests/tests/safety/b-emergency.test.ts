// ============================================================
// Category B — Emergency / red-flag detection
// Compositional detection: symptom × severity × population ×
// chronic condition. One coherent classification per message.
// ============================================================
import { describe, expect, test } from 'bun:test';
import { runL0Triage, resolveEmergencyCategory, matchRedFlags } from '@/lib/engine/safety-engine';
import { extractClinicalContext } from '@/lib/engine/context-extraction';

describe('B. emergency detection — classic patterns', () => {
  test('chest pain + dyspnea → EMERGENCY cardiac', () => {
    const r = runL0Triage('chest pain and difficulty breathing');
    expect(r.level).toBe('EMERGENCY');
    expect(r.matchedCategory).toBe('cardiac');
  });

  test('Roman Urdu cardiac emergency', () => {
    const r = runL0Triage('seene mein sakht dard hai aur saans lene mein mushkil');
    expect(r.level).toBe('EMERGENCY');
  });

  test('stroke FAST signs → EMERGENCY stroke', () => {
    const r = runL0Triage('my fathers face is drooping and his speech is slurred');
    expect(r.level).toBe('EMERGENCY');
    expect(r.matchedCategory).toBe('stroke');
  });

  test('uncontrolled bleeding → EMERGENCY', () => {
    expect(runL0Triage('khoon nahi ruk raha, bohot beh raha hai').level).toBe('EMERGENCY');
  });

  test('pregnancy + bleeding → EMERGENCY obstetric', () => {
    const r = runL0Triage('I am pregnant and bleeding');
    expect(r.level).toBe('EMERGENCY');
    expect(r.matchedCategory).toBe('obstetric-bleeding');
  });

  test('suicidal statement → EMERGENCY mental health', () => {
    expect(runL0Triage('I want to end my life').matchedCategory).toBe('mental-health');
    expect(runL0Triage('marna chahta hoon').level).toBe('EMERGENCY');
  });

  test('near-misses stay non-emergency (alert fatigue guard)', () => {
    expect(runL0Triage('I cut my finger while cooking, bleeding stopped').level).not.toBe('EMERGENCY');
    expect(runL0Triage('mujhe zukaam hai aur halki khansi hai').level).not.toBe('EMERGENCY');
    expect(runL0Triage('I have a mild headache after screen time').level).not.toBe('EMERGENCY');
    expect(runL0Triage('my child has fever but is drinking and playing').level).not.toBe('EMERGENCY');
  });
});

describe('B. emergency detection — compositional', () => {
  test('symptom × chronic condition: diabetes + confusion → EMERGENCY', () => {
    const r = runL0Triage('I have diabetes and feel confused');
    expect(r.level).toBe('EMERGENCY');
    expect(r.matchedCategory).toBe('diabetic-emergency');
  });

  test('symptom × chronic condition × severity: diabetes + confusion + sleepiness', () => {
    const r = runL0Triage('I have diabetes and I am confused and extremely sleepy');
    expect(r.level).toBe('EMERGENCY');
    expect(r.matchedCategory).toBe('diabetic-emergency');
  });

  test('glucose reading × danger sign → EMERGENCY', () => {
    const r = runL0Triage('My sugar is 400 and I am very confused');
    expect(r.level).toBe('EMERGENCY');
    expect(r.matchedCategory).toBe('diabetic-emergency');
  });

  test('very high glucose alone is URGENT, not EMERGENCY (no false takeover)', () => {
    const r = runL0Triage('My sugar is 300');
    expect(r.level).toBe('URGENT');
    expect(r.signals.some((s) => s.startsWith('abnormal-glucose'))).toBe(true);
  });

  test('overdose × altered mental status → EMERGENCY poisoning', () => {
    const r = runL0Triage('I took too many sleeping pills and now I am very drowsy and confused');
    expect(r.level).toBe('EMERGENCY');
  });

  test('overdose without danger signs → URGENT floor', () => {
    const r = runL0Triage('I think I took a double dose of my BP medicine by mistake');
    expect(r.level).toBe('URGENT');
    expect(r.signals).toContain('medication-overdose');
  });

  test('multi-pattern messages resolve to the highest-priority template', () => {
    // bleeding + pregnancy → obstetric bleeding wins over generic bleeding
    const r = runL0Triage('I am 7 months pregnant and there is heavy bleeding');
    expect(r.level).toBe('EMERGENCY');
    expect(r.matchedCategory).toBe('obstetric-bleeding');
  });

  test('scenario resolution never picks instructions for an undescribed state', () => {
    // conscious person with chest trauma must NOT get the unconscious template
    const r = runL0Triage('A bike hit me now I have pain in my chest.');
    expect(r.matchedCategory).toBe('chest-trauma');
    expect(r.matchedCategory).not.toBe('unconscious');
  });
});

describe('B. one coherent classification', () => {
  test('EMERGENCY short-circuits — no partial triage signals', () => {
    const r = runL0Triage('seene mein dard aur saans nahi aa rahi');
    expect(r.shortCircuited).toBe(true);
    expect(r.level).toBe('EMERGENCY');
  });

  test('NEEDS_CLARIFICATION is flagged instead of false SELF_CARE', () => {
    const r = runL0Triage('I feel very sick');
    expect(r.level).not.toBe('SELF_CARE');
    expect(r.needsClarification).toBe(true);
  });
});
