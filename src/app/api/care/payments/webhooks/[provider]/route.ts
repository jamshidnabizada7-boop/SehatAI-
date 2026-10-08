// Care Connect §11 — provider webhook intake (the payment trust boundary).
// Signature-verified + timestamp-checked + idempotent (unique provider+eventId)
// + replay-safe. Raw body is required for signature verification.
import { NextRequest, NextResponse } from 'next/server';
import { processWebhook, PaymentError } from '@/server/care/payments/payment-service';
export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  try {
    const rawBody = await req.text();
    const result = await processWebhook({ provider, rawBody, headers: req.headers });
    // Always 200 for valid-provider duplicates/acks so providers stop retrying.
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    if (e instanceof PaymentError) {
      // Signature failures must NOT return 200 (provider should retry/alert).
      return NextResponse.json({ error: e.code }, { status: e.status });
    }
    return NextResponse.json({ error: 'WEBHOOK_ERROR' }, { status: 500 });
  }
}
