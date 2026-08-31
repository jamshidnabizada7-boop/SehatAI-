// ============================================================
// Categories M + N — Output validation and contradiction
// detection. Final answers stay consistent with the structured
// safety decision: no diagnoses, no doses, no emergency
// downgrades, no contradictory urgency language.
// ============================================================
import { describe, expect, test } from 'bun:test';
import {
  hasDosePattern,
  hasDiagnosisAssertion,
  runRuleChecks,
  urgencyConsistencyIssues,
  hasFalseReassurance,
  extractCitations,
} from '@/server/pipeline/run';

describe('M. diagnosis-assertion guard', () => {
  test('2nd-person assertions are caught', () => {
    expect(hasDiagnosisAssertion('You have dengue fever and need treatment')).toBe(true);
    expect(hasDiagnosisAssertion('aap ko malaria hai')).toBe(true);
    expect(hasDiagnosisAssertion('آپ کو ملیریا ہے')).toBe(true);
  });

  test('hedged possibilities are allowed', () => {
    expect(hasDiagnosisAssertion('These symptoms may be caused by dengue — a doctor must check')).toBe(false);
    expect(hasDiagnosisAssertion('it could be malaria, which a test can confirm')).toBe(false);
  });

  test('new patterns: "sounds like", 3rd person, "diagnosis is"', () => {
    expect(hasDiagnosisAssertion('It sounds like you have typhoid')).toBe(true);
    expect(hasDiagnosisAssertion('Your child has measles')).toBe(true);
    expect(hasDiagnosisAssertion('The diagnosis is dengue')).toBe(true);
    expect(hasDiagnosisAssertion('لگتا ہے آپ کو ملیریا ہے')).toBe(true);
  });
});

describe('N. urgency consistency (contradiction detection)', () => {
  test('EMERGENCY answers cannot contain downplay language', () => {
    const issues = urgencyConsistencyIssues('This is not an emergency, just rest at home', 'EMERGENCY');
    expect(issues).toContain('emergencyDownplay');
  });

  test('non-emergency answers cannot give unconditional call-1122-now directives', () => {
    const issues = urgencyConsistencyIssues('Rest and drink fluids. Call 1122 now.', 'SELF_CARE');
    expect(issues).toContain('unconditionalEmergencyDirective');
  });

  test('conditional escalation warnings are always allowed', () => {
    expect(urgencyConsistencyIssues('Rest and drink fluids. GO NOW IF breathing becomes hard — call 1122.', 'SELF_CARE')).toEqual([]);
    expect(urgencyConsistencyIssues('If the fever rises above 39, call 1122 immediately.', 'ROUTINE')).toEqual([]);
    expect(urgencyConsistencyIssues('agar saans mushkil ho to 1122 par call karein', 'SELF_CARE')).toEqual([]);
  });

  test('EMERGENCY answers may (and should) demand immediate help', () => {
    expect(urgencyConsistencyIssues('Call 1122 now — this is an emergency.', 'EMERGENCY')).toEqual([]);
  });
});

describe('M. context-aware rule checks', () => {
  test('clarification-required answers must ask a question', () => {
    const checks = runRuleChecks('You should rest and drink water.', 'en', { needsClarification: true });
    const ask = checks.find((c) => c.name === 'clarifyingQuestionPresent');
    expect(ask?.passed).toBe(false);
    const checksOk = runRuleChecks('What are you feeling, and since when?', 'en', { needsClarification: true });
    expect(checksOk.find((c) => c.name === 'clarifyingQuestionPresent')?.passed).toBe(true);
  });

  test('clarification-required answers must not falsely reassure', () => {
    const checks = runRuleChecks('What do you feel? There is nothing to worry about anyway.', 'en', { needsClarification: true });
    expect(checks.find((c) => c.name === 'noFalseReassurance')?.passed).toBe(false);
  });

  test('medication-request answers must redirect to a professional', () => {
    const checks = runRuleChecks('I cannot give doses. Ask a pharmacist.', 'en', { medicationPrescribing: true });
    expect(checks.find((c) => c.name === 'medicationRedirectPresent')?.passed).toBe(true);
    const bad = runRuleChecks('Sure, here is what to take.', 'en', { medicationPrescribing: true });
    expect(bad.find((c) => c.name === 'medicationRedirectPresent')?.passed).toBe(false);
  });

  test('base checks keep working without context', () => {
    const checks = runRuleChecks('Rest and drink fluids.');
    expect(checks.map((c) => c.name)).toContain('noDoseAmounts');
  });
});

describe('M. validator composes with citations', () => {
  test('full check-set on a realistic answer', () => {
    const answer = 'Fever with headache is common and usually settles [fever-adult].\n• Rest and drink fluids [fever-adult]\nGO NOW IF: breathing trouble, rash, or confusion — call 1122 [fever-adult]';
    const checks = runRuleChecks(answer, 'en', { level: 'SELF_CARE' });
    expect(checks.every((c) => c.passed)).toBe(true);
    const { citations } = extractCitations(answer, new Set(['fever-adult']));
    expect(citations.length).toBe(1);
  });
});
