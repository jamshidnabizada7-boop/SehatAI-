# SehatAI Unified Deployment & Operations Audit

**Audit Date**: October 8, 2026  
**Auditor**: Antigravity Reconciliation Engine (Zero-Base Audit)  
**Target Repository**: `D:\SehatAI-UNIFIED`  
**Classification**: **ENGINEERING PRODUCTION READY BUT EXTERNAL ACTIVATION BLOCKED**

---

## 1. Readiness Matrix

| Area | Engineering Implementation | Production Activation Status |
|---|---|---|
| **Next.js Production Build** | Compiles cleanly (94 pages / routes) | READY |
| **Prisma ORM & PostgreSQL** | Dual-target schema (SQLite dev, PostgreSQL prod) | READY |
| **Unified CI Pipeline** | `.github/workflows/ci.yml` (typecheck, lint, safety, care, build) | READY |
| **Durable Notification Outbox** | Database queue with retry backoff & worker endpoint | READY |
| **Private Document Storage** | Private disk storage with magic byte validation | STAGING READY (requires S3/GCS bucket in prod) |
| **Payment Provider Integration** | Abstraction complete (mock, pk-local, hesabpay, card) | BLOCKED (requires merchant agreement) |
| **Doctor Payouts** | Ledger calculation and approval flows complete | BLOCKED (requires commercial bank API) |
| **WebRTC Calling Infrastructure** | Signaling scaffold & fallback ladder complete | BLOCKED (requires LiveKit / TURN deployment) |
| **Legal Agreements** | 11 draft policies drafted in `docs/legal/` | BLOCKED (requires legal counsel sign-off) |

---

## 2. Activation Checklist for Staging & Production

Before promoting the application from engineering testing to public user traffic:

1. **Database**:
   - Provision a PostgreSQL database instance (Neon / Supabase / AWS RDS).
   - Set `DATABASE_URL` with connection pooling enabled.
   - Run `bunx prisma migrate deploy`.
2. **Payment Credentials**:
   - Obtain live merchant API keys from licensed payment aggregators.
   - Set `CARE_PAYMENT_PROVIDER` and corresponding credentials in secret manager.
3. **WebRTC & TURN**:
   - Deploy managed LiveKit cluster or coturn TURN server.
   - Set `CARE_VIDEO_PROVIDER=livekit`, `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET`.
4. **Push & Background Workers**:
   - Generate production VAPID key pair via `webpush.generateVAPIDKeys()`.
   - Configure a recurring cron job (every 60s) targeting `POST /api/care/notifications/outbox` with `CRON_SECRET`.
5. **Private Object Storage**:
   - Provision private AWS S3 bucket with default SSE-KMS encryption.
   - Set `CARE_S3_BUCKET`, `CARE_S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.
