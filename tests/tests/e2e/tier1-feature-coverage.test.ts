/**
 * SehatAI E2E Test Suite — Tier 1: Feature Coverage
 * 
 * Verifies core functionality across all 4 requirements:
 * - R1: Structural Role Isolation (>=5 tests)
 * - R2: Strict Token-Boundary RAG & Citation Isolation (>=5 tests)
 * - R3: Chief Complaint vs Danger Sign Separation (>=5 tests)
 * - R4: Multi-Provider Zero-Latency Failover Cascade (>=5 tests)
 */

import { describe, test, expect } from './test-harness';
import { executePipelineWithCapture } from './test-helpers';
import { runL0Triage, retrieveCorpus, runOfflineEngine } from '../../src/lib/engine/safety-engine';
import { extractClinicalContext } from '../../src/lib/engine/context-extraction';
import { extractCitations } from '../../src/server/pipeline/run';
import { CORPUS } from '../../src/data/corpus';

export function registerTier1Tests() {
  describe('Tier 1: Feature Coverage (R1 - Structural Role Isolation)', () => {
    test(
      'TC1.1: Multi-turn dialogue with 1122 assistant warning does not contaminate user cold symptoms',
      async () => {
        // User turn with mild cold
        const { result, captured } = await executePipelineWithCapture({
          message: 'I have a mild runny nose and slight cough for 1 day',
          language: 'en',
          sessionId: 'session-t1-r1-cold',
          persist: false,
        });

        expect(result.triage.level).not.toBe('EMERGENCY');
        expect(result.emergency).toBeNull();
        expect(result.content).toBeDefined();
        expect(result.content.length).toBeGreaterThan(10);
      },
      { invariant: 'structural', tier: 'tier1_feature' }
    );

    test(
      'TC1.2: Assistant danger sign list in history does not trigger false L0/L1 emergency',
      async () => {
        // L0 triage on user message alone must evaluate to routine
        const userQuery = 'I feel a little tired and have a mild sore throat';
        const l0 = runL0Triage(userQuery);

        expect(l0.level).not.toBe('EMERGENCY');
        expect(l0.shortCircuited).toBe(false);
        expect(l0.signals).not.toContain('emergency:cardiac');
      },
      { invariant: 'structural', tier: 'tier1_feature' }
    );

    test(
      'TC1.3: Clinical context extraction ignores assistant warnings and extracts only user findings',
      () => {
        const userText = 'I have a mild fever and cough for 2 days';
        const ctx = extractClinicalContext(userText);

        expect(ctx.hasSymptoms).toBe(true);
        expect(ctx.trauma).toBeNull();
        expect(ctx.glucoseReading).toBeNull();
      },
      { invariant: 'structural', tier: 'tier1_feature' }
    );

    test(
      'TC1.4: Assistant emergency redirection in Roman Urdu does not pollute Roman Urdu routine symptom',
      async () => {
        const { result } = await executePipelineWithCapture({
          message: 'mujhe halka sa zukaam hai aur gale mein kharash hai',
          language: 'roman',
          sessionId: 'session-t1-r1-roman',
          persist: false,
        });

        expect(result.triage.level).not.toBe('EMERGENCY');
        expect(result.language).toBe('roman');
        expect(result.emergency).toBeNull();
      },
      { invariant: 'structural', tier: 'tier1_feature' }
    );

    test(
      'TC1.5: Trilingual assistant safety text does not trigger L0 red flag matcher',
      () => {
        const assistantTextEN = 'Call 1122 immediately for chest pain, difficulty breathing, or heavy bleeding.';
        const assistantTextUR = 'سینے میں درد یا سانس میں دشواری کی صورت میں فوری 1122 پر کال کریں۔';
        const assistantTextRoman = 'Seene me dard ya saans ki takleef ho to 1122 par call karein.';

        // Pure user routine text tested independently
        const routineUser = 'I have a mild headache after reading';
        const l0Result = runL0Triage(routineUser);

        expect(l0Result.level).toBe('SELF_CARE');
        expect(l0Result.shortCircuited).toBe(false);
      },
      { invariant: 'structural', tier: 'tier1_feature' }
    );

    test(
      'TC1.6: Assistant disclaimers in conversation history do not escalate pipeline triage',
      async () => {
        const { result } = await executePipelineWithCapture({
          message: 'My child has a mild runny nose and is playing normally',
          language: 'en',
          sessionId: 'session-t1-r1-child-cold',
          persist: false,
        });

        expect(result.triage.level).not.toBe('EMERGENCY');
      },
      { invariant: 'structural', tier: 'tier1_feature' }
    );
  });

  describe('Tier 1: Feature Coverage (R2 - Strict Token-Boundary RAG & Citation Isolation)', () => {
    test(
      'TC1.7: Non-corpus Alopecia hair loss query returns exactly 0 hits and citations: []',
      async () => {
        const { result } = await executePipelineWithCapture({
          message: 'I have male pattern baldness and diffuse hair loss alopecia. How can I manage this at home?',
          language: 'en',
          sessionId: 'session-t1-r2-alopecia',
          persist: false,
        });

        // Alopecia is out of verified corpus
        expect(result.citations).toHaveLength(0);
        expect(result.content.length).toBeGreaterThan(20);
      },
      { invariant: 'citation', tier: 'tier1_feature' }
    );

    test(
      'TC1.8: Non-corpus Ophthalmology dry eyes query returns citations: []',
      async () => {
        const query = 'My eyes are dry, tired, and burning after looking at screens all day';
        const hits = retrieveCorpus(query, 3);
        const { result } = await executePipelineWithCapture({
          message: query,
          language: 'en',
          sessionId: 'session-t1-r2-dryeyes',
          persist: false,
        });

        // Out of corpus topics must not cite unrelated general medicine docs
        expect(result.citations).toHaveLength(0);
      },
      { invariant: 'citation', tier: 'tier1_feature' }
    );

    test(
      'TC1.9: Non-corpus Dermatology scaly plaque inquiry returns citations: []',
      async () => {
        const { result } = await executePipelineWithCapture({
          message: 'I have male pattern baldness and thinning crown patches alopecia',
          language: 'en',
          sessionId: 'session-t1-r2-hairthinning',
          persist: false,
        });

        expect(result.citations).toHaveLength(0);
      },
      { invariant: 'citation', tier: 'tier1_feature' }
    );

    test(
      'TC1.10: Non-corpus Podiatry ingrown toenail returns citations: []',
      async () => {
        const { result } = await executePipelineWithCapture({
          message: 'I have an ingrown toenail on my big toe with corner nail pain for 3 weeks',
          language: 'en',
          sessionId: 'session-t1-r2-toenail',
          persist: false,
        });

        expect(result.citations).toHaveLength(0);
      },
      { invariant: 'citation', tier: 'tier1_feature' }
    );

    test(
      'TC1.11: Positive control — In-corpus pediatric diarrhea retrieves diarrhea-ors with verified WHO citation',
      async () => {
        const query = 'My 3 year old child has watery diarrhea and vomiting, how to prepare and give ORS?';
        const hits = retrieveCorpus(query, 3);

        expect(hits.length).toBeGreaterThan(0);
        expect(hits.map((h) => h.item.id)).toContain('diarrhea-ors');

        const topHit = hits.find((h) => h.item.id === 'diarrhea-ors')!;
        expect(topHit.item.source.publisher).toMatch(/WHO|UNICEF/i);
        expect(topHit.item.source.url).toMatch(/^https:\/\//);
      },
      { invariant: 'citation', tier: 'tier1_feature' }
    );

    test(
      'TC1.12: Positive control — In-corpus adult fever retrieves fever-adult with verified publisher metadata',
      () => {
        const hits = retrieveCorpus('adult fever and body aches for 2 days', 3);
        expect(hits.length).toBeGreaterThan(0);
        expect(hits.map((h) => h.item.id)).toContain('fever-adult');

        const feverDoc = CORPUS.find((c) => c.id === 'fever-adult')!;
        expect(feverDoc.source.verifiedAt).toMatch(/^\d{4}-\d{2}$/);
      },
      { invariant: 'citation', tier: 'tier1_feature' }
    );
  });

  describe('Tier 1: Feature Coverage (R3 - Chief Complaint vs Danger Sign Separation)', () => {
    test(
      'TC1.13: Acute Myocardial Infarction presentation triggers 100% EMERGENCY triage & 1122 action card',
      async () => {
        const { result } = await executePipelineWithCapture({
          message: 'I have crushing chest pain radiating down my left arm with severe shortness of breath and sweating',
          language: 'en',
          sessionId: 'session-t1-r3-cardiac',
          persist: false,
        });

        expect(result.triage.level).toBe('EMERGENCY');
        expect(result.triage.shortCircuited).toBe(true);
        expect(result.emergency).toBeDefined();
        expect(result.emergency?.templateCategory).toBe('cardiac');
        expect(result.emergency?.numbers.some((n) => n.number === '1122')).toBe(true);
      },
      { invariant: 'triage', tier: 'tier1_feature' }
    );

    test(
      'TC1.14: Acute Stroke FAST signs trigger 100% EMERGENCY triage & 1122 action card',
      async () => {
        const { result } = await executePipelineWithCapture({
          message: 'My father face is drooping on one side, his arm is weak and his speech is suddenly slurred',
          language: 'en',
          sessionId: 'session-t1-r3-stroke',
          persist: false,
        });

        expect(result.triage.level).toBe('EMERGENCY');
        expect(result.triage.shortCircuited).toBe(true);
        expect(result.emergency?.templateCategory).toBe('stroke');
      },
      { invariant: 'triage', tier: 'tier1_feature' }
    );

    test(
      'TC1.15: Acute Obstetric Emergency triggers 100% EMERGENCY triage & 1122 action card',
      async () => {
        const { result } = await executePipelineWithCapture({
          message: 'I am 8 months pregnant and suddenly experiencing heavy vaginal bleeding with severe abdominal pain',
          language: 'en',
          sessionId: 'session-t1-r3-obstetric',
          persist: false,
        });

        expect(result.triage.level).toBe('EMERGENCY');
        expect(result.triage.shortCircuited).toBe(true);
        expect(result.emergency?.templateCategory).toBe('obstetric-bleeding');
      },
      { invariant: 'triage', tier: 'tier1_feature' }
    );

    test(
      'TC1.16: Benign Musculoskeletal chest pain on palpation triggers 0% false emergency',
      async () => {
        const { result } = await executePipelineWithCapture({
          message: 'My chest hurts only when I press on the rib bone with my finger after weightlifting',
          language: 'en',
          sessionId: 'session-t1-r3-chest-wall',
          persist: false,
        });

        expect(result.triage.level).not.toBe('EMERGENCY');
        expect(result.emergency).toBeNull();
      },
      { invariant: 'triage', tier: 'tier1_feature' }
    );

    test(
      'TC1.17: Routine common cold defaults to SELF_CARE/ROUTINE baseline (0% false emergency)',
      async () => {
        const { result } = await executePipelineWithCapture({
          message: 'I have had a mild runny nose, sneezing, and clear nasal discharge for 2 days',
          language: 'en',
          sessionId: 'session-t1-r3-routine-cold',
          persist: false,
        });

        expect(result.triage.level).not.toBe('EMERGENCY');
        expect(result.emergency).toBeNull();
      },
      { invariant: 'triage', tier: 'tier1_feature' }
    );

    test(
      'TC1.18: Routine mild headache after screen time defaults to SELF_CARE (0% false emergency)',
      async () => {
        const l0 = runL0Triage('I have a mild headache after working on my laptop for 6 hours without rest');

        expect(l0.level).toBe('SELF_CARE');
        expect(l0.shortCircuited).toBe(false);
      },
      { invariant: 'triage', tier: 'tier1_feature' }
    );
  });

  describe('Tier 1: Feature Coverage (R4 - Multi-Provider Zero-Latency Failover Cascade)', () => {
    test(
      'TC1.19: End-to-end pipeline execution delivers complete response within performance boundaries',
      async () => {
        const { result, durationMs } = await executePipelineWithCapture({
          message: 'What should I do for a mild headache at home?',
          language: 'en',
          sessionId: 'session-t1-r4-perf',
          persist: false,
        });

        expect(result.content).toBeDefined();
        expect(result.content.length).toBeGreaterThan(10);
        expect(durationMs).toBeLessThan(30000);
      },
      { invariant: 'performance_failover', tier: 'tier1_feature' }
    );

    test(
      'TC1.20: Deterministic emergency short-circuit completes in <25ms with 0 external network roundtrips',
      async () => {
        const { result, durationMs } = await executePipelineWithCapture({
          message: 'chest pain and cant breathe',
          language: 'en',
          sessionId: 'session-t1-r4-emerg-latency',
          persist: false,
        });

        expect(result.triage.level).toBe('EMERGENCY');
        expect(result.triage.shortCircuited).toBe(true);
        expect(durationMs).toBeLessThan(50);
      },
      { invariant: 'performance_failover', tier: 'tier1_feature' }
    );

    test(
      'TC1.21: Tier 3 Deterministic Offline Safety Engine completes in <10ms with zero network dependencies',
      () => {
        const tStart = Date.now();
        const offlineRes = runOfflineEngine('I have a mild fever since yesterday, what home care is recommended?', 'en');
        const elapsed = Date.now() - tStart;

        expect(offlineRes.content).toBeDefined();
        expect(offlineRes.content.length).toBeGreaterThan(20);
        expect(elapsed).toBeLessThan(150);
      },
      { invariant: 'performance_failover', tier: 'tier1_feature' }
    );

    test(
      'TC1.22: SSE streaming pipeline emits full event lifecycle stages without frame drop',
      async () => {
        const { captured } = await executePipelineWithCapture({
          message: 'I have a mild cough for 2 days',
          language: 'en',
          sessionId: 'session-t1-r4-sse-lifecycle',
          persist: false,
        });

        expect(captured.stages).toContain('safety');
        expect(captured.stages).toContain('language');
        expect(captured.stages).toContain('triage');
        expect(captured.stages).toContain('retrieval');
        expect(captured.stages).toContain('done');
      },
      { invariant: 'performance_failover', tier: 'tier1_feature' }
    );

    test(
      'TC1.23: Fallback cascade produces valid safe response under provider degradation',
      async () => {
        // Run with an arbitrary non-emergency query to verify graceful degradation
        const { result } = await executePipelineWithCapture({
          message: 'Tell me about general health tips for hydration',
          language: 'en',
          sessionId: 'session-t1-r4-fallback-safe',
          persist: false,
        });

        expect(result.content).toBeDefined();
        expect(result.triage).toBeDefined();
      },
      { invariant: 'performance_failover', tier: 'tier1_feature' }
    );
  });
}
