// ============================================================
// Care Connect §58 — idempotency.
// A repeated request must not charge twice, refund twice, pay the
// doctor twice, or book a slot twice. DB-backed (works across
// processes/serverless) with atomic insert-if-absent semantics.
// ============================================================
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';

export type IdempotencyScope =
  | 'payment.create'
  | 'payment.confirm'
  | 'webhook.process'
  | 'refund.create'
  | 'payout.create'
  | 'consultation.book'
  | 'review.create';

export class IdempotencyReplayError extends Error {
  result: unknown;
  constructor(result: unknown) {
    super('IDEMPOTENT_REPLAY');
    this.result = result;
  }
}

export interface IdempotencyResult<T> {
  key: string;
  result: T;
  replayed: boolean;
}

/**
 * Run `fn` once per key. Concurrent/repeat callers with the same key:
 *  - if a previous run COMPLETED → replay its stored result
 *  - if a run is IN_PROGRESS → throw IdempotencyReplayError (caller returns 409/retry)
 *  - if no run → execute inside a claimed key
 */
export async function withIdempotency<T>(
  key: string | undefined | null,
  scope: IdempotencyScope,
  fn: () => Promise<T>,
  opts?: { ttlHours?: number },
): Promise<IdempotencyResult<T>> {
  // No key supplied → run uncached (tests / non-idempotent ops still work)
  if (!key) {
    return { key: `anon:${randomUUID()}`, result: await fn(), replayed: false };
  }

  const expiresAt = new Date(Date.now() + (opts?.ttlHours ?? 24) * 3600_000);

  // Atomic claim: create row only if it doesn't exist.
  try {
    await db.idempotencyKey.create({ data: { key, scope, status: 'IN_PROGRESS', expiresAt } });
  } catch {
    const existing = await db.idempotencyKey.findUnique({ where: { key } });
    if (!existing) throw new Error('IDEMPOTENCY_CLAIM_FAILED');
    if (existing.status === 'COMPLETED') {
      throw new IdempotencyReplayError(existing.resultJson ? JSON.parse(existing.resultJson) : null);
    }
    throw new IdempotencyReplayError(null); // IN_PROGRESS or FAILED → concurrent/retry
  }

  try {
    const result = await fn();
    await db.idempotencyKey.update({
      where: { key },
      data: {
        status: 'COMPLETED',
        resultJson: safeJson(result),
      },
    });
    return { key, result, replayed: false };
  } catch (err) {
    await db.idempotencyKey.update({ where: { key }, data: { status: 'FAILED' } }).catch(() => undefined);
    throw err;
  }
}

function safeJson(v: unknown): string | undefined {
  try {
    return JSON.stringify(v ?? null);
  } catch {
    return undefined;
  }
}

/**
 * Cheap scope-level guard for endpoints that need coarse uniqueness
 * (e.g. one open payment per consultation) BEFORE the full flow.
 */
export async function acquireScopedLock(key: string, scope: IdempotencyScope, ttlHours = 1): Promise<boolean> {
  try {
    await db.idempotencyKey.create({
      data: { key, scope, status: 'IN_PROGRESS', expiresAt: new Date(Date.now() + ttlHours * 3600_000) },
    });
    return true;
  } catch {
    return false;
  }
}

export async function releaseScopedLock(key: string): Promise<void> {
  await db.idempotencyKey.deleteMany({ where: { key } }).catch(() => undefined);
}
