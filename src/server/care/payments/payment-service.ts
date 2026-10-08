// ============================================================
// Care Connect §7/§8/§11 — payment orchestration.
// Commission resolution (CommissionRule, basis points) → checkout
// creation → server-side confirmation ONLY via verified webhook or
// provider API → balanced ledger posting → doctor earning (PENDING)
// → consultation PAID → REQUESTED.
// Webhooks are signature-verified, timestamp-checked, idempotent
// (unique provider+eventId) and replay-safe.
// ============================================================
import { createHmac, randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { splitMoney } from '@/lib/care/money';
import { PAYMENT_TRANSITIONS, assertTransition, type PaymentState } from '@/lib/care/constants';
import { getPaymentProvider } from './registry';
import { postTransaction } from '../ledger';
import { transitionConsultation } from '../consultation-service';
import { notify } from '../notifications';
import { auditCare } from '../audit';

export class PaymentError extends Error {
  status: number;
  code: string;
  constructor(code: string, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

/** §7 — resolve the effective CommissionRule (most specific, currently effective). */
export async function resolveCommission(opts: {
  country: string | null;
  consultationType: string;
  specialty: string | null;
  amountMinor: number;
  currency: string;
}): Promise<{ percentageBps: number; fixedFeeMinor: number; ruleId: string | null }> {
  const now = new Date();
  const rules = await db.commissionRule.findMany({
    where: {
      enabled: true,
      effectiveFrom: { lte: now },
      OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: now } }],
      AND: [
        { OR: [{ country: null }, { country: opts.country }] },
        { OR: [{ consultationType: null }, { consultationType: opts.consultationType }] },
        { OR: [{ specialty: null }, { specialty: opts.specialty }] },
      ],
    },
  });
  if (rules.length === 0) {
    // Fail-closed default: 20% commission, 0 fixed (documented default rule).
    return { percentageBps: 2000, fixedFeeMinor: 0, ruleId: null };
  }
  // Most specific rule wins: country > type > specialty matches.
  rules.sort((a, b) => specificity(b) - specificity(a));
  const rule = rules[0];
  return { percentageBps: rule.percentageBps, fixedFeeMinor: rule.fixedFeeMinor, ruleId: rule.id };
}

function specificity(r: { country: string | null; consultationType: string | null; specialty: string | null }): number {
  return (r.country ? 4 : 0) + (r.consultationType ? 2 : 0) + (r.specialty ? 1 : 0);
}

/** §10 — the patient sees ONE clear total; internal breakdown recorded. */
export function computeSplit(opts: {
  priceMinor: number;
  currency: string;
  percentageBps: number;
  fixedFeeMinor: number;
  processorFeeMinor?: number;
}) {
  const { partMinor: commissionMinor, restMinor: afterCommission } = splitMoney(opts.priceMinor, opts.percentageBps);
  const commissionWithFixed = Math.min(opts.priceMinor, commissionMinor + opts.fixedFeeMinor);
  const processorFeeMinor = opts.processorFeeMinor ?? 0;
  const doctorNet = Math.max(0, opts.priceMinor - commissionWithFixed - processorFeeMinor);
  return {
    priceMinor: opts.priceMinor,
    commissionMinor: commissionWithFixed,
    processorFeeMinor,
    doctorNetMinor: doctorNet,
    currency: opts.currency,
  };
}

