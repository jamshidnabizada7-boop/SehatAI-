// ============================================================
// Care Connect §9 — PaymentProvider abstraction.
// SehatAI is not coupled to any one payment company. Real adapters
// require merchant agreements (§12); until configured they throw
// PROVIDER_NOT_CONFIGURED — NO fake integrations (§100).
//
// Contract notes:
// - createCheckout: hosted checkout only (§57 — SehatAI stays out of
//   PCI scope; no raw card data ever touches the app).
// - Payment success is NEVER trusted from the frontend (§11): it is
//   determined server-side via verified webhook or provider API.
// - All amounts are integer minor units + currency (§6).
// ============================================================

export interface CheckoutRequest {
  amountMinor: number;
  currency: string;
  reference: string; // payment id
  description: string; // NO clinical details (§62/§79)
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  providerRef: string;
  checkoutUrl: string; // hosted page
}

export interface RefundRequest {
  paymentProviderRef: string;
  amountMinor: number;
  currency: string;
  reference: string; // refund id
}

export interface RefundResult {
  providerRef: string;
  state: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface PayoutRequest {
  amountMinor: number;
  currency: string;
  reference: string; // payout id
  destination: Record<string, string>; // provider-specific, tokenized (no secrets)
}

export interface PayoutResult {
  providerRef: string;
  state: 'PENDING' | 'PAID' | 'FAILED';
}

export interface WebhookVerification {
  valid: boolean;
  eventId: string;
  type: string;
  payload: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly name: string;
  /** True when real merchant credentials are configured. */
  readonly isConfigured: boolean;
  /** Label shown in UI — mock MUST be visibly marked (§100 no fake integrations). */
  readonly uiLabel: string;

  createCheckout(req: CheckoutRequest): Promise<CheckoutSession>;
  refundPayment(req: RefundRequest): Promise<RefundResult>;
  createPayout(req: PayoutRequest): Promise<PayoutResult>;
  getPaymentStatus(providerRef: string): Promise<{ state: 'PENDING' | 'PAID' | 'FAILED'; providerRef: string }>;
  /** Verify a webhook's signature + timestamp freshness (replay-safe, §11). */
  verifyWebhook(rawBody: string, headers: Headers): WebhookVerification;
}

export class ProviderNotConfiguredError extends Error {
  constructor(providerName: string) {
    super(`PROVIDER_NOT_CONFIGURED: ${providerName} requires a signed merchant agreement + credentials (plan §9/§12/§100)`);
    this.name = 'ProviderNotConfiguredError';
  }
}

/** Shared HMAC verification helpers for adapters. */
export function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
