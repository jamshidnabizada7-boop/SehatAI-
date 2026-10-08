# SehatAI Care Connect — Production Deployment Guide (§94, §100)

> **Document Type:** Production Engineering Standard, Deployment Pipeline & Release Runbook  
> **Target Audience:** DevOps Engineers, Release Managers, Cloud Architects

---

## 1. Environment Architecture & Configuration Matrix

Care Connect operates across three isolated environments (`docs/CARE_CONNECT_ENVIRONMENTS.md`):

| Component | Development | Staging | Production |
|---|---|---|---|
| **Platform** | Local Bun / Node 22 | Cloud Container (Kubernetes / ECS) | Clustered Container Deployment |
| **Database** | SQLite (`file:./dev.db`) | Managed PostgreSQL | Managed Multi-AZ PostgreSQL |
| **Object Store** | `local-private` (`storage/care/`) | S3 Bucket (Staging) | S3 Bucket (Production KMS) |
| **Payment Provider** | `mock` (development only) | Sandbox Gateways | Certified Merchant Gateways |
| **Video Signaling** | WebSocket (:3004) | Dedicated Container (:3004) | Clustered Signaling / LiveKit |
| **Rollout Stage** | Stage 1 (Internal) | Stage 2 (Alpha Invited) | Stage 3 → Stage 6 (Phased) |

---

## 2. Database Migration Procedure (§94)

### 2.1 The Cardinal Rule (§94)
**`prisma db push` IS STRICTLY FORBIDDEN IN STAGING AND PRODUCTION.**
`db push` executes unversioned schema synchronization and can cause irrecoverable data loss. Production databases must be updated exclusively using versioned migrations.

### 2.2 Generating Migrations (Pre-Release Phase):
1. In your local development branch (configured against PostgreSQL dev instance):
   ```bash
   npx prisma migrate dev --name care_connect_foundation
   ```
2. Verify that migration SQL files in `prisma/migrations/*` accurately reflect the additive schema changes.
3. Commit migration files to Git.

### 2.3 Executing Migrations in Production Release:
During container deployment or release pipeline:
```bash
# 1. Run versioned migrations
npx prisma migrate deploy

# 2. Seed baseline data (idempotent upserts)
npx tsx prisma/seed.ts
npx tsx prisma/seed-care.ts
```

---

## 3. Seed Execution & Baseline Configuration

The Care Connect seed script (`prisma/seed-care.ts`) is completely **idempotent**:
- Seeds baseline `JurisdictionPolicy` rows for Pakistan (`PK > PK`), Afghanistan (`AF > AF`), and restricted cross-border corridors.
- Seeds `CommissionRule` table with default platform rates (2000 bps / 20%).
- Seeds `FeatureFlag` records for runtime operational control.

To run manually:
```bash
npx tsx prisma/seed-care.ts
```

---

## 4. Web Push (VAPID) & Service Worker Setup (§62)

1. **Key Generation:**
   Generate a cryptographic VAPID keypair using the `web-push` CLI:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. **Environment Variables:**
   Set in production cloud secrets:
   ```bash
   NEXT_PUBLIC_VAPID_PUBLIC_KEY="<public_key>"
   VAPID_PRIVATE_KEY="<private_key>"
   ```
3. **PWA Integration:**
   `public/sw.js` handles incoming push notifications and notification clicks, focusing active windows or navigating to `/`. Lock-screen notifications never include private clinical text.

---

## 5. WebRTC Video Signaling Mini-Service

WebRTC audio/video consultations connect via the companion signaling mini-service:
- **Location:** `mini-services/video-signal/index.js`
- **Port:** Port 3004 (relays room messages: `join`, `offer`, `answer`, `ice`, `leave`).
- **Proxy Configuration:** In standard deployments, reverse proxy (Caddy / Nginx) routes WebSocket traffic via `/?XTransformPort=3004` or via dedicated hostname `NEXT_PUBLIC_VIDEO_SIGNAL_URL=wss://signal.sehatai.health`.
- **Production Scaling:** For multi-region high-concurrency production deployments, swap signaling to the LiveKit cloud adapter configured in `src/server/care/video-service.ts`.

---

## 6. Phased Rollout Management (§95)

Care Connect employs a 6-stage phased rollout gated by `CARE_ROLLOUT_STAGE`:

1. **Stage 1 (Internal Team Only):**
   - Default setting. Only staff members (`session.role === 'admin' | 'clinical_admin' | 'finance'`) can see or interact with Care Connect surfaces.
2. **Stage 2 (Invited Alpha):**
   - Invited patients and doctors test core consultation loops.
3. **Stage 3 (Pilot Region - Single City/Specialty):**
   - Open to public within a designated pilot geographic corridor (e.g., Family Medicine in Lahore/Karachi).
4. **Stage 4 (Soft Launch):**
   - Extended marketplace access across Pakistan corridor.
5. **Stage 5 (Public Launch - Pakistan Corridor):**
   - Full commercial operation for Pakistan domestic corridor.
6. **Stage 6 (Regional Corridor - Pakistan & Afghanistan):**
   - Cross-border second opinions and regional corridors unlocked following regulatory review.

To advance rollout stage at runtime:
```bash
# In production environment:
CARE_ROLLOUT_STAGE="2"
```

---

## 7. Emergency Rollback Path

If an unforeseen defect or payment reconciliation anomaly occurs post-deployment:
1. **Kill Switch via Feature Flags (Instant, Zero Downtime):**
   Execute admin flag toggle:
   ```bash
   POST /api/care/admin { "action": "flag.set", "key": "CARE_PAYMENTS_ENABLED", "enabled": false }
   POST /api/care/admin { "action": "flag.set", "key": "CARE_ENABLED", "enabled": false }
   ```
   *Result:* Commercial surfaces immediately vanish from UI navigation; existing AI triage and core SehatAI functions remain completely operational.
2. **Container Rollback:**
   Redeploy previous container image tag. Because Care Connect schema additions are strictly additive, older application containers continue running without crashing against the database.
