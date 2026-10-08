// Care Connect §50 — disputes (patient/doctor open; admin resolve).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authorizeConsultationAccess, CareAuthzError } from '@/lib/care/care-auth';
import { hasCapability } from '@/lib/care/rbac';
import { rateLimit, RATE_LIMITS } from '@/lib/care/rate-limit';
import { auditCare } from '@/server/care/audit';
export const runtime = 'nodejs';

const REASONS = new Set(['doctor_no_show', 'technical_failure', 'incorrect_charge', 'not_delivered', 'refund_problem', 'payout_problem', 'other']);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { access } = await authorizeConsultationAccess(id, 'consultation.dispute');
    if (access.kind !== 'participant') return NextResponse.json({ error: 'PARTICIPANT_ONLY' }, { status: 403 });
    const rl = await rateLimit(`care-dispute:${access.session.id}`, 5, 3600);
    if (!rl.allowed) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });

    const body = await req.json();
    const reason = String(body.reason ?? '');
    if (!REASONS.has(reason)) return NextResponse.json({ error: 'INVALID_REASON' }, { status: 400 });

    const dispute = await db.dispute.create({
      data: {
        consultationId: id,
        openedByRole: access.role,
        openedById: access.session.id,
        reason,
        detail: body.detail ? String(body.detail).slice(0, 3000) : null,
        state: 'OPEN',
      },
    });
    // §3 — disputed state where the machine allows it.
    await db.consultationStatusEvent.create({
      data: { consultationId: id, fromStatus: null, toStatus: 'DISPUTED', actorId: access.session.id, actorRole: access.role, reason: `dispute ${dispute.id}` },
    }).catch(() => undefined);
    await auditCare({ actorId: access.session.id, actorRole: access.role, action: 'dispute.opened', consultationId: id, detail: { disputeId: dispute.id, reason } });
    return NextResponse.json({ dispute }, { status: 201 });
  } catch (e) {
    if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'ERROR' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await (await import('@/lib/care/care-auth')).requireCareSession();
    if (!hasCapability(session.role, 'refund.decide')) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    const body = await req.json();
    const state = String(body.state ?? '');
    if (!['UNDER_REVIEW', 'RESOLVED_PATIENT', 'RESOLVED_DOCTOR', 'REJECTED', 'ESCALATED'].includes(state)) {
      return NextResponse.json({ error: 'INVALID_STATE' }, { status: 400 });
    }
    const dispute = await db.dispute.update({
      where: { id: String(body.disputeId ?? '') },
      data: {
        state,
        resolution: body.resolution ? String(body.resolution).slice(0, 2000) : undefined,
        resolvedById: ['RESOLVED_PATIENT', 'RESOLVED_DOCTOR', 'REJECTED'].includes(state) ? session.id : undefined,
        resolvedAt: ['RESOLVED_PATIENT', 'RESOLVED_DOCTOR', 'REJECTED'].includes(state) ? new Date() : undefined,
      },
    });
    await auditCare({ actorId: session.id, actorRole: session.role, action: 'dispute.updated', consultationId: id, detail: { disputeId: dispute.id, state } });
    return NextResponse.json({ dispute });
  } catch (e) {
    if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: 'ERROR' }, { status: 500 });
  }
}
