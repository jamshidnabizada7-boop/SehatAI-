# SEHATAI — RELEASE-BLOCKING CORRECTIONS FINAL VERIFICATION REPORT

**Canonical Repository:** `D:\SehatAI-UNIFIED`  
**Target Branch:** `production-activation`  
**Starting HEAD SHA:** `d88cd96b04ef99c2291799a402c5072af1e846bc`  
**Verification Date:** 2026-10-08  
**Verification Environment:** Windows 11 host with local ext4 loopback cluster (`/mnt/host/d/pgdata.img`), PostgreSQL 18.6 (`x86_64-alpine-linux-musl`), Node.js v24.19.0, Bun v1.4.0, Prisma 6.19.2.

---

## Executive Classification

### **PRE-PRODUCTION — ENGINEERING HARDENED & VERIFIED / EXTERNAL DEPENDENCIES BLOCKED**

**CRITICAL DECLARATION:** Per project mandate, passing automated mock tests, compiling TypeScript, and passing local concurrency tests **DO NOT** constitute production readiness. SehatAI is classified strictly as **PRE-PRODUCTION**. 

Commercial launch remains **BLOCKED** on third-party provider integrations, cloud infrastructure provisioning, and regulatory clearances:
1. **Real Payment Gateways:** HesabPay (Afghanistan), 1Link / JazzCash / PayFast (Pakistan), and Stripe/Card adapters remain unconfigured code stubs (`ProviderNotConfiguredError`).
2. **Telemedicine Live Calling:** LiveKit JWT token generator is verified, but NO live LiveKit SFU signaling cluster is connected. Token issuance does not establish operational video calling.
3. **Medical Document Cloud Storage:** Local encrypted storage is operational; AWS S3 / Alibaba Cloud OSS buckets and IAM keys are not provisioned.
4. **Legal & Regulatory Licensing:** Formal legal approval under Pakistan PM&DC telemedicine rules and Afghanistan Ministry of Public Health (MoPH) directives is pending.

---

## P0 — PostgreSQL Security & Access Control Remediation

### 1. Diagnosis of Prior Insecure Configuration
In prior test runs, PostgreSQL was initialized with:
- `listen_addresses = '*'` in `postgresql.conf`
- `host all all 0.0.0.0/0 trust` in `pg_hba.conf`
- `host all all ::0/0 trust` in `pg_hba.conf`
- `scripts/setup-pg.sh` which re-appended open trust rules on cluster setup.

This exposed the local database cluster to unauthenticated network access from any interface.

### 2. Remediations Applied
1. **Removed Unsafe Scripts:**
   - Deleted `scripts/setup-pg.sh` (`git rm scripts/setup-pg.sh`).
   - Replaced `scripts/start-pg.sh` with a secure script enforcing loopback mounting and authenticated daemon startup.
2. **Restricted Interface Binding:**
   - Replaced `listen_addresses = '*'` with `listen_addresses = '127.0.0.1'` in `/var/lib/postgresql/data/db/postgresql.conf`.
3. **Enforced SCRAM-SHA-256 Authentication:**
   - Stripped all `0.0.0.0/0 trust` and `::0/0 trust` directives from `pg_hba.conf`.
   - Updated IPv4 and IPv6 loopback entries:
     ```
     host all all 127.0.0.1/32 scram-sha-256
     host all all ::1/128     scram-sha-256
     ```
   - Set password for database user `postgres` via `ALTER ROLE postgres WITH PASSWORD 'postgres';`.
4. **Data Preservation:**
   - Existing databases (`sehatai_test`) and test data residing on the ext4 loopback cluster (`/mnt/host/d/pgdata.img`) were strictly preserved. No database erasure occurred.

### 3. Verification Evidence
- **Unauthenticated Connection Rejection:**
  Attempting to execute queries without valid credentials from Windows host:
  ```powershell
  $env:DATABASE_URL="postgresql://postgres@127.0.0.1:5432/sehatai_test"
  "SELECT 1;" | bun x prisma db execute --stdin
  ```
  Result: **REJECTED (Exit 1)** — `Error: P1000 Authentication failed against database server`.
- **Wrong Password Rejection:**
  Attempting to execute queries with invalid password:
  ```powershell
  $env:DATABASE_URL="postgresql://postgres:wrong_pw@127.0.0.1:5432/sehatai_test"
  "SELECT 1;" | bun x prisma db execute --stdin
  ```
  Result: **REJECTED (Exit 1)** — `Error: P1000 Authentication failed against database server`.
