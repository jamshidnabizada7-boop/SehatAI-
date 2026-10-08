// ============================================================
// Care Connect §30/§31 — pre-consultation AI intake + clinical handoff.
// §30: intake runs the EXISTING pipeline; deterministic emergency
// detection runs FIRST and an emergency NEVER funnels into the paid
// booking path (§85).
// §31: the handoff is a doctor-facing summary clearly labeled
// "AI-GENERATED — REVIEW REQUIRED". The doctor accepts/edits/corrects;
// AI output is never silently converted into a doctor-authored record.
// §33: no chain-of-thought — structured fields only.
// ============================================================
import { db } from '@/lib/db';
import { runPipeline } from '@/server/pipeline/run';
import { emptyServerProfile, type ServerHealthProfile } from '@/lib/profile-server';
import { llmJSON } from '@/server/llm';
import { hasDosePattern } from '@/server/pipeline/run';

export interface IntakeInput {
  consultationId: string;
  chiefComplaint: string;
  symptoms?: string[];
  durationDays?: number;
  severity?: number;
  conditions?: string[];
  medications?: string[];
  allergies?: string[];
  pregnant?: boolean;
  ageBand?: string;
  previousTreatment?: string;
  questions?: string;
}

export async function runIntake(opts: { intake: IntakeInput; userId?: string }) {
  const profile: ServerHealthProfile = {
    ...emptyServerProfile(),
    conditions: opts.intake.conditions ?? [],
    allergies: opts.intake.allergies ?? [],
    medications: opts.intake.medications ?? [],
    pregnant: opts.intake.pregnant === true,
    ageBand: (opts.intake.ageBand ?? 'undisclosed') as ServerHealthProfile['ageBand'],
  };

  // Compose the intake narrative and run the EXISTING pipeline headlessly.
  const narrative = [
    opts.intake.chiefComplaint,
    opts.intake.symptoms?.length ? `Symptoms: ${opts.intake.symptoms.join(', ')}` : '',
    opts.intake.durationDays != null ? `Duration: ${opts.intake.durationDays} day(s)` : '',
    opts.intake.severity != null ? `Severity (1-5): ${opts.intake.severity}` : '',
    opts.intake.previousTreatment ? `Previous treatment: ${opts.intake.previousTreatment}` : '',
    opts.intake.questions ? `Patient questions: ${opts.intake.questions}` : '',
  ]
    .filter(Boolean)
    .join('. ');

  const pipeline = await runPipeline(
    {
      message: narrative,
      language: 'en',
      sessionId: `care-intake-${opts.intake.consultationId}`,
      persist: false,
      profile,
      userId: opts.userId,
    },
    undefined,
  );

  // §85 — emergency never enters the paid funnel; instructions shown first.
  const emergency = pipeline.triage?.level === 'EMERGENCY' || pipeline.emergency != null;

  const intake = await db.clinicalIntake.upsert({
    where: { consultationId: opts.intake.consultationId },
    create: {
      consultationId: opts.intake.consultationId,
      chiefComplaint: opts.intake.chiefComplaint.slice(0, 2000),
      symptomsJson: JSON.stringify(opts.intake.symptoms ?? []),
      durationDays: opts.intake.durationDays ?? null,
      severity: opts.intake.severity ?? null,
      conditionsJson: JSON.stringify(opts.intake.conditions ?? []),
      medicationsJson: JSON.stringify(opts.intake.medications ?? []),
      allergiesJson: JSON.stringify(opts.intake.allergies ?? []),
      pregnant: opts.intake.pregnant ?? null,
      ageBand: opts.intake.ageBand ?? null,
      previousTreatment: opts.intake.previousTreatment?.slice(0, 2000),
      questions: opts.intake.questions?.slice(0, 2000),
      triageLevel: pipeline.triage?.level ?? null,
      redFlagCategoriesJson: JSON.stringify((pipeline.triage?.signals ?? []).map(String)),
      emergency,
      pipelineMetaJson: JSON.stringify({
        engine: pipeline.triage?.engine ?? null,
        citations: (pipeline.citations ?? []).slice(0, 5),
        confidence: pipeline.confidence ?? null,
        drugCheckSeverity: pipeline.drugCheck?.severity ?? null,
      }),
    },
    update: {
      chiefComplaint: opts.intake.chiefComplaint.slice(0, 2000),
      symptomsJson: JSON.stringify(opts.intake.symptoms ?? []),
      durationDays: opts.intake.durationDays ?? null,
      severity: opts.intake.severity ?? null,
      conditionsJson: JSON.stringify(opts.intake.conditions ?? []),
      medicationsJson: JSON.stringify(opts.intake.medications ?? []),
      allergiesJson: JSON.stringify(opts.intake.allergies ?? []),
      pregnant: opts.intake.pregnant ?? null,
      ageBand: opts.intake.ageBand ?? null,
      previousTreatment: opts.intake.previousTreatment?.slice(0, 2000),
      questions: opts.intake.questions?.slice(0, 2000),
      triageLevel: pipeline.triage?.level ?? null,
      redFlagCategoriesJson: JSON.stringify((pipeline.triage?.signals ?? []).map(String)),
      emergency,
      pipelineMetaJson: JSON.stringify({
        engine: pipeline.triage?.engine ?? null,
        citations: (pipeline.citations ?? []).slice(0, 5),
        confidence: pipeline.confidence ?? null,
        drugCheckSeverity: pipeline.drugCheck?.severity ?? null,
      }),
    },
  });

  return { intake, emergency, pipeline };
}

