// Care Connect §62 — push delivery helper (server-side).
// Delivers PENDING in-app notifications as web-push messages to the
// user's registered subscriptions. Lock-screen text comes ONLY from
// the Notification row (already privacy-safe). Email/SMS adapters are
// BLOCKED BY EXTERNAL PROVIDER (no provider agreements yet).
import webpush from 'web-push';
import { db } from '@/lib/db';

let vapidReady = false;
function ensureVapid(): boolean {
  if (vapidReady) return true;
  const pub = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails('mailto:support@sehatai.health', pub, priv);
  vapidReady = true;
  return true;
}

/** Attempt push delivery for one user's pending notifications. Best-effort. */
export async function deliverPendingPush(userId: string): Promise<{ sent: number; failed: number }> {
  const notifications = await db.notification.findMany({
    where: { userId, state: 'PENDING', channel: { in: ['inapp', 'push'] } },
    orderBy: { createdAt: 'asc' },
    take: 10,
  });
  if (notifications.length === 0) return { sent: 0, failed: 0 };
  if (!ensureVapid()) return { sent: 0, failed: 0 };

  const subscriptions = await db.pushSubscription.findMany({ where: { userId }, take: 5 });
  let sent = 0;
  let failed = 0;
  for (const notification of notifications) {
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: JSON.parse(subscription.keys) },
          JSON.stringify({
            title: notification.title,
            body: notification.body, // privacy-safe (§62)
            consultationId: notification.consultationId ?? undefined,
            type: notification.type,
          }),
          { TTL: 3600 },
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        // 410 Gone / 404 Not Found → subscription expired; remove it (§62)
        const statusCode = typeof err === 'object' && err !== null && 'statusCode' in err ? (err as { statusCode: number }).statusCode : 0;
        if (statusCode === 410 || statusCode === 404) {
          await db.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => undefined);
        }
      }
    }
    await db.notification.update({
      where: { id: notification.id },
      data: { state: 'SENT', sentAt: new Date() },
    }).catch(() => undefined);
  }
  return { sent, failed };
}
