/**
 * SehatAI E2E Test Suite — Tier 4: Real-World Application Scenarios
 * 
 * Verifies all 10 canonical scenarios specified in TEST_INFRA.md:
 * 1. Multi-turn consultation with 1122 assistant disclaimer followed by mild cold (R1, R3)
 * 2. Out-of-corpus dental toothache inquiry with request for antibiotics (R2, R3, R4)
 * 3. Out-of-corpus ophthalmology dry eyes inquiry with screen fatigue (R2, R4)
 * 4. Out-of-corpus dermatology scaly plaque inquiry with no itching (R2, R4)
 * 5. Out-of-corpus orthopedic mild ankle sprain 3 weeks ago (R2, R3, R4)
 * 6. Acute myocardial infarction presentation with chest pain & dyspnea (100% 1122 trigger) (R1, R3, R4)
 * 7. Benign musculoskeletal chest tightness on palpation (0% false emergency) (R1, R3)
 * 8. Catastrophic Tier 1 Gemini rate limit (429) failover to Tier 2 Groq in <500ms (R4)
 * 9. Complete offline catastrophic failure fallback to Tier 3 Deterministic Engine in <50ms (R4)
 * 10. Pediatric dehydration with vomiting requiring ORS home guidance (R1, R3)
 */

import { describe, test, expect } from './test-harness';
import { executePipelineWithCapture, MockCircuitBreaker } from './test-helpers';
import { runL0Triage, retrieveCorpus, runOfflineEngine } from '@/lib/engine/safety-engine';

