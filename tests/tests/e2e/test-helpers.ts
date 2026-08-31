/**
 * SehatAI E2E Test Helpers & Mocks
 * 
 * Provides mock providers, SSE event capture utilities, multi-turn history builders,
 * and verification helpers for testing universal invariants.
 */

import type { PipelineInput, PipelineResult } from '../../src/server/pipeline/run';
import { runPipeline } from '../../src/server/pipeline/run';
import type { Lang, PipelineStage, TriageLevel, Citation } from '../../src/lib/types';
import { CORPUS } from '../../src/data/corpus';

export interface CapturedEvents {
  stages: PipelineStage[];
  events: { stage: PipelineStage; data: unknown }[];
  safetyData?: import('../../src/lib/types').SafetyStageData;
  languageData?: import('../../src/lib/types').LanguageStageData;
  triageData?: import('../../src/lib/types').TriageStageData;
  retrievalData?: import('../../src/lib/types').RetrievalStageData;
  generationDeltas: string[];
  validationData?: import('../../src/lib/types').ValidationStageData;
  emergencyData?: import('../../src/lib/types').EmergencyStageData;
  doneData?: import('../../src/lib/types').DoneStageData;
  errorData?: { message: string; fallbackContent: string };
}

/**
 * Executes runPipeline while capturing all emitted SSE events in real-time.
 */
export async function executePipelineWithCapture(
  input: PipelineInput
): Promise<{ result: PipelineResult; captured: CapturedEvents; durationMs: number }> {
  const captured: CapturedEvents = {
    stages: [],
    events: [],
    generationDeltas: [],
  };

  const tStart = Date.now();
  const result = await runPipeline(
    {
      ...input,
      persist: input.persist ?? false, // Default to ephemeral memory for tests
    },
    (stage, data) => {
      captured.stages.push(stage);
      captured.events.push({ stage, data });

      switch (stage) {
        case 'safety':
          captured.safetyData = data as any;
          break;
        case 'language':
          captured.languageData = data as any;
          break;
        case 'triage':
          captured.triageData = data as any;
          break;
        case 'retrieval':
          captured.retrievalData = data as any;
          break;
        case 'generation':
          if ((data as any)?.delta) {
            captured.generationDeltas.push((data as any).delta);
          }
          break;
        case 'validation':
          captured.validationData = data as any;
          break;
        case 'emergency':
          captured.emergencyData = data as any;
          break;
        case 'done':
          captured.doneData = data as any;
          break;
        case 'error':
          captured.errorData = data as any;
          break;
      }
    }
  );

  const durationMs = Date.now() - tStart;
  return { result, captured, durationMs };
}

/**
 * Creates a multi-turn conversation scenario.
 */
export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  emergency?: boolean;
  triageLevel?: TriageLevel;
}

/**
 * Simulates a realistic multi-turn interaction with full assistant warnings and disclaimers.
 */
export function buildMultiTurnDialogueWithDisclaimers(userComplaint: string, lang: Lang = 'en'): ConversationTurn[] {
  const disclaimerText = {
    en: 'IMPORTANT SAFETY WARNING: If you experience chest pain, severe difficulty breathing, sudden face drooping, slurred speech, heavy uncontrolled bleeding, or loss of consciousness, CALL 1122 IMMEDIATELY. Do not wait. This AI cannot replace emergency medical services.',
    ur: 'اہم ایمرجنسی انتباہ: اگر سینے میں شدید درد، سانس لینے میں شدید دقت، چہرے کا ٹیڑھا ہونا، زبان لڑکھڑانا، خون کا نہ رکنا، یا بے ہوشی ہو تو فوراً 1122 پر کال کریں۔',
    roman: 'Aham Emergency Warning: Agar seene mein shaded dard, saans lene mein takleef, chehra latakna, khoon na rukna, ya behoshi ho toh fori tor par 1122 par call karein.',
  };

  return [
    {
      role: 'user',
      content: 'Hello doctor, can you tell me what emergency signs I should watch out for?',
    },
    {
      role: 'assistant',
      content: disclaimerText[lang],
      emergency: true,
      triageLevel: 'EMERGENCY',
    },
    {
      role: 'user',
      content: userComplaint,
    },
  ];
}

/**
 * Asserts that a list of citations contains strictly verified corpus items and no fabricated sources.
 */
export function verifyCitationsGrounded(citations: Citation[]): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  const corpusIds = new Set(CORPUS.map((c) => c.id.toLowerCase()));

  for (const cit of citations) {
    if (!corpusIds.has(cit.id.toLowerCase())) {
      violations.push(`Citation ID "${cit.id}" does not exist in verified CORPUS.`);
    }
    if (!cit.publisher || cit.publisher.trim().length === 0) {
      violations.push(`Citation "${cit.id}" lacks publisher attribution.`);
    }
    if (!cit.url || !cit.url.startsWith('http')) {
      violations.push(`Citation "${cit.id}" has invalid or non-HTTP URL: "${cit.url}"`);
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * In-Memory Circuit Breaker Tester utility for simulating provider failures & 429s.
 */
export class MockCircuitBreaker {
  public state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  public consecutiveFailures = 0;
  public openUntil = 0;
  public readonly FAILURE_THRESHOLD = 2;
  public readonly COOLDOWN_MS = 30000;

  public isAvailable(): boolean {
    if (this.state === 'OPEN') {
      if (Date.now() > this.openUntil) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }
    return true;
  }

  public recordSuccess(): void {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
  }

  public recordFailure(is429 = false): void {
    this.consecutiveFailures++;
    if (is429 || this.consecutiveFailures >= this.FAILURE_THRESHOLD) {
      this.state = 'OPEN';
      this.openUntil = Date.now() + (is429 ? 45000 : this.COOLDOWN_MS);
    }
  }
}
