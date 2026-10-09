# SehatAI Care Connect — Owner & Executive Activation Checklist

> **Target Audience:** Project Owner, Chief Executive Officer, Chief Medical Officer, Finance Director, Legal Counsel  
> **Purpose:** Authoritative operational checklist and commercial runbook detailing all external accounts, regulatory licenses, banking merchant agreements, cloud infrastructure, and configuration steps required to transition SehatAI + Care Connect from local/staging validation into production operation.  
> **Status Policy:** Every integration is audited below. Where external commercial agreements or owner credentials are required, the status is stamped as **BLOCKED** or **ACTION REQUIRED**. No mocked substitute is counted as production readiness.

---

## 1. Executive Summary & Activation Dependency Graph

```
                               ┌────────────────────────────────────────────────────────┐
                               │           Corporate Entity & Regulatory Base           │
                               │  - SECP Incorporation / Business Registration           │
                               │  - PM&DC Telemedicine Regulatory Clearance (§31/§32)   │
                               │  - Corporate Bank Account (PKR / USD / AFN)            │
                               └──────────────────────────┬─────────────────────────────┘
                                                          │
                    ┌─────────────────────────────────────┼────────────────────────────────────┐
                    ▼                                     ▼                                    ▼
       ┌────────────────────────┐            ┌────────────────────────┐           ┌────────────────────────┐
       │   Cloud Infrastructure │            │  Banking & Settlements │           │  Clinical Operations   │
       │  - AWS RDS PostgreSQL  │            │  - 1Link / PayFast PK  │           │  - Doctor PM&DC Verif. │
       │  - AWS S3 KMS Vault    │            │  - HesabPay AF Corridor│           │  - Cross-Border Legal  │
       │  - LiveKit Cloud SFU   │            │  - Card Gateway Escrow │           │  - Clinical Admin Staff│
       └────────────────────────┘            └────────────────────────┘           └────────────────────────┘
```

---

## 2. Comprehensive Provider Activation Matrix

### Subsystem 1: Managed Cloud PostgreSQL Database
* **Account to Create:** Amazon Web Services (AWS) or Neon / Supabase Enterprise.
* **Account / Plan Type:**
  * Staging: `db.t4g.medium` (Single-AZ, 50 GB gp3).
  * Production: `db.r6g.large` (Multi-AZ High Availability, 200 GB gp3 auto-scaling to 1 TB, 30-day continuous Point-in-Time Recovery).
* **Required Configuration:**
  * Engine: PostgreSQL 16.4+.
  * Parameter Group: `rds.force_ssl = 1`, `password_encryption = scram-sha-256`.
  * Separate connection endpoints: Unpooled Port 5432 for migrations (`npx prisma migrate deploy`), Pooled Port 6543 (PgBouncer) for container web traffic.
  * Security Group: Restrict incoming TCP port 5432 strictly to SehatAI application VPC subnets (never expose 0.0.0.0/0).
* **Environment Variable Names:**
  * `DATABASE_URL` (pooled connection string for application runtime)
  * `DATABASE_URL_POOLED`
  * `DATABASE_URL_UNPOOLED` (direct connection string for schema migrations)
* **Expected Cost Category:** $150 – $350 / month (depending on Multi-AZ and storage volume).
* **Necessary Merchant / Legal Approval:** Standard cloud vendor master services agreement.
* **Verification Steps:**
  1. Run `npx prisma migrate deploy` using direct credentials.
  2. Query `SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';` — must return exactly 79 tables.
  3. Verify SSL cipher suite: `SELECT ssl_is_used(), ssl_cipher();`.
* **Remaining Coding Work:** None. Database schema, Prisma client, and migration baseline (`20261008000000_init_postgresql`) are fully functional.
* **Current Status:**
  * Staging (Local WSL2 ext4 loopback): **PASS (79 tables active)**.
  * Production Managed Cloud RDS: **BLOCKED: Awaiting Owner AWS Account Provisioning**.

---