- **Authenticated Localhost Connection:**
  Connecting with configured SCRAM-SHA-256 credentials:
  ```powershell
  $env:DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/sehatai_test"
  "SELECT current_database(), current_user;" | bun x prisma db execute --stdin
  ```
  Result: **SUCCESS (Exit 0)** — `Script executed successfully`.

---

## P1 — Authoritative Production Prisma & PostgreSQL Reconciliation

### 1. Root Cause of Incompatible Schemas
The hackathon prototype originally used SQLite for zero-setup developer machines (`prisma/schema.prisma`). In earlier staging work, an alternate schema (`prisma/schema.postgresql.prisma`) was created with `provider = "postgresql"`. This created dual divergent schemas, encoding discrepancies (`Â§` vs `§`), and forced tests to use `--schema` overrides while `next build` and standard prisma commands defaulted to SQLite.

### 2. Reconciliation & Single Authoritative Architecture
1. **Single Schema Architecture:**
   - Updated `prisma/schema.prisma` datasource provider permanently to `provider = "postgresql"`.
   - Removed `prisma/schema.postgresql.prisma` (`git rm prisma/schema.postgresql.prisma`).
   - Cleaned up UTF-8 comment encodings repo-wide.
2. **Version-Controlled PostgreSQL Migration:**
   - Generated initial canonical migration via `bun x prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script`.
   - Sanitized Windows UTF-8 BOM to prevent PostgreSQL parser errors (`\u{feff}`).
   - Saved version-controlled migration: `prisma/migrations/20261008000000_init_postgresql/migration.sql` (1,813 lines of SQL DDL).
3. **Fresh Disposable Database Verification (Reproducibility Without `db push`):**
   - Created fresh PostgreSQL database `sehatai_fresh_migration_test`.
   - Deployed migration sequence:
     ```powershell
     $env:DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/sehatai_fresh_migration_test"
     bun x prisma migrate deploy
     ```
   - Result:
     `Applying migration 20261008000000_init_postgresql`  
     `All migrations have been successfully applied.`
   - Database catalog inventory check (`SELECT count(*) FROM pg_tables WHERE schemaname = 'public';`): Exactly **79 tables** created (78 domain models + 1 `_prisma_migrations` table).
   - `bun x prisma migrate status`: `Database schema is up to date!`.
4. **Existing Data Preservation & Migration Baselining:**
   - Baselined existing database `sehatai_test` using `bun x prisma migrate resolve --applied 20261008000000_init_postgresql`.
   - Verified existing data retained without disruption.
5. **Natively Compiled Prisma Client:**
   - Ran `bun x prisma generate` against `prisma/schema.prisma`.
   - Generated native Prisma Client v6.19.2 for PostgreSQL.

---

## P2 — Afghanistan Emergency Telephone Numbers Correction

### 1. Primary Source Investigation & Audit
- **Afghanistan 112 (Fire Department):** U.S. State Department Travel Advisory explicitly states: *"Dial 102 for medical assistance; Dial 112 for the fire department."* Prior code categorized `112` as "General Ambulance", which is unsupported and dangerous for patients in life-threatening medical shock.
- **Afghanistan 102 (Kabul Ambulance):** Identified by the Afghan Ministry of Public Health (MoPH) as the dedicated Kabul Ambulance Service. Coverage is strictly restricted to **Kabul City only**. Nationwide ambulance dispatch does NOT exist across Afghanistan's provinces; patients in provinces must obtain direct transport to provincial/regional hospitals.
- **Afghanistan 166 (Health Helpline):** Independently verified via MoPH and WHO records as a national health and psycho-social counseling helpline, not a physical ambulance dispatch service.
- **Afghanistan 119 (Police Emergency):** Ministry of Interior / Afghan National Police nationwide hotline.
- **Afghanistan 410 (Awaaz Afghanistan):** UNHCR / UNOPS / WFP / WHO inter-agency toll-free humanitarian call center.

