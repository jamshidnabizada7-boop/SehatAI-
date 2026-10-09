// ============================================================
// Care Connect §13 — doctor earnings + payouts.
// Doctor wallet UI is DERIVED from the ledger (§8) — never from
// consultation rows. Payouts: PENDING → PROCESSING → PAID/FAILED/
// REVERSED with provider confirmation; idempotent; double-payout
// impossible (earnings rows are atomically claimed, §59).
// ============================================================
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { getPaymentProvider } from './payments/registry';
import { postTransaction, doctorWallet } from './ledger';
import { PAYOUT_TRANSITIONS, assertTransition, type PayoutState } from '@/lib/care/constants';
import { auditCare } from './audit';

export class PayoutError extends Error {
  status: number;
  code: string;
  constructor(code: string, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

/** Promote earnings whose availability delay has elapsed (lazy, no cron). */
export async function promoteDueEarnings(): Promise<number> {
  const due = await db.doctorEarning.findMany({
    where: { state: 'PENDING', availableAt: { lte: new Date() } },
    take: 100,
  });
  for (const earning of due) {
    const tx = await db.$transaction(async (txClient) => {
      // Atomically claim: only move PENDING rows (double-promotion safe).
      const claimed = await txClient.doctorEarning.updateMany({
        where: { id: earning.id, state: 'PENDING' },
        data: { state: 'AVAILABLE' },
      });
      if (claimed.count === 0) return false;
      await postTransaction({
        reference: `earning:promote:${earning.id}`,
        idempotencyKey: `earning:promote:${earning.id}`,
        consultationId: earning.consultationId,
        legs: [
          { accountKind: 'DOCTOR_PENDING', ownerDoctorProfileId: earning.doctorProfileId, direction: 'DEBIT', amountMinor: earning.netMinor, currency: earning.currency, memo: 'promote to available' },
          { accountKind: 'DOCTOR_AVAILABLE', ownerDoctorProfileId: earning.doctorProfileId, direction: 'CREDIT', amountMinor: earning.netMinor, currency: earning.currency, memo: 'earning available' },
        ],
      });
      return true;
    });
    void tx;
  }
  return due.length;
}

export async function doctorEarningsView(opts: { doctorProfileId: string; currency: string }) {
  await promoteDueEarnings();
  const wallet = await doctorWallet(opts.doctorProfileId, opts.currency);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [paidThisMonth, lifetime, upcoming] = await Promise.all([
    db.payout.aggregate({
      where: { doctorProfileId: opts.doctorProfileId, currency: opts.currency, state: 'PAID', processedAt: { gte: monthStart } },
      _sum: { amountMinor: true },
    }),
    db.doctorEarning.aggregate({
      where: { doctorProfileId: opts.doctorProfileId, currency: opts.currency, state: { in: ['PAID'] } },
      _sum: { netMinor: true },
    }),
    db.doctorEarning.aggregate({
      where: { doctorProfileId: opts.doctorProfileId, currency: opts.currency, state: 'AVAILABLE' },
      _sum: { netMinor: true },
    }),
  ]);
  return {
    currency: opts.currency,
    availableMinor: wallet.availableMinor,
    pendingMinor: wallet.pendingMinor,
    paidThisMonthMinor: paidThisMonth._sum.amountMinor ?? 0,
    lifetimePaidMinor: lifetime._sum.netMinor ?? 0,
    upcomingPayoutMinor: upcoming._sum.netMinor ?? 0,
  };
}

/** §13 — doctor requests a payout of their AVAILABLE balance. */
export async function requestPayout(opts: { doctorProfileId: string; doctorUserId: string; currency?: string }) {
  await promoteDueEarnings();
  const doctor = await db.doctorProfile.findUnique({ where: { id: opts.doctorProfileId }, select: { country: true } });
  if (!doctor) throw new PayoutError('DOCTOR_NOT_FOUND', 404);
  const currency = (opts.currency ?? 'PKR').toUpperCase();

  const wallet = await doctorWallet(opts.doctorProfileId, currency);
  if (wallet.availableMinor <= 0) throw new PayoutError('NOTHING_AVAILABLE', 409);

  const method = await db.doctorProfile.findUnique({
    where: { id: opts.doctorProfileId },
    select: { payoutMethod: true },
  });
  if (!method?.payoutMethod) throw new PayoutError('PAYOUT_METHOD_REQUIRED');

  const payout = await db.$transaction(async (tx) => {
    // Acquire row-level lock on DoctorProfile to serialize concurrent payout requests
    await tx.doctorProfile.update({
      where: { id: opts.doctorProfileId },
      data: { updatedAt: new Date() },
    });

    // Re-verify available earnings under lock inside transaction
    const earnings = await tx.doctorEarning.findMany({
      where: { doctorProfileId: opts.doctorProfileId, currency, state: 'AVAILABLE' },
      orderBy: { availableAt: 'asc' },
    });
    const earningsSumMinor = earnings.reduce((sum, e) => sum + e.netMinor, 0);
    // Ledger invariant: Payout cannot exceed ledger wallet balance (debt recovery)
    const currentAvailableMinor = Math.min(earningsSumMinor, wallet.availableMinor);
    if (currentAvailableMinor <= 0) {
      throw new PayoutError('NOTHING_AVAILABLE', 409);
    }

    const created = await tx.payout.create({
      data: {
        doctorProfileId: opts.doctorProfileId,
        state: 'PENDING',
        amountMinor: currentAvailableMinor,
        currency,
        method: method.payoutMethod,
        requestedById: opts.doctorUserId,
        idempotencyKey: `payout_${randomUUID()}`,
      },
    });

    let remaining = currentAvailableMinor;
    for (const earning of earnings) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, earning.netMinor);
      if (take === earning.netMinor) {
        await tx.doctorEarning.updateMany({
          where: { id: earning.id, state: 'AVAILABLE' },
          data: { state: 'PAID' },
        });
      } else {
        await tx.doctorEarning.update({
          where: { id: earning.id },
          data: { netMinor: { decrement: take } },
        });
      }
      await tx.payoutItem.create({
        data: { payoutId: created.id, earningId: earning.id, amountMinor: take, currency },
      });
      remaining -= take;
    }
    if (remaining > 0) throw new PayoutError('LEDGER_MISMATCH', 500);
    return created;
  }, { timeout: 15_000 });

