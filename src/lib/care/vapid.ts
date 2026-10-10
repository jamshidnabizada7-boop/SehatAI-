import webpush from 'web-push';

let cachedKeys: { publicKey: string; privateKey: string } | null = null;

export function getVapidKeys(): { publicKey: string; privateKey: string } {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };
  }
  if (!cachedKeys) {
    cachedKeys = webpush.generateVAPIDKeys();
    console.log('[push] Generated VAPID keys (dev) — set VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY for production');
  }
  return cachedKeys!;
}

const vapidSubject = process.env.NEXTAUTH_URL || 'mailto:dev@sehatai.pk';

export function getVapidConfig() {
  const keys = getVapidKeys();
  webpush.setVapidDetails(vapidSubject, keys.publicKey, keys.privateKey);
  return keys;
}