// ------------------------------------------------------------
// Create checkout for a consultation (patient "Pay & Book")
// ------------------------------------------------------------
export async function createCheckoutForConsultation(opts: { consultationId: string; patientId: string; idempotencyKey: string }) {
  if (!(process.env.CARE_PAYMENTS_ENABLED === 'true' || (await flagEnabled()))) {
    throw new PaymentError('PAYMENTS_DISABLED', 403);
  }
  const consultation = await db.consultation.findUnique({
    where: { id: opts.consultationId },
    include: { doctorProfile: { select: { specialty: true, country: true } }, service: true },
  });
  if (!consultation) throw new PaymentError('CONSULTATION_NOT_FOUND', 404);
  if (consultation.patientId !== opts.patientId) throw new PaymentError('NOT_YOUR_CONSULTATION', 403);
  if (consultation.status !== 'PAYMENT_PENDING') {
    throw new PaymentError(`NOT_PAYABLE_STATUS:${consultation.status}`, 409);
  }
  // One open payment per consultation (coarse guard before provider call).
  const existing = await db.payment.findFirst({
    where: { consultationId: consultation.id, status: { in: ['CREATED', 'PENDING', 'AUTHORIZED', 'PAID'] } },
  });
  if (existing && existing.status === 'PAID') throw new PaymentError('ALREADY_PAID', 409);

  const priceMinor = consultation.priceMinor ?? consultation.service?.priceMinor ?? 0;
  const currency = (consultation.currency ?? consultation.service?.currency ?? 'PKR').toUpperCase();
  if (priceMinor <= 0) throw new PaymentError('INVALID_PRICE');

  const commission = await resolveCommission({
    country: consultation.patientCountry,
    consultationType: consultation.type,
    specialty: consultation.doctorProfile.specialty,
    amountMinor: priceMinor,
    currency,
  });
  const breakdown = computeSplit({
    priceMinor,
    currency,
    percentageBps: commission.percentageBps,
    fixedFeeMinor: commission.fixedFeeMinor,
  });

  const provider = getPaymentProvider();
  const payment = await (existing
    ? Promise.resolve(existing)
    : db.payment.create({
        data: {
          consultationId: consultation.id,
          patientId: opts.patientId,
          provider: provider.name,
          status: 'CREATED',
          amountMinor: priceMinor,
          currency,
          breakdownJson: JSON.stringify({
            doctorFeeMinor: breakdown.doctorNetMinor,
            platformFeeMinor: breakdown.commissionMinor,
            processorFeeMinor: breakdown.processorFeeMinor,
            taxMinor: 0,
            discountMinor: 0,
          }),
          idempotencyKey: opts.idempotencyKey,
        },
      }));

  const session = await provider.createCheckout({
    amountMinor: priceMinor,
    currency,
    reference: payment.id,
    description: 'SehatAI Care Connect consultation', // NO clinical detail (§79)
    successUrl: '/care/checkout/result',
    cancelUrl: '/care/checkout/result',
  });

  const updated = await db.payment.update({
    where: { id: payment.id },
    data: { providerRef: session.providerRef, checkoutUrl: session.checkoutUrl, status: 'PENDING' },
  });
  await db.paymentAttempt.create({
    data: { paymentId: payment.id, attemptNo: 1, status: 'PENDING', providerRef: session.providerRef },
  });
  await transitionConsultation({
    consultationId: consultation.id, to: 'PAYMENT_PENDING', actorId: opts.patientId, actorRole: 'PATIENT',
  }).catch(() => undefined); // already PAYMENT_PENDING — transition machine allows no-op same-state

  return { payment: updated, checkoutUrl: session.checkoutUrl, breakdown, provider: provider.uiLabel };
}

async function flagEnabled(): Promise<boolean> {
  const row = await db.featureFlag.findUnique({ where: { key: 'CARE_PAYMENTS_ENABLED' } });
  return row?.enabled === true;
}

// ------------------------------------------------------------
// Webhook intake (§11) — the ONLY path that marks a payment PAID.
// ------------------------------------------------------------
export async function processWebhook(opts: { provider: string; rawBody: string; headers: Headers }) {
  const provider = getPaymentProvider(opts.provider);
  if (provider.name !== opts.provider) throw new PaymentError('PROVIDER_MISMATCH', 400);

  const verification = provider.verifyWebhook(opts.rawBody, opts.headers);
  if (!verification.valid || !verification.eventId) {
    await auditCare({ action: 'care.webhook.invalid', detail: { provider: opts.provider } });
    throw new PaymentError('WEBHOOK_INVALID_SIGNATURE', 400);
  }

  // Idempotent intake: unique(provider, eventId).
  let record;
  try {
    record = await db.paymentWebhook.create({
      data: {
        provider: provider.name,
        eventId: verification.eventId,
        signature: opts.headers.get('x-mock-signature') ?? opts.headers.get('x-signature') ?? null,
        valid: true,
        payloadJson: opts.rawBody,
      },
    });
  } catch {
    // duplicate delivery — already recorded; ack ok, do not re-process
    return { duplicate: true };
  }

  try {
    const payload = verification.payload as {
      type?: string; reference?: string; amountMinor?: number; currency?: string;
    };
    switch (verification.type) {
      case 'payment.succeeded':
        await markPaymentPaid({
          paymentId: String(payload.reference ?? ''),
          amountMinor: Number(payload.amountMinor ?? 0),
          currency: String(payload.currency ?? ''),
          providerRef: String(payload.reference ?? ''),
        });
        break;
      case 'payment.failed': {
        const payment = await db.payment.findUnique({ where: { id: String(payload.reference ?? '') } });
        if (payment) await transitionPayment(payment.id, 'FAILED');
        break;
      }
      default:
        // refund.completed / payout.paid handled by their own services
        break;
    }
    await db.paymentWebhook.update({ where: { id: record.id }, data: { processed: true, processedAt: new Date() } });
    return { duplicate: false, type: verification.type };
  } catch (e) {
    await db.paymentWebhook.update({ where: { id: record.id }, data: { processed: false } }).catch(() => undefined);
    throw e;
  }
}