### 2. Code Remediations
1. **Corrected `EMERGENCY_NUMBERS_AF` in `src/data/lexicon.ts`:**
   - `102`: `Kabul Ambulance Service` (Coverage: `Kabul City only`, Source: `Ministry of Public Health (MoPH)`)
   - `112`: `Fire Department (Afghanistan)` (Coverage: `Nationwide fire dispatch`, Source: `U.S. State Department Travel Advisory / Directorate of Fire & Disaster Management`)
   - `119`: `Police Emergency (Afghanistan)` (Coverage: `Nationwide`, Source: `Ministry of Interior / Afghan National Police`)
   - `166`: `Afghan Health & Psycho-social Helpline` (Coverage: `Nationwide`, Source: `Ministry of Public Health (MoPH) / WHO`)
   - `410`: `Awaaz Afghanistan Humanitarian Helpline` (Coverage: `Nationwide`, Source: `UNHCR / UNOPS / WFP / WHO Awaaz Inter-agency Call Center`)
2. **Province-Specific Routing:**
   - Extended `getEmergencyNumbers(countryCode, regionOrCity)`:
     - When province is outside Kabul (e.g., Herat, Kandahar, Balkh/Mazar, Nangarhar/Jalalabad), the primary medical recommendation is: `Provincial Hospital Emergency (Direct Transport)` with explicit advisory: `Centralized ambulance dispatch unavailable outside Kabul`.
     - When location is unknown or general AF, returns Kabul Ambulance with explicit coverage annotation `Kabul City only`.
3. **Medical Pairing Logic in `buildEmergencyContent`:**
   - Updated call-line generation to filter only medical/ambulance services for medical emergencies, preventing erroneous pairing of `102` (Ambulance) with `112` (Fire Department).
4. **Anti-Leakage Safeguard in `src/server/pipeline/run.ts`:**
   - Completely sanitized Pakistan emergency numbers (`1122`, `1023`, `115`, `1166`, `15`) and ambulance entity names from non-PK user responses.

### 3. Verification Evidence
Dedicated test suite: `tests/safety/afghanistan-emergency-audit.test.ts` (8/8 tests passed).

---

## P3 — PostgreSQL Commercial Concurrency & Invariants Hardening

### 1. P2002 Unique-Constraint Violation Precision
- **Risk Investigated:** In `src/server/care/ledger.ts`, prior code caught `P2002` and checked `String(err).includes('idempotencyKey')`. Because Prisma includes the SQL query in the error string, and `idempotencyKey` is a column in every `LedgerEntry` insert statement, ANY unique constraint violation on `LedgerEntry` or related tables would match this condition and be silently swallowed.
- **Hardening Applied:** 
  1. Inspect `err.meta?.target` directly to verify that the failing constraint is specifically `idempotencyKey` or `LedgerEntry_idempotencyKey_key`.
  2. Perform an explicit database check (`db.ledgerEntry.findFirst({ where: { idempotencyKey: ... } })`) to confirm that the identical idempotency key was indeed already written by a concurrent transaction before returning `{ posted: false }`.
  3. Any other unique constraint violation (e.g. `LedgerAccount.code`) is strictly re-thrown.

### 2. Double-Refund Elimination via Row Lock
- **Risk Investigated:** In `src/server/care/refund-service.ts`, `computeRefundEligibility` aggregated prior refunds outside a database transaction. Concurrent requests could both read `alreadyRefunding = 0` and both issue full refunds for the same payment.
- **Hardening Applied:** Wrapped refund creation inside `db.$transaction` with an explicit row lock on `Payment` (`await tx.payment.update(...)`). Concurrent callers are serialized; subsequent callers observe the committed refund and fail with 409 `REFUND_EXCEEDS_PAYMENT`.

### 3. Double-Payout Elimination via DoctorProfile Row Lock
- **Risk Investigated:** In `src/server/care/payout-service.ts`, concurrent payout requests evaluated available balances outside the transaction, risking race conditions on doctor earnings.
- **Hardening Applied:** Wrapped payout creation inside `db.$transaction` with an explicit row lock on `DoctorProfile` (`await tx.doctorProfile.update(...)`) and in-transaction re-verification of available earnings. Subsequent callers observe 0 available earnings and fail with 409 `NOTHING_AVAILABLE`.

