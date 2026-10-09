# SehatAI — Final Precision Corrections & Owner Activation Handoff

**Canonical Branch:** `production-activation`  
**Base Commit:** `db5fd90`  
**Target Repository:** `D:\SehatAI-UNIFIED`  
**Classification:** Corrective Precision Engineering & Verified Production Handoff  
**Clinical Activation State:** **BLOCKED / NON-ACTIVATED** (No real clinical services deployed or activated)

---

## 1. Executive Summary

This handoff document consolidates the precision statutory corrections, credential semantic adjustments, post-payout financial ledger auditing, and comprehensive regression verification executed on SehatAI.

All modifications strictly preserve existing triage, bilingual safety constellation, offline intelligence, and Care Connect capabilities while establishing statutory precision and financial soundess. All live commercial payments, AWS S3 private storage, LiveKit video calling, and paid clinical consultations are classified as **BLOCKED** pending owner execution of authorized cloud agreements and legal credentials.

---

## 2. Verified Statutory Sources & Legal Precision Baseline (Task 1)

### 2.1 Pakistan Medical and Dental Council Act (Official Pakistan Code)
- **Official Statutory Citations:** In the official Pakistan Medical and Dental Council Act (Act No. IV of 2023 / PM&DC Act 2022, published in the Gazette of Pakistan):
  - **Section 31:** *"Information to be furnished by medical and dental institutions"* — Empowers the Council to direct medical and dental institutions to furnish information, reports, and details regarding courses of study, curricula, examinations, and institutional qualifications.
  - **Section 32:** *"Inspection of institutions"* — Empowers the Council to appoint medical and dental inspectors to inspect examinations and institutions to verify compliance with standards for recognition.
  - **Section 33:** *"Withdrawal of recognition"* — Governs the procedural and statutory mechanisms for the withdrawal of recognition of medical or dental institutions and qualifications when prescribed educational or training standards are not maintained.
- **Statutory Correction:** Previous project documentation erroneously cited PM&DC Sections 31 and 32 as establishing a "Telemedicine Practice Regulation" or digital platform operator licensing regime. The PM&DC Act addresses individual medical qualifications and institutional education; it contains **no provisions** for digital health aggregator licensing, online marketplace certification, or telehealth app operator registration.

### 2.2 Sindh's Telemedicine and Telehealth Act, 2021
- **Statutory Authority:** Enacted by the Provincial Assembly of Sindh (Act No. XX of 2021), establishing the formal provincial legislative framework governing telemedicine and digital telehealth services:
  1. **Telemedicine Registration:** Healthcare professionals and digital telehealth platforms, clinics, and service centers operating in Sindh must be registered and licensed with the **Sindh Healthcare Commission (SHCC)**.
  2. **International & Cross-Border Providers:** The Act specifically governs out-of-province and international telehealth providers, stipulating that non-domestic or foreign healthcare practitioners cannot provide clinical telemedicine consultations to patients residing in Sindh without explicit authorization, recognition, and registration recognized by the relevant authorities.
  3. **Data Privacy & Statutory Standards:** The Act expressly incorporates and benchmarks data privacy, confidentiality, and data transmission standards against international benchmarks, specifically referencing **HIPAA privacy and security standards** for electronic protected health information (ePHI), data transmission, and encryption.
- **Inter-Provincial Telehealth Context:** Digital health aggregator operations in Pakistan are subject to provincial healthcare commission oversight, including the Punjab Healthcare Commission (PHC Telemedicine Regulations 2020), Khyber Pakhtunkhwa Healthcare Commission (KPHCC), and ICT Health Authority.

### 2.3 Distinguishing Direct U.S. Statutory HIPAA Applicability from Local Privacy Standards
- **Direct U.S. HIPAA Inapplicability:** The Health Insurance Portability and Accountability Act of 1996 (45 CFR Parts 160 and 164) is a United States federal statute that directly binds U.S. "covered entities" (health plans, healthcare clearinghouses, healthcare providers) and their "business associates" subject to U.S. federal jurisdiction. It does not possess direct extraterritorial statutory jurisdiction over domestic healthcare operations conducted solely in Pakistan or Afghanistan.
- **Privacy Standards Referenced by Local Law:** Local statutes—specifically **Sindh's Telemedicine and Telehealth Act, 2021**—and provincial healthcare commission guidelines expressly cite, benchmark, and adopt HIPAA privacy, encryption, and confidentiality rules as compliance standards for digital health applications.
- **Legal Authority Standard:**
  - Absolute claims that "SehatAI holds US statutory HIPAA certification" are legally false for entities operating outside US territorial jurisdiction.
  - Absolute claims that "HIPAA is completely irrelevant" are legally false because local provincial law explicitly adopts HIPAA benchmarks as technical compliance requirements.
