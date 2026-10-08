# SehatAI Care Connect — Operations Runbook & Admin Guide (§100)

> **Document Type:** Operational Procedures, Administration Manual & System Observability  
> **Audience:** Operations Engineers, Clinical Administrators, Finance Officers, Support Leads

---

## 1. Administrative Control Center (`/api/care/admin`)

The Care Connect admin subsystem operates under strict least-privilege role segregation (`src/lib/care/rbac.ts`). Access to resources is partitioned by operational role:
- **`clinical_admin` / `support`:** Consultation lists, dispute investigation, review moderation, doctor credentialing.
- **`finance`:** Gross Merchandise Value (GMV), payment reconciliation, payout processing, platform fee accounting. Zero access to private clinical records.
- **`admin` / `super_admin`:** Feature flag toggling, commission rules, cross-border jurisdiction policies, fraud investigation.

### 1.1 Console Resource Views (`GET /api/care/admin?resource=`)
1. **`overview`:** Realtime business intelligence dashboard:
   - Today’s platform commission, total GMV, aggregate refunded volume, pending doctor payouts.
   - Count of active vs completed consultations; 30-day patient and doctor onboarding velocities.
2. **`consultations`:** Full operational listing across all 17 lifecycle states with patient and doctor identifiers.
3. **`payments` & `refunds`:** Detailed transaction log with gateway references and processing states.
4. **`payouts`:** Doctor disbursement queue.
5. **`fraud`:** Active fraud signals from automated pattern detection.
6. **`disputes`:** Open patient/doctor consultation disputes.
7. **`flags`:** Runtime feature flag states and scopes.

---

## 2. Feature Flag Runtime Management

Care Connect features are controlled at runtime without redeploying software:
1. **Database Table `FeatureFlag`:**
   - Overrides static `.env` defaults.
   - Supports global scope (`scope: global`) or country-specific scopes (e.g., `scope: country:PK`).
2. **In-Memory Caching (`src/lib/care/flags.ts`):**
   - Flags are cached for 15 seconds (`CACHE_TTL_MS = 15_000`) to guarantee high-throughput query performance without overloading the database.
   - Executing `POST /api/care/admin` with `{ action: "flag.set", key: "CARE_PAYMENTS_ENABLED", enabled: true }` writes to the database and immediately calls `clearFlagCache()`.

---

## 3. Fraud Monitoring & Review Queue (§60)

The engine monitors abnormal transactional patterns and generates `FraudSignal` events:
- **`failed_payments`:** Excessive card or wallet declines from the same patient within 1 hour.
- **`refund_abuse`:** Repeated booking-then-cancellation loops.
- **`self_booking`:** Patient accounts sharing IP, device finger-print, or bank account with the attending doctor.
- **`review_manipulation`:** Clusters of 5-star ratings from new accounts within short time intervals.

### Administrative Action on Fraud Signals:
1. Navigate to `/api/care/admin?resource=fraud`.
2. Review the event `detailJson` and affected `userId`.
3. Dispatch review resolution:
   `POST /api/care/admin { action: "fraud.review", signalId: "<id>", state: "ACTIONED" | "DISMISSED" }`.

---

## 4. Doctor Payout Processing Runbook (§13)

### 4.1 Earnings Maturation Ladder
1. **Payment Capture:** Upon consultation completion, net earnings are posted to `DoctorEarning` in `PENDING` state.
2. **Maturity Delay (`CARE_EARNING_DELAY_HOURS`):** Default 72 hours. Protects against post-consultation refund claims.
3. **Automated Promotion:**
   - Evaluated lazily on doctor earnings view or via operational sweep (`promoteDueEarnings()`).
   - Atomically claims rows where `availableAt <= NOW()` and posts balancing ledger entries:
     - `DEBIT: DOCTOR_PENDING`
     - `CREDIT: DOCTOR_AVAILABLE`

### 4.2 Executing Doctor Disbursements
1. The doctor submits a disbursement request from their portal (`POST /api/doctor/care/payouts`), creating a `Payout` row in `PENDING` state and debiting `DOCTOR_AVAILABLE`.
2. Finance officer reviews pending payouts:
   `GET /api/care/admin?resource=payouts`.
3. Verification:
   - Verify doctor PM&DC license is active and not suspended.
   - Verify destination bank title matches doctor's legal CNIC name.
4. Execution:
   `POST /api/care/admin { action: "payout.process", payoutId: "<id>" }`.
   - Triggers the disbursement gateway or marks external 1Link bank transfer.

---

## 5. Observability, Metrics & Audit Trails

1. **Structured Audit Logs:**
   - Every administrative, financial, and clinical action records an immutable row in `AuditLog` and `ConsultationAuditEvent`.
   - Tracks: `actorId`, `actorRole`, `action`, `resource`, `ip`, `meta`, `createdAt`.
2. **Telemetry Metrics (`src/lib/observability.ts`):**
   - Prometheus-compatible metrics endpoint exposed at `/api/observability/metrics`.
   - Monitors: HTTP request durations, active consultation counts, pipeline latency bands, memory usage, and error rate counters.
3. **Health Checks (`/api/health`):**
   - Evaluates database connectivity, redis/cache responsiveness, and external payment gateway reachability.
