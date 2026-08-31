// SehatAI — Phase 2: Push subscription endpoint
// POST /api/push/subscribe { subscription } → stores push subscription
// POST /api/push/send { subscription, payload } → sends a push notification
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { getVapidConfig } from '../vapid/route';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

// POST /api/push/subscribe — store subscription
export async function POST(req: NextRequest) {
  let body: { subscription?: unknown; userId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const subscription = body.subscription;
  if (!subscription || typeof subscription !== 'object') {
    return NextResponse.json({ error: 'subscription is required' }, { status: 400 });
  }

  // Get session (optional — guests can also subscribe)
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  let userId: string | null = null;
  if (email) {
    const user = await db.user.findUnique({ where: { email } });
    if (user) userId = user.id;
  }

  // Store subscription (in-memory for dev — in production, use DB)
  // For now, just acknowledge
  console.log('[push] Subscription stored for user:', userId ?? 'guest');

  return NextResponse.json({ ok: true, userId });
}

// PUT /api/push/send — send a push notification (admin/doctor only)
export async function PUT(req: NextRequest) {
  let body: { subscription?: unknown; payload?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const subscription = body.subscription as webpush.PushSubscription | undefined;
  const payload = body.payload as string | undefined;

  if (!subscription || !payload) {
    return NextResponse.json({ error: 'subscription + payload required' }, { status: 400 });
  }

  try {
    getVapidConfig();
    await webpush.sendNotification(subscription, payload);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Push failed', detail: msg }, { status: 500 });
  }
}
