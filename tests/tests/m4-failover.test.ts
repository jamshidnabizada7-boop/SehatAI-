// ============================================================
// SehatAI — Milestone 4 (M4) Multi-Provider Zero-Latency Failover Cascade Test Suite
// Verifies:
// 1. Google API Key prefix validation (accepts AQ.*, AIzaSy, GCP keys)
// 2. In-memory Circuit Breaker State Machine (CLOSED -> OPEN -> HALF_OPEN)
// 3. AbortController-backed timeout execution (zero leaky sockets)
// 4. StreamThoughtFilter chunk boundary parsing (<think>...</think>)
// 5. extractJsonBlock robust parsing
// 6. Tier 3 Deterministic Offline Safety Engine helpers
// 7. Multi-provider cascade fallback and failover
// ============================================================

import {
  getGemini,
  getGroq,
  resetClientsForTesting,
  circuitBreaker,
  ProviderCircuitBreaker,
  runWithAbortTimeout,
  StreamThoughtFilter,
  extractJsonBlock,
  buildDeterministicAnswer,
  buildMedicationRefusal,
  buildClarificationAnswer,
  ApiKeyPool,
  isRateLimitError,
  llmChat,
  llmChatStream,
  llmJSON,
} from '../src/server/llm';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
    throw new Error(message);
  } else {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  }
}

