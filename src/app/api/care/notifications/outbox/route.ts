// Care Connect §17 — Durable Outbox worker invocation route.
// Can be called by serverless cron (with CRON_SECRET or INTERNAL_WORKER_KEY)
// or by authenticated admin.
import { NextRequest, NextResponse } from 'next/server';
import { processNotificationOutbox } from '@/server/care/push-delivery';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const cronSecret = process.env.CRON_SECRET ?? process.env.INTERNAL_WORKER_KEY;

  let authorized = false;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    authorized = true;
  } else {
    try {
      await requireAdmin();
      authorized = true;
    } catch {
      authorized = false;
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized — requires worker secret or admin role' }, { status: 401 });
  }

  try {
    const result = await processNotificationOutbox(50);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
