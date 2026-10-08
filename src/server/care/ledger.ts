// ============================================================
// Care Connect §8 — double-entry financial ledger. CRITICAL.
// Doctor wallet balances are NEVER computed from consultation rows —
// only from immutable ledger entries. Every money movement posts a
// balanced transaction (Σdebits = Σcredits per currency). Old entries
// are never modified; corrections create compensating entries.
// Idempotency: LedgerEntry.idempotencyKey is UNIQUE — the same
// movement can never post twice (§58).
// ============================================================
import { db } from '@/lib/db';

export type LedgerAccountKind =
  | 'PLATFORM_CASH'
  | 'PLATFORM_FEE'
  | 'PROCESSOR_FEE'
  | 'DOCTOR_PENDING'
  | 'DOCTOR_AVAILABLE'
  | 'REFUND_RESERVE'
  | 'PAYOUT_CLEARING'
  | 'SUSPENSE';

export interface LedgerLeg {
  accountKind: LedgerAccountKind;
  ownerDoctorProfileId?: string | null;
  direction: 'DEBIT' | 'CREDIT';
  amountMinor: number;
  currency: string;
  memo?: string;
}

export interface PostTransactionInput {
  reference: string;            // business txn reference (payment id, refund id, payout id)
  idempotencyKey: string;       // unique — replay-proof
  legs: LedgerLeg[];
  consultationId?: string;
  paymentId?: string;
  payoutId?: string;
  refundId?: string;
}

export class LedgerError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

const ACCOUNT_CODE: Record<LedgerAccountKind, (ccy: string, owner?: string | null) => string> = {
  PLATFORM_CASH: (ccy) => `platform:cash:${ccy}`,
  PLATFORM_FEE: (ccy) => `platform:fee:${ccy}`,
  PROCESSOR_FEE: (ccy) => `processor:fee:${ccy}`,
  DOCTOR_PENDING: (ccy, owner) => `doctor:pending:${owner}:${ccy}`,
  DOCTOR_AVAILABLE: (ccy, owner) => `doctor:available:${owner}:${ccy}`,
  REFUND_RESERVE: (ccy) => `refund:reserve:${ccy}`,
  PAYOUT_CLEARING: (ccy) => `payout:clearing:${ccy}`,
  SUSPENSE: (ccy) => `suspense:${ccy}`,
};

export async function getOrCreateAccount(opts: {
  kind: LedgerAccountKind;
  currency: string;
  ownerDoctorProfileId?: string | null;
  tx?: Parameters<Parameters<typeof db.$transaction>[0]>[0];
}) {
  const code = ACCOUNT_CODE[opts.kind](opts.currency.toUpperCase(), opts.ownerDoctorProfileId);
  const client = opts.tx ?? db;
  const existing = await client.ledgerAccount.findUnique({ where: { code } });
  if (existing) return existing;
  try {
    return await client.ledgerAccount.create({
      data: {
        code,
        kind: opts.kind,
        currency: opts.currency.toUpperCase(),
        ownerDoctorProfileId: opts.ownerDoctorProfileId ?? null,
      },
    });
  } catch {
    // concurrent creation — re-read
    return client.ledgerAccount.findUniqueOrThrow({ where: { code } });
  }
}

/**
 * Post one balanced, immutable transaction. Throws on:
 * - unbalanced legs (per currency)
 * - zero/negative amounts
 * - duplicate idempotencyKey (already posted) → returns { alreadyPosted: true }
 */
export async function postTransaction(input: PostTransactionInput): Promise<{ posted: boolean; reference: string }> {
  if (!input.legs.length) throw new LedgerError('EMPTY_LEGS');
  const byCurrency = new Map<string, { debit: number; credit: number }>();
  for (const leg of input.legs) {
    if (!Number.isInteger(leg.amountMinor) || leg.amountMinor <= 0) {
      throw new LedgerError('INVALID_LEG_AMOUNT');
    }
    const ccy = leg.currency.toUpperCase();
    const acc = byCurrency.get(ccy) ?? { debit: 0, credit: 0 };
    if (leg.direction === 'DEBIT') acc.debit += leg.amountMinor;
    else acc.credit += leg.amountMinor;
    byCurrency.set(ccy, acc);
  }
  for (const [ccy, sums] of byCurrency) {
    if (sums.debit !== sums.credit) {
      throw new LedgerError(`UNBALANCED: ${ccy} debits ${sums.debit} != credits ${sums.credit}`);
    }
  }

  try {
    return await db.$transaction(async (tx) => {
      // Idempotency probe: leg keys are deterministic `${key}:${index}` —
      // if leg 0 exists, this transaction was already posted → replay, skip.
      const existing = await tx.ledgerEntry.findFirst({
        where: { idempotencyKey: `${input.idempotencyKey}:0` },
        select: { id: true },
      });
      if (existing) return { posted: false, reference: input.reference };

      for (const [index, leg] of input.legs.entries()) {
        const account = await getOrCreateAccount({
          kind: leg.accountKind,
          currency: leg.currency,
          ownerDoctorProfileId: leg.ownerDoctorProfileId ?? null,
          tx,
        });
        await tx.ledgerEntry.create({
          data: {
            accountId: account.id,
            direction: leg.direction,
            amountMinor: leg.amountMinor,
            currency: leg.currency.toUpperCase(),
            consultationId: input.consultationId,
            paymentId: input.paymentId,
            payoutId: input.payoutId,
            refundId: input.refundId,
            reference: input.reference,
            idempotencyKey: `${input.idempotencyKey}:${index}`,
            memo: leg.memo,
          },
        });
      }
      return { posted: true, reference: input.reference };
    }, { timeout: 15_000 });
  } catch (err: any) {
    if (err.code === 'P2002' && (err.meta?.target?.includes('idempotencyKey') || String(err).includes('idempotencyKey'))) {
      return { posted: false, reference: input.reference };
    }
    throw err;
  }
}

export interface LedgerBalance {
  currency: string;
  debitMinor: number;   // Σ debits on the account
  creditMinor: number;  // Σ credits on the account
  /** For doctor accounts the wallet UI uses: pending = credit−debit; available = credit−debit. */
  netMinor: number;
}

export async function balanceOf(code: string): Promise<LedgerBalance | null> {
  const account = await db.ledgerAccount.findUnique({ where: { code } });
  if (!account) return null;
  const grouped = await db.ledgerEntry.groupBy({
    by: ['direction'],
    where: { accountId: account.id },
    _sum: { amountMinor: true },
  });
  const debit = grouped.find((g) => g.direction === 'DEBIT')?._sum.amountMinor ?? 0;
  const credit = grouped.find((g) => g.direction === 'CREDIT')?._sum.amountMinor ?? 0;
  return { currency: account.currency, debitMinor: debit, creditMinor: credit, netMinor: credit - debit };
}

export async function doctorWallet(doctorProfileId: string, currency: string) {
  const ccy = currency.toUpperCase();
  const [pending, available] = await Promise.all([
    balanceOf(`doctor:pending:${doctorProfileId}:${ccy}`),
    balanceOf(`doctor:available:${doctorProfileId}:${ccy}`),
  ]);
  return {
    currency: ccy,
    pendingMinor: pending?.netMinor ?? 0,
    availableMinor: available?.netMinor ?? 0,
  };
}
