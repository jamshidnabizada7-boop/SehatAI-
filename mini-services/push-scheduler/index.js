// SehatAI — Push Notification Scheduler (mini-service)
// Runs every 5 minutes, checks for due reminders, and sends push notifications
// via the web-push API. Uses the same Prisma database.
// Port: 3031
import express from 'express';
import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';
import cors from 'cors';

const app = express();
const PORT = 3031;
const prisma = new PrismaClient();

// VAPID keys (auto-generated in dev)
let vapidKeys: { publicKey: string; privateKey: string } | null = null;

function getVapidKeys() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  }
  if (!vapidKeys) {
    vapidKeys = webpush.generateVAPIDKeys();
    console.log('[push-scheduler] Generated VAPID keys (dev)');
  }
  return vapidKeys;
}

function initWebPush() {
  const keys = getVapidKeys();
  webpush.setVapidDetails(
    process.env.NEXTAUTH_URL || 'mailto:dev@sehatai.pk',
    keys.publicKey,
    keys.privateKey
  );
}

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'push-scheduler', port: PORT });
});

// Check + send due reminders
app.post('/check-and-send', async (req, res) => {
  try {
    initWebPush();

    // Find reminders that are due
    const dueReminders = await prisma.reminder.findMany({
      where: {
        status: 'active',
        nextDue: { lte: new Date() },
      },
      take: 50,
    });

    console.log(`[push-scheduler] Found ${dueReminders.length} due reminders`);

    let sentCount = 0;
    let failedCount = 0;

    for (const reminder of dueReminders) {
      // Try to find a push subscription for this user/session
      // (In a real system, we'd map session → user → subscriptions)
      // For now, send to ALL subscriptions (demo)
      const subscriptions = await prisma.pushSubscription.findMany({
        take: 10, // limit per cycle
      });

      for (const sub of subscriptions) {
        try {
          const payload = JSON.stringify({
            title: `SehatAI — ${reminder.title}`,
            body: reminder.notes || reminder.title,
            icon: '/icon.svg',
            tag: `reminder-${reminder.id}`,
            data: { reminderId: reminder.id, url: '/' },
          });

          const keys = JSON.parse(sub.keys);
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: keys.p256dh, auth: keys.auth },
            },
            payload
          );
          sentCount++;
        } catch (err) {
          // Subscription may have expired — mark as failed
          failedCount++;
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription gone — delete it
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
        }
      }

      // Update reminder's nextDue (advance by 1 day for daily reminders)
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 1);
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { nextDue },
      });
    }

    res.json({
      checked: dueReminders.length,
      sent: sentCount,
      failed: failedCount,
    });
  } catch (err) {
    console.error('[push-scheduler] Error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

app.listen(PORT, () => {
  console.log(`[push-scheduler] Running on port ${PORT}`);
  console.log(`[push-scheduler] Health check: http://localhost:${PORT}/health`);
});
