// SehatAI — Phase 2: VAPID keys endpoint
// GET /api/push/vapid → public VAPID key for client subscription
import { NextResponse } from 'next/server';
import { getVapidKeys } from '@/lib/care/vapid';

export const runtime = 'nodejs';

export async function GET() {
  const keys = getVapidKeys();
  return NextResponse.json({
    publicKey: keys.publicKey,
  });
}