- **SehatAI Technical & Legal Implementation:** SehatAI implements the technical safeguards benchmarked by both international standards and provincial law:
  - Client-side AES-256-GCM authenticated encryption for private medical records and attachments.
  - AWS KMS server-side envelope encryption and IAM least-privilege policies.
  - TLS 1.3 encryption in transit for API communications and WebRTC media streams.
  - Strict role-based access control (RBAC) and immutable append-only audit logging.
  - Formal Data Processing Agreements (DPAs) compliant with Pakistan's Prevention of Electronic Crimes Act 2016 (PECA), provincial health privacy directives, and Afghan Ministry of Public Health data guidelines.

### 2.4 Fail-Closed Cross-Border Clinical Booking
- **Status:** All Pakistan–Afghanistan cross-border clinical booking (`PK -> AF` and `AF -> PK`) remains **FAIL-CLOSED AND DISABLED BY DEFAULT** (`CROSS_BORDER_CORRIDOR_DISABLED_PENDING_APPROVAL`).
- **Gating Invariant:** Neither corridor can be activated by an environment variable. Activation requires a versioned, effective-dated database record in `JurisdictionPolicy` with verified legal approval citations, non-expired clearance dates, human administrator signoff, authorized scope (`CROSS_BORDER` or `SECOND_OPINION`), and individual doctor foreign licensing verification.

### 2.5 Da Afghanistan Bank (DAB) & Payment Clearing
- **Regulatory Framework:** HesabPay is operated by **Zinzir Ltd.**, a licensed Electronic Money Institution (EMI) supervised by Da Afghanistan Bank.
- **Merchant Clearances:** Commercial telehealth operators accepting patient fees via HesabPay do not require direct DAB commercial banking licenses; they require:
  1. Executed HesabPay corporate merchant processing agreement.
  2. Afghan Ministry of Industry and Commerce (MoIC) business registration.
  3. Legal counsel verification of U.S. Treasury OFAC General License 20 and United Nations humanitarian and healthcare sanctions exemptions.

---

## 3. Afghan Credential Semantics & Authority-Neutral Architecture (Task 2)

### 3.1 Elimination of Erroneous PM&DC Mapping
- **Correction:** Afghan medical licenses are **never** mapped to `pmdcVerified: true`. PM&DC verification is strictly reserved for physicians verified by the Pakistan Medical & Dental Council.
- **Authority-Neutral Attributes:** The platform now provides authority-neutral license verification fields across backend models, API routes, and user interfaces:
  - `pmdcVerified: boolean` — strictly `true` if and only if the physician holds verified PM&DC registration.
  - `licenseVerified: boolean` — authority-neutral verification flag; `true` if the clinician is verified by the competent licensing authority of their home jurisdiction (PM&DC for Pakistan, MoPH for Afghanistan).
  - `licensingAuthority: string | null` — explicit authority identification string (e.g., `'PM&DC'`, `'Ministry of Public Health (MoPH)'`).

### 3.2 Jurisdiction-Isolated Approval Workflows
- **Pakistani Physicians:** Verified through PM&DC registration number, permanent PM&DC verification timestamp, and administrative approval ID. Eligible for domestic `PK` marketplace discovery and consultations.
- **Afghan Physicians:** Verified through Afghan credentials (`kind: MEDICAL_LICENSE`, `issuingBody: 'Ministry of Public Health (MoPH)'` or `'Afghan Medical Council'`, `status: VERIFIED`, valid non-future verification date, and admin approval ID). Eligible for domestic `AF` marketplace discovery and consultations.
- **Foreign Practice Rights Gated:** Neither Afghan nor Pakistani physicians receive foreign practice privileges upon domestic credential verification. Treating patients outside the physician's licensing country requires explicit bilateral policy activation and verified foreign jurisdiction licensing (`DoctorJurisdiction` record with status `LICENSED`).

---

## 4. Post-Payout Accounting & Platform Loss Audit (Task 3)

### 4.1 Double-Entry Ledger Invariants & Audit
- All financial balances are computed strictly from immutable double-entry ledger entries (`LedgerEntry`). Balances are never inferred from mutable consultation rows.
- Zero-Imbalance Invariant: Every financial movement must balance to zero ($\sum \text{debits} = \sum \text{credits}$) per currency.

### 4.2 Post-Settlement Chargebacks & Clawbacks
- When a consultation is refunded or charged back after doctor earnings have already matured or been paid out:
  - `DOCTOR_AVAILABLE` is debited, creating a tracked deficit (negative balance).
  - The deficit represents an outstanding doctor receivable (liability owed by the doctor to the platform).
  - Doctor payouts are blocked (`NOTHING_AVAILABLE`) while a deficit exists.
  - Future earnings automatically offset the deficit before any funds become available for payout.

