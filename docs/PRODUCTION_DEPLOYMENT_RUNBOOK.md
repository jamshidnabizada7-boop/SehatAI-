# SehatAI + Care Connect Production Deployment Runbook

**Document ID:** OPS-DEPLOY-2026-10-08-09  
**Classification:** INFRASTRUCTURE OPERATIONS MANUAL  
**Target Environment:** Linux Container (Docker / Kubernetes / Systemd) / Neon PostgreSQL  
**Date:** October 8, 2026  

---

## 1. System Requirements & Topology

```
                   Internet / Users / Mobile Apps
                                 │
                                 ▼
                     [Cloudflare / Cloud WAF]
                    (DDoS, SSL Termination, CSP)
                                 │
            ┌────────────────────┴────────────────────┐
            ▼                                         ▼
[Next.js App Replicas (Port 3000)]        [LiveKit SFU (Port 7880/7881)]
   (SSR, API Routes, Triage Engine)          (WebRTC Audio/Video Media)
            │                                         │
            ├────────────────────┬────────────────────┘
            ▼                    ▼
[PostgreSQL Database (Neon)]  [Encrypted Object Storage]
  (Prisma Schema, Ledger)       (AWS S3 / Alibaba Cloud OSS)
            ▲
            │
[Background Worker Daemon]
  (scripts/run-outbox-worker.ts)
```

- **Node.js Runtime:** Node.js v20.x LTS or v22.x LTS.
- **Database:** PostgreSQL 15+ (Neon Serverless recommended with connection pooling).
- **Process Manager:** Systemd, PM2, or Docker Compose / Kubernetes.
- **Minimum Sizing:** 2 vCPU, 4GB RAM per Next.js app instance; 4 vCPU, 8GB RAM for LiveKit media node.

---

## 2. Environment Configuration Matrix

Ensure all variables are populated in the production environment (e.g. AWS Secrets Manager, Doppler, or Doppler/K8s Secrets).

```bash
# ------------------------------------------------------------
# Core Application & Authentication
# ------------------------------------------------------------
NODE_ENV=production
NEXTAUTH_URL=https://sehatai.health
NEXTAUTH_SECRET=generate_strong_64_char_hex_secret
DATABASE_URL=postgresql://user:password@ep-proj-123.ap-southeast-1.aws.neon.tech/sehatai?sslmode=require

# ------------------------------------------------------------
# Encrypted Object Storage (Care Connect §37)
# ------------------------------------------------------------
CARE_STORAGE_PROVIDER=s3                  # or 'oss'
CARE_STORAGE_KEY=generate_strong_32_byte_aes_key
CARE_S3_BUCKET=sehatai-care-prod-private
CARE_S3_REGION=ap-south-1
CARE_S3_KEY=AKIA_PROD_ACCESS_KEY
CARE_S3_SECRET=PROD_SECRET_ACCESS_KEY

# ------------------------------------------------------------
# Realtime WebRTC & LiveKit (Care Connect §26)
# ------------------------------------------------------------
CARE_VIDEO_PROVIDER=livekit
LIVEKIT_URL=wss://livekit.sehatai.health
LIVEKIT_API_KEY=devkey_or_prod_api_key
LIVEKIT_API_SECRET=prod_livekit_secret_key_hs256

# ------------------------------------------------------------
# Push Notifications (Care Connect §62)
# ------------------------------------------------------------
VAPID_PUBLIC_KEY=BHprod_vapid_public_key...
VAPID_PRIVATE_KEY=prod_vapid_private_key...

# ------------------------------------------------------------
# AI Provider Fallback Matrix
# ------------------------------------------------------------
GROQ_API_KEY=gsk_prod_key
DASHSCOPE_API_KEY=sk-prod_dashscope_key
OPENROUTER_API_KEY=sk-or-prod_key
```

---

## 3. Step-by-Step Deployment Procedure

### Step 1: Clone Repository & Select Safety Baseline
```bash
git clone <repo_url> /opt/sehatai
cd /opt/sehatai
git checkout production-activation
```

### Step 2: Install Production Dependencies
```bash
npm ci --omit=dev
```

### Step 3: Run Database Migrations
```bash
npx prisma migrate deploy
npx prisma generate
```

### Step 4: Build Next.js Production Bundle
```bash
npm run build
```

### Step 5: Start Primary Next.js Application
Using PM2:
```bash
pm2 start "npm run start" --name "sehatai-web" -i max
```
Using Systemd (`/etc/systemd/system/sehatai-web.service`):
```ini
[Unit]
Description=SehatAI Next.js Production Service
After=network.target

[Service]
Type=simple
User=sehatai
WorkingDirectory=/opt/sehatai
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
EnvironmentFile=/etc/sehatai/prod.env

[Install]
WantedBy=multi-user.target
```

### Step 6: Start Outbox Worker Daemon
Using Systemd (`/etc/systemd/system/sehatai-worker.service`):
```ini
[Unit]
Description=SehatAI Durable Outbox Worker Daemon
After=network.target

[Service]
Type=simple
User=sehatai
WorkingDirectory=/opt/sehatai
ExecStart=/usr/local/bin/bun scripts/run-outbox-worker.ts --interval 3000 --batch 20
Restart=always
RestartSec=10
EnvironmentFile=/etc/sehatai/prod.env

[Install]
WantedBy=multi-user.target
```

---

## 4. Health Checks & Verification Commands

```bash
# Verify HTTP endpoint health
curl -f https://sehatai.health/api/health

# Verify outbox worker single pass
bun scripts/run-outbox-worker.ts --once

# Replay any dead-letter queue items (operator command)
bun scripts/run-outbox-worker.ts --replay-dead-letters --once
```

---

## 5. Rollback Procedure

If a production incident occurs:
1. Revert Git HEAD to verified baseline:
   ```bash
   git checkout 55ee4bf35d084a5280c060bd18e1841d0c6102f4
   npm ci
   npm run build
   pm2 restart all
   ```
2. Database rollback: Invariant migrations are backward-compatible and additive. Schema changes do not drop existing columns.