### Subsystem 2: Private Medical Document Storage (Vault)
* **Account to Create:** Amazon Web Services (AWS Simple Storage Service) or Alibaba Cloud (OSS).
* **Account / Plan Type:** AWS Standard S3 Bucket with AWS Key Management Service (SSE-KMS).
* **Required Configuration:**
  * Bucket Name: `sehatai-prod-medical-vault-private` (outside `/public`, zero public web access).
  * Enforce **S3 Block Public Access** (enable all 4 settings).
  * Apply `deploy/storage/s3-bucket-policy.json` (strictly denies non-TLS HTTP traffic and requires server-side encryption).
  * Client-side double encryption: SehatAI server code performs AES-256-GCM encryption before streaming bytes to S3, and S3 applies SSE-KMS at the bucket level.
  * Signed Read URL TTL: 300 seconds (5 minutes) maximum lifetime.
* **Environment Variable Names:**
  * `CARE_STORAGE_PROVIDER="s3"`
  * `CARE_STORAGE_KEY` (32-byte hex entropy key: `openssl rand -hex 32`)
  * `CARE_S3_BUCKET`
  * `CARE_S3_REGION` (e.g. `ap-south-1`)
  * `CARE_S3_KEY` (IAM Access Key ID)
  * `CARE_S3_SECRET` (IAM Secret Access Key)
* **Expected Cost Category:** $15 – $60 / month (pay-as-you-go based on stored GB and signed GET requests).
* **Necessary Merchant / Legal Approval:** HIPAA / BAA (Business Associate Agreement) or local data protection policy addendum.
* **Verification Steps:**
  1. Upload test medical image via `PUT /api/care/storage/upload`.
  2. Confirm S3 direct web URL returns `403 Forbidden`.
  3. Fetch file using authorized short-lived signed URL via `GET /api/care/storage/view?key=...`.
* **Remaining Coding Work:** None. `src/server/care/storage.ts` contains full SigV4 client-side and AES-256-GCM implementation without external heavy SDK bloat.
* **Current Status:**
  * Staging Local Storage (`storage/care/`, AES-256-GCM): **PASS**.
  * Production AWS S3 KMS Bucket: **BLOCKED: Awaiting Owner AWS S3 Provisioning & IAM Credentials**.

---

### Subsystem 3: WebRTC Telemedicine SFU & Video Infrastructure
* **Account to Create:** LiveKit Cloud (`cloud.livekit.io`) or Self-Hosted LiveKit Cluster on Kubernetes / AWS ECS.
* **Account / Plan Type:** LiveKit Cloud Pro Plan (or Enterprise with HIPAA compliance).
* **Required Configuration:**
  * Video SFU region selection: `ap-south-1` (Mumbai / Karachi latency optimization).
  * Dedicated STUN/TURN allocation: port 3478 / 5349 for mobile NAT traversal across cellular carrier CGNAT (Jazz, Zong, Telenor, Roshan, Afghan Telecom).
  * Token TTL: 900 seconds (15 minutes).
  * Video Consultation Privacy: Server-side recording disabled by default (`recording: false`).
* **Environment Variable Names:**
  * `CARE_VIDEO_PROVIDER="livekit"`
  * `LIVEKIT_URL` (e.g. `wss://livekit.sehatai.health` or `wss://sehatai-prod.livekit.cloud`)
  * `LIVEKIT_API_KEY`
  * `LIVEKIT_API_SECRET`
  * `CARE_VIDEO_TOKEN_SECRET` (HMAC secret for local session signing)
* **Expected Cost Category:** $50 – $250 / month (based on participant video minutes).
* **Necessary Merchant / Legal Approval:** Standard SaaS agreement; confirm WebRTC media stream data retention policy (zero video media retention).
* **Verification Steps:**
  1. Issue room token for consultation via `POST /api/care/video/token`.
  2. Validate generated JWT signature against `LIVEKIT_API_SECRET`.
  3. Connect two independent devices and confirm bidirectional audio/video stream exchange.
* **Remaining Coding Work:** None. `src/server/care/video-service.ts` implements both `MiniSignalProvider` (staging) and `LiveKitVideoProvider` (production).
* **Current Status:**
  * Staging WebSocket Relay (:3004): **PASS**.
  * Production LiveKit Cloud SFU Cluster: **BLOCKED: Awaiting Owner LiveKit Account & API Keys**.

---

### Subsystem 4: Pakistan Domestic Payment Gateway & Escrow Payouts
* **Account to Create:** Certified Merchant Account with a State Bank of Pakistan (SBP) licensed Payment Service Provider / Operator (PSO/PSP):
  * Primary: **1Link 1Bill** / **PayFast (Apps360)** / **Bank Alfalah Payment Gateway**.
  * Secondary Mobile Wallets: **JazzCash Merchant** / **Easypaisa Merchant**.
