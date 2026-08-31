// ============================================================
// Category D — Medication safety
// GENERAL INFO vs INDIVIDUALIZED PRESCRIBING across drugs,
// routes, languages, ages/weights. Prescribing requests are
// never SELF_CARE and never answered with doses.
// ============================================================
import { describe, expect, test } from 'bun:test';
import { extractMedicationRequest } from '@/lib/engine/context-extraction';
import { runL0Triage } from '@/lib/engine/safety-engine';
import {
  hasDosePattern,
  hasPrescriptionDirective,
  ruleRefuses,
} from '@/server/pipeline/run';

function meds(msg: string) {
  return extractMedicationRequest(msg);
}

describe('D. medication intent classification', () => {
  test('prescribing requests → PRESCRIBING', () => {
    expect(meds('Give me the dose of amoxicillin.')?.intent).toBe('PRESCRIBING');
    expect(meds('Which antibiotic should I take for fever?')?.intent).toBe('PRESCRIBING');
    expect(meds('What antibiotic should my child take?')?.intent).toBe('PRESCRIBING');
    expect(meds('tell me the exact dose of paracetamol')?.intent).toBe('PRESCRIBING');
    expect(meds('kitni goli loon?')?.intent).toBe('PRESCRIBING');
    expect(meds('konsi dawa loon bukhar ke liye')?.intent).toBe('PRESCRIBING');
    expect(meds('مجھے اموکسسیلین کی خوراک بتائیں')?.intent).toBe('PRESCRIBING');
    expect(meds('prescribe me something for the pain')?.intent).toBe('PRESCRIBING');
  });

  test('general info questions → GENERAL_INFO', () => {
    expect(meds('Can I take antibiotics without seeing a doctor?')?.intent).toBe('GENERAL_INFO');
    expect(meds('is paracetamol safe during pregnancy?')?.intent).toBe('GENERAL_INFO');
    expect(meds('what is amoxicillin used for?')?.intent).toBe('GENERAL_INFO');
    expect(meds('kya main antibiotic le sakta hoon?')?.intent).toBe('GENERAL_INFO');
  });

  test('overdose / missed-dose / interaction intents', () => {
    expect(meds('I took too many pills of my medicine')?.intent).toBe('OVERDOSE');
    expect(meds('I forgot my insulin dose this morning')?.intent).toBe('MISSED_DOSE');
    expect(meds('can I take panadol with my BP medicine together?')?.intent).toBe('INTERACTION');
  });

  test('personalization detection (age/weight never unlock prescribing)', () => {
    const m = meds('I am 23 years old. I weigh 60 kg. Give me the exact dose of amoxicillin for my fever.');
    expect(m?.intent).toBe('PRESCRIBING');
    expect(m?.personalized).toBe(true);
  });

  test('child context on medication requests', () => {
    expect(meds('What antibiotic should my child take?')?.contexts).toContain('child');
    expect(meds('give dose of amoxicillin for my 4 year old son')?.contexts).toContain('child');
  });

  test('drug coverage is general, not amoxicillin-only', () => {
    expect(meds('give me azithromycin dose')?.drugs).toContain('azithromycin');
    expect(meds('ciprofloxacin kitni leni hai?')?.drugs).toContain('ciprofloxacin');
    expect(meds('kitni panadol goli loon?')?.drugs).toContain('paracetamol');
    expect(meds('mujhe flagyl ki dose chahiye')?.drugs).toContain('metronidazole');
    expect(meds('insulin dose batao')?.drugs).toContain('insulin');
  });
});

describe('D. medication triage policy', () => {
  test('prescribing requests are never SELF_CARE', () => {
    expect(runL0Triage('Give me the dose of amoxicillin.').level).toBe('ROUTINE');
    expect(runL0Triage('Which antibiotic should I take for fever?').level).toBe('ROUTINE');
    expect(runL0Triage('What antibiotic should my child take?').level).toBe('ROUTINE');
    expect(runL0Triage('kitni paracetamol goli loon bukhar ke liye?').level).toBe('ROUTINE');
  });

  test('general info questions stay informational', () => {
    expect(runL0Triage('Can I take antibiotics without seeing a doctor?').level).toBe('SELF_CARE');
  });

  test('prescribing signal recorded for the pipeline', () => {
    expect(runL0Triage('Give me the dose of amoxicillin.').signals).toContain('medication-prescribing-request');
  });
});

describe('D. L2 dose detection (output validator)', () => {
  test('unit doses are caught', () => {
    expect(hasDosePattern('take 500 mg of amoxicillin')).toBe(true);
    expect(hasDosePattern('5 ml syrup twice')).toBe(true);
    expect(hasDosePattern('100 mcg lein')).toBe(true);
  });

  test('unit-less doses are caught', () => {
    expect(hasDosePattern('take 2 tablets every 4 hours')).toBe(true);
    expect(hasDosePattern('do goli lein subah sham')).toBe(true);
    expect(hasDosePattern('give 500 paracetamol')).toBe(true);
    expect(hasDosePattern('take paracetamol 3 times a day')).toBe(true);
    expect(hasDosePattern('take one capsule daily')).toBe(true);
  });

  test('legitimate mentions are NOT caught', () => {
    expect(hasDosePattern('my sugar is 300 today')).toBe(false);
    expect(hasDosePattern('the child is 2 months old')).toBe(false);
    expect(hasDosePattern('fever for 3 days')).toBe(false);
    expect(hasDosePattern('I weigh 60 kg')).toBe(false);
    expect(hasDosePattern('dissolve the ORS sachet in 1 litre of water')).toBe(false);
    expect(hasDosePattern('drink fluids often')).toBe(false);
    expect(hasDosePattern('my blood sugar reading was 180 mg/dl')).toBe(false);
  });

  test('prescription directives are caught (incl. OTC + Urdu)', () => {
    expect(hasPrescriptionDirective('you should take amoxicillin for 5 days')).toBe(true);
    expect(hasPrescriptionDirective('take 2 panadol')).toBe(true);
    expect(hasPrescriptionDirective('aap augmentin lein')).toBe(true);
    expect(hasPrescriptionDirective('never take antibiotics without a doctor')).toBe(false);
    expect(hasPrescriptionDirective('ask your pharmacist about paracetamol')).toBe(false);
  });

  test('refusal judge: redirect present, doses absent', () => {
    expect(ruleRefuses('I cannot give doses. Please see a doctor or pharmacist.')).toBe(true);
    expect(ruleRefuses('take 500 mg amoxicillin twice a day, see a doctor')).toBe(false);
    expect(ruleRefuses('panadol lein')).toBe(false);
  });
});
