// ============================================================
// Care Connect §62 — Notification service.
// Creates in-app Notification rows; push/email/SMS delivery is
// provider-abstracted. Lock-screen privacy is enforced here:
// NEVER put clinical details in title/body (§62).
// Implements §17 Durable Outbox pattern for fault-tolerant delivery.
// ============================================================
import { db } from '@/lib/db';
import { deliverPendingPush } from './push-delivery';

export type CareNotificationType =
  | 'consultation.confirmed'
  | 'consultation.doctor_accepted'
  | 'consultation.scheduled'
  | 'consultation.doctor_joined'
  | 'consultation.ending'
  | 'consultation.completed'
  | 'consultation.cancelled'
  | 'message.received'
  | 'prescription.available'
  | 'refund.processed'
  | 'payout.processed'
  | 'review.received';

const PRIVACY_SAFE_TEXT: Record<CareNotificationType, { title: string; body: string }> = {
  'consultation.confirmed': { title: 'Care Connect', body: 'Your consultation booking is confirmed.' },
  'consultation.doctor_accepted': { title: 'Care Connect', body: 'A doctor accepted your consultation request.' },
  'consultation.scheduled': { title: 'Care Connect', body: 'Your consultation is scheduled. Open the app for details.' },
  'consultation.doctor_joined': { title: 'Care Connect', body: 'Your consultation is ready to start.' },
  'consultation.ending': { title: 'Care Connect', body: 'Your consultation window is ending soon.' },
  'consultation.completed': { title: 'Care Connect', body: 'Your consultation is complete. View your summary.' },
  'consultation.cancelled': { title: 'Care Connect', body: 'A consultation was cancelled. Refund status in the app.' },
  'message.received': { title: 'Care Connect', body: 'You have a new message about your consultation.' },
  'prescription.available': { title: 'Care Connect', body: 'A document is available from your consultation.' },
  'refund.processed': { title: 'Care Connect', body: 'A refund was processed to your payment method.' },
  'payout.processed': { title: 'Care Connect', body: 'A payout was processed to your account.' },
  'review.received': { title: 'Care Connect', body: 'You received a new rating.' },
};

export async function notify(opts: {
  userId: string;
  type: CareNotificationType;
  consultationId?: string;
  channel?: 'inapp' | 'push' | 'email' | 'sms';
  data?: Record<string, unknown>;
}, client: typeof db | import("@prisma/client").Prisma.TransactionClient = db): Promise<void> {
  if (client === db) {
    await db.$transaction(tx => notify(opts, tx));
    void deliverPendingPush(opts.userId).catch(() => undefined);
    return;
  }
  const safe = PRIVACY_SAFE_TEXT[opts.type] ?? { title: 'Care Connect', body: 'You have an update in Care Connect.' };
  const notif = await client.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      channel: opts.channel ?? 'inapp',
      title: safe.title,
      body: safe.body,
      consultationId: opts.consultationId,
      dataJson: opts.data ? JSON.stringify(opts.data) : undefined,
      state: 'PENDING',
    },
  });

  // §17 / §62 Durable Outbox: persist message for asynchronous/worker delivery
  await client.notificationOutbox.create({
    data: {
      notificationId: notif.id,
      channel: opts.channel ?? 'push',
      payloadJson: JSON.stringify({
        userId: opts.userId,
        notificationId: notif.id,
        title: safe.title,
        body: safe.body,
        consultationId: opts.consultationId,
        type: opts.type,
      }),
      status: 'PENDING',
    },
  });

  // Optimistic dispatch in current request lifecycle; failure will be retried by outbox worker
}

export async function notifyMany(userIds: string[], opts: {
  type: CareNotificationType;
  consultationId?: string;
  data?: Record<string, unknown>;
}, client: typeof db | import("@prisma/client").Prisma.TransactionClient = db): Promise<void> {
  await Promise.all(userIds.map((userId) => notify({ userId, ...opts }, client)));
}
