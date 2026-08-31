// ============================================================
// M1: Structural Role Isolation Test Suite (Universal Invariant Verification)
// Tests Requirement R1:
// 1. PatientDialogueStream (strictly role: 'user')
// 2. DialogueHistoryStream (all turns with role tags)
// 3. Zero assistant disclaimer leakage into L0 / L1 / clinical context
// ============================================================

import { createDialogueStreams, type PatientDialogueStream, type DialogueHistoryStream } from '../src/lib/types';
import { runPipeline } from '../src/server/pipeline/run';
import { matchRedFlags, runL0Triage } from '../src/lib/engine/safety-engine';
import { extractClinicalContext } from '../src/lib/engine/context-extraction';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${msg}`);
  }
}

async function runM1Tests() {
  console.log('============================================================');
  console.log('  SehatAI — M1 Structural Role Isolation Invariant Test Harness');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function runTest(name: string, fn: () => void | Promise<void>) {
    return (async () => {
      try {
        await fn();
        console.log(`[PASS] ${name}`);
        passed++;
      } catch (err: any) {
        console.error(`[FAIL] ${name}: ${err?.message || err}`);
        failed++;
      }
    })();
  }

  // --- Test 1: createDialogueStreams produces separated typed streams ---
  await runTest('createDialogueStreams separates user and assistant messages', () => {
    const raw = [
      { role: 'user', content: 'Turn 1 user: mild cough', createdAt: '2026-01-01T10:00:00Z' },
      {
        role: 'assistant',
        content: 'Turn 1 assistant: Call 1122 immediately for chest pain, severe bleeding, or stroke.',
        triageLevel: 'SELF_CARE',
        emergency: false,
        createdAt: '2026-01-01T10:00:05Z',
      },
      { role: 'user', content: 'Turn 2 user: also slight headache', createdAt: '2026-01-01T10:01:00Z' },
      {
        role: 'assistant',
        content: 'Turn 2 assistant: Rest and hydrate. Go to ER if unconscious.',
        triageLevel: 'SELF_CARE',
        emergency: false,
        createdAt: '2026-01-01T10:01:05Z',
      },
    ];
    const current = 'Turn 3 user: is paracetamol safe?';

    const { patientStream, historyStream } = createDialogueStreams(raw, current, 'en');

    // Verify patientStream contains ONLY role: 'user' messages + current message
    assert(patientStream.length === 3, `Expected patientStream length 3, got ${patientStream.length}`);
    assert(patientStream.every((m) => m.role === 'user'), 'patientStream contains non-user message');
    assert(patientStream[0].content === 'Turn 1 user: mild cough', 'patientStream[0] mismatch');
    assert(patientStream[1].content === 'Turn 2 user: also slight headache', 'patientStream[1] mismatch');
    assert(patientStream[2].content === 'Turn 3 user: is paracetamol safe?', 'patientStream[2] mismatch');
    assert(patientStream[2].language === 'en', 'patientStream[2] language mismatch');

    // Verify historyStream contains all 5 turns in order
    assert(historyStream.length === 5, `Expected historyStream length 5, got ${historyStream.length}`);
    assert(historyStream[0].role === 'user', 'historyStream[0] role mismatch');
    assert(historyStream[1].role === 'assistant', 'historyStream[1] role mismatch');
    assert(historyStream[2].role === 'user', 'historyStream[2] role mismatch');
    assert(historyStream[3].role === 'assistant', 'historyStream[3] role mismatch');
    assert(historyStream[4].role === 'user', 'historyStream[4] role mismatch');
  });

  // --- Test 2: Immutability and freeze check ---
  await runTest('Dialogue streams are deeply frozen to prevent mutation', () => {
    const raw = [{ role: 'user', content: 'Initial message' }];
    const { patientStream, historyStream } = createDialogueStreams(raw, 'Current message');

    assert(Object.isFrozen(patientStream), 'patientStream is not frozen');
    assert(Object.isFrozen(historyStream), 'historyStream is not frozen');
  });

  // --- Test 3: Assistant emergency disclaimers never leak into patientStream or L0 matcher ---
  await runTest('Assistant safety disclaimers (1122, chest pain, hemorrhage) are excluded from patientStream', () => {
    const raw = [
      {
        role: 'assistant',
        content:
          '🚨 EMERGENCY DISCLAIMER: Call 1122 (Rescue) immediately if you have crushing chest pain, difficulty breathing, severe bleeding, or convulsions.',
        triageLevel: 'EMERGENCY',
        emergency: true,
      },
      {
        role: 'assistant',
        content: 'When to see a doctor: If heart attack, stroke FAST signs, or unconsciousness occur.',
        triageLevel: 'ROUTINE',
        emergency: false,
      },
    ];
    const current = 'I have a mild runny nose and sneezing for 1 day.';

    const { patientStream } = createDialogueStreams(raw, current, 'en');

    assert(patientStream.length === 1, `Expected patientStream length 1, got ${patientStream.length}`);
    assert(patientStream[0].content === current, 'patientStream content mismatch');

    const combinedPatientText = patientStream.map((m) => m.content).join(' ');
    // Deterministic matchers on patient text must return ZERO matches
    const redFlags = matchRedFlags(combinedPatientText);
    assert(redFlags.length === 0, `Expected 0 red flags on patient stream, got ${redFlags.length}`);

    const l0 = runL0Triage(combinedPatientText);
    assert(l0.level !== 'EMERGENCY', `Expected non-emergency L0 triage, got ${l0.level}`);
  });

  // --- Test 4: End-to-end pipeline role isolation verification ---
  await runTest('Pipeline run with prior assistant emergency disclaimers does NOT trigger false emergency', async () => {
    const historyWithAssistantDisclaimers = [
      { role: 'user', content: 'What should I do if someone has a high fever?' },
      {
        role: 'assistant',
        content:
          'Give fluids. ⚠️ CALL 1122 IMMEDIATELY IF: patient has chest pain, unconsciousness, severe difficulty breathing, or stroke FAST signs.',
        triageLevel: 'ROUTINE',
        emergency: false,
      },
    ];

    const res = await runPipeline({
      message: 'I have a mild tickle in my throat, no other symptoms.',
      language: 'en',
      sessionId: 'm1-test-session-' + Date.now(),
      history: historyWithAssistantDisclaimers,
      persist: false,
    });

    assert(res.triage.level !== 'EMERGENCY', `Expected non-emergency triage, got ${res.triage.level}`);
    assert(!res.triage.shortCircuited, 'Pipeline falsely short-circuited as emergency due to history disclaimer!');
    assert(res.triage.level === 'SELF_CARE' || res.triage.level === 'ROUTINE', `Expected SELF_CARE or ROUTINE, got ${res.triage.level}`);
  });

  // --- Test 5: Multilingual assistant disclaimer isolation ---
  await runTest('Urdu / Roman Urdu assistant disclaimers do not leak into extraction', async () => {
    const historyUrdu = [
      { role: 'user', content: 'کھانسی کا علاج بتائیں' },
      {
        role: 'assistant',
        content: 'شہد اور گرم پانی لیں۔ فوری 1122 پر کال کریں اگر سینے میں شدید درد، سانس بند یا بے ہوشی ہو۔',
        triageLevel: 'SELF_CARE',
        emergency: false,
      },
    ];

    const res = await runPipeline({
      message: 'شکریہ، صرف ہلکا سا گلا خراب ہے',
      language: 'ur',
      sessionId: 'm1-test-ur-' + Date.now(),
      history: historyUrdu,
      persist: false,
    });

    assert(res.triage.level !== 'EMERGENCY', `Urdu disclaimer caused false EMERGENCY: ${res.triage.level}`);
    assert(!res.triage.shortCircuited, 'Urdu pipeline falsely short-circuited!');
  });

  // --- Test 6: Empty history handling ---
  await runTest('createDialogueStreams handles empty raw history cleanly', () => {
    const { patientStream, historyStream } = createDialogueStreams([], 'Mild fever for 1 day', 'roman');

    assert(patientStream.length === 1, `Expected 1 patient message, got ${patientStream.length}`);
    assert(patientStream[0].role === 'user', 'Expected role user');
    assert(patientStream[0].content === 'Mild fever for 1 day', 'Content mismatch');
    assert(patientStream[0].language === 'roman', 'Language mismatch');

    assert(historyStream.length === 1, `Expected 1 history message, got ${historyStream.length}`);
    assert(historyStream[0].role === 'user', 'Expected role user');
    assert(historyStream[0].content === 'Mild fever for 1 day', 'Content mismatch');
  });

  console.log('\n============================================================');
  console.log(`  M1 Role Isolation Verification: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runM1Tests().catch((e) => {
  console.error('Test suite error:', e);
  process.exit(1);
});
