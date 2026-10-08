// Care Connect §10 — checkout entry. One clear total; creates the
// provider checkout session and redirects the patient to hosted
// checkout (SehatAI never sees card data, §57).
import { NextRequest, NextResponse } from 'next/server';
import { getCareSession } from '@/lib/care/care-auth';
import { createCheckoutForConsultation, PaymentError } from '@/server/care/payments/payment-service';
import { withIdempotency, IdempotencyReplayError } from '@/lib/care/idempotency';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getCareSession();
    if (!session) {
      return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }
    const consultationId = new URL(req.url).searchParams.get('consultationId') ?? '';
    if (!consultationId) return NextResponse.json({ error: 'CONSULTATION_REQUIRED' }, { status: 400 });

    const { result } = await withIdempotency(
      `checkout.start:${consultationId}:${session.id}`,
      'payment.create',
      () => createCheckoutForConsultation({ consultationId, patientId: session.id, idempotencyKey: `checkout.start:${consultationId}:${session.id}` }),
    );
    // Redirect to the provider's hosted checkout (mock → local result page).
    return NextResponse.redirect(new URL(result.checkoutUrl, req.url), 302);
  } catch (e) {
    if (e instanceof IdempotencyReplayError) {
      return NextResponse.json({ error: 'IDEMPOTENT_REPLAY' }, { status: 409 });
    }
    if (e instanceof PaymentError) {
      return NextResponse.json({ error: e.code, provider: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'ERROR' }, { status: 500 });
  }
}