/** Server-side payment success — the single trust boundary (§11). */
export async function markPaymentPaid(opts: { paymentId: string; amountMinor: number; currency: string; providerRef: string }) {
  const payment = await db.payment.findUnique({
    where: { id: opts.paymentId },
    include: { consultation: { include: { doctorProfile: { select: { id: true, specialty: true } } } } },
  });
  if (!payment) throw new PaymentError('PAYMENT_NOT_FOUND', 404);
  if (payment.status === 'PAID') return { already: true }; // idempotent

  // §11 amount/currency mismatch → do NOT trust; flag for review.
  if (opts.amountMinor !== payment.amountMinor || opts.currency.toUpperCase() !== payment.currency) {
    await auditCare({ action: 'care.payment.amount_mismatch', consultationId: payment.consultationId, detail: { paymentId: payment.id } });
    throw new PaymentError('AMOUNT_MISMATCH', 409);
  }

  await transitionPayment(payment.id, 'PAID');
  await db.payment.update({
    where: { id: payment.id },
    data: { capturedAt: new Date(), providerRef: opts.providerRef || payment.providerRef },
  });

  const breakdown = JSON.parse(payment.breakdownJson ?? '{}') as {
    doctorFeeMinor?: number; platformFeeMinor?: number; processorFeeMinor?: number;
  };
  const doctorNet = breakdown.doctorFeeMinor ?? 0;
  const platformFee = breakdown.platformFeeMinor ?? 0;
  const processorFee = breakdown.processorFeeMinor ?? 0;
  const ccy = payment.currency;

  // §8 balanced ledger: DEBIT cash 100% = CREDIT doctor-pending + platform-fee + processor-fee.
  await postTransaction({
    reference: `payment:${payment.id}`,
    idempotencyKey: `payment:${payment.id}:charge`,
    paymentId: payment.id,
    consultationId: payment.consultationId,
    legs: [
      { accountKind: 'PLATFORM_CASH', direction: 'DEBIT', amountMinor: payment.amountMinor, currency: ccy, memo: 'patient payment' },
      { accountKind: 'DOCTOR_PENDING', ownerDoctorProfileId: payment.consultation.doctorProfile.id, direction: 'CREDIT', amountMinor: doctorNet, currency: ccy, memo: 'doctor pending earning' },
      ...(platformFee > 0 ? [{ accountKind: 'PLATFORM_FEE' as const, direction: 'CREDIT' as const, amountMinor: platformFee, currency: ccy, memo: 'commission' }] : []),
      ...(processorFee > 0 ? [{ accountKind: 'PROCESSOR_FEE' as const, direction: 'CREDIT' as const, amountMinor: processorFee, currency: ccy, memo: 'processor fee' }] : []),
    ],
  });

  // DoctorEarning (PENDING until payout-delay elapses → AVAILABLE)
  const delayHours = Number(process.env.CARE_EARNING_DELAY_HOURS ?? '72');
  const existingEarning = await db.doctorEarning.findUnique({ where: { consultationId: payment.consultationId } });
  if (!existingEarning && doctorNet > 0) {
    await db.doctorEarning.create({
      data: {
        doctorProfileId: payment.consultation.doctorProfile.id,
        consultationId: payment.consultationId,
        grossMinor: payment.amountMinor,
        commissionMinor: platformFee,
        processorFeeMinor: processorFee,
        netMinor: doctorNet,
        currency: ccy,
        state: 'PENDING',
        availableAt: new Date(Date.now() + delayHours * 3600_000),
      },
    });
  }
  await db.platformFee.create({
    data: {
      consultationId: payment.consultationId,
      paymentId: payment.id,
      commissionMinor: platformFee,
      processorFeeMinor: processorFee,
      currency: ccy,
    },
  }).catch(() => undefined); // reporting row; unique per payment handled logically

  // Consultation: PAYMENT_PENDING → PAID → REQUESTED (doctor now must accept)
  await transitionConsultation({
    consultationId: payment.consultationId, to: 'PAID', actorRole: 'SYSTEM', reason: `payment ${payment.id} captured`,
  });
  const consultation = await transitionConsultation({
    consultationId: payment.consultationId, to: 'REQUESTED', actorRole: 'SYSTEM', reason: 'awaiting doctor acceptance',
  });
  await notify({ userId: consultation.patientId, type: 'consultation.confirmed', consultationId: consultation.id });
  await notify({ userId: consultation.doctorUserId, type: 'consultation.doctor_accepted', consultationId: consultation.id });

  return { already: false };
}

export async function transitionPayment(paymentId: string, to: PaymentState) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new PaymentError('PAYMENT_NOT_FOUND', 404);
  assertTransition(PAYMENT_TRANSITIONS, payment.status as PaymentState, to);
  return db.payment.update({ where: { id: paymentId }, data: { status: to } });
}

export function newPaymentIdempotencyKey(): string {
  return `pay_${randomUUID()}`;
}

/** CSRF-safe signing secret for checkout handoff endpoints (dev helper). */
export function signCheckoutPayload(payload: string): string {
  const secret = process.env.CARE_CHECKOUT_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'dev-checkout-secret';
  return createHmac('sha256', secret).update(payload).digest('hex');
}