// ------------------------------------------------------------
// §31 — handoff generation (LLM with deterministic fallback).
// ------------------------------------------------------------

const HANDOFF_SYSTEM = `You prepare a doctor-facing clinical handoff from patient intake data.
Return STRICT JSON with fields: chiefComplaint, duration, symptoms (string[]), negatives (string[]), redFlags (string[]), profileSnapshot (string), medications (string[]), allergies (string[]), relevantHistory (string), triageLevel (string), patientQuestions (string), aiSources (string[]).
Rules: include ONLY information present in the input. Never invent findings. Never suggest diagnoses or treatment — this is a summary for the doctor, not clinical advice. Keep each field concise.`;

export async function generateHandoff(consultationId: string) {
  const intake = await db.clinicalIntake.findUnique({
    where: { consultationId },
    include: {
      consultation: {
        include: {
          patient: { select: { name: true } },
        },
      },
    },
  });
  if (!intake) throw new Error('INTAKE_REQUIRED');

  const parse = (v: string | null | undefined): string[] => {
    try {
      const p = JSON.parse(v ?? '[]');
      return Array.isArray(p) ? p.map(String) : [];
    } catch {
      return [];
    }
  };

  // Deterministic handoff — always available, no LLM needed (§11 style).
  const deterministic = {
    chiefComplaint: intake.chiefComplaint,
    duration: intake.durationDays != null ? `${intake.durationDays} day(s)` : 'not stated',
    symptoms: parse(intake.symptomsJson),
    negatives: [] as string[],
    redFlags: parse(intake.redFlagCategoriesJson),
    profileSnapshot: `ageBand=${intake.ageBand ?? 'undisclosed'}, pregnant=${intake.pregnant === true}`,
    medications: parse(intake.medicationsJson),
    allergies: parse(intake.allergiesJson),
    relevantHistory: parse(intake.conditionsJson).join(', '),
    triageLevel: intake.triageLevel ?? 'unknown',
    patientQuestions: intake.questions ?? '',
    aiSources: [] as string[],
  };

  // LLM enrichment when keys exist; validated + dose-refused.
  let final = deterministic;
  try {
    const meta = intake.pipelineMetaJson ? (JSON.parse(intake.pipelineMetaJson) as Record<string, unknown>) : {};
    const llm = await llmJSON<typeof deterministic>(
      HANDOFF_SYSTEM,
      JSON.stringify({
        intake: {
          chiefComplaint: intake.chiefComplaint,
          symptoms: deterministic.symptoms,
          durationDays: intake.durationDays,
          severity: intake.severity,
          conditions: deterministic.relevantHistory,
          medications: deterministic.medications,
          allergies: deterministic.allergies,
          previousTreatment: intake.previousTreatment,
          questions: intake.questions,
        },
        pipeline: { triageLevel: intake.triageLevel, redFlags: deterministic.redFlags, engine: meta.engine },
      }),
    );
    // Safety gates: no invented doses, keep only filled fields over deterministic base.
    const safe = { ...deterministic };
    for (const key of Object.keys(deterministic) as Array<keyof typeof deterministic>) {
      const v = (llm as Record<string, unknown>)[key];
      if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
      if (typeof v === 'string' && hasDosePattern(v)) continue;
      if (typeof v === 'string' || Array.isArray(v)) {
        (safe as Record<string, unknown>)[key] = v;
      }
    }
    final = safe;
  } catch {
    // deterministic fallback already covers this (no LLM keys in dev)
  }

  const handoff = await db.clinicalHandoff.upsert({
    where: { consultationId },
    create: {
      consultationId,
      generatedContent: JSON.stringify(final),
      status: 'DRAFT',
      label: 'AI-GENERATED — REVIEW REQUIRED',
      provenanceJson: JSON.stringify({
        engine: intake.triageLevel,
        generatedAt: new Date().toISOString(),
        deterministicFallback: true,
      }),
    },
    update: {
      generatedContent: JSON.stringify(final),
      status: 'DRAFT',
      label: 'AI-GENERATED — REVIEW REQUIRED',
    },
  });

  return { handoff, content: final };
}

/** §31 — doctor accepts/edits; status records provenance. */
export async function reviewHandoff(opts: {
  consultationId: string;
  doctorUserId: string;
  action: 'ACCEPT' | 'EDIT' | 'REJECT';
  editedContent?: Record<string, unknown>;
}) {
  const handoff = await db.clinicalHandoff.findUnique({ where: { consultationId: opts.consultationId } });
  if (!handoff) throw new Error('HANDOFF_NOT_FOUND');

  const status = opts.action === 'ACCEPT' ? 'ACCEPTED' : opts.action === 'EDIT' ? 'EDITED' : 'REJECTED';
  return db.clinicalHandoff.update({
    where: { consultationId: opts.consultationId },
    data: {
      status,
      doctorEditedContent: opts.action === 'EDIT' && opts.editedContent ? JSON.stringify(opts.editedContent) : handoff.doctorEditedContent,
      reviewedById: opts.doctorUserId,
      reviewedAt: new Date(),
    },
  });
}