* **Account / Plan Type:** Corporate Merchant Integration with Dual APIs:
  1. Inward Collection API (Card, 1Bill OTC, QR, Wallet).
  2. Outward Bulk Disbursement API (IBFT - Inter-Bank Fund Transfer for doctor earnings payout).
* **Required Configuration:**
  * Whitelisted server IP addresses for webhook callback delivery.
  * Raw body HMAC-SHA256 signature verification configured in webhook endpoint.
  * Bank Settlement Escrow Account: Holding account for 72-hour earnings maturity delay before IBFT payout.
* **Environment Variable Names:**
  * `CARE_PAYMENT_PROVIDER="pk-local"`
  * `CARE_PK_GATEWAY_KEY`
  * `CARE_PK_GATEWAY_SECRET`
  * `CARE_ALLOW_MOCK_PAYMENTS="false"` (strictly locked)
  * `CARE_EARNING_DELAY_HOURS="72"`
* **Expected Cost Category:** 1.5% – 2.5% + PKR 10–25 per transaction (MDR - Merchant Discount Rate).
* **Necessary Merchant / Legal Approval:**
  * SECP Certificate of Incorporation.
  * Corporate NTN (National Tax Number).
  * Form 29 / Form A corporate filings.
  * Dedicated Corporate Commercial Bank Account with IBFT API enablement.
* **Verification Steps:**
  1. Execute sandbox payment transaction via gateway SDK.
  2. Receive and verify inbound webhook signature at `/api/care/payments/webhooks/pk-local`.
  3. Verify double-entry ledger postings: `PATIENT_ESCROW` credit and `PLATFORM_COMMISSION` credit.
  4. Test IBFT disbursement to doctor bank account after 72-hour delay via `POST /api/care/payouts/process`.
* **Remaining Coding Work:** Connect production credentials to the `src/server/care/payments/` gateway adapter interface.
* **Current Status:** **BLOCKED: Awaiting Owner SECP Registration, Corporate Bank Account & SBP Gateway Contract**.

---

### Subsystem 5: Afghanistan Domestic Payment Corridor
* **Account to Create:** **HesabPay Corporate Merchant Account** (Zinzir Ltd. / licensed by Da Afghanistan Bank).
* **Account / Plan Type:** API Enterprise Merchant (supporting Hawala / HesabPay Wallet / DAB Interbank clearing).
* **Required Configuration:**
  * Currency: AFN (Afghan Afghani).
  * Webhook callback URL: `https://sehatai.health/api/care/payments/webhooks/hesabpay`.
  * Merchant Public Key and Private API Key authentication.
* **Environment Variable Names:**
  * `HESABPAY_API_KEY`
  * `HESABPAY_MERCHANT_ID`
* **Expected Cost Category:** 1.0% – 2.0% per transaction.
* **Necessary Merchant / Legal Approval:**
  * Ministry of Industry and Commerce (MoIC) Business License.
  * Da Afghanistan Bank (DAB) e-payment compliance authorization.
* **Verification Steps:**
  1. Initiate test AFN payment transaction via HesabPay sandbox checkout.
  2. Confirm webhook receipt and verify signature.
  3. Confirm ledger entry credited in `AFN` minor units.
* **Remaining Coding Work:** Production adapter hookup in `src/server/care/payments/`.
* **Current Status:** **BLOCKED: Awaiting Owner HesabPay Merchant Contract & DAB Clearances**.

---

### Subsystem 6: International Credit & Debit Card Gateway
* **Account to Create:** Stripe (via UK/UAE/US entity) or 2Checkout (Verifone) / Checkout.com.
* **Account / Plan Type:** Standard Verified Business Account.
* **Required Configuration:**
  * Currencies supported: USD, GBP, EUR, AED, PKR.
  * Webhook endpoint: `https://sehatai.health/api/care/payments/webhooks/card`.
  * Enable 3D Secure (3DS) mandatory authentication for fraud prevention.
* **Environment Variable Names:**
  * `CARE_CARD_GATEWAY_KEY`
  * `CARE_CHECKOUT_SECRET`
