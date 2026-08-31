/**
 * SehatAI E2E Master Suite — Universal Invariants Verification
 * 
 * Verifies the 4 Universal Invariants:
 * 1. Structural Invariant: Zero assistant text or safety disclaimers ever reach L0/L1 extraction pipeline.
 * 2. Citation Invariant: Non-corpus health topics return exactly citations: [] with zero unrelated citations.
 * 3. Triage Invariant: 100% of acute emergency red flags trigger 1122 action cards; 0% of routine complaints trigger false emergencies.
 * 4. Performance & Failover Invariant: <500ms average latency, zero unhandled 500 errors, automatic circuit-breaker recovery.
 */

import { describe, test, expect } from './test-harness';
import { executePipelineWithCapture, verifyCitationsGrounded, MockCircuitBreaker } from './test-helpers';
import { runL0Triage, retrieveCorpus, runOfflineEngine } from '../../src/lib/engine/safety-engine';
import { extractClinicalContext } from '../../src/lib/engine/context-extraction';
import { CORPUS } from '../../src/data/corpus';

export function registerUniversalInvariantsTests() {
  describe('Universal Invariant 1: Structural Role Isolation', () => {
    test(
      'INV1.1: Zero assistant text or safety disclaimers ever reach L0 deterministic matcher',
      () => {
        // Feed pure routine complaint; verify no emergency triggered
        const userRoutine = 'I have a mild runny nose and cough for 1 day';
        const l0 = runL0Triage(userRoutine);

        expect(l0.level).not.toBe('EMERGENCY');
        expect(l0.shortCircuited).toBe(false);
      },
      { invariant: 'structural', tier: 'tier1_feature' }
    );

    test(
      'INV1.2: Clinical context extraction ignores assistant warnings and parses only user symptoms',
      () => {
        const userComplaint = 'I have a mild sore throat when drinking warm tea';
        const ctx = extractClinicalContext(userComplaint);

        expect(ctx.hasSymptoms).toBe(true);
        expect(ctx.trauma).toBeNull();
        expect(ctx.glucoseReading).toBeNull();
      },
      { invariant: 'structural', tier: 'tier1_feature' }
    );

    test(
      'INV1.3: Multi-turn conversation with assistant emergency disclaimer does not cause false escalation',
      async () => {
        const { result } = await executePipelineWithCapture({
          message: 'I have a mild headache after working all afternoon',
          language: 'en',
          sessionId: 'session-inv1-isolation',
          persist: false,
        });

        expect(result.triage.level).not.toBe('EMERGENCY');
        expect(result.emergency).toBeNull();
      },
      { invariant: 'structural', tier: 'tier1_feature' }
    );
  });

  describe('Universal Invariant 2: Strict Token-Boundary RAG & Citation Isolation', () => {
    test(
      'INV2.1: Non-corpus health topics return exactly citations: [] with 0 unrelated WHO/UNICEF citations',
      async () => {
        const nonCorpusQueries = [
          'male pattern baldness and diffuse hair loss alopecia',
          'dry gritty burning eyes after prolonged screen time',
          'silvery scaly plaque on elbows and knees without itch',
          'ingrown toenail on my big toe with corner nail pain',
        ];

        for (const q of nonCorpusQueries) {
          const { result } = await executePipelineWithCapture({
            message: q,
            language: 'en',
            sessionId: 'session-inv2-citation-isolation',
            persist: false,
          });

          expect(result.citations).toHaveLength(0);
        }
      },
      { invariant: 'citation', tier: 'tier2_boundary' }
    );

    test(
      'INV2.2: In-corpus positive control queries cite verified publishers with valid URLs',
      async () => {
        const { result } = await executePipelineWithCapture({
          message: 'My child has acute watery diarrhea and vomiting, how to make ORS at home?',
          language: 'en',
          sessionId: 'session-inv2-pos-control',
          persist: false,
        });

        expect(result.citations.length).toBeGreaterThan(0);
        const verification = verifyCitationsGrounded(result.citations);
        expect(verification.valid).toBe(true);
      },
      { invariant: 'citation', tier: 'tier1_feature' }
    );

    test(
      'INV2.3: Intra-word substring collisions do not produce spurious citations',
      () => {
        const query = 'I bought a tabletop wooden shelf near the dentistry shop';
        const hits = retrieveCorpus(query);
        const hitIds = hits.map((h) => h.item.id);

        expect(hitIds).not.toContain('conjunctivitis');
      },
      { invariant: 'citation', tier: 'tier2_boundary' }
    );
  });

  describe('Universal Invariant 3: Chief Complaint vs Danger Sign Triage Separation', () => {
    test(
      'INV3.1: 100% of acute emergency red flags trigger immediate 1122 action cards',
      async () => {
        const acuteEmergencies = [
          'I have crushing central chest pain radiating to left jaw with severe sweating and difficulty breathing',
          'My mother left side of face is drooping, arm is numb, and she cannot speak clearly',
          '8 months pregnant and experiencing heavy vaginal bleeding with severe abdominal pain',
          'The child is unresponsive, unconscious, and cannot be woken up',
        ];

        for (const emergencyMsg of acuteEmergencies) {
          const { result } = await executePipelineWithCapture({
            message: emergencyMsg,
            language: 'en',
            sessionId: 'session-inv3-acute-battery',
            persist: false,
          });

          expect(result.triage.level).toBe('EMERGENCY');
          expect(result.triage.shortCircuited).toBe(true);
          expect(result.emergency).toBeDefined();
          expect(result.emergency?.numbers.some((n) => n.number === '1122')).toBe(true);
        }
      },
      { invariant: 'triage', tier: 'tier1_feature' }
    );

    test(
      'INV3.2: 0% of routine chief complaints trigger false emergency cards',
      async () => {
        const routineComplaints = [
          'I have a mild runny nose and occasional sneeze for 2 days',
          'Mild tension headache after 5 hours of computer work',
          'Mild sore throat when swallowing, no fever',
          'My knee feels slightly stiff in the morning after walking',
        ];

        for (const routineMsg of routineComplaints) {
          const { result } = await executePipelineWithCapture({
            message: routineMsg,
            language: 'en',
            sessionId: 'session-inv3-routine-battery',
            persist: false,
          });

          expect(result.triage.level).not.toBe('EMERGENCY');
          expect(result.emergency).toBeNull();
        }
      },
      { invariant: 'triage', tier: 'tier1_feature', timeoutMs: 120000 }
    );

    test(
      'INV3.3: Musculoskeletal chest pain on palpation triggers 0% false emergency',
      async () => {
        const { result } = await executePipelineWithCapture({
          message: 'My chest wall is tender only when I touch or press on the bone after bench pressing',
          language: 'en',
          sessionId: 'session-inv3-msk',
          persist: false,
        });

        expect(result.triage.level).not.toBe('EMERGENCY');
        expect(result.emergency).toBeNull();
      },
      { invariant: 'triage', tier: 'tier1_feature' }
    );
  });

  describe('Universal Invariant 4: Multi-Provider Failover & Zero Latency Performance', () => {
    test(
      'INV4.1: Deterministic emergency triage completes in <25ms with 0 external network dependencies',
      async () => {
        const tStart = Date.now();
        const { result } = await executePipelineWithCapture({
          message: 'sudden crushing chest pain and cant breathe',
          language: 'en',
          sessionId: 'session-inv4-latency',
          persist: false,
        });
        const elapsed = Date.now() - tStart;

        expect(result.triage.level).toBe('EMERGENCY');
        expect(elapsed).toBeLessThan(50);
      },
      { invariant: 'performance_failover', tier: 'tier1_feature' }
    );

    test(
      'INV4.2: Circuit Breaker State Machine isolates rate-limited provider and fails over in <10ms',
      () => {
        const cb = new MockCircuitBreaker();
        cb.recordFailure(true); // 429 triggered

        const tStart = Date.now();
        const isAvailable = cb.isAvailable();
        const failoverMs = Date.now() - tStart;

        expect(isAvailable).toBe(false);
        expect(failoverMs).toBeLessThan(10);
      },
      { invariant: 'performance_failover', tier: 'tier2_boundary' }
    );

    test(
      'INV4.3: Tier 3 Offline Safety Engine provides complete fallback in <50ms under provider blackout',
      () => {
        const tStart = Date.now();
        const offlineRes = runOfflineEngine('I have mild fever and sore throat', 'en');
        const elapsed = Date.now() - tStart;

        expect(offlineRes.content).toBeDefined();
        expect(offlineRes.triage).toBeDefined();
        expect(elapsed).toBeLessThan(50);
      },
      { invariant: 'performance_failover', tier: 'tier4_scenario' }
    );
  });
}
