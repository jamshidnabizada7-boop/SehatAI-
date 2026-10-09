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
  | 'SUSPENSE'
  | 'PLATFORM_LOSS';

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
  PLATFORM_LOSS: (ccy) => `platform:loss:${ccy}`,
};

export async function getOrCreateAccount(opts: {
  kind: LedgerAccountKind;
  currency: string;
  ownerDoctorProfileId?: string | null;
  tx?: Parameters<Parameters<typeof db.$transaction>[0]>[0];
}) {
  const code = ACCOUNT_CODE[opts.kind](opts.currency.toUpperCase(), opts.ownerDoctorProfileId);
  const existing = await db.ledgerAccount.findUnique({ where: { code } });
  if (existing) return existing;
  try {
    return await db.ledgerAccount.create({
      data: {
        code,
        kind: opts.kind,
        currency: opts.currency.toUpperCase(),
        ownerDoctorProfileId: opts.ownerDoctorProfileId ?? null,
      },
    });
  } catch {
    // concurrent creation — re-read from db
    return db.ledgerAccount.findUniqueOrThrow({ where: { code } });
  }
}

/**
 * Post one balanced, immutable transaction. Throws on:
 * - unbalanced legs (per currency)
 * - zero/negative amounts
 * - duplicate idempotencyKey (already posted) → returns { alreadyPosted: true }
 */
export async function postTransaction(
  input: PostTransactionInput,
  existingTx?: any
): Promise<{ posted: boolean; reference: string }> {
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

  // Pre-resolve all accounts outside interactive transaction to prevent
  // PostgreSQL 25P02 aborted transaction block errors under concurrent posting
  const accountsByCode = new Map<string, { id: string }>();
  for (const leg of input.legs) {
    const code = ACCOUNT_CODE[leg.accountKind](leg.currency.toUpperCase(), leg.ownerDoctorProfileId);
    if (!accountsByCode.has(code)) {
      const account = await getOrCreateAccount({
        kind: leg.accountKind,
        currency: leg.currency,
        ownerDoctorProfileId: leg.ownerDoctorProfileId ?? null,
      });
      accountsByCode.set(code, account);
    }
  }

  const runTransaction = async (tx: any) => {
    // Idempotency probe: leg keys are deterministic `${key}:${index}` —
    // if leg 0 exists, this transaction was already posted → replay, skip.
    const existing = await tx.ledgerEntry.findFirst({
      where: { idempotencyKey: `${input.idempotencyKey}:0` },
      select: { id: true },
    });
    if (existing) return { posted: false, reference: input.reference };

    for (const [index, leg] of input.legs.entries()) {
      const code = ACCOUNT_CODE[leg.accountKind](leg.currency.toUpperCase(), leg.ownerDoctorProfileId);
      const account = accountsByCode.get(code)!;
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
  };

  if (existingTx) {
    return await runTransaction(existingTx);
  }

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await db.$transaction(runTransaction, { timeout: 15_000 });
    } catch (err: any) {
      if (err && typeof err === 'object' && err.code === 'P2002') {
        const target = err.meta?.target;
        const isTargetIdempotencyKey =
          (Array.isArray(target) && target.includes('idempotencyKey')) ||
          (typeof target === 'string' &&
            (target === 'idempotencyKey' ||
             target === 'LedgerEntry_idempotencyKey_key' ||
             target.endsWith('_idempotencyKey_key')));

        if (isTargetIdempotencyKey) {
          // Double-check: verify that a ledger entry with this exact idempotencyKey actually exists in the DB.
          // If it does not exist, then this is not an intended idempotency skip and must be thrown.
          const confirmed = await db.ledgerEntry.findFirst({
            where: { idempotencyKey: `${input.idempotencyKey}:0` },
            select: { id: true },
          });
          if (confirmed) {
            return { posted: false, reference: input.reference };
          }
        }
      }

      // Retry on transient PostgreSQL write conflicts / deadlocks (P2034, 40P01, 40001)
      const isTransient =
        err?.code === 'P2034' ||
        err?.message?.includes('40P01') ||
        err?.message?.includes('40001') ||
        err?.message?.includes('deadlock') ||
        err?.message?.includes('could not serialize access');
      if (isTransient && attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 50 + Math.random() * 50));
        continue;
      }

      throw err;
    }
  }

  throw new LedgerError('TRANSACTION_FAILED');
}

export interface LedgerBalance {
  currency: string;
  debitMinor: number;   // Σ debits on the account
  creditMinor: number;  // Σ credits on the account
  /** For doctor accounts the wallet UI uses: pending = credit−debit; available = credit−debit. */
  netMinor: number;
}

export async function balanceOf(code: string, txClient?: any): Promise<LedgerBalance | null> {
  const client = txClient ?? db;
  const account = await client.ledgerAccount.findUnique({ where: { code } });
  if (!account) return null;
  const grouped = await client.ledgerEntry.groupBy({
    by: ['direction'],
    where: { accountId: account.id },
    _sum: { amountMinor: true },
  });
  const debit = grouped.find((g: any) => g.direction === 'DEBIT')?._sum.amountMinor ?? 0;
  const credit = grouped.find((g: any) => g.direction === 'CREDIT')?._sum.amountMinor ?? 0;
  return { currency: account.currency, debitMinor: debit, creditMinor: credit, netMinor: credit - debit };
}

export async function doctorWallet(doctorProfileId: string, currency: string, txClient?: any) {
  const ccy = currency.toUpperCase();
  const [pending, available] = await Promise.all([
    balanceOf(`doctor:pending:${doctorProfileId}:${ccy}`, txClient),
    balanceOf(`doctor:available:${doctorProfileId}:${ccy}`, txClient),
  ]);
  return {
    currency: ccy,
    pendingMinor: pending?.netMinor ?? 0,
    availableMinor: available?.netMinor ?? 0,
  };
}
