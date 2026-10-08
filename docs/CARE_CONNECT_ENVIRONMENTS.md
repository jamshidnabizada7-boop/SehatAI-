# SehatAI Care Connect — Environment Isolation Matrix (§92)

> **Document status:** System Architecture & Infrastructure Standard  
> **Rule (§92):** **NEVER test payments against production.** Development, staging, and production environments are strictly isolated with separate databases, cryptographic keys, object buckets, and payment webhook endpoints.

---

## 1. Environment Topology & Matrix

| Dimension | Local Development | Staging / Pre-Production | Production |
|---|---|---|---|
| **Host / URL** | `http://localhost:3000` | `https://staging.sehatai.health` | `https://sehatai.health` |
| **Database Engine** | SQLite (`file:./dev.db`) | PostgreSQL (Neon / RDS managed) | PostgreSQL (High-Availability multi-AZ) |
| **Prisma Workflow** | `prisma db push` | `prisma migrate deploy` (versioned) | `prisma migrate deploy` (versioned only) |
| **Payment Provider** | `mock` (`MockPaymentProvider`) | Sandbox gateways (`pk-local`, `hesabpay`) | Live merchant credentials only |
| **Mock Confirmation** | Allowed via `/api/care/payments/mock/confirm` | **Hard-blocked** (`CARE_ALLOW_MOCK_PAYMENTS=false`) | **Hard-blocked** (throws 403 in prod) |
| **Object Storage** | `local-private` (`storage/care/`, AES-256-GCM) | Private S3 Bucket (staging, KMS-encrypted) | Dedicated Private S3 Bucket (multi-region KMS) |
| **Video Signaling** | `mini-services/video-signal` (:3004) | Dedicated signaling cluster or LiveKit sandbox | High-availability LiveKit cloud / dedicated cluster |
| **Rollout Stage** | Stage 1 (Internal team) | Stage 2 (Invited alpha / staff) | Controlled rollout (Stage 3 → Stage 6) |
| **VAPID Keys** | Local development keys | Sandbox push project keys | Production PWA VAPID keypair |

---

## 2. Configuration Matrix by Environment

### 2.1 Database Isolation
- **Development:** Local SQLite SQLite file (`dev.db`). Destructive schema adjustments are acceptable during local test runs via `prisma db push --accept-data-loss`.
- **Staging & Production:** Strictly managed PostgreSQL instances. Schema modifications **MUST NEVER** use `db push`. All migrations must be recorded as versioned migrations (`prisma/migrations/`) and executed via `npx prisma migrate deploy` in the release phase.

### 2.2 Payment Security & Webhook Endpoints
- **Never Test Payments in Production:** Testing payments in production contaminates the commercial double-entry ledger, creates false tax obligations, and risks regulatory audit violations.
- **Webhook Trust Boundaries:**
  - In development, mock webhooks are signed using `CARE_MOCK_PAYMENT_SECRET` and processed via the local mock confirm handler.
  - In staging, payment provider sandboxes send webhooks to `https://staging.sehatai.health/api/care/payments/webhooks/[provider]`.
  - In production, live gateway credentials (`CARE_PK_GATEWAY_KEY`, `HESABPAY_API_KEY`) verify cryptographic signatures against incoming raw HTTP request bodies before posting ledger entries.

### 2.3 Cryptographic Key Isolation
Every environment must maintain distinct, non-overlapping secrets:
1. `NEXTAUTH_SECRET`: Independent 32+ character entropy string per environment.
2. `CARE_STORAGE_KEY`: Independent 32-byte key for AES-256-GCM object storage encryption. Compromising a development or staging key does not expose production patient files.
3. `CARE_VIDEO_TOKEN_SECRET`: Independent HMAC secret for 15-minute room access tokens.

---

## 3. Environment Promotion Checklist

Before promoting code or configurations across environments:
1. Ensure all Care Connect unit and integration tests pass cleanly (`bun test tests/care/`).
2. Verify zero regressions in safety gate (`bun test tests/tests/safety/`).
3. Ensure no Care surface TypeScript errors (`tsc --noEmit`).
4. Validate that all required environment variables for the target tier are configured in the cloud secret manager.
5. Apply database migrations using `npx prisma migrate deploy`.