### 4. Verification Evidence
Comprehensive suite: `tests/care/postgres-concurrency.test.ts` (10/10 tests passed):
1. Simultaneous slot booking (3-way race): exactly 1 succeeds, 2 fail with 409 `SLOT_ALREADY_BOOKED`.
2. Concurrent duplicate webhooks (4 parallel identical events): exactly 1 processes, 3 return `duplicate: true`.
3. Concurrent ledger transactions: exactly 1 posts, 2 return `posted: false`.
4. Concurrent refunds on same payment: exactly 1 succeeds, 2 fail with 409 `REFUND_EXCEEDS_PAYMENT`.
5. Concurrent payouts for same doctor: exactly 1 succeeds, 2 fail with 409 `NOTHING_AVAILABLE`.
6. Ledger replay: subsequent submissions return `posted: false`; balances remain unchanged.
7. Currency mismatch across legs: strictly rejected with `LedgerError`.
8. Amount mismatch (debits != credits): strictly rejected with `LedgerError`.
9. P2002 precision: unrelated unique constraint errors (e.g. duplicate `LedgerAccount.code`) are NOT swallowed.
10. Repeated concurrency & deadlock resistance: 10 parallel transactions execute cleanly without deadlocks.

---

## P4 — Production Provider Boundaries & External Blockers

The following table provides the authentic implementation status, required external credentials, and agreements for all external subsystems:

