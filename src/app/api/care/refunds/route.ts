// Care Connect §49 — refund endpoints (patient/doctor/staff).
// POST: request refund for a consultation (policy-evaluated,
// provider-confirmed). GET: own refunds; staff with viewAny see all.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCareSession, CareAuthzError } from '@/lib/care/care-auth';
import { hasCapability } from '@/lib/care/rbac';
import { requestRefund, RefundError } from '@/server/care/refund-service';
import { withIdempotency, IdempotencyReplayError } from '@/lib/care/idempotency';
import { rateLimit, RATE_LIMITS } from '@/lib/care/rate-limit';
import { auditCare } from '@/server/care/audit';
export const runtime = 'nodejs';

function err(e: unknown) {
  if (e instanceof IdempotencyReplayError) {
    return NextResponse.json({ error: 'IDEMPOTENT_REPLAY', existing: e.result }, { status: 409 });
  }
  if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof RefundError) return NextResponse.json({ error: e.code }, { status: e.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : 'ERROR' }, { status: 500 });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCareSession();
    if (!session) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    const rl = await rateLimit(`care-refund:${session.id}`, RATE_LIMITS.refundRequest.limit, RATE_LIMITS.refundRequest.windowSeconds);
    if (!rl.allowed) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });

    const body = await req.json();
    const consultationId = String(body.consultationId ?? '');
    const reason = String(body.reason ?? 'patient_cancelled');
    if (!consultationId) return NextResponse.json({ error: 'CONSULTATION_REQUIRED' }, { status: 400 });

    // Ownership check: patient/doctor must be participants; staff need refund.create.
    const consultation = await db.consultation.findUnique({ where: { id: consultationId }, select: { patientId: true, doctorUserId: true } });
    if (!consultation) return NextResponse.json({ error: 'CONSULTATION_NOT_FOUND' }, { status: 404 });
    const isParticipant = consultation.patientId === session.id || consultation.doctorUserId === session.id;
    if (!isParticipant && !hasCapability(session.role, 'refund.create')) {
      return NextResponse.json({ error: 'NOT_A_PARTICIPANT' }, { status: 403 });
    }
    const role: 'PATIENT' | 'DOCTOR' | 'SUPPORT' | 'FINANCE' = isParticipant
      ? consultation.patientId === session.id ? 'PATIENT' : 'DOCTOR'
      : session.role === 'finance' ? 'FINANCE' : 'SUPPORT';

    const idemKey = req.headers.get('idempotency-key') ?? undefined;
    const { result } = await withIdempotency(
      idemKey ? `refund.create:${session.id}:${idemKey}` : undefined,
      'refund.create',
      () => requestRefund({ consultationId, actorId: session.id, actorRole: role, reason }),
    );
    return NextResponse.json({ refund: result.refund, eligibilityNote: result.eligibilityNote }, { status: 201 });
  } catch (e) {
    return err(e);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getCareSession();
    if (!session) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    const consultationId = new URL(req.url).searchParams.get('consultationId');

    const where = consultationId
      ? { consultationId }
      : { OR: [{ consultation: { patientId: session.id } }, { consultation: { doctorUserId: session.id } }] };
    const refunds = await db.refund.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
    return NextResponse.json({ refunds });
  } catch (e) {
    return err(e);
  }
}
