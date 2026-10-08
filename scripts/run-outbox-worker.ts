#!/usr/bin/env bun
// ============================================================
// SehatAI Care Connect — Standalone Durable Outbox Worker
// Processes queued notifications from NotificationOutbox with
// atomic queue locking, retries, exponential backoff, dead-lettering,
// and stuck-job recovery.
//
// Usage:
//   bun scripts/run-outbox-worker.ts [--interval 3000] [--batch 20] [--once] [--replay-dead-letters]
// ============================================================
import { processNotificationOutbox, replayDeadLetterJobs, recoverStuckJobs } from '../src/server/care/push-delivery';

const args = process.argv.slice(2);
function getArg(name: string, fallback: string): string {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return fallback;
}

const intervalMs = Number(getArg('--interval', '3000'));
const batchSize = Number(getArg('--batch', '20'));
const runOnce = args.includes('--once');
const shouldReplayDeadLetters = args.includes('--replay-dead-letters');

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n[OutboxWorker] Received ${signal}. Gracefully stopping outbox worker...`);
  // Allow running batch to finish
  setTimeout(() => {
    console.log('[OutboxWorker] Shutdown complete.');
    process.exit(0);
  }, 1000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

async function main() {
  console.log('====================================================');
  console.log('SehatAI Care Connect Durable Outbox Worker');
  console.log(`Mode: ${runOnce ? 'Single-run' : `Continuous (interval: ${intervalMs}ms)`}`);
  console.log(`Batch size: ${batchSize}`);
  console.log('====================================================');

  if (shouldReplayDeadLetters) {
    console.log('[OutboxWorker] Replaying dead-letter jobs as requested...');
    const replayed = await replayDeadLetterJobs();
    console.log(`[OutboxWorker] Replayed ${replayed} dead-letter jobs back to PENDING.`);
  }

  // Initial stuck job recovery
  const initialReclaimed = await recoverStuckJobs();
  if (initialReclaimed > 0) {
    console.log(`[OutboxWorker] Reclaimed ${initialReclaimed} orphaned jobs from previous crashes.`);
  }

  let loopCount = 0;
  while (!shuttingDown) {
    loopCount++;
    try {
      const stats = await processNotificationOutbox(batchSize);
      if (stats.processed > 0 || stats.reclaimed > 0) {
        console.log(`[OutboxWorker] [Run #${loopCount}] Processed: ${stats.processed}, Delivered: ${stats.delivered}, DeadLetter: ${stats.deadLetter}, Reclaimed: ${stats.reclaimed}`);
      }
    } catch (err: unknown) {
      console.error(`[OutboxWorker] Error during batch run #${loopCount}:`, err);
    }

    if (runOnce) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  console.log('[OutboxWorker] Worker stopped.');
}

main().catch((err) => {
  console.error('[OutboxWorker] Fatal startup error:', err);
  process.exit(1);
});