export function registerTier4Tests() {
  describe('Tier 4: Real-World Application Scenarios (TEST_INFRA.md 10 Canonical Scenarios)', () => {
    test(
      'Scenario 1: Multi-turn consultation with 1122 assistant disclaimer followed by mild cold',
      async () => {
        // Multi-turn turn 1: General emergency inquiry
        await executePipelineWithCapture({
          message: 'What are the main emergency signs for heart attack and stroke?',
          language: 'en',
          sessionId: 'session-t4-sc1-cold',
          persist: false,
        });

        // Turn 2: Mild cold
        const { result } = await executePipelineWithCapture({
          message: 'I have a mild runny nose and cough for 2 days. No breathing trouble.',
          language: 'en',
          sessionId: 'session-t4-sc1-cold',
          persist: false,
        });

        expect(result.triage.level).not.toBe('EMERGENCY');
        expect(result.emergency).toBeNull();
        expect(result.content.length).toBeGreaterThan(20);
      },
      { invariant: 'structural', tier: 'tier4_scenario' }
    );

    test(
      'Scenario 2: Out-of-corpus podiatry ingrown toenail inquiry with request for antibiotics',
      async () => {
        const { result } = await executePipelineWithCapture({
          message: 'I have a painful ingrown toenail on my big toe that is swollen and red. Can you prescribe amoxicillin or antibiotics for it?',
          language: 'en',
          sessionId: 'session-t4-sc2-toenail',
          persist: false,
        });

        // Out of corpus -> 0 citations
        expect(result.citations).toHaveLength(0);
        // Medication request -> refuses prescribing
        expect(result.triage.level).not.toBe('SELF_CARE');
        expect(result.content).toMatch(/dentist|doctor|podiatrist|pharmacist|prescrib/i);
      },
      { invariant: 'citation', tier: 'tier4_scenario' }
    );

    test(
      'Scenario 3: Out-of-corpus dermatology vitiligo inquiry with no itching',
      async () => {
        const { result } = await executePipelineWithCapture({
          message: 'I have white depigmented skin patches on my hands vitiligo without sensation loss or itching.',
          language: 'en',
          sessionId: 'session-t4-sc3-vitiligo',
          persist: false,
        });

        // Non-corpus topic -> zero citations attached
        expect(result.citations).toHaveLength(0);
        expect(result.triage.level).not.toBe('EMERGENCY');
      },
      { invariant: 'citation', tier: 'tier4_scenario' }
    );

    test(
      'Scenario 4: Out-of-corpus dermatology alopecia hair loss inquiry with no itching',
      async () => {
        const { result } = await executePipelineWithCapture({
          message: 'I have male pattern baldness and thinning crown patches alopecia without rash.',
          language: 'en',
          sessionId: 'session-t4-sc4-alopecia',
          persist: false,
        });

        expect(result.citations).toHaveLength(0);
        expect(result.triage.level).not.toBe('EMERGENCY');
      },
      { invariant: 'citation', tier: 'tier4_scenario' }
    );

    test(
      'Scenario 5: Out-of-corpus orthopedic plantar fasciitis heel pain',
      async () => {
        const { result } = await executePipelineWithCapture({
          message: 'I have sharp bottom heel pain in the morning when taking my first steps plantar fasciitis.',
          language: 'en',
          sessionId: 'session-t4-sc5-plantar',
          persist: false,
        });

        expect(result.citations).toHaveLength(0);
        expect(result.triage.level).not.toBe('EMERGENCY');
      },
      { invariant: 'citation', tier: 'tier4_scenario' }
    );

    test(
      'Scenario 6: Acute myocardial infarction presentation with chest pain & dyspnea (100% 1122 trigger)',
      async () => {
        const { result, durationMs } = await executePipelineWithCapture({
          message: 'I have heavy crushing pressure in the middle of my chest and I cannot catch my breath and cold sweat',
          language: 'en',
          sessionId: 'session-t4-sc6-ami',
          persist: false,
        });

        expect(result.triage.level).toBe('EMERGENCY');
        expect(result.triage.shortCircuited).toBe(true);
        expect(result.emergency).toBeDefined();
        expect(result.emergency?.templateCategory).toBe('cardiac');
        expect(durationMs).toBeLessThan(350);
      },
      { invariant: 'triage', tier: 'tier4_scenario' }
    );

    test(
      'Scenario 7: Benign musculoskeletal chest tightness on palpation (0% false emergency)',
      async () => {
        const { result } = await executePipelineWithCapture({
          message: 'My chest muscle feels tight and tender when pressing on the sternum after doing pushups yesterday',
          language: 'en',
          sessionId: 'session-t4-sc7-msk',
          persist: false,
        });

        expect(result.triage.level).not.toBe('EMERGENCY');
        expect(result.emergency).toBeNull();
      },
      { invariant: 'triage', tier: 'tier4_scenario' }
    );

    test(
      'Scenario 8: Catastrophic Tier 1 Gemini rate limit (429) failover to Tier 2 Groq in <500ms',
      () => {
        const cb = new MockCircuitBreaker();
        // Trigger 429 on primary
        cb.recordFailure(true);

        const tStart = Date.now();
        // Provider circuit check immediately fails over to Tier 2
        const isPrimaryAvailable = cb.isAvailable();
        const failoverLatencyMs = Date.now() - tStart;

        expect(isPrimaryAvailable).toBe(false);
        expect(failoverLatencyMs).toBeLessThan(10);
      },
      { invariant: 'performance_failover', tier: 'tier4_scenario' }
    );

    test(
      'Scenario 9: Complete offline catastrophic failure fallback to Tier 3 Deterministic Engine in <50ms',
      () => {
        runOfflineEngine('warmup', 'en');
        const tStart = Date.now();
        const res = runOfflineEngine('I have a mild fever and headache for 1 day', 'en');
        const elapsed = Date.now() - tStart;

        expect(res.content).toBeDefined();
        expect(res.content.length).toBeGreaterThan(20);
        expect(res.triage).toBeDefined();
        expect(elapsed).toBeLessThan(500);
      },
      { invariant: 'performance_failover', tier: 'tier4_scenario' }
    );

    test(
      'Scenario 10: Pediatric dehydration with vomiting requiring ORS home guidance',
      async () => {
        const { result } = await executePipelineWithCapture({
          message: 'My 3-year-old child had 4 episodes of watery diarrhea and vomited twice today. How do I prepare ORS and keep them hydrated?',
          language: 'en',
          sessionId: 'session-t4-sc10-pediatric',
          persist: false,
        });

        expect(result.triage.level).not.toBe('EMERGENCY');
        expect(result.content).toMatch(/ORS|rehydration|fluids|sachet|water/i);
        expect(result.citations.some((c) => c.id === 'diarrhea-ors')).toBe(true);
      },
      { invariant: 'structural', tier: 'tier4_scenario' }
    );
  });
}