| Subsystem | File Location | Code Status | External Dependency Status | Real Implementation Path / Missing Credentials |
|---|---|---|---|---|
| **Private Medical Storage** | `src/server/care/storage.ts` | **Operational Locally** | **BLOCKED (Cloud)** | `LocalPrivateStorage` uses AES-256-GCM authenticated encryption at rest. AWS S3 / Alibaba OSS SigV4 adapter is implemented in code but requires provisioned private bucket and credentials (`CARE_S3_BUCKET`, `CARE_S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`). |
| **Telemedicine Video & Audio** | `src/server/care/video-service.ts` | **JWT Generator Only** | **BLOCKED (LiveKit Cloud)** | `LiveKitVideoProvider` generates signed HS256 JWT access tokens. Real WebRTC video calls **CANNOT** function without a deployed LiveKit SFU server cluster, open firewall ports (UDP 50000-60000, TCP 7881), and credentials (`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`). |
| **Afghanistan Payments (HesabPay)** | `src/server/care/payments/adapters.ts` | **Unconfigured Stub** | **BLOCKED (Contract)** | `hesabPayAdapter` is an unconfigured scaffold throwing `ProviderNotConfiguredError`. Requires commercial merchant agreement with HesabPay, merchant account, `HESABPAY_API_KEY`, `HESABPAY_MERCHANT_ID`, and concrete REST API implementation for checkout, webhook intake, and refunds. |
| **Pakistan Local Payments** | `src/server/care/payments/adapters.ts` | **Unconfigured Stub** | **BLOCKED (Contract)** | `pakistanPaymentAdapter` is an unconfigured scaffold throwing `ProviderNotConfiguredError`. Requires merchant agreement with 1Link / JazzCash / PayFast, API keys (`CARE_PK_GATEWAY_KEY`, `CARE_PK_GATEWAY_SECRET`), and hosted checkout redirect integration. |
| **International Card Payments** | `src/server/care/payments/adapters.ts` | **Unconfigured Stub** | **BLOCKED (Contract)** | `cardPaymentAdapter` throws `ProviderNotConfiguredError`. Requires Stripe or Checkout.com merchant account and `CARE_CARD_GATEWAY_KEY`. |
| **Doctor Bank Payouts** | `src/server/care/payout-service.ts` | **Architecture Only** | **BLOCKED (Banking)** | Ledger mechanics, item claiming, and double-payout locks are fully tested. Live disbursements require banking clearing rail (1Link 1Bill / Raast in Pakistan; HesabPay wallet / Da Afghanistan Bank rails in Afghanistan). |
| **Web Push Notifications** | `src/server/care/push-delivery.ts` | **Operational Locally** | **BLOCKED (VAPID Env)** | Standalone outbox worker and push delivery via `web-push` library are fully implemented. Requires production VAPID keypair (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`). |
| **SMS / Email Alerts** | `src/server/care/push-delivery.ts` | **Not Implemented** | **BLOCKED (Provider)** | No SMS aggregator (Twilio / Jazz / Roshan) or transactional email provider (SES / Postmark) is configured. |
| **Clinical Governance & Regulatory** | `docs/legal/*.md` | **Draft Only** | **BLOCKED (Counsel)** | Telemedicine regulations in Pakistan (PM&DC guidelines) and Afghanistan (MoPH directives) require formal legal counsel review before commercial doctor onboarding. |

---

## P5 — Regression & Evidence Master Verification Matrix

All gates were executed on `D:\SehatAI-UNIFIED` against the real running PostgreSQL 18.6 database cluster:

| Verification Gate | Exact Command | Exit Code | Result | Details |
|---|---|---|---|---|
| **TypeScript Checking** | `bun run typecheck` | 0 | **PASS** | 0 errors across entire repository (`tsc --noEmit`). |
| **ESLint Validation** | `bun run lint` | 0 | **PASS** | Clean lint verification across all routes, components, and mini-services. |
| **Prisma Generation** | `bun x prisma generate` | 0 | **PASS** | Generated native PostgreSQL Prisma Client v6.19.2 in 1.50s. |
| **Medical Safety Suite** | `bun test tests/tests/safety/ tests/safety/` | 0 | **PASS** | **573 passed / 0 failed** across 22 test files (including Afghanistan emergency routing). |
| **Care Connect Suite** | `bun test tests/care/` | 0 | **PASS** | **76 passed / 0 failed** across 3 test files (unit, integration, postgres concurrency). |
| **Security Red-Team Suite** | `bun test tests/security/` | 0 | **PASS** | **18 passed / 0 failed** (100% DB-backed authorization & isolation tests). |
| **PostgreSQL Concurrency** | `bun test tests/care/postgres-concurrency.test.ts` | 0 | **PASS** | **10 passed / 0 failed** (all concurrency races, ledger replays, and invariants verified). |
| **Commercial Smoke E2E** | `bun run tests/care/care-smoke.ts` | 0 | **PASS** | Full booking → checkout → mock confirm → doctor earning → refund → reversal verified (`SMOKE OK`). |
| **Production Build** | `DOCKER_BUILD=1 bun run build` | 0 | **PASS** | **94 / 94 routes generated** in standalone production mode in 52s. |

---

## Summary of Files Touched

| File | Status | Description |
|---|---|---|
| `prisma/schema.prisma` | Modified | Updated datasource to `provider = "postgresql"`. Authoritative production schema. |
| `prisma/schema.postgresql.prisma` | Deleted | Redundant divergent schema removed. |
| `prisma/migrations/20261008000000_init_postgresql/migration.sql` | Created | Canonical version-controlled migration (1,813 lines of SQL DDL). |
| `scripts/setup-pg.sh` | Deleted | Insecure reusable script with `0.0.0.0/0 trust` removed. |
| `scripts/start-pg.sh` | Modified | Secured startup script with loopback mount and SCRAM-SHA-256 enforcement. |
| `src/data/lexicon.ts` | Modified | Corrected Afghanistan emergency numbers (112 = Fire, 102 = Kabul Ambulance, 166 = Helpline, 410 = Awaaz). Supported province routing. |
| `src/server/pipeline/run.ts` | Modified | Added province/city routing; sanitized Pakistan emergency numbers from Afghan responses; restricted emergency pairing to medical contacts. |
| `src/server/care/ledger.ts` | Modified | Hardened P2002 error handling to strictly inspect target field and verify DB record existence. |
| `src/server/care/refund-service.ts` | Modified | Serialized concurrent refunds via transaction and `Payment` row lock (preventing double refunds). |
| `src/server/care/payout-service.ts` | Modified | Serialized concurrent payouts via transaction and `DoctorProfile` row lock (preventing double payouts). |
| `tests/care/postgres-concurrency.test.ts` | Modified | Expanded to 10 comprehensive commercial concurrency and financial invariant tests. |
| `tests/safety/afghanistan-emergency-audit.test.ts` | Created | Dedicated primary source audit suite for Afghanistan emergency contacts and routing. |
| `docs/RELEASE_BLOCKERS_FINAL_VERIFICATION.md` | Created | Final release-blocking verification report. |

---

## Conclusion & Staging Safety Recommendation

- **Staging Deployment:** **SAFE TO BEGIN** for internal testing, staging sandbox validation, and simulated multi-client test procedures using mock adapters in staging environments.
- **Production Commercial Launch:** **STRICTLY BLOCKED** until external commercial merchant contracts, LiveKit SFU infrastructure, cloud storage buckets, and legal healthcare licenses are executed.
