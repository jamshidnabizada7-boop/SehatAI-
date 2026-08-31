// SehatAI — Phase 2: VAPID keys endpoint
// GET /api/push/vapid → public VAPID key for client subscription
// On first call, generates + caches a VAPID keypair in memory (dev).
// In production, set VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY env vars.
import { NextResponse } from 'next/server';
import webpush from 'web-push';

export const runtime = 'nodejs';

// In-memory key cache (dev only — use env vars in production)
let cachedKeys: { publicKey: string; privateKey: string } | null = null;

function getVapidKeys() {
  // Use env vars if available
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };
  }
  // Generate + cache (dev only)
  if (!cachedKeys) {
    cachedKeys = webpush.generateVAPIDKeys();
    console.log('[push] Generated VAPID keys (dev) — set VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY for production');
  }
  return cachedKeys;
}

// Configure web-push
const vapidSubject = process.env.NEXTAUTH_URL || 'mailto:dev@sehatai.pk';

export function getVapidConfig() {
  const keys = getVapidKeys();
  webpush.setVapidDetails(vapidSubject, keys.publicKey, keys.privateKey);
  return keys;
}

export async function GET() {
  const keys = getVapidKeys();
  return NextResponse.json({
    publicKey: keys.publicKey,
  });
}
