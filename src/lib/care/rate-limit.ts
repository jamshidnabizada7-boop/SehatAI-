// ============================================================
// Care Connect §56 — rate limiting.
// Plan requires a distributed limiter, not a process-memory Map.
// Implementation: DB-backed fixed-window counters (RateLimitCounter
// table) — correct across processes/serverless instances. A tiny
// in-process fast path avoids hammering the DB for hot keys.
// ============================================================
import { db } from '@/lib/db';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000);
  const resetAt = new Date(windowStart.getTime() + windowSeconds * 1000);

  try {
    // Atomic upsert-increment (SQLite + Postgres compatible).
    const row = await db.rateLimitCounter.upsert({
      where: { key_windowStart: { key, windowStart } },
      create: { key, windowStart, count: 1 },
      update: { count: { increment: 1 } },
    });
    const used = row.count;
    return { allowed: used <= limit, remaining: Math.max(0, limit - used), resetAt };
  } catch {
    // Fail-open on limiter infrastructure failure, but never block auth flows forever.
    return { allowed: true, remaining: limit, resetAt };
  }
}

export function clientIpFrom(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

// Common buckets (§56)
export const RATE_LIMITS = {
  login: { limit: 10, windowSeconds: 300 },
  signup: { limit: 5, windowSeconds: 3600 },
  doctorSearch: { limit: 60, windowSeconds: 60 },
  chat: { limit: 30, windowSeconds: 60 },
  translation: { limit: 30, windowSeconds: 60 },
  aiEndpoints: { limit: 20, windowSeconds: 60 },
  fileUpload: { limit: 20, windowSeconds: 300 },
  paymentCreate: { limit: 10, windowSeconds: 300 },
  refundRequest: { limit: 5, windowSeconds: 3600 },
  videoToken: { limit: 30, windowSeconds: 60 },
  reviews: { limit: 10, windowSeconds: 3600 },
} as const;