async function runTests() {
  console.log('============================================================');
  console.log('  SehatAI — Milestone 4 (M4) LLM Failover & Safety Test Suite');
  console.log('============================================================\n');

  // ------------------------------------------------------------
  // Test 1: Google API Key Prefix Check
  // ------------------------------------------------------------
  console.log('[Test Group 1] Google API Key Validation');
  {
    const originalGeminiKey = process.env.GEMINI_API_KEY;
    const originalGoogleKey = process.env.GOOGLE_API_KEY;

    try {
      // 1.1 Accept AQ.* Google AI Studio key format
      resetClientsForTesting();
      process.env.GEMINI_API_KEY = 'AQ.DUMMY_AI_STUDIO_KEY_VALIDATION_TOKEN_M4';
      delete process.env.GOOGLE_API_KEY;
      const clientStudio = getGemini();
      assert(clientStudio !== null, 'getGemini() must accept AQ.* Google AI Studio keys');

      // 1.2 Accept AIzaSy standard GCP key format
      resetClientsForTesting();
      process.env.GEMINI_API_KEY = 'AIzaSy_MOCK_TEST_VALID_KEY_FORMAT_12345';
      const clientGcp = getGemini();
      assert(clientGcp !== null, 'getGemini() must accept AIzaSy* GCP keys');

      // 1.3 Reject placeholder key
      resetClientsForTesting();
      process.env.GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
      const clientPlaceholder = getGemini();
      assert(clientPlaceholder === null, 'getGemini() must reject placeholder keys');

      // 1.4 Reject empty key
      resetClientsForTesting();
      process.env.GEMINI_API_KEY = '   ';
      const clientEmpty = getGemini();
      assert(clientEmpty === null, 'getGemini() must reject empty keys');
    } finally {
      process.env.GEMINI_API_KEY = originalGeminiKey;
      process.env.GOOGLE_API_KEY = originalGoogleKey;
      resetClientsForTesting();
    }
  }

  // ------------------------------------------------------------
  // Test 2: In-Memory Circuit Breaker State Machine
  // ------------------------------------------------------------
  console.log('\n[Test Group 2] Circuit Breaker State Machine (CLOSED -> OPEN -> HALF_OPEN)');
  {
    const cb = new ProviderCircuitBreaker({
      failureThreshold: 2,
      defaultCooldownMs: 100, // 100ms for fast unit test
      rateLimitCooldownMs: 150,
    });

    // 2.1 Initial state should be CLOSED and available
    assert(cb.isAvailable('tier1_gemini') === true, 'Circuit should initially be available');
    assert(cb.getState('tier1_gemini').status === 'CLOSED', 'Circuit should start in CLOSED state');

    // 2.2 Recording success preserves CLOSED state
    cb.recordSuccess('tier1_gemini');
    assert(cb.getState('tier1_gemini').status === 'CLOSED', 'Success preserves CLOSED state');
    assert(cb.getState('tier1_gemini').totalSuccesses === 1, 'Total successes incremented');

    // 2.3 Single regular failure does not trip (threshold = 2)
    cb.recordFailure('tier1_gemini', new Error('Generic network timeout'));
    assert(cb.getState('tier1_gemini').status === 'CLOSED', 'Single failure below threshold stays CLOSED');
    assert(cb.getState('tier1_gemini').consecutiveFailures === 1, 'Consecutive failures = 1');
    assert(cb.isAvailable('tier1_gemini') === true, 'Still available after 1 failure');

    // 2.4 Second regular failure trips circuit to OPEN
    cb.recordFailure('tier1_gemini', new Error('Generic network timeout 2'));
    assert(cb.getState('tier1_gemini').status === 'OPEN', 'Consecutive failures >= threshold trips to OPEN');
    assert(cb.isAvailable('tier1_gemini') === false, 'isAvailable() returns false during OPEN (0ms failover)');

    // 2.5 Wait for cooldown -> transitions to HALF_OPEN
    await new Promise((r) => setTimeout(r, 120));
    assert(cb.isAvailable('tier1_gemini') === true, 'isAvailable() transitions to HALF_OPEN after cooldown');
    assert(cb.getState('tier1_gemini').status === 'HALF_OPEN', 'State is HALF_OPEN');

    // 2.6 Success in HALF_OPEN resets to CLOSED
    cb.recordSuccess('tier1_gemini');
    assert(cb.getState('tier1_gemini').status === 'CLOSED', 'Success in HALF_OPEN resets to CLOSED');
    assert(cb.getState('tier1_gemini').consecutiveFailures === 0, 'Consecutive failures reset to 0');

    // 2.7 429 Rate Limit error trips IMMEDIATELY on first error
    cb.recordFailure('tier2_groq', { status: 429, message: 'Rate limit exceeded: 429 Too Many Requests' });
    assert(cb.getState('tier2_groq').status === 'OPEN', '429 Rate Limit trips immediately to OPEN');
    assert(cb.isAvailable('tier2_groq') === false, 'Tier 2 unavailable in 0ms');
  }

  // ------------------------------------------------------------
  // Test 3: AbortController-Backed Timeout Execution
  // ------------------------------------------------------------
  console.log('\n[Test Group 3] AbortController-Backed Timeout & Signal Propagation');
  {
    // 3.1 Fast promise completes successfully
    const val = await runWithAbortTimeout(
      async () => 'fast result',
      500,
      'fastTest',
    );
    assert(val === 'fast result', 'runWithAbortTimeout completes fast operations');

    // 3.2 Timed-out operation aborts and throws timeout error
    let signalAborted: boolean = false;
    let timedOutError: boolean = false;
    try {
      await runWithAbortTimeout(
        async (signal) => {
          signal.addEventListener('abort', () => {
            signalAborted = true;
          });
          await new Promise((r) => setTimeout(r, 200));
          return 'should not return';
        },
        50,
        'timeoutTest',
      );
    } catch (err: any) {
      if (err.message.includes('timed out after 50ms')) {
        timedOutError = true;
      }
    }
    assert(timedOutError === true, 'runWithAbortTimeout rejects with explicit timeout message');
    assert(signalAborted === true, 'runWithAbortTimeout invokes signal.abort() to cancel network connections');

    // 3.3 Parent AbortSignal cancels operation immediately
    const parentController = new AbortController();
    let parentAborted: boolean = false;
    try {
      const promise = runWithAbortTimeout(
        async (signal) => {
          signal.addEventListener('abort', () => {
            parentAborted = true;
          });
          await new Promise((r) => setTimeout(r, 500));
          return 'ok';
        },
        1000,
        'parentAbortTest',
        parentController.signal,
      );
      setTimeout(() => parentController.abort(), 30);
      await promise;
    } catch {
      // Expected rejection on abort
    }
    assert(parentAborted === true, 'Parent AbortSignal immediately aborts inner controller');
  }

  // ------------------------------------------------------------
  // Test 4: StreamThoughtFilter (<think>...</think>)
  // ------------------------------------------------------------
  console.log('\n[Test Group 4] Stream Thought Filter (Chunk Split Boundaries)');
  {
    const filter = new StreamThoughtFilter();

    // 4.1 Process thought split across chunks
    const chunk1 = 'Here is ';
    const chunk2 = 'the <thi';
    const chunk3 = 'nk>internal reasoning process</thi';
    const chunk4 = 'nk>answer to your question.';

    const out1 = filter.processChunk(chunk1);
    const out2 = filter.processChunk(chunk2);
    const out3 = filter.processChunk(chunk3);
    const out4 = filter.processChunk(chunk4);
    const final = out1 + out2 + out3 + out4 + filter.flush();

    assert(
      final === 'Here is the answer to your question.',
      `Thought tags should be completely stripped across split chunks. Got: "${final}"`,
    );
    assert(!final.includes('<think>'), 'Zero <think> tags leaked');
    assert(!final.includes('internal reasoning'), 'Zero thought tokens leaked');
  }

  // ------------------------------------------------------------
  // Test 5: Structured JSON Block Extraction
  // ------------------------------------------------------------
  console.log('\n[Test Group 5] extractJsonBlock Parsing');
  {
    // 5.1 Clean JSON
    const clean = '{"symptoms":["fever","cough"],"durationDays":3}';
    const out1 = extractJsonBlock(clean);
    assert(out1 === clean, 'Extracts clean JSON directly');

    // 5.2 Markdown fences
    const fenced = '```json\n{\n  "triage": "ROUTINE",\n  "escalate": false\n}\n```';
    const out2 = extractJsonBlock(fenced);
    assert(out2 !== null && JSON.parse(out2).triage === 'ROUTINE', 'Extracts JSON from markdown fences');

    // 5.3 Surrounding conversational noise
    const noisy = 'Here is the structured analysis:\n{"confidence":0.95}\nHope this helps!';
    const out3 = extractJsonBlock(noisy);
    assert(out3 === '{"confidence":0.95}', 'Extracts JSON embedded in conversational prose');
  }

  // ------------------------------------------------------------
  // Test 6: Tier 3 Deterministic Offline Safety Engine Helpers
  // ------------------------------------------------------------
  console.log('\n[Test Group 6] Tier 3 Deterministic Offline Safety Engine');
  {
    // 6.1 Deterministic Answer
    const mockHit = {
      item: {
        id: 'fever-home-care',
        title: { en: 'Fever Home Care', ur: 'بخار کی دیکھ بھال', roman: 'Bukhar ki dekh bhal' },
        content: { en: 'Drink fluids and rest.', ur: 'پانی پیئیں اور آرام کریں۔', roman: 'Pani piyein aur araam karein.' },
        source: { title: 'WHO Guideline', publisher: 'WHO', url: 'https://www.who.int', license: 'CC-BY', verifiedAt: '2026-01-01' },
        tags: ['fever'],
        baseLevel: 'SELF_CARE' as const,
      },
      score: 3,
    };

    const detAns = buildDeterministicAnswer([mockHit as any], 'en', 'connection');
    assert(detAns.content.includes('Fever Home Care'), 'Deterministic answer includes verified topic title');
    assert(detAns.content.includes('Drink fluids and rest.'), 'Deterministic answer includes verified content');
    assert(detAns.citations.length === 1 && detAns.citations[0].id === 'fever-home-care', 'Deterministic citations attached');

    // 6.2 Deterministic Answer for newly added clinical topics
    const mockHemorrhoidsHit = {
      item: {
        id: 'hemorrhoids-piles',
        title: { en: 'Piles & hemorrhoids (bawaseer)', ur: 'بواسیر اور مقعد کی سوزش', roman: 'Bawaseer (hemorrhoids)' },
        content: { en: 'High fiber diet and sitz bath.', ur: 'فائبر غذا اور گرم پانی۔', roman: 'Fiber ghiza aur garam paani.' },
        source: { title: 'WHO Guideline', publisher: 'WHO', url: 'https://www.who.int', license: 'CC-BY', verifiedAt: '2026-01-01' },
        tags: ['bawaseer', 'piles'],
        baseLevel: 'SELF_CARE' as const,
      },
      score: 4,
    };
    const detHemorrhoids = buildDeterministicAnswer([mockHemorrhoidsHit as any], 'roman', 'connection');
    assert(detHemorrhoids.content.includes('Bawaseer'), 'Deterministic answer includes Bawaseer title in Roman Urdu');
    assert(detHemorrhoids.citations[0].id === 'hemorrhoids-piles', 'Bawaseer citations attached');

    // 6.3 Medication Refusal
    const medRef = buildMedicationRefusal(['amoxicillin', 'brufen'], 'en');
    assert(medRef.content.includes('amoxicillin, brufen'), 'Refusal lists specific requested drugs');
    assert(medRef.content.includes('doctor or pharmacist'), 'Refusal directs to licensed professional');

    // 6.4 Clarification Answer
    const clarifyAns = buildClarificationAnswer(['vague_distress'], 'en');
    assert(clarifyAns.includes('I want to help you safely'), 'Clarification header present');
    assert(clarifyAns.includes('1122'), 'Clarification emergency footer present');
  }

  // ------------------------------------------------------------
  // Test 7: Multi-Provider Failover Cascade Behavior
  // ------------------------------------------------------------
  console.log('\n[Test Group 7] Multi-Provider Failover Cascade');
  {
    // Test that when providers are disabled/offline, functions safely return null without throwing
    resetClientsForTesting();
    process.env.GEMINI_API_KEY = 'invalid-test-key-0000';
    process.env.GROQ_API_KEY = 'invalid-test-key-0000';

    // Trip circuits to simulate total provider outage
    circuitBreaker.forceState('tier1_gemini', 'OPEN', 60000);
    circuitBreaker.forceState('tier2_groq', 'OPEN', 60000);
    circuitBreaker.forceState('tier_zai', 'OPEN', 60000);

    const chatResult = await llmChat([{ role: 'user', content: 'test query' }], { timeoutMs: 100 });
    assert(chatResult === null, 'llmChat safely returns null when providers are tripped');

    const streamResult = await llmChatStream([{ role: 'user', content: 'test stream' }], () => {}, { timeoutMs: 100 });
    assert(streamResult === null, 'llmChatStream safely returns null when providers are tripped');

    const jsonResult = await llmJSON('system prompt', 'user prompt', { timeoutMs: 100 });
    assert(jsonResult === null, 'llmJSON safely returns null when providers are tripped');
  }

  // ------------------------------------------------------------
  // Test 8: Multi-Key Pool & 429 Rotation Manager
  // ------------------------------------------------------------
  console.log('\n[Test Group 8] Multi-Key Pool & 429 Rotation Manager');
  {
    const originalGeminiKey = process.env.GEMINI_API_KEY;
    const originalGeminiKeys = process.env.GEMINI_API_KEYS;
    const originalGeminiKey1 = process.env.GEMINI_API_KEY_1;
    const originalGeminiKey2 = process.env.GEMINI_API_KEY_2;

    try {
      process.env.GEMINI_API_KEY = '';
      process.env.GEMINI_API_KEYS = 'AIzaSyKeyA123456789,AIzaSyKeyB123456789';
      process.env.GEMINI_API_KEY_1 = 'AIzaSyKeyC123456789';
      process.env.GEMINI_API_KEY_2 = 'AIzaSyKeyD123456789';

      const pool = new ApiKeyPool('GeminiTest', ['GEMINI_API_KEY', 'GEMINI_API_KEYS']);
      assert(pool.hasKeys(), 'ApiKeyPool successfully loads configured keys');
      assert(pool.getAllKeys().length === 4, `ApiKeyPool deduplicates and loads 4 keys (got ${pool.getAllKeys().length})`);
      assert(pool.getAvailableKeys().length === 4, 'All 4 keys initially available');

      // Test 429 cooldown rotation
      pool.markRateLimited('AIzaSyKeyA123456789', 5000);
      assert(pool.getAvailableKeys().length === 3, 'Available keys decremented to 3 after rate limit');
      assert(!pool.getAvailableKeys().includes('AIzaSyKeyA123456789'), 'Rate-limited key excluded from available pool');
      assert(pool.getAvailableKeys().includes('AIzaSyKeyB123456789'), 'Available pool contains backup key B');

      // Test rate limit error detector
      assert(isRateLimitError(new Error('429 Too Many Requests')), 'isRateLimitError detects HTTP 429');
      assert(isRateLimitError(new Error('Quota exceeded for metric')), 'isRateLimitError detects Quota exceeded');
      assert(isRateLimitError(new Error('RESOURCE_EXHAUSTED')), 'isRateLimitError detects RESOURCE_EXHAUSTED');
      assert(!isRateLimitError(new Error('Invalid JSON payload')), 'isRateLimitError ignores non-quota errors');

      // Test reset
      pool.reset();
      assert(pool.getAvailableKeys().length === 4, 'Reset restores all keys to available pool');
    } finally {
      process.env.GEMINI_API_KEY = originalGeminiKey;
      process.env.GEMINI_API_KEYS = originalGeminiKeys;
      process.env.GEMINI_API_KEY_1 = originalGeminiKey1;
      process.env.GEMINI_API_KEY_2 = originalGeminiKey2;
    }
  }

  console.log('\n============================================================');
  console.log(`  M4 TEST SUITE SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