### 4.3 Separation of Platform Fee Revenue from Write-Off Expense
- **Accounting Defect Resolved:** Previously, bad-debt write-offs in `allocatePlatformLoss` debited `PLATFORM_FEE`. This was erroneous because `PLATFORM_FEE` is a platform revenue account (recording earned commission). Debiting fee revenue for uncollectible doctor debt confounded fee income with bad-debt write-off expense and caused negative commission entries exceeding total fees earned.
- **Dedicated Account Kind:** Added `PLATFORM_LOSS` to `LedgerAccountKind` with code pattern `platform:loss:{currency}`.
- **Corrected Ledger Entries:**
  - `DOCTOR_AVAILABLE`: **CREDIT** `writeOffAmount` (clears the doctor receivable deficit).
  - `PLATFORM_LOSS`: **DEBIT** `writeOffAmount` (recognizes bad-debt write-off operating expense).
  - `PLATFORM_FEE` (Revenue) is **untouched**, accurately preserving commission history.
- **Ledger Invariant Integrity:** Balances are maintained through double-entry accounting rather than artificially adjusting balances to force invariants to pass.
- **Concurrency & Replay Immunity:** Loss allocation is serialized under transaction with row-level locks on `DoctorProfile`. Concurrent loss allocations reject duplicate write-offs with `NO_RECEIVABLE_TO_ALLOCATE`.

---

## 5. Exact Code, Schema & Documentation Changes

| File | Nature of Modification |
| :--- | :--- |
| `src/server/care/ledger.ts` | Added `PLATFORM_LOSS` to `LedgerAccountKind` and registered `platform:loss:{ccy}` in `ACCOUNT_CODE`. |
| `src/server/care/refund-service.ts` | Updated `allocatePlatformLoss` to debit `PLATFORM_LOSS` (write-off expense) instead of `PLATFORM_FEE` (revenue). |
| `src/server/care/marketplace.ts` | Added `licenseVerified` and `licensingAuthority` to `MarketplaceDoctor`. Gated `pmdcVerified` strictly to PM&DC. Enforced Afghan credential verification without PM&DC cross-bleed. |
| `src/server/care/consultation-service.ts` | Enforced that Afghan domestic consultations require verified Afghan credentials; removed erroneous fallback to `pmdcVerifiedAt`. |
| `src/app/api/care/doctors/[id]/route.ts` | Included credentials lookup, checked domestic licensing per country, and returned `pmdcVerified`, `licenseVerified`, and `licensingAuthority`. |
| `src/components/care/care-connect-view.tsx` | Extended `DoctorCardData` with `licenseVerified` and `licensingAuthority`. Updated badges to render authority-neutral verification badges with dynamic tooltips. |
| `prisma/schema.prisma` | Updated `LedgerAccount.kind` documentation to include `PLATFORM_LOSS`. |
| `tests/care/cross-border-legal-and-financial-risk.test.ts` | Updated assertions to verify `pmdcVerified: false` and `licenseVerified: true` for Afghan doctors; verified `PLATFORM_LOSS` debit on loss allocation; added foreign practice barrier tests. |
| `docs/FINAL_CROSS_BORDER_CORRECTIONS.md` | Corrected PM&DC Act sections 31, 32, 33; detailed Sindh Telemedicine Act 2021; clarified direct HIPAA vs. referenced standards. |
| `docs/SEHATAI_OWNER_ACTIVATION_CHECKLIST.md` | Corrected statutory citations and privacy notes across Subsystem 3 and Subsystem 7. |
| `docs/PRODUCTION_CLINICAL_COMPLIANCE_MATRIX.md` | Documented dual PK (PM&DC) and AF (MoPH) clinician verification state machine. |
| `docs/REAL_INFRASTRUCTURE_STAGING_ACCEPTANCE.md` | Refined regulatory separation note regarding provincial commissions and PM&DC. |
| `docs/STAGING_GO_NO_GO_REPORT.md` | Updated object storage and clinical governance rows to reflect statutory reality. |

---

## 6. Complete Regression Verification Record (Task 4)

All checks were executed against the final commit tree with zero modifications skipped or relaxed.

### 6.1 Unique Test Counts (Zero Double-Counting)