* **Expected Cost Category:** 2.9% + $0.30 per international card charge.
* **Necessary Merchant / Legal Approval:** Registered legal entity in a supported jurisdiction.
* **Verification Steps:**
  1. Test card charge with 3DS challenge.
  2. Verify chargeback event simulation via `processChargeback()` ledger clawback handler.
* **Remaining Coding Work:** Production webhook adapter hookup.
* **Current Status:** **BLOCKED: Awaiting International Entity & Stripe/Checkout.com Account**.

---

### Subsystem 7: Doctor Licensure & Telemedicine Legal Clearances
* **Regulatory Body (Pakistan):** **Pakistan Medical & Dental Council (PM&DC)**.
  * Section 31/32 Telemedicine Practice Regulations.
  * Requirement: Electronic verification of doctor PM&DC registration numbers, permanent licenses, and good standing certificates.
  * Doctor Onboarding Mandate: Admin manual verification required (`pmdcVerifiedBy` ID and timestamp) before any doctor is permitted to appear in marketplace search or accept patient bookings.
* **Regulatory Body (Afghanistan):** **Ministry of Public Health (MoPH)**.
  * Department of Private Health Sector Regulation.
  * Telemedicine operating permit and clinical oversight protocols.
* **Cross-Border Corridor Policy:**
  * Pakistan–Afghanistan cross-border consultations (`PK -> AF` and `AF -> PK`) are **HARD-DISABLED BY DEFAULT** in codebase (`CARE_CROSS_BORDER_CORRIDOR_APPROVED="false"`).
  * Legal Requirement: Formal written bilateral MoU or cross-border medical licensing framework between PM&DC and MoPH before this flag may be enabled.
* **Required Action:**
  * Legal counsel must formalize Terms of Service, Patient Informed Consent, Doctor Service Level Agreements, and Electronic Prescriptions Liability Waivers.
* **Current Status:** **BLOCKED: Awaiting PM&DC / MoPH Written Regulatory Filings & Legal Counsel Approvals**.

---

### Subsystem 8: Push Notifications & Mobile PWA Infrastructure
* **Account to Create:** Web Push VAPID Keypair (in-house) + Firebase Cloud Messaging (Google FCM) / Apple Developer Program.
* **Account / Plan Type:**
  * VAPID: Free (standard RFC 8292).
  * Apple Developer Program: $99 / year (required for iOS Safari APNs Web Push).
* **Required Configuration:**
  * Cryptographic VAPID key generation: `npx web-push generate-vapid-keys`.
  * Durable Outbox Worker Service daemon: `scripts/run-outbox-worker.ts` configured as systemd service or container task with atomic queue locking and stuck-job recovery.
