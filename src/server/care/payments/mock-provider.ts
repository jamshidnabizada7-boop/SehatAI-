import { careSecret } from '../secrets';
// ============================================================
// Care Connect — MOCK payment provider. DEV/TEST ONLY (§100:
// "Do not fake payments"). This adapter exists so the full
// payment path — checkout → signed webhook → verification →
// idempotency → ledger — is exercised end-to-end locally with
// deterministic, testable semantics. It is HARD-BLOCKED in
// production and always labeled "TEST" in the UI.
// ============================================================
import { createHmac, timingSafeEqual } from 'crypto';
import {
  type PaymentProvider, type CheckoutSession, type RefundResult, type PayoutResult,
  type WebhookVerification, ProviderNotConfiguredError,
} from './provider';

function mockSecret() { return careSecret('CARE_MOCK_PAYMENT_SECRET', 'dev-only-mock-secret-change-me', false); }
const TIMESTAMP_TOLERANCE_MS = 5 * 60_000;

function signPayload(rawBody: string, timestamp: string): string {
  return createHmac('sha256', mockSecret()).update(`${timestamp}.${rawBody}`).digest('hex');
}

export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';
  readonly isConfigured = true; // mock is intentionally self-configured
  readonly uiLabel = 'TEST payments (development only — no real money moves)';

  /** Hard production block (§100). */
  private assertNotProduction(): void {
    if (process.env.NODE_ENV === 'production' && process.env.CARE_ALLOW_MOCK_PAYMENTS !== 'true') {
      throw new ProviderNotConfiguredError('mock (mock payments are forbidden in production)');
    }
  }

  async createCheckout(req: { amountMinor: number; currency: string; reference: string; successUrl: string; cancelUrl: string }): Promise<CheckoutSession> {
    this.assertNotProduction();
    const providerRef = `mock_${req.reference}`;
    const url = new URL(req.successUrl, process.env.NEXTAUTH_URL ?? 'http://localhost:3000');
    url.searchParams.set('mock_payment', req.reference);
    return { providerRef, checkoutUrl: url.toString() };
  }

  async refundPayment(req: { paymentProviderRef: string; amountMinor: number; reference: string }): Promise<RefundResult> {
    this.assertNotProduction();
    return { providerRef: `mockref_${req.reference}`, state: 'COMPLETED' };
  }

  async createPayout(req: { amountMinor: number; reference: string }): Promise<PayoutResult> {
    this.assertNotProduction();
    return { providerRef: `mockpo_${req.reference}`, state: 'PAID' };
  }

  async getPaymentStatus(providerRef: string): Promise<{ state: 'PENDING' | 'PAID' | 'FAILED'; providerRef: string }> {
    // The mock never holds state server-side: status is driven entirely
    // by signed webhooks (the same trust model as real providers, §11).
    return { state: 'PENDING', providerRef };
  }

  /**
   * Webhook body (emitted by the mock checkout confirm step):
   * { eventId, type: 'payment.succeeded'|'payment.failed'|'refund.completed'|'payout.paid', reference, amountMinor, currency, timestamp }
   * Signature header: X-Mock-Signature = hex(hmac_sha256(secret, `${timestamp}.${rawBody}`))
   */
  verifyWebhook(rawBody: string, headers: Headers): WebhookVerification {
    const signature = headers.get('x-mock-signature') ?? '';
    const timestamp = headers.get('x-mock-timestamp') ?? '';
    const ts = Number(timestamp);
    if (!timestamp || !Number.isFinite(ts) || Math.abs(Date.now() - ts) > TIMESTAMP_TOLERANCE_MS) {
      return { valid: false, eventId: '', type: '', payload: {} };
    }
    const expected = signPayload(rawBody, timestamp);
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    const valid = a.length === b.length && timingSafeEqual(a, b);
    if (!valid) return { valid: false, eventId: '', type: '', payload: {} };
    try {
      const payload = JSON.parse(rawBody) as Record<string, unknown>;
      return {
        valid: true,
        eventId: String(payload.eventId ?? ''),
        type: String(payload.type ?? ''),
        payload,
      };
    } catch {
      return { valid: false, eventId: '', type: '', payload: {} };
    }
  }

  /** Test helper — produces a correctly signed webhook request body. */
  static buildSignedWebhook(event: Record<string, unknown>): { body: string; headers: Record<string, string> } {
    const body = JSON.stringify(event);
    const timestamp = String(Date.now());
    return {
      body,
      headers: {
        'content-type': 'application/json',
        'x-mock-timestamp': timestamp,
        'x-mock-signature': signPayload(body, timestamp),
      },
    };
  }
}
