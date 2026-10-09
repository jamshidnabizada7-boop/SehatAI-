// ============================================================
// Care Connect §48/§49 — cancellation policies + refunds.
// NEVER mark a refund successful before the provider confirms it
// (§49). Flow: eligibility → provider request → REFUND_PENDING →
// provider confirmation (webhook or provider-reported COMPLETED) →
// REFUNDED → compensating ledger entries. Partial refunds supported.
// ============================================================
import { db } from '@/lib/db';
import { REFUND_TRANSITIONS, assertTransition, type RefundState } from '@/lib/care/constants';
import { getPaymentProvider } from './payments/registry';
import { postTransaction, type LedgerLeg } from './ledger';
import { transitionConsultation } from './consultation-service';
import { notify } from './notifications';
import { auditCare } from './audit';

export class RefundError extends Error {
  status: number;
  code: string;
  constructor(code: string, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

export const CANCELLATION_POLICY_VERSION = '2026.10-initial';

/** §48 policy — deterministic eligibility. Returns refundable minor amount. */
export async function computeRefundEligibility(opts: { consultationId: string; actorRole: 'PATIENT' | 'DOCTOR' | 'SUPPORT' | 'FINANCE'; reason: string }) {
  const c = await db.consultation.findUnique({
    where: { id: opts.consultationId },
    include: { payments: { where: { status: 'PAID' }, orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  if (!c) throw new RefundError('CONSULTATION_NOT_FOUND', 404);
  const payment = c.payments[0];
  if (!payment) throw new RefundError('NO_CAPTURED_PAYMENT', 409);

  const paidMinor = payment.amountMinor;
  let refundMinor = 0;
  let policyNote = '';

  if (opts.actorRole === 'DOCTOR' || opts.reason === 'doctor_cancelled' || opts.reason === 'doctor_no_show' || c.status === 'EXPIRED') {
    refundMinor = paidMinor; // §48: doctor cancels / no-show / expired → full refund
    policyNote = 'full: doctor-side cancellation or expiry';
  } else if (opts.reason === 'technical_failure') {
    refundMinor = paidMinor; // support workflow default full; disputes may adjust
    policyNote = 'full: technical failure';
  } else {
    // Patient-initiated cancellation (§48 ladder)
    if (['PAYMENT_PENDING', 'PAID', 'REQUESTED'].includes(c.status)) {
      refundMinor = paidMinor;
      policyNote = 'full: cancelled before doctor acceptance';
    } else if (['DOCTOR_ACCEPTED', 'SCHEDULED', 'WAITING'].includes(c.status)) {
      const scheduled = c.scheduledAt ? new Date(c.scheduledAt).getTime() : null;
      const moreThan24h = scheduled == null || scheduled - Date.now() > 24 * 3600_000;
      refundMinor = moreThan24h ? paidMinor : Math.floor(paidMinor / 2);
      policyNote = moreThan24h ? 'full: >24h before schedule' : 'partial: late cancellation (50%)';
    } else {
      refundMinor = 0;
      policyNote = 'none: consultation already delivered';
    }
  }

  return { payment, refundMinor, paidMinor, policyNote, policyVersion: CANCELLATION_POLICY_VERSION };
}

/** Request a refund — creates the row and immediately goes to the provider. */
export async function requestRefund(opts: {
  consultationId: string;
  actorId: string;
  actorRole: 'PATIENT' | 'DOCTOR' | 'SUPPORT' | 'FINANCE';
  reason: string;
  idempotencyKey?: string;
}) {
  const eligibility = await computeRefundEligibility({ consultationId: opts.consultationId, actorRole: opts.actorRole, reason: opts.reason });
  const { payment, refundMinor, policyVersion } = eligibility;
  if (refundMinor <= 0) throw new RefundError('NOT_REFUNDABLE', 409);

  // Duplicate refund guard: Σ refunds must never exceed the payment.
  // We execute this check and row creation inside a transaction with an explicit row lock on Payment.
  const refund = await db.$transaction(async (tx) => {
    // Acquire row-level lock on Payment to serialize concurrent refund attempts
    await tx.payment.update({
      where: { id: payment.id },
      data: { updatedAt: new Date() },
    });

    const priorRefunds = await tx.refund.aggregate({
      where: { paymentId: payment.id, state: { in: ['REQUESTED', 'REFUND_PENDING', 'REFUNDED'] } },
      _sum: { amountMinor: true },
    });
    const alreadyRefunding = priorRefunds._sum.amountMinor ?? 0;
    if (alreadyRefunding + refundMinor > payment.amountMinor) {
      throw new RefundError('REFUND_EXCEEDS_PAYMENT', 409);
    }

    return tx.refund.create({
      data: {
        paymentId: payment.id,
        consultationId: opts.consultationId,
        amountMinor: refundMinor,
        currency: payment.currency,
        reason: opts.reason,
        state: 'REQUESTED',
        policyVersion,
        requestedById: opts.actorId,
      },
    });
  });

  await transitionRefund(refund.id, 'REFUND_PENDING');

  const provider = getPaymentProvider(payment.provider);
  const result = await provider.refundPayment({
    paymentProviderRef: payment.providerRef ?? payment.id,
    amountMinor: refundMinor,
    currency: payment.currency,
    reference: refund.id,
  });
  await db.refund.update({ where: { id: refund.id }, data: { provider: provider.name, providerRef: result.providerRef } });

  if (result.state === 'COMPLETED') {
    // Provider confirmed synchronously (mock). Real async providers confirm
    // via webhook → confirmRefund() below. Both paths converge here.
    await confirmRefund({ refundId: refund.id, providerRef: result.providerRef });
  }

  await auditCare({
    actorId: opts.actorId, actorRole: opts.actorRole, action: 'refund.requested',
    consultationId: opts.consultationId, detail: { refundId: refund.id, amountMinor: refundMinor, policyNote: eligibility.policyNote },
  });
  return { refund, eligibilityNote: eligibility.policyNote };
}

/** Provider-confirmed completion (webhook 'refund.completed' or sync COMPLETED). */
export async function confirmRefund(opts: { refundId: string; providerRef?: string }) {
  const refund = await db.refund.findUnique({ where: { id: opts.refundId } });
  if (!refund) throw new RefundError('REFUND_NOT_FOUND', 404);
  if (refund.state === 'REFUNDED') return { already: true }; // idempotent

  await transitionRefund(refund.id, 'REFUNDED');
  if (opts.providerRef) {
    await db.refund.update({ where: { id: refund.id }, data: { providerRef: opts.providerRef } });
  }
  // Keep the Payment state machine consistent (§11).
  const paymentState = await db.payment.findUnique({ where: { id: refund.paymentId }, select: { status: true, amountMinor: true } });
  if (paymentState && ['PAID', 'PARTIALLY_REFUNDED', 'REFUND_PENDING'].includes(paymentState.status)) {
    const fullyRefunded = refund.amountMinor >= paymentState.amountMinor;
    const nextState = fullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    const { PAYMENT_TRANSITIONS, assertTransition } = await import('@/lib/care/constants');
    try {
      assertTransition(PAYMENT_TRANSITIONS, paymentState.status as never, nextState as never);
      await db.payment.update({ where: { id: refund.paymentId }, data: { status: nextState } });
    } catch { /* already transitioned by a concurrent refund */ }
  }

  // Compensating ledger entries (§8) — money leaves the platform accounts.
  const payment = await db.payment.findUnique({ where: { id: refund.paymentId } });
  if (payment) {
    const breakdown = JSON.parse(payment.breakdownJson ?? '{}') as {
      doctorFeeMinor?: number; platformFeeMinor?: number;
    };
    const doctorNet = breakdown.doctorFeeMinor ?? 0;
    const platformFee = breakdown.platformFeeMinor ?? 0;
    const ccy = refund.currency;
    // Waterfall: refund the doctor's portion first, then platform fee.
    const doctorLeg = Math.min(doctorNet, refund.amountMinor);
    const platformLeg = refund.amountMinor - doctorLeg;
    if (platformLeg > platformFee) throw new RefundError('REFUND_EXCEEDS_LEDGER', 409);

    const consultation = await db.consultation.findUnique({ where: { id: refund.consultationId }, select: { doctorProfileId: true } });

    // Inspect whether doctor earnings were already promoted to DOCTOR_AVAILABLE or PAID (§13)
    const doctorEarnings = await db.doctorEarning.findMany({
      where: { consultationId: refund.consultationId },
    });
    const availableAmount = doctorEarnings
      .filter((e) => e.state === 'AVAILABLE')
      .reduce((sum, e) => sum + e.netMinor, 0);
    const paidAmount = doctorEarnings
      .filter((e) => e.state === 'PAID')
      .reduce((sum, e) => sum + e.netMinor, 0);

    // If earnings were already PAID out to doctor, debit DOCTOR_AVAILABLE to establish
    // a clawback liability (negative balance to be recovered from subsequent earnings).
    let debitAvailable = 0;
    let debitPending = 0;
    if (paidAmount > 0) {
      debitAvailable = doctorLeg;
    } else {
      debitAvailable = Math.min(doctorLeg, availableAmount);
      debitPending = doctorLeg - debitAvailable;
    }

    const doctorLegs: LedgerLeg[] = [];
    if (debitAvailable > 0 && consultation) {
      doctorLegs.push({
        accountKind: 'DOCTOR_AVAILABLE' as const,
        ownerDoctorProfileId: consultation.doctorProfileId,
        direction: 'DEBIT' as const,
        amountMinor: debitAvailable,
        currency: ccy,
        memo: paidAmount > 0 ? 'clawback post-payout refund (negative balance)' : 'reverse doctor earning (matured)',
      });
    }
    if (debitPending > 0 && consultation) {
      doctorLegs.push({
        accountKind: 'DOCTOR_PENDING' as const,
        ownerDoctorProfileId: consultation.doctorProfileId,
        direction: 'DEBIT' as const,
        amountMinor: debitPending,
        currency: ccy,
        memo: 'reverse doctor earning (pending)',
      });
    }

    await postTransaction({
      reference: `refund:${refund.id}`,
      idempotencyKey: `refund:${refund.id}:compensate`,
      refundId: refund.id,
      paymentId: payment.id,
      consultationId: refund.consultationId,
      legs: [
        { accountKind: 'PLATFORM_CASH', direction: 'CREDIT', amountMinor: refund.amountMinor, currency: ccy, memo: 'cash out to patient' },
        ...doctorLegs,
        ...(platformLeg > 0
          ? [{ accountKind: 'PLATFORM_FEE' as const, direction: 'DEBIT' as const, amountMinor: platformLeg, currency: ccy, memo: 'reverse commission' }]
          : []),
      ],
    });

    // Reverse the doctor's earning for a full refund.
    if (doctorLeg >= doctorNet && doctorNet > 0 && consultation) {
      await db.doctorEarning.updateMany({
        where: { consultationId: refund.consultationId, state: { in: ['PENDING', 'AVAILABLE', 'PAID'] } },
        data: { state: 'REVERSED' },
      });
    } else if (doctorLeg > 0 && consultation) {
      // Partial: reduce the earning row to keep reporting consistent.
      await db.doctorEarning.updateMany({
        where: { consultationId: refund.consultationId },
        data: { netMinor: { decrement: doctorLeg }, grossMinor: { decrement: Math.min(refund.amountMinor, payment.amountMinor) } },
      });
    }
  }

  // Consultation → REFUND_PENDING → REFUNDED (if terminal cancellation)
  const consultation = await db.consultation.findUnique({ where: { id: refund.consultationId }, select: { status: true, patientId: true, doctorUserId: true } });
  if (consultation) {
    await transitionConsultation({
      consultationId: refund.consultationId,
      to: 'REFUNDED',
      actorRole: 'SYSTEM',
      reason: `refund ${refund.id} confirmed`,
    }).catch(() => undefined); // DISPUTED stays DISPUTED; only refundable states transition
    await notify({ userId: consultation.patientId, type: 'refund.processed', consultationId: refund.consultationId });
  }
  return { already: false };
}

export async function transitionRefund(refundId: string, to: RefundState) {
  const refund = await db.refund.findUnique({ where: { id: refundId } });
  if (!refund) throw new RefundError('REFUND_NOT_FOUND', 404);
  assertTransition(REFUND_TRANSITIONS, refund.state as RefundState, to);
  return db.refund.update({ where: { id: refundId }, data: { state: to } });
}

/**
 * Handle payment chargeback from payment processor.
 * Transitions payment to CHARGEDBACK/DISPUTED, consultation to DISPUTED,
 * executes compensating ledger entries (reversing platform commission and clawing back doctor share),
 * and records dispute audit trail.
 */
export async function processChargeback(opts: {
  paymentId: string;
  reason?: string;
  actorId?: string;
  actorRole?: 'PATIENT' | 'SUPPORT' | 'FINANCE' | 'SYSTEM';
}) {
  const payment = await db.payment.findUnique({
    where: { id: opts.paymentId },
    include: { consultation: { select: { id: true, doctorProfileId: true } } },
  });
  if (!payment) throw new RefundError('PAYMENT_NOT_FOUND', 404);
  if (payment.status === 'REFUNDED') {
    throw new RefundError('CANNOT_CHARGEBACK_ALREADY_REFUNDED', 409);
  }
  if (!['PAID', 'PARTIALLY_REFUNDED'].includes(payment.status)) {
    throw new RefundError(`CANNOT_CHARGEBACK_STATUS_${payment.status}`, 409);
  }

  // 1. Transition payment state
  const { PAYMENT_TRANSITIONS, assertTransition: assertPayTrans } = await import('@/lib/care/constants');
  if (payment.status !== 'DISPUTED' && payment.status !== 'CHARGEDBACK') {
    assertPayTrans(PAYMENT_TRANSITIONS, payment.status as never, 'DISPUTED' as never);
    await db.payment.update({ where: { id: payment.id }, data: { status: 'DISPUTED' } });
  }
  await db.payment.update({ where: { id: payment.id }, data: { status: 'CHARGEDBACK' } });

  // 2. Transition consultation to DISPUTED
  if (payment.consultation) {
    await db.consultation.update({
      where: { id: payment.consultation.id },
      data: { status: 'DISPUTED' },
    }).catch(() => undefined);
  }

  // 3. Compensating ledger reversal
  const breakdown = JSON.parse(payment.breakdownJson ?? '{}') as {
    doctorFeeMinor?: number; platformFeeMinor?: number;
  };
  const doctorNet = breakdown.doctorFeeMinor ?? Math.round(payment.amountMinor * 0.8);
  const ccy = payment.currency;

  const doctorLegTotal = Math.min(doctorNet, payment.amountMinor);
  const platformLegTotal = payment.amountMinor - doctorLegTotal;

  const doctorEarnings = await db.doctorEarning.findMany({
    where: { consultationId: payment.consultationId },
  });
  const availableAmount = doctorEarnings
    .filter((e) => e.state === 'AVAILABLE')
    .reduce((sum, e) => sum + e.netMinor, 0);
  const paidAmount = doctorEarnings
    .filter((e) => e.state === 'PAID')
    .reduce((sum, e) => sum + e.netMinor, 0);

  let debitAvailable = 0;
  let debitPending = 0;
  if (paidAmount > 0) {
    debitAvailable = doctorLegTotal;
  } else {
    debitAvailable = Math.min(doctorLegTotal, availableAmount);
    debitPending = doctorLegTotal - debitAvailable;
  }

  const doctorLegs: LedgerLeg[] = [];
  if (debitAvailable > 0 && payment.consultation) {
    doctorLegs.push({
      accountKind: 'DOCTOR_AVAILABLE' as const,
      ownerDoctorProfileId: payment.consultation.doctorProfileId,
      direction: 'DEBIT' as const,
      amountMinor: debitAvailable,
      currency: ccy,
      memo: paidAmount > 0 ? 'chargeback doctor clawback (negative balance)' : 'chargeback doctor clawback (available)',
    });
  }
  if (debitPending > 0 && payment.consultation) {
    doctorLegs.push({
      accountKind: 'DOCTOR_PENDING' as const,
      ownerDoctorProfileId: payment.consultation.doctorProfileId,
      direction: 'DEBIT' as const,
      amountMinor: debitPending,
      currency: ccy,
      memo: 'chargeback doctor clawback (pending)',
    });
  }

  const txRes = await postTransaction({
    reference: `chargeback:${payment.id}`,
    idempotencyKey: `chargeback:${payment.id}:reversal`,
    paymentId: payment.id,
    consultationId: payment.consultationId,
    legs: [
      { accountKind: 'PLATFORM_CASH', direction: 'CREDIT', amountMinor: payment.amountMinor, currency: ccy, memo: 'chargeback settlement exit' },
      ...doctorLegs,
      ...(platformLegTotal > 0
        ? [{ accountKind: 'PLATFORM_FEE' as const, direction: 'DEBIT' as const, amountMinor: platformLegTotal, currency: ccy, memo: 'reverse platform commission on chargeback' }]
        : []),
    ],
  });

  // 4. Update earnings to REVERSED
  await db.doctorEarning.updateMany({
    where: { consultationId: payment.consultationId },
    data: { state: 'REVERSED' },
  });

  await auditCare({
    actorId: opts.actorId ?? 'SYSTEM',
    actorRole: opts.actorRole ?? 'FINANCE',
    action: 'payment.chargeback',
    consultationId: payment.consultationId,
    detail: { paymentId: payment.id, amountMinor: payment.amountMinor, reason: opts.reason },
  });

  return { success: true, paymentId: payment.id, transactionReference: txRes.reference };
}