  await postTransaction({
    reference: `payout:${payout.id}`,
    idempotencyKey: `payout:${payout.id}:debit`,
    payoutId: payout.id,
    legs: [
      { accountKind: 'DOCTOR_AVAILABLE', ownerDoctorProfileId: opts.doctorProfileId, direction: 'DEBIT', amountMinor: payout.amountMinor, currency, memo: 'payout requested' },
      { accountKind: 'PAYOUT_CLEARING', direction: 'CREDIT', amountMinor: payout.amountMinor, currency, memo: 'in transit to doctor' },
    ],
  });

  await auditCare({ actorId: opts.doctorUserId, actorRole: 'DOCTOR', action: 'payout.requested', detail: { payoutId: payout.id, amountMinor: payout.amountMinor } });
  return payout;
}

/** Finance/admin or provider webhook advances the payout. */
export async function processPayout(opts: { payoutId: string; actorId?: string; actorRole?: string }) {
  const payout = await db.payout.findUnique({ where: { id: opts.payoutId } });
  if (!payout) throw new PayoutError('PAYOUT_NOT_FOUND', 404);
  if (payout.state !== 'PENDING' && payout.state !== 'FAILED') {
    return payout; // idempotent
  }

  await transitionPayout(payout.id, 'PROCESSING');
  const provider = getPaymentProvider(process.env.CARE_PAYOUT_PROVIDER ?? process.env.CARE_PAYMENT_PROVIDER);
  const result = await provider.createPayout({
    amountMinor: payout.amountMinor,
    currency: payout.currency,
    reference: payout.id,
    destination: safeParse(payout.methodRef),
  });

  if (result.state === 'PAID') {
    await transitionPayout(payout.id, 'PAID');
    await db.payout.update({
      where: { id: payout.id },
      data: { provider: provider.name, providerRef: result.providerRef, processedById: opts.actorId, processedAt: new Date() },
    });
    // Clearing → external (balanced, money left the platform's settlement view).
    await postTransaction({
      reference: `payout:${payout.id}`,
      idempotencyKey: `payout:${payout.id}:external`,
      payoutId: payout.id,
      legs: [
        { accountKind: 'PAYOUT_CLEARING', direction: 'DEBIT', amountMinor: payout.amountMinor, currency: payout.currency, memo: 'sent to provider' },
        { accountKind: 'SUSPENSE', direction: 'CREDIT', amountMinor: payout.amountMinor, currency: payout.currency, memo: 'external settlement (provider-held)' },
      ],
    });
    await auditCare({ actorId: opts.actorId, actorRole: opts.actorRole ?? 'SYSTEM', action: 'payout.paid', detail: { payoutId: payout.id } });
  } else if (result.state === 'FAILED') {
    await transitionPayout(payout.id, 'FAILED');
    await db.payout.update({ where: { id: payout.id }, data: { failureReason: 'provider reported failure' } });
  }
  return db.payout.findUnique({ where: { id: payout.id } });
}

