// Care Connect §9 — provider registry. Selection via CARE_PAYMENT_PROVIDER.
// The mock adapter is dev/test only and hard-blocked in production.
import type { PaymentProvider } from './provider';
import { MockPaymentProvider } from './mock-provider';
import { hesabPayAdapter, pakistanPaymentAdapter, cardPaymentAdapter } from './adapters';
import { ProviderNotConfiguredError } from './provider';

const PROVIDERS: Record<string, PaymentProvider> = {
  mock: new MockPaymentProvider(),
  hesabpay: hesabPayAdapter,
  'pk-local': pakistanPaymentAdapter,
  card: cardPaymentAdapter,
};

export function getPaymentProvider(name?: string | null): PaymentProvider {
  const key = (name ?? process.env.CARE_PAYMENT_PROVIDER ?? 'mock').toLowerCase();
  if (key === 'mock' && process.env.NODE_ENV === 'production' && process.env.CARE_ALLOW_MOCK_PAYMENTS !== 'true') {
    throw new ProviderNotConfiguredError('Mock payment provider is strictly barred in production.');
  }
  const provider = PROVIDERS[key];
  if (!provider) throw new ProviderNotConfiguredError(`unknown provider: ${key}`);
  if (process.env.NODE_ENV === 'production' && !provider.isConfigured) {
    throw new ProviderNotConfiguredError(`Payment provider ${key} is not configured with required production credentials.`);
  }
  return provider;
}

export function listProviders(): Array<{ name: string; configured: boolean; uiLabel: string; isMock: boolean }> {
  return Object.values(PROVIDERS).map((p) => ({
    name: p.name,
    configured: p.isConfigured,
    uiLabel: p.uiLabel,
    isMock: p.name === 'mock',
  }));
}

export { MockPaymentProvider };
