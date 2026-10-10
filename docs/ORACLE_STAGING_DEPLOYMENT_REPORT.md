# SehatAI v0.2.3 — Oracle Staging Deployment & Acceptance Report

**Project:** SehatAI Care Connect  
**Repository:** `D:\SehatAI-UNIFIED`  
**Git Branch:** `production-activation`  
**Canonical Commit:** `84f759f59f14220259e9f42a71a47fb5464b528e`  
**Release Archive:** `deploy/sehatai-staging-v0.2.3-arm64-standalone.tar.gz` (54 MB)  
**Target Server:** `ariahub-oracle` (Oracle Cloud Free Tier, shape `VM.Standard.A1.Flex`, 2 OCPUs, 12 GB RAM, aarch64 Linux)  
**Binding:** `127.0.0.1:4000` (Strict loopback isolation)  
**Windows Access URL:** [http://localhost:4400](http://localhost:4400) (via active SSH tunnel)  

---

## 1. Oracle Preflight & Storage Recovery Summary

Before deployment, authorized Tier 1 disk recovery was executed on the host:
- **Cleaned Target 1**: Exactly 22 orphaned `/tmp/aria-*` archives (3.14 GB / 3,138,056,192 bytes purged).
- **Cleaned Target 2**: Inactive Docker BuildKit cache pruned (`sudo docker builder prune -f`, 5.95 GB reclaimed).
- **Zero Impact on ARIA Hub**: No Docker images, running containers, volumes, database files, or `/opt/aria-hub/releases` directories were touched.

### Host Storage & Resources Before vs. After
| Metric | Pre-Cleanup | Post-Cleanup & Deployment | Current Live State |
| :--- | :--- | :--- | :--- |
| **Root Disk Available (`/dev/sda1`)** | 918 MB (99% full) | 9.4 GB (80% full) | **9.2 GB available (80% full)** |
| **Available RAM** | 8.3 GiB | 8.3 GiB | **8.2 GiB available** (3.0 GiB used, 7.0 GiB buff/cache) |
| **Swap Space Free** | 3.9 GiB free | 3.9 GiB free | **3.9 GiB free** (105 MiB used) |
| **CPU Load** | 0.09 | 0.12 | **0.15** |
| **Inodes Available** | 5,185,275 (86% free) | 5,185,275 (86% free) | **5,184,812 (86% free)** |
| **Port `127.0.0.1:4000`** | Free | Bound to `sehatai-staging` | **Bound strictly to 127.0.0.1:4000** |

---

## 2. Deployment Verification

1. **Artifact Transfer & SHA-256 Checksum Match**:
   - Local SHA-256: `36739f785827718af5363121bec347a8f0b17623eb26cfa9921b564c76400bf1`
   - Remote SHA-256 on Oracle: `36739f785827718af5363121bec347a8f0b17623eb26cfa9921b564c76400bf1`
   - **Verification**: 100% exact match.
2. **Extraction Path & Ownership**:
   - Path: `/opt/sehatai/releases/20261011_v023` (176 MB total footprint).
   - Ownership: `sehatai:sehatai` (`0755` directories, `0644` files).
   - Archive cleaned from `/tmp/`.
3. **Prisma Query Engine Verification**:
   - Location: `/opt/sehatai/releases/20261011_v023/node_modules/@prisma/engines/libquery_engine-linux-arm64-openssl-3.0.x.so.node`
   - Architecture: `ELF 64-bit LSB shared object, ARM aarch64, version 1 (SYSV), dynamically linked`
   - Native AArch64 binary confirmed operational.
4. **Environment Isolation (`/etc/sehatai/staging.env`)**:
   - Mode: `0600`, owned by `sehatai:sehatai`.
   - Dedicated Supabase Project: `aws-0-ap-south-1.pooler.supabase.com:5432` (`sehatai-staging`, 79 tables, 5 synthetic baseline accounts).
   - LiveKit Cloud Credentials: Staging project keys loaded.
   - Staging Gate Protection: `STAGING_AUTH_REQUIRED=true`, `STAGING_ACCESS_SECRET` configured.
   - Commerce Guardrails: `STAGING_BLOCK_BOOKING=true`, `STAGING_BLOCK_PAYMENTS=true`, `STAGING_BLOCK_UPLOADS=true`.

---

## 3. Service Status & Sandboxing

The application runs as a sandboxed systemd service:
```
Service: sehatai-staging.service
Active: active (running)
ExecStart: /usr/bin/node /opt/sehatai/current/server.js
MemoryCurrent: 77.7 MB (77,774,848 bytes)
MemoryMax: 2048M (cgroup hard limit)
CPUQuota: 100% (1 core max limit)
ActiveSymlink: /opt/sehatai/current -> /opt/sehatai/releases/20261011_v023
ListenAddress: 127.0.0.1:4000 (No public external interface listener)
```

---

## 4. Live Health Check Evidence

```bash
$ curl -s http://127.0.0.1:4000/api/care/health
```
**Exact Output**:
```json
{
  "status": "ok",
  "service": "sehatai-care-staging",
  "database": {
    "status": "connected",
    "host": "aws-0-ap-south-1.pooler.supabase.com",
    "database": "postgres",
    "source": ".env",
    "isStaging": true
  },
  "timestamp": "2026-10-10T21:51:43.416Z"
}
```

---

## 5. Acceptance Test Battery Results (30 / 30 Passed — 100%)

The automated acceptance test battery (`scripts/test-oracle-deployment.ts`) executed 30 real integration checks against the Oracle deployment:

| # | Suite / Area | Test Case | Target / Expected | Observed Result | Pass/Fail |
| :---: | :--- | :--- | :---: | :---: | :---: |
| 1 | **Health & DB** | Database connectivity to Supabase cloud pooler | HTTP 200 | HTTP 200 (`aws-0-ap-south-1.pooler.supabase.com`) | **✓ PASS** |
| 2 | **Staging Gate** | Unauthenticated visitor blocked from `/` without staging key | HTTP 401 | HTTP 401 (Unauthorized) | **✓ PASS** |
| 3 | **Staging Gate** | `POST /api/staging/unlock` with forged key rejected | HTTP 401 | HTTP 401 (`INVALID_STAGING_KEY`) | **✓ PASS** |
| 4 | **Staging Gate** | `POST /api/staging/unlock` with authorized secret establishes cookie | HTTP 200 | HTTP 200 (`sehatai_staging_key` cookie set) | **✓ PASS** |
| 5 | **Staging Gate** | Authenticated browser loads root URL | HTTP 200 | HTTP 200 (12,623 bytes HTML payload) | **✓ PASS** |
| 6 | **Localization** | English locale (`/?lang=en`) | HTTP 200 | HTTP 200 | **✓ PASS** |
| 7 | **Localization** | Urdu locale (`/?lang=ur`) | HTTP 200 | HTTP 200 | **✓ PASS** |
| 8 | **Localization** | Dari/Farsi locale (`/?lang=fa`) | HTTP 200 | HTTP 200 | **✓ PASS** |
| 9 | **Localization** | Pashto locale (`/?lang=ps`) | HTTP 200 | HTTP 200 | **✓ PASS** |
| 10 | **RBAC & Auth** | Patient NextAuth session recognized (`test.patient1@sehatai.local`) | HTTP 200 | HTTP 200 (Role: user) | **✓ PASS** |
| 11 | **RBAC & Auth** | Unauthenticated access to protected `/api/care/consultations` blocked | HTTP 401 | HTTP 401 (Unauthorized) | **✓ PASS** |
| 12 | **Marketplace** | `GET /api/care/doctors` returns active synthetic clinician directory | HTTP 200 | HTTP 200 (3 verified clinicians returned) | **✓ PASS** |
| 13 | **Marketplace** | Cardiology specialty filtering (`?specialty=Cardiology`) | HTTP 200 | HTTP 200 (Dr. Ayesha Khan filtered) | **✓ PASS** |
| 14 | **Marketplace** | Pediatrics specialty filtering (`?specialty=Pediatrics`) | HTTP 200 | HTTP 200 (Dr. Fatima Noor filtered) | **✓ PASS** |
| 15 | **IDOR Security** | Authorized patient can view their own consultation | HTTP 200 | HTTP 200 (`cmv2h48hl0012ubso1mxyydlu`) | **✓ PASS** |
| 16 | **IDOR Security** | Cross-patient access strictly rejected (Patient 2 accessing Patient 1) | HTTP 403 | HTTP 403 (`NOT_A_PARTICIPANT`) | **✓ PASS** |
| 17 | **IDOR Security** | Non-existent consultation query | HTTP 404 | HTTP 404 (`CONSULTATION_NOT_FOUND`) | **✓ PASS** |
| 18 | **LiveKit Call** | Authorized participant receives signed LiveKit room JWT | HTTP 200 | HTTP 200 (`care-cmv2h48hl0012ubso1mxyydlu`) | **✓ PASS** |
| 19 | **LiveKit Call** | Unauthorized user call join strictly rejected | HTTP 403 | HTTP 403 (`REQUIRES_PARTICIPANT`) | **✓ PASS** |
| 20 | **AI Triage** | Cardiac emergency red flag triggers deterministic escalation | HTTP 200 | HTTP 200 (1122/102 emergency helpline guidance) | **✓ PASS** |
| 21 | **Guardrail** | Appointment booking hard-blocked in staging | HTTP 403 | HTTP 403 (`BOOKING_HARD_BLOCKED_IN_STAGING`) | **✓ PASS** |
| 22 | **Guardrail** | Real payments hard-blocked in staging | HTTP 403 | HTTP 403 (`PAYMENTS_HARD_BLOCKED_IN_STAGING`) | **✓ PASS** |
| 23 | **Guardrail** | Medical uploads hard-blocked in staging | HTTP 403 | HTTP 403 (`UPLOADS_HARD_BLOCKED_IN_STAGING`) | **✓ PASS** |
| 24 | **ARIA Hub v1** | Port 3000 Web HTTP code | HTTP 308 | HTTP 308 (Redirect to canonical) | **✓ PASS** |
| 25 | **ARIA Hub Cand.** | Port 3100 Candidate HTTP code | HTTP 308 | HTTP 308 | **✓ PASS** |
| 26 | **ARIA Hub v2** | Port 13000 Web HTTP code | HTTP 200 | HTTP 200 | **✓ PASS** |
| 27 | **ARIA Hub API** | Port 14100 `/health` HTTP code | HTTP 200 | HTTP 200 (`{"status":"ok"}`) | **✓ PASS** |
| 28 | **ARIA Hub Caddy**| Port 18080 Reverse Proxy | HTTP 200 | HTTP 200 | **✓ PASS** |
| 29 | **ARIA Hub DB 17**| Docker container `ariahub-main-postgres` (Port 5450) | Ready | `accepting connections` | **✓ PASS** |
| 30 | **ARIA Hub DB 16**| Docker container `ariahub-v2-postgres-1` (Port 5432) | Ready | `accepting connections` | **✓ PASS** |

---

## 6. ARIA Hub Isolation & Immunity Confirmation

At no point during disk cleanup, file extraction, configuration, or testing did SehatAI touch ARIA Hub:
- Caddy reverse proxy on port 18080 remained uninterrupted.
- ARIA Hub v1 and v2 web services remained healthy.
- Docker containers `ariahub-main-postgres` (Postgres 17 on 5450) and `ariahub-v2-postgres-1` (Postgres 16 on 5432) remained running with zero restarts.
- SehatAI connects strictly to its external Supabase staging database pooler on `aws-0-ap-south-1.pooler.supabase.com:5432`, preventing any local database collision.

---

## 7. Security & Privacy Audit

1. **Staging Gate Defense**:
   - Root URL `/` and all protected application routes reject unauthorized access with HTTP 401 and strict headers (`X-Frame-Options: DENY`, `Content-Security-Policy`, `Strict-Transport-Security`).
   - Query string token passing (`?staging_key=...`) is strictly blocked.
   - Authorized testers unlock access via `POST /api/staging/unlock` with the staging secret, which establishes the `sehatai_staging_key` session cookie.
2. **IDOR Defense**:
   - Consultations, messages, and video rooms require genuine participant ownership in the database (`consultation.patientId === session.userId` or `consultation.doctorUserId === session.userId`).
   - Cross-patient requests are blocked with HTTP 403 Forbidden.
3. **Commerce & Safety Guardrails**:
   - `STAGING_BLOCK_BOOKING=true`: Rejects new appointment bookings with HTTP 403.
   - `STAGING_BLOCK_PAYMENTS=true`: Rejects payment initiation with HTTP 403.
   - `STAGING_BLOCK_UPLOADS=true`: Rejects document/attachment uploads with HTTP 403.
4. **Secret Management**:
   - Release archive scanned: zero `.env`, `.pem`, `.key`, or `.sql` files packaged.
   - Server config `/etc/sehatai/staging.env` has file mode `0600` owned by `sehatai`.

---

## 8. Windows Browser Access Details

An SSH tunnel is actively forwarding traffic from the Windows host to the Oracle VM loopback:
- **Tunnel Command**:
  ```powershell
  ssh -N -L 127.0.0.1:4400:127.0.0.1:4000 ariahub-oracle
  ```
- **Local Access URL**:
  👉 **[http://localhost:4400](http://localhost:4400)**

### How to Access via Web Browser:
1. Open Chrome, Edge, or Firefox and navigate to `http://localhost:4400/staging/unlock`.
2. Enter the Staging Key configured in `/etc/sehatai/staging.env`.
3. Click **Unlock Staging**. The browser receives the `sehatai_staging_key` cookie and redirects to the full SehatAI portal.
4. Log in using any of the synthetic accounts below.

---

## 9. Staging Synthetic Accounts

The Supabase staging database contains 5 pre-seeded baseline accounts:

### Clinician Accounts (Doctor Role)
1. **Dr. Ayesha Khan** (Cardiologist)
   - Email: `dr.ayesha.khan@sehatai.local`
   - License / PM&DC: `12345-P` (Verified)
   - Fee: 2,500 PKR
2. **Dr. Tariq Mahmood** (General Physician / Internal Medicine)
   - Email: `dr.tariq.mahmood@sehatai.local`
   - License / PM&DC: `23456-P` (Verified)
   - Fee: 1,800 PKR
3. **Dr. Fatima Noor** (Pediatrician)
   - Email: `dr.fatima.noor@sehatai.local`
   - License / PM&DC: `34567-P` (Verified)
   - Fee: 2,200 PKR

### Patient Accounts (User Role)
1. **Patient 1 (Zainab Bibi)**: `test.patient1@sehatai.local`
2. **Patient 2 (Bilal Ahmed)**: `test.patient2@sehatai.local`

*(All synthetic test accounts share the staging development credential set).*

---

## 10. Instant Rollback Plan

If at any point a rollback to the previous release is required, run:
```bash
ssh ariahub-oracle "sudo ln -sfn /opt/sehatai/releases/20261010_071541 /opt/sehatai/current && sudo systemctl restart sehatai-staging"
```
The symlink switch is atomic and executes in under 2 seconds.

---

## 11. Production Readiness Assessment

- **Engineering Staging Status**: **FULLY OPERATIONAL & VALIDATED** (30/30 acceptance tests passed).
- **Oracle Infrastructure**: Co-existing stably with ARIA Hub with 9.2 GB free disk space and 8.2 GiB available RAM.
- **External Dependencies Remaining for Public Production Launch**:
  1. *Payment Merchant Agreement*: Genuine commercial merchant gateway credentials required (JazzCash/Easypaisa/HesabPay) to replace sandbox abstraction.
  2. *LiveKit Production Media Server*: Final production WebRTC domain and secret configuration.
  3. *Cloud Storage*: Private S3 bucket provisioning for permanent production medical document storage.
  4. *Legal & Clinical Review*: Final jurisdiction regulatory sign-off for tele-consultation billing.
