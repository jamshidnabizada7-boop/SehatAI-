// ============================================================
// Care Connect §9 — real provider adapters.
// Each adapter is a scaffold that throws ProviderNotConfiguredError
// until: (a) a merchant agreement exists, and (b) server-side
// credentials are configured. This is intentional (§100: no fake
// integrations). Implementing a live adapter means filling in the
// marked blocks and setting the env credentials — the payment
// state machine, webhook intake, idempotency and ledger stay
// identical regardless of provider.
// ============================================================
import {
  type PaymentProvider, type CheckoutSession, type RefundResult, type PayoutResult,
  type WebhookVerification, ProviderNotConfiguredError,
} from './provider';

class UnconfiguredAdapter implements PaymentProvider {
  constructor(
    readonly name: string,
    readonly uiLabel: string,
    private readonly requiredEnv: string[],
  ) {}
  get isConfigured(): boolean {
    return this.requiredEnv.every((k) => !!process.env[k]);
  }
  private assert(): void {
    if (!this.isConfigured) throw new ProviderNotConfiguredError(`${this.name} (missing: ${this.requiredEnv.join(', ')})`);
  }
  async createCheckout(): Promise<CheckoutSession> { this.assert(); throw new ProviderNotConfiguredError(this.name); }
  async refundPayment(): Promise<RefundResult> { this.assert(); throw new ProviderNotConfiguredError(this.name); }
  async createPayout(): Promise<PayoutResult> { this.assert(); throw new ProviderNotConfiguredError(this.name); }
  async getPaymentStatus(): Promise<{ state: 'PENDING' | 'PAID' | 'FAILED'; providerRef: string }> { this.assert(); throw new ProviderNotConfiguredError(this.name); }
  verifyWebhook(): WebhookVerification { return { valid: false, eventId: '', type: '', payload: {} }; }
}

/** HesabPay — Afghanistan corridor. Requires signed merchant agreement. */
export const hesabPayAdapter = new UnconfiguredAdapter('hesabpay', 'HesabPay', ['HESABPAY_API_KEY', 'HESABPAY_MERCHANT_ID']);

/** Pakistan local rails (JazzCash/Easypaisa/PayFast style hosted checkout). */
export const pakistanPaymentAdapter = new UnconfiguredAdapter('pk-local', 'Pakistan payment gateway', ['CARE_PK_GATEWAY_KEY', 'CARE_PK_GATEWAY_SECRET']);

/** International card gateway (Stripe-style hosted checkout). */
export const cardPaymentAdapter = new UnconfiguredAdapter('card', 'Card payment', ['CARE_CARD_GATEWAY_KEY']);