async function transitionPayout(payoutId: string, to: PayoutState) {
  const payout = await db.payout.findUnique({ where: { id: payoutId } });
  if (!payout) throw new PayoutError('PAYOUT_NOT_FOUND', 404);
  assertTransition(PAYOUT_TRANSITIONS, payout.state as PayoutState, to);
  return db.payout.update({ where: { id: payoutId }, data: { state: to } });
}

/**
 * Retry a failed payout settlement.
 * Transitions FAILED -> PENDING, then executes processPayout.
 */
export async function retryPayout(opts: { payoutId: string; actorId?: string; actorRole?: string }) {
  const payout = await db.payout.findUnique({ where: { id: opts.payoutId } });
  if (!payout) throw new PayoutError('PAYOUT_NOT_FOUND', 404);
  if (payout.state !== 'FAILED') {
    throw new PayoutError(`CANNOT_RETRY_PAYOUT_STATE_${payout.state}`, 409);
  }

  // Reset to PENDING per state machine
  await db.payout.update({
    where: { id: payout.id },
    data: { state: 'PENDING', failureReason: null },
  });

  return processPayout(opts);
}

/**
 * Revert a failed payout settlement back to the doctor's available balance.
 * Returns funds from PAYOUT_CLEARING to DOCTOR_AVAILABLE and restores claimed earnings.
 */
export async function revertFailedPayout(opts: { payoutId: string; actorId?: string; actorRole?: string; reason?: string }) {
  const payout = await db.payout.findUnique({
    where: { id: opts.payoutId },
    include: { items: true },
  });
  if (!payout) throw new PayoutError('PAYOUT_NOT_FOUND', 404);
  if (payout.state !== 'FAILED' && payout.state !== 'PROCESSING') {
    throw new PayoutError(`CANNOT_REVERT_PAYOUT_STATE_${payout.state}`, 409);
  }

  // Compensating ledger transaction: return funds from PAYOUT_CLEARING back to DOCTOR_AVAILABLE
  await postTransaction({
    reference: `payout:revert:${payout.id}`,
    idempotencyKey: `payout:revert:${payout.id}:compensate`,
    payoutId: payout.id,
    legs: [
      { accountKind: 'PAYOUT_CLEARING', direction: 'DEBIT', amountMinor: payout.amountMinor, currency: payout.currency, memo: 'revert failed clearing' },
      { accountKind: 'DOCTOR_AVAILABLE', ownerDoctorProfileId: payout.doctorProfileId, direction: 'CREDIT', amountMinor: payout.amountMinor, currency: payout.currency, memo: 'restore doctor available balance' },
    ],
  });

  // Restore claimed earnings back to AVAILABLE
  const earningIds = payout.items.map((pi) => pi.earningId);
  if (earningIds.length > 0) {
    await db.doctorEarning.updateMany({
      where: { id: { in: earningIds }, state: 'PAID' },
      data: { state: 'AVAILABLE' },
    });
  }

  await db.payout.update({
    where: { id: payout.id },
    data: { state: 'REVERSED', failureReason: opts.reason ?? 'settlement failed, returned to doctor wallet' },
  });

  await auditCare({
    actorId: opts.actorId ?? 'SYSTEM',
    actorRole: opts.actorRole ?? 'FINANCE',
    action: 'payout.reverted',
    detail: { payoutId: payout.id, amountMinor: payout.amountMinor, reason: opts.reason },
  });

  return db.payout.findUnique({ where: { id: payout.id } });
}

function safeParse(v: string | null): Record<string, string> {
  try {
    return v ? (JSON.parse(v) as Record<string, string>) : {};
  } catch {
    return {};
  }
}
