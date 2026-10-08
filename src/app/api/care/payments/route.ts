// Care Connect §10/§11 — payment endpoints.
// POST: create checkout for a consultation (Idempotency-Key honored).
// GET ?paymentId=: server-side status check (never frontend-trusted).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCareSession, CareAuthzError } from '@/lib/care/care-auth';
import { createCheckoutForConsultation, PaymentError } from '@/server/care/payments/payment-service';
import { withIdempotency, IdempotencyReplayError } from '@/lib/care/idempotency';
import { rateLimit, RATE_LIMITS } from '@/lib/care/rate-limit';
export const runtime = 'nodejs';

function err(e: unknown) {
  if (e instanceof IdempotencyReplayError) {
    return NextResponse.json({ error: 'IDEMPOTENT_REPLAY', existing: e.result }, { status: 409 });
  }
  if (e instanceof CareAuthzError) return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof PaymentError) return NextResponse.json({ error: e.code }, { status: e.status });
  return NextResponse.json({ error: e instanceof Error ? e.message : 'ERROR' }, { status: 500 });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCareSession();
    if (!session) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    const rl = await rateLimit(`care-pay:${session.id}`, RATE_LIMITS.paymentCreate.limit, RATE_LIMITS.paymentCreate.windowSeconds);
    if (!rl.allowed) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });

    const body = await req.json();
    const consultationId = String(body.consultationId ?? '');
    if (!consultationId) return NextResponse.json({ error: 'CONSULTATION_REQUIRED' }, { status: 400 });

    const idemKey = req.headers.get('idempotency-key') ?? `auto-${consultationId}-${session.id}`;
    const { result } = await withIdempotency(
      `payment.create:${idemKey}`,
      'payment.create',
      () => createCheckoutForConsultation({ consultationId, patientId: session.id, idempotencyKey: `payment.create:${idemKey}` }),
    );
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return err(e);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getCareSession();
    if (!session) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    const paymentId = new URL(req.url).searchParams.get('paymentId') ?? '';
    const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { consultation: { select: { patientId: true, doctorUserId: true } } } });
    if (!payment) return NextResponse.json({ error: 'PAYMENT_NOT_FOUND' }, { status: 404 });
    if (payment.consultation.patientId !== session.id && payment.consultation.doctorUserId !== session.id) {
      return NextResponse.json({ error: 'NOT_YOUR_PAYMENT' }, { status: 403 });
    }
    return NextResponse.json({
      payment: {
        id: payment.id,
        status: payment.status,
        amountMinor: payment.amountMinor,
        currency: payment.currency,
        provider: payment.provider,
        checkoutUrl: payment.checkoutUrl,
        capturedAt: payment.capturedAt,
      },
    });
  } catch (e) {
    return err(e);
  }
}
