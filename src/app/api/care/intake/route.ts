// Care Connect §30 — pre-consultation AI intake.
// Runs the EXISTING pipeline (emergency detection FIRST — §85). The
// result feeds the AI clinical handoff for the doctor (§31).
import { NextRequest, NextResponse } from 'next/server';
import { getCareSession, CareAuthzError } from '@/lib/care/care-auth';
import { db } from '@/lib/db';
import { runIntake, type IntakeInput } from '@/server/care/handoff-service';
import { rateLimit, RATE_LIMITS } from '@/lib/care/rate-limit';
import { auditCare } from '@/server/care/audit';
export const runtime = 'nodejs';

function err(e: unknown) {
  if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : 'ERROR' }, { status: 500 });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCareSession();
    if (!session) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    const rl = await rateLimit(`care-intake:${session.id}`, RATE_LIMITS.aiEndpoints.limit, RATE_LIMITS.aiEndpoints.windowSeconds);
    if (!rl.allowed) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });

    const body = await req.json();
    const consultationId = String(body.consultationId ?? '');
    if (!consultationId || !body.chiefComplaint) {
      return NextResponse.json({ error: 'CONSULTATION_AND_CHIEF_COMPLAINT_REQUIRED' }, { status: 400 });
    }
    const consultation = await db.consultation.findUnique({ where: { id: consultationId }, select: { patientId: true, doctorUserId: true } });
    if (!consultation) return NextResponse.json({ error: 'CONSULTATION_NOT_FOUND' }, { status: 404 });
    if (consultation.patientId !== session.id) {
      return NextResponse.json({ error: 'ONLY_PATIENT_SUBMITS_INTAKE' }, { status: 403 });
    }

    const intake: IntakeInput = {
      consultationId,
      chiefComplaint: String(body.chiefComplaint),
      symptoms: Array.isArray(body.symptoms) ? body.symptoms.map(String).slice(0, 20) : undefined,
      durationDays: body.durationDays != null ? Math.min(3650, Math.max(0, Number(body.durationDays))) : undefined,
      severity: body.severity != null ? Math.min(5, Math.max(1, Number(body.severity))) : undefined,
      conditions: Array.isArray(body.conditions) ? body.conditions.map(String).slice(0, 30) : undefined,
      medications: Array.isArray(body.medications) ? body.medications.map(String).slice(0, 30) : undefined,
      allergies: Array.isArray(body.allergies) ? body.allergies.map(String).slice(0, 30) : undefined,
      pregnant: typeof body.pregnant === 'boolean' ? body.pregnant : undefined,
      ageBand: body.ageBand ? String(body.ageBand) : undefined,
      previousTreatment: body.previousTreatment ? String(body.previousTreatment) : undefined,
      questions: body.questions ? String(body.questions) : undefined,
    };

    const { emergency, intake: saved } = await runIntake({ intake, userId: session.id });
    await auditCare({ actorId: session.id, actorRole: 'PATIENT', action: 'intake.submitted', consultationId, detail: { emergency } });

    // §85 — emergency blocks the paid funnel; instructions rendered by UI.
    return NextResponse.json({
      intake: { id: saved.id, triageLevel: saved.triageLevel, emergency },
      emergency,
      message: emergency
        ? 'Emergency signs detected. SehatAI shows emergency instructions first — no booking needed.'
        : 'Intake recorded and prepared for the doctor.',
    }, { status: emergency ? 200 : 201 });
  } catch (e) {
    return err(e);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getCareSession();
    if (!session) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    const consultationId = new URL(req.url).searchParams.get('consultationId') ?? '';
    const consultation = await db.consultation.findUnique({ where: { id: consultationId }, select: { patientId: true, doctorUserId: true } });
    if (!consultation) return NextResponse.json({ error: 'CONSULTATION_NOT_FOUND' }, { status: 404 });
    if (consultation.patientId !== session.id && consultation.doctorUserId !== session.id) {
      return NextResponse.json({ error: 'NOT_A_PARTICIPANT' }, { status: 403 });
    }
    const intake = await db.clinicalIntake.findUnique({ where: { consultationId } });
    return NextResponse.json({ intake });
  } catch (e) {
    return err(e);
  }
}