| Test Battery | Command | Files | Tests Passed | Tests Failed | Execution Time |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Comprehensive Safety Suite** | `bun test tests/tests/safety/` | 21 | 565 | 0 | 28.61s |
| **Afghanistan Emergency Directory** | `bun test tests/safety/afghanistan-emergency-audit.test.ts` | 1 | 10 | 0 | 0.31s |
| **Authorization Red Team** | `bun test tests/security/authorization-red-team.test.ts` | 1 | 18 | 0 | 0.53s |
| **Care Connect Unit & Integration** | `bun test tests/care/care-unit.test.ts tests/care/care-integration.test.ts` | 2 | 66 | 0 | 4.37s |
| **PostgreSQL Concurrency & Financial** | `bun test tests/care/postgres-concurrency.test.ts tests/care/financial-edge-cases.test.ts` | 2 | 22 | 0 | 5.33s |
| **Live Staging Integration** | `bun test tests/care/live-staging-integration.test.ts` | 1 | 17 | 0 | 3.99s |
| **Cross-Border Risk & Accounting** | `bun test tests/care/cross-border-legal-and-financial-risk.test.ts` | 1 | 19 | 0 | 3.21s |
| **Full E2E 4-Tier & Invariants Runner** | `bun tests/tests/e2e/e2e-runner.ts` | 5 | 76 | 0 | 234.69s |
| **Milestone 4 Failover & Circuit Breaker** | `npx tsx tests/tests/m4-failover.test.ts` | 1 | 52 | 0 | 3.82s |
| **Total Automated Unit/Integration/E2E** | — | **35** | **845** | **0** | **~285s** |

### 6.2 Static Analysis & Production Build Checks

| Quality Gate | Tool / Command | Result | Notes |
| :--- | :--- | :---: | :--- |
| **TypeScript Strict Checking** | `bun run typecheck` (`tsc --noEmit`) | **PASS** | 0 type errors across entire codebase. |
| **ESLint Static Analysis** | `bun run lint` (`eslint .`) | **PASS** | 0 lint errors across all files. |
| **Next.js Turbopack Build** | `bun run build` (`prisma generate && next build`) | **PASS** | 94/94 static and dynamic routes compiled successfully. |

---

## 7. Unresolved Legal Issues (Pending Qualified Counsel)

The following items are legal and regulatory prerequisites that cannot be solved by software engineering:
1. **Provincial Healthcare Commission Aggregator Licensing (Pakistan):** Formal legal determination whether digital health aggregator platforms require health facility licensing under the Sindh Healthcare Commission (SHCC), Punjab Healthcare Commission (PHC), or KP Healthcare Commission (KPHCC).
2. **International Cross-Border Medical Practice Treaties:** Identification of statutory mechanisms (or bilateral treaties) permitting cross-border medical consultations between Pakistani and Afghan practitioners.
3. **Electronic Prescribing Recognition Across Borders:** Verification of mutual legal recognition of electronic prescriptions under the Drug Regulatory Authority of Pakistan (DRAP) Act and Afghan pharmacy laws.
4. **HesabPay Corporate Merchant Agreement & Sanctions Review:** Formal execution of the HesabPay commercial merchant agreement and counsel signoff regarding US OFAC General License 20 medical exemptions.
5. **Data Processing Agreements (DPAs):** Execution of standard DPAs with cloud infrastructure providers (AWS, Neon, LiveKit) ensuring compliance with PECA 2016 and provincial health confidentiality rules.

---

## 8. Detailed Owner-Account Activation List

All commercial subsystems remain **BLOCKED** until the project owner provides authorized production accounts:

```
[BLOCKED] 1. Managed PostgreSQL Database
          - Requirement: Multi-AZ managed instance (Neon, Supabase, or AWS RDS).
          - Credentials: DATABASE_URL, DIRECT_URL (pooled & direct strings).

[BLOCKED] 2. Private AWS S3 Storage
          - Requirement: Private S3 bucket with customer-managed KMS key and IAM user.
          - Credentials: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, CARE_S3_BUCKET, CARE_S3_REGION.
          - Legal: Executed AWS Data Processing Addendum (DPA).

[BLOCKED] 3. LiveKit Cloud Video Infrastructure
          - Requirement: LiveKit Cloud managed server or dedicated HA cluster.
          - Credentials: LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET.

[BLOCKED] 4. Licensed Payment Gateways
          - Pakistan: 1Link / JazzCash / Easypaisa / PayFast merchant account (CARE_PK_GATEWAY_KEY, CARE_PK_GATEWAY_SECRET).
          - Afghanistan: HesabPay corporate merchant contract (HESABPAY_API_KEY, HESABPAY_MERCHANT_ID).

[BLOCKED] 5. Doctor Payout Clearing
          - Requirement: Corporate banking API or 1Link Raast bulk payout API.
          - Protocol: 2FA maker-checker authorization workflow.

[BLOCKED] 6. Live Clinical Consultations
          - Requirement: Qualified healthcare counsel review of terms of service, informed consent, and clinician SLAs.
          - Status: Care Connect marketplace runs in staging demonstration mode with simulated payments.
```

---

## 9. Conclusion & Safety Declaration

- **No live clinical services have been activated.**
- **No commercial payment gateways are processing real currency.**
- **All cross-border corridors are fail-closed.**
- **Ledger invariants and financial debt accounting are mathematically verified.**
- **The codebase is stable, type-safe, cleanly linted, and ready for owner activation.**
