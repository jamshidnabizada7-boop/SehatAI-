// Care Connect §3/§70 — Consultation create + list.
// POST: patient creates a consultation (DRAFT→PAYMENT_PENDING) after
// jurisdiction + availability checks. Idempotent via Idempotency-Key.
// GET: role-scoped list — patients see their own, doctors see theirs,
// staff (viewAny) see all (audited).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCareSession, CareAuthzError } from '@/lib/care/care-auth';
import { hasCapability } from '@/lib/care/rbac';
import { createConsultation, expireStaleRequests, ConsultationError } from '@/server/care/consultation-service';
import { withIdempotency, IdempotencyReplayError } from '@/lib/care/idempotency';
import { rateLimit, clientIpFrom, RATE_LIMITS } from '@/lib/care/rate-limit';
import { auditCare } from '@/server/care/audit';
export const runtime = 'nodejs';

function err(e: unknown) {
  if (e instanceof IdempotencyReplayError) {
    return NextResponse.json({ error: 'IDEMPOTENT_REPLAY', existing: e.result }, { status: 409 });
  }
  if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof ConsultationError) return NextResponse.json({ error: e.code }, { status: e.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : 'ERROR' }, { status: 500 });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCareSession();
    if (!session) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    const rl = await rateLimit(`care-book:${session.id}`, RATE_LIMITS.paymentCreate.limit, RATE_LIMITS.paymentCreate.windowSeconds);
    if (!rl.allowed) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });

    const body = await req.json();
    const type = String(body.type ?? '').toUpperCase();
    if (!['TEXT', 'AUDIO', 'VIDEO'].includes(type)) return NextResponse.json({ error: 'INVALID_TYPE' }, { status: 400 });
    if (!body.doctorProfileId || !body.patientCountry) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
    }

    // §83 — Telemedicine consent gate (mandatory before booking)
    const consent = await db.consentRecord.findFirst({
      where: { userId: session.id, type: 'TELEMEDICINE', revokedAt: null },
    });
    if (!consent) {
      return NextResponse.json({ error: 'TELEMEDICINE_CONSENT_REQUIRED' }, { status: 403 });
    }

    const idemKey = req.headers.get('idempotency-key') ?? undefined;
    const { result } = await withIdempotency(
      idemKey ? `consultation.create:${idemKey}` : undefined,
      'consultation.book',
      async () =>
        (await createConsultation({
          patientId: session.id,
          doctorProfileId: String(body.doctorProfileId),
          type: type as 'TEXT' | 'AUDIO' | 'VIDEO',
          serviceId: body.serviceId ? String(body.serviceId) : undefined,
          scheduledAt: body.scheduledAt ? String(body.scheduledAt) : undefined,
          patientCountry: String(body.patientCountry),
          instant: body.instant === true,
        })),
    );

    await auditCare({
      actorId: session.id, actorRole: session.role, action: 'consultation.create',
      consultationId: result.consultation.id, detail: { type, doctorProfileId: body.doctorProfileId },
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return err(e);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getCareSession();
    if (!session) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    await expireStaleRequests();

    const url = new URL(req.url);
    const statusFilter = url.searchParams.get('status') ?? undefined;
    const viewAll = url.searchParams.get('all') === 'true' && hasCapability(session.role, 'consultation.viewAny');
    const role = url.searchParams.get('role'); // patient | doctor — doctor dashboard picks

    const where = viewAll
      ? { ...(statusFilter ? { status: statusFilter } : {}) }
      : role === 'doctor' && session.doctorProfileId
        ? { doctorProfileId: session.doctorProfileId, ...(statusFilter ? { status: statusFilter } : {}) }
        : { patientId: session.id, ...(statusFilter ? { status: statusFilter } : {}) };

    if (viewAll) {
      await auditCare({ actorId: session.id, actorRole: session.role, action: 'consultation.viewAny' });
    }

    const consultations = await db.consultation.findMany({
      where,
      include: {
        doctorProfile: { include: { user: { select: { name: true } } } },
        patient: { select: { name: true } },
        service: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      consultations: consultations.map((c) => ({
        id: c.id,
        type: c.type,
        status: c.status,
        priceMinor: c.priceMinor,
        currency: c.currency,
        scheduledAt: c.scheduledAt,
        windowClosesAt: c.windowClosesAt,
        graceClosesAt: c.graceClosesAt,
        instant: c.instant,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        doctor: {
          id: c.doctorProfileId,
          name: c.doctorProfile.user.name,
          specialty: c.doctorProfile.specialty,
          facilityCity: c.doctorProfile.facilityCity,
        },
        patient: { id: c.patientId, name: c.patient.name },
        unreadForMe: 0, // computed in detail view via lastReadAt
      })),
    });
  } catch (e) {
    return err(e);
  }
}
