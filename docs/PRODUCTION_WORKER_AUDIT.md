# SehatAI Care Connect Production Background Worker & Outbox Audit

**Document ID:** WRK-AUDIT-2026-10-08-06  
**Target Module:** `src/server/care/push-delivery.ts` & `scripts/run-outbox-worker.ts`  
**Classification:** DISTRIBUTED SYSTEMS RELIABILITY AUDIT  
**Date:** October 8, 2026  

---

## 1. Executive Summary (§17 & §62)

To ensure high availability and prevent slow external push notification gateways (Web-Push, APNs, FCM) from blocking patient-facing HTTP request threads, SehatAI implements a **Durable Notification Outbox Pattern**.

Notification rows created during consultations (e.g., booking confirmations, message alerts, prescription readiness) are staged synchronously in `NotificationOutbox` and processed asynchronously by worker instances.

---

## 2. Distributed Queue Architecture

```
[Web Application / API Routes]
             │
             ▼
[Stage in DB Transaction] (NotificationOutbox: status=PENDING, nextAttemptAt=now)
             │
             ▼
   [Database Persistence]
             │
             ▼
[Worker Poll Loop: run-outbox-worker.ts]
             │
    ┌────────┴────────┐
    ▼                 ▼
[Worker 1]        [Worker 2]  (Multi-Worker Concurrency)
    │                 │
    └────────┬────────┘
             ▼
[Atomic Queue Lock] (updateMany WHERE status='PENDING' -> status='CLAIMED')
   • count === 1: Process payload
   • count === 0: Handled by peer worker (Zero Double-Dispatch)
             │
             ├────── SUCCESS ─────> status = 'DELIVERED'
             │
             └────── FAILURE ─────> attempts += 1
                                       ├── attempts < 5 ──> Exponential Backoff (30s * 2^att)
                                       │                    status = 'PENDING'
                                       └── attempts >= 5 ─> status = 'DEAD_LETTER'
```

---

## 3. Concurrency Safety & Atomic Queue Claims

In high-concurrency environments with multiple container replicas, workers reading identical batches risk dispatching duplicate push notifications.

To eliminate this race condition:
```typescript
const claim = await db.notificationOutbox.updateMany({
  where: { id: item.id, status: 'PENDING' },
  data: { status: 'CLAIMED', updatedAt: new Date() },
});
if (claim.count === 0) {
  // Already claimed by a concurrent worker — skip immediately
  continue;
}
```
Only the worker instance that successfully transitions the row from `PENDING` to `CLAIMED` proceeds to dispatch the push payload.

---

## 4. Exponential Backoff & Dead-Letter Routing

When external push gateways return transient errors (e.g., gateway timeouts, 503 service unavailable, rate limits):
1. **Backoff Schedule:**
   - Attempt 1: 60 seconds delay
   - Attempt 2: 120 seconds delay
   - Attempt 3: 240 seconds delay
   - Attempt 4: 480 seconds delay
2. **Dead-Letter Routing:**
   - After reaching `maxAttempts` (default: 5), the job is transitioned to `status: 'DEAD_LETTER'` with `lastError` captured.
   - Prevents poison-pill messages from saturating the active queue.
3. **Unconfigured Push Gateway Protection:**
   - When VAPID keys are absent, push delivery flags `unconfigured: true`.
   - The worker retains `status: 'PENDING'` and records `lastError: 'VAPID_NOT_CONFIGURED'` instead of falsely marking items `DELIVERED` when `sent === 0`.

---

## 5. Crash Recovery & Operator Controls

### Automatic Stuck-Job Recovery (`recoverStuckJobs`)
If a worker process crashes, is terminated by OOM killer, or restarts mid-batch, jobs remain in `CLAIMED` status.
- Before every batch loop, the worker reclaims any job where `status IN ('CLAIMED', 'PROCESSING')` and `updatedAt <= now - 5 minutes`.
- Reclaimed jobs are reset to `status: 'PENDING'` with `lastError: 'RECLAIMED_FROM_STUCK_WORKER'`.

### Operator Replay (`replayDeadLetterJobs`)
Operators can replay failed jobs once underlying gateway outages are resolved:
- `replayDeadLetterJobs()` resets `DEAD_LETTER` items to `PENDING` with `attempts: 0` and immediate `nextAttemptAt`.
- CLI command: `bun scripts/run-outbox-worker.ts --replay-dead-letters`.

---

## 6. Standalone Worker Daemon (`scripts/run-outbox-worker.ts`)

- **Execution:** `bun scripts/run-outbox-worker.ts [--interval 3000] [--batch 20] [--once]`
- **Signal Handling:** Listens for `SIGTERM` and `SIGINT`, allows currently executing dispatches to complete gracefully before exiting.
- **Production Deployment:** Can be managed via Systemd, PM2, or as a standalone Kubernetes worker pod.
