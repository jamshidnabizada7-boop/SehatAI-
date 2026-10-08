// Care Connect — MOCK checkout confirmation (DEV/TEST ONLY, §100).
// Simulates the provider's side of the flow: builds a properly SIGNED
// webhook event and feeds it through the same processWebhook trust
// boundary a real provider hits. Hard-blocked in production and when
// the mock provider is not selected.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCareSession } from '@/lib/care/care-auth';
import { processWebhook, PaymentError } from '@/server/care/payments/payment-service';
import { MockPaymentProvider } from '@/server/care/payments/mock-provider';
import { getPaymentProvider } from '@/server/care/payments/registry';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const session = await getCareSession();
    if (!session) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    if (process.env.NODE_ENV === 'production' && process.env.CARE_ALLOW_MOCK_PAYMENTS !== 'true') {
      return NextResponse.json({ error: 'MOCK_FORBIDDEN_IN_PRODUCTION' }, { status: 403 });
    }
    if (getPaymentProvider().name !== 'mock') {
      return NextResponse.json({ error: 'MOCK_PROVIDER_NOT_SELECTED' }, { status: 409 });
    }

    const { paymentId, outcome } = await req.json();
    const payment = await db.payment.findUnique({ where: { id: String(paymentId ?? '') } });
    if (!payment) return NextResponse.json({ error: 'PAYMENT_NOT_FOUND' }, { status: 404 });
    if (payment.patientId !== session.id) return NextResponse.json({ error: 'NOT_YOUR_PAYMENT' }, { status: 403 });

    const event = {
      eventId: `mock_evt_${payment.id}_${outcome ?? 'succeeded'}_${Date.now()}`,
      type: outcome === 'failed' ? 'payment.failed' : 'payment.succeeded',
      reference: payment.id,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
    };
    const signed = MockPaymentProvider.buildSignedWebhook(event);
    const headers = new Headers(signed.headers);
    const result = await processWebhook({ provider: 'mock', rawBody: signed.body, headers });

    const fresh = await db.payment.findUnique({ where: { id: payment.id }, select: { status: true } });
    return NextResponse.json({ ok: true, ...result, paymentStatus: fresh?.status });
  } catch (e) {
    if (e instanceof PaymentError) return NextResponse.json({ error: e.code }, { status: e.status });
    return NextResponse.json({ error: e instanceof Error ? e.message : 'ERROR' }, { status: 500 });
  }
}
