// Care Connect §31 — clinical handoff endpoints (doctor-facing).
// GET: generate (if missing) and return the labeled handoff draft.
// POST: doctor accepts / edits / rejects — provenance preserved.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authorizeConsultationAccess, CareAuthzError } from '@/lib/care/care-auth';
import { generateHandoff, reviewHandoff } from '@/server/care/handoff-service';
import { auditCare } from '@/server/care/audit';
export const runtime = 'nodejs';

function err(e: unknown) {
  if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
  const msg = e instanceof Error ? e.message : 'ERROR';
  const status = msg === 'INTAKE_REQUIRED' || msg === 'HANDOFF_NOT_FOUND' ? 404 : 500;
  return NextResponse.json({ error: msg }, { status });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { access } = await authorizeConsultationAccess(id, 'handoff.review');
    if (access.kind !== 'participant' || access.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'DOCTOR_ONLY' }, { status: 403 });
    }
    const { handoff, content } = await generateHandoff(id);
    return NextResponse.json({
      handoff: {
        id: handoff.id,
        status: handoff.status,
        label: handoff.label, // "AI-GENERATED — REVIEW REQUIRED" (§31)
        content,
        reviewedAt: handoff.reviewedAt,
      },
    });
  } catch (e) {
    return err(e);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { access } = await authorizeConsultationAccess(id, 'handoff.review');
    if (access.kind !== 'participant' || access.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'DOCTOR_ONLY' }, { status: 403 });
    }
    const body = await req.json();
    const action = String(body.action ?? '').toUpperCase();
    if (!['ACCEPT', 'EDIT', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'INVALID_ACTION' }, { status: 400 });
    }
    const handoff = await reviewHandoff({
      consultationId: id,
      doctorUserId: access.session.id,
      action: action as 'ACCEPT' | 'EDIT' | 'REJECT',
      editedContent: typeof body.editedContent === 'object' && body.editedContent != null
        ? (body.editedContent as Record<string, unknown>)
        : undefined,
    });
    await auditCare({
      actorId: access.session.id, actorRole: 'DOCTOR', action: `handoff.${action.toLowerCase()}`,
      consultationId: id, detail: { handoffId: handoff.id },
    });
    return NextResponse.json({ handoff: { id: handoff.id, status: handoff.status } });
  } catch (e) {
    return err(e);
  }
}