* **Environment Variable Names:**
  * `VAPID_PUBLIC_KEY`
  * `VAPID_PRIVATE_KEY`
  * `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
  * `VAPID_SUBJECT="mailto:security@sehatai.health"`
  * `INTERNAL_WORKER_KEY`
* **Expected Cost Category:** $0 – $99 / year.
* **Necessary Merchant / Legal Approval:** Apple Developer Program Organization verification.
* **Verification Steps:**
  1. Subscribe browser to push service via `/api/care/notifications/subscribe`.
  2. Queue notification via `enqueueNotification()`.
  3. Run worker `bun scripts/run-outbox-worker.ts --once` and observe lock, delivery, and receipt.
* **Remaining Coding Work:** None. Outbox worker, retry backoff, stuck job recovery, and dead-letter replay are 100% complete and tested.
* **Current Status:**
  * Queue Worker Engine & DB Locking: **PASS**.
  * Production APNs / FCM Credentials: **ACTION REQUIRED: Owner to generate VAPID keys and enroll in Apple Developer Program**.

---

### Subsystem 9: AI Multi-Provider Inference Hierarchy
* **Accounts to Create:**
  1. **Alibaba Cloud DashScope** (Primary Model: Qwen 2.5 72B Instruct / Qwen-Plus).
  2. **Google Cloud / Google AI Studio** (Tier 1 Fallback: Gemini 1.5 Pro / Flash).
  3. **Groq Cloud** (Tier 2 Ultra-Low Latency Fallback: Llama 3.3 70B Versatile).
  4. **OpenRouter** (Multi-Model Gateway Fallback).
* **Account / Plan Type:** Commercial Tier with Monthly Billing / Invoicing.
* **Required Configuration:**
  * Set spending limits / hard billing quotas to prevent denial-of-wallet spikes.
  * Whitelist outbound production egress IP addresses.
* **Environment Variable Names:**
  * `DASHSCOPE_API_KEY`
  * `GOOGLE_GENERATIVE_AI_API_KEY`
  * `GROQ_API_KEY`
  * `OPENROUTER_API_KEY`
* **Expected Cost Category:** $200 – $800 / month (usage-based token billing).
* **Necessary Merchant / Legal Approval:** Standard commercial API terms.
* **Verification Steps:**
  1. Run automated failover test: `bun run test:m4` (52/52 tests must pass across all tiers).
* **Remaining Coding Work:** None. The 4-tier cascade hierarchy, token accounting, and fallback engine in `src/server/llm.ts` are 100% complete.
* **Current Status:** **READY (API Keys Active in Staging, requires owner enterprise billing setup for production)**.

---

### Subsystem 10: Observability & Error Monitoring
* **Account to Create:** Sentry (`sentry.io`) or Self-Hosted GlitchTip.
* **Account / Plan Type:** Business / Team Plan.
* **Required Configuration:**
  * Project DSN for Node.js backend.
  * Strict Data Scrubbing Rule: Configure Sentry server-side rules to reject credit card numbers, email addresses, and PM&DC numbers.
  * SehatAI Client-Side Sanitization: Enforced by `src/lib/observability.ts` (strips all PHI, symptoms, medical descriptions, and credentials before transmission).
* **Environment Variable Names:**
  * `SENTRY_DSN`
  * `SENTRY_ENVIRONMENT="production"`
* **Expected Cost Category:** $0 – $80 / month.
* **Verification Steps:**
  1. Trigger test exception with sanitized context via `captureException()`.
  2. Confirm event appears in Sentry dashboard with zero Protected Health Information.
* **Remaining Coding Work:** None. `src/lib/observability.ts` includes `scrubPhi()`, `sanitizeContext()`, and envelope dispatch.
* **Current Status:** **ACTION REQUIRED: Owner to create Sentry project and supply DSN**.

---

## 3. Owner Activation Phase Timeline

| Phase | Milestone | Responsible Party | Estimated Duration | Blocked State |
| :--- | :--- | :--- | :---: | :---: |
| **Phase 1** | Corporate Entity & Tax Registration (SECP, NTN) | Project Owner / Legal Counsel | 2 – 4 Weeks | Blocks Phase 3 & 4 |
| **Phase 2** | Cloud Infrastructure Provisioning (AWS RDS, S3 KMS, LiveKit) | DevOps Engineer / Owner | 2 – 3 Days | Blocks Staging Cloud Gate |
| **Phase 3** | Banking Escrow & Payment Gateway Merchant Contract (1Link / PayFast) | Finance Director / Bank | 3 – 6 Weeks | Blocks Real Money Pilot |
| **Phase 4** | PM&DC Telemedicine Regulatory Consultation & Clinical Policy Sign-Off | Chief Medical Officer | 4 – 8 Weeks | Blocks Public Doctor Launch |
| **Phase 5** | Production Staging Gate Verification on Real Cloud Hardware | Engineering Lead | 3 Days | Unlocks Stage 3 Rollout |
| **Phase 6** | Controlled Pilot Launch (Stage 3: Family Medicine in Pilot City) | Whole Team | Continuous | Production Operation |

---

## 4. Final Activation Sign-Off Block

| Role | Name | Signature | Date | Approval Status |
| :--- | :--- | :--- | :--- | :--- |
| **Project Owner / CEO** | ____________________ | ____________________ | ________ | `[ ] APPROVED  [ ] PENDING` |
| **Chief Medical Officer** | ____________________ | ____________________ | ________ | `[ ] APPROVED  [ ] PENDING` |
| **Lead Legal Counsel** | ____________________ | ____________________ | ________ | `[ ] APPROVED  [ ] PENDING` |
| **Finance Director** | ____________________ | ____________________ | ________ | `[ ] APPROVED  [ ] PENDING` |
| **Engineering Lead** | ____________________ | ____________________ | ________ | `[ ] APPROVED  [ ] PENDING` |
