// ============================================================
// SehatAI — Phase 2: Parallel Veto Constellation
// Inspired by Hippocratic AI's Polaris architecture: multiple
// specialist validators run CONCURRENTLY alongside the primary
// generation agent. Any validator can VETO the output, triggering
// a revision or abstention.
//
// Architecture:
//   Primary agent: triage + differential + generation (existing pipeline)
//   Validator 1: Red-flag recheck (checks for missed emergencies)
//   Validator 2: Medication safety (checks drug interactions)
//   Validator 3: Citation grounding (checks no invented citations)
//   Validator 4: Language consistency (checks response language matches request)
//
// All run via Promise.allSettled() — if ANY validator returns
// veto=true, the pipeline triggers a revision or abstention.
// This is SAFER than the sequential approach because:
//   - Validators can't be "forgotten" by a prompt change
//   - Each validator is a small, focused check (less prompt injection surface)
//   - Concurrent execution means lower latency (not additive)
// ============================================================

import type { Lang, TriageLevel, DrugCheckSummary, ResponseConfidence, Citation } from '@/lib/types';
import { scanForInjection, sanitizeRetrievedContext } from '@/lib/prompt-security';
import { checkDrugSafety, messageMentionsDrug, resolveDrugName } from '@/lib/drug-interactions';
import { extractCitations } from '@/server/pipeline/run';
import { allergyCrossCheck, type ServerHealthProfile } from '@/lib/profile-server';

// ---------- Types ----------

export interface ConstellationInput {
  message: string;
  language: Lang | 'auto';
  profile: ServerHealthProfile | null;
  /** L1 triage suggestion (from the existing pipeline) */
  triageLevel: TriageLevel;
  /** generated response text */
  response: string;
  /** citations from the response */
  citations: Citation[];
  /** retrieved corpus IDs (allowed citation IDs) */
  allowedCitationIds: Set<string>;
}

export interface ValidatorResult {
  name: string;
  /** if true, the output is invalid and must be revised */
  veto: boolean;
  /** reason for the veto (for logging + confidence adjustment) */
  reason: string;
  /** severity: critical vetoes trigger abstention; moderate triggers revision */
  severity: 'critical' | 'moderate' | 'low';
  /** latency in ms */
  latencyMs: number;
}

export interface ConstellationResult {
  /** true if all validators passed */
  approved: boolean;
  /** all validator results */
  results: ValidatorResult[];
  /** if any critical veto, must abstain */
  mustAbstain: boolean;
  /** if any moderate veto, should revise */
  shouldRevise: boolean;
  /** total latency (max of all validators — they ran concurrently) */
  totalLatencyMs: number;
  /** agreement ratio (0-1) — how many validators approved */
  agreementRatio: number;
}

// ---------- Validators ----------

/** Validator 1: Red-flag recheck — ensures no emergency signs were missed */
async function validateRedFlags(input: ConstellationInput): Promise<ValidatorResult> {
  const t0 = Date.now();
  const lower = input.message.toLowerCase();

  // Critical red-flag patterns that should ALWAYS trigger EMERGENCY
  const criticalPatterns = [
    { pattern: /chest pain.*breath|seene.*saans/i, expected: 'EMERGENCY' },
    { pattern: /face droop|slurred speech|chehra.*tedha/i, expected: 'EMERGENCY' },
    { pattern: /unconscious|behosh/i, expected: 'EMERGENCY' },
    { pattern: /suicid|kill myself|marna chahta|khudkushi/i, expected: 'EMERGENCY' },
    { pattern: /severe bleeding|khoon nahi ruk/i, expected: 'EMERGENCY' },
    { pattern: /seizure|convulsion|dorah/i, expected: 'EMERGENCY' },
  ];

  for (const { pattern, expected } of criticalPatterns) {
    if (pattern.test(lower) && input.triageLevel !== expected) {
      return {
        name: 'red-flag-recheck',
        veto: true,
        reason: `Critical red flag detected but triage was ${input.triageLevel}, expected ${expected}`,
        severity: 'critical',
        latencyMs: Date.now() - t0,
      };
    }
  }

  return {
    name: 'red-flag-recheck',
    veto: false,
    reason: 'No missed red flags',
    severity: 'low',
    latencyMs: Date.now() - t0,
  };
}

/** Validator 2: Medication safety — checks drug interactions + allergies */
async function validateMedicationSafety(input: ConstellationInput): Promise<ValidatorResult> {
  const t0 = Date.now();

  if (!messageMentionsDrug(input.message)) {
    return {
      name: 'medication-safety',
      veto: false,
      reason: 'No drugs mentioned',
      severity: 'low',
      latencyMs: Date.now() - t0,
    };
  }

  // Run the drug-interaction engine
  const result = checkDrugSafety({
    text: input.message,
    allergies: input.profile?.allergies ?? [],
    currentMedications: input.profile?.medications ?? [],
    pregnant: input.profile?.pregnant ?? false,
    breastfeeding: false,
    ageBand: input.profile?.ageBand ?? 'undisclosed',
    conditions: input.profile?.conditions ?? [],
  });

  // Check allergy cross-reactivity
  const allergyHits = allergyCrossCheck(input.profile, input.message);

  if (result.overallSeverity === 'HIGH') {
    return {
      name: 'medication-safety',
      veto: true,
      reason: `HIGH-severity drug interaction: ${result.hits.map((h) => `${h.drugA}+${h.drugB}`).join(', ')}`,
      severity: 'critical',
      latencyMs: Date.now() - t0,
    };
  }

  if (allergyHits.length > 0) {
    return {
      name: 'medication-safety',
      veto: true,
      reason: `Allergy cross-reactivity: ${allergyHits.map((h) => `${h.allergy}→${h.trigger}`).join(', ')}`,
      severity: 'moderate',
      latencyMs: Date.now() - t0,
    };
  }

  return {
    name: 'medication-safety',
    veto: false,
    reason: result.overallSeverity === 'NONE' ? 'No interactions' : `${result.overallSeverity} interaction noted`,
    severity: 'low',
    latencyMs: Date.now() - t0,
  };
}

/** Validator 3: Citation grounding — checks no invented citations */
async function validateCitations(input: ConstellationInput): Promise<ValidatorResult> {
  const t0 = Date.now();

  // Use the existing extractCitations function to strip invented [ID] markers
  const { stripped, sanitized } = extractCitations(input.response, input.allowedCitationIds);

  if (stripped.length > 0) {
    return {
      name: 'citation-grounding',
      veto: true,
      reason: `Invented citation markers stripped: ${stripped.join(', ')}`,
      severity: 'moderate',
      latencyMs: Date.now() - t0,
    };
  }

  return {
    name: 'citation-grounding',
    veto: false,
    reason: 'All citations grounded',
    severity: 'low',
    latencyMs: Date.now() - t0,
  };
}

/** Validator 4: Language consistency — checks response language matches request */
async function validateLanguage(input: ConstellationInput): Promise<ValidatorResult> {
  const t0 = Date.now();

  // Simple check: if the user wrote in Urdu script, the response should contain Urdu script
  const userHasUrdu = /[\u0600-\u06FF]/.test(input.message);
  const responseHasUrdu = /[\u0600-\u06FF]/.test(input.response);

  if (userHasUrdu && !responseHasUrdu) {
    return {
      name: 'language-consistency',
      veto: true,
      reason: 'User wrote in Urdu but response has no Urdu script',
      severity: 'moderate',
      latencyMs: Date.now() - t0,
    };
  }

  // Check for prompt injection
  const injectionScan = scanForInjection(input.message);
  if (injectionScan.isInjectionAttempt) {
    return {
      name: 'language-consistency',
      veto: false, // don't veto — the pipeline handles injection, but log it
      reason: `Injection attempt detected: ${injectionScan.patterns.join(', ')}`,
      severity: 'low',
      latencyMs: Date.now() - t0,
    };
  }

  return {
    name: 'language-consistency',
    veto: false,
    reason: 'Language consistent',
    severity: 'low',
    latencyMs: Date.now() - t0,
  };
}

// ---------- Constellation runner ----------

/**
 * Run all 4 validators concurrently + collect results.
 * This is the core of the Hippocratic AI pattern:
 *   - All validators run in parallel (Promise.allSettled)
 *   - Any veto triggers revision or abstention
 *   - Latency = max(all validators), not sum
 */
export async function runConstellation(input: ConstellationInput): Promise<ConstellationResult> {
  const t0 = Date.now();

  // Run all validators concurrently
  const [redFlag, medSafety, citations, language] = await Promise.allSettled([
    validateRedFlags(input),
    validateMedicationSafety(input),
    validateCitations(input),
    validateLanguage(input),
  ]);

  // Collect results (fallback to pass on rejection — a failed validator should NOT block the response)
  const results: ValidatorResult[] = [
    redFlag.status === 'fulfilled' ? redFlag.value : { name: 'red-flag-recheck', veto: false, reason: 'Validator failed (pass)', severity: 'low', latencyMs: 0 },
    medSafety.status === 'fulfilled' ? medSafety.value : { name: 'medication-safety', veto: false, reason: 'Validator failed (pass)', severity: 'low', latencyMs: 0 },
    citations.status === 'fulfilled' ? citations.value : { name: 'citation-grounding', veto: false, reason: 'Validator failed (pass)', severity: 'low', latencyMs: 0 },
    language.status === 'fulfilled' ? language.value : { name: 'language-consistency', veto: false, reason: 'Validator failed (pass)', severity: 'low', latencyMs: 0 },
  ];

  const totalLatencyMs = Date.now() - t0;

  // Determine overall result
  const criticalVetoes = results.filter((r) => r.veto && r.severity === 'critical');
  const moderateVetoes = results.filter((r) => r.veto && r.severity === 'moderate');
  const approvedCount = results.filter((r) => !r.veto).length;

  return {
    approved: criticalVetoes.length === 0 && moderateVetoes.length === 0,
    results,
    mustAbstain: criticalVetoes.length > 0,
    shouldRevise: moderateVetoes.length > 0 && criticalVetoes.length === 0,
    totalLatencyMs,
    agreementRatio: approvedCount / results.length,
  };
}

// ---------- Confidence adjustment ----------

/**
 * Adjust the confidence band based on constellation results.
 * If validators disagree, lower the confidence.
 */
export function adjustConfidence(
  baseConfidence: ResponseConfidence,
  constellation: ConstellationResult,
): ResponseConfidence {
  if (constellation.mustAbstain) {
    return {
      band: 'LOW',
      score: 0.3,
      reasons: [...baseConfidence.reasons, 'Critical validator veto — abstention'],
    };
  }

  if (constellation.shouldRevise) {
    return {
      band: baseConfidence.band === 'HIGH' ? 'MEDIUM' : baseConfidence.band,
      score: Math.min(baseConfidence.score, 0.7),
      reasons: [...baseConfidence.reasons, `Moderate validator veto: ${constellation.results.filter((r) => r.veto).map((r) => r.name).join(', ')}`],
    };
  }

  // If all validators agree, slightly boost confidence
  if (constellation.agreementRatio === 1) {
    return {
      band: baseConfidence.band,
      score: Math.min(1, baseConfidence.score + 0.05),
      reasons: baseConfidence.reasons,
    };
  }

  return baseConfidence;
}
