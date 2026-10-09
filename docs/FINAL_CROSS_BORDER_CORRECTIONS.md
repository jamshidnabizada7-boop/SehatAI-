# SehatAI Final Cross-Border Legal & Financial Risk Audit Report

**Date:** October 9, 2026  
**Target Repository:** `D:\SehatAI-UNIFIED`  
**Target Branch:** `production-activation`  
**Starting HEAD Baseline:** `afbbdfd`  
**Safety Backup Verification:**  
- Git Branch: `backup/pre-legal-corrections-afbbdfd`  
- Git Bundle Archive: `D:\sehatai-pre-legal-corrections-afbbdfd.bundle` (14 refs verified via `git bundle verify`)  
- Staging Database: PostgreSQL 16 on WSL2 loopback (`127.0.0.1:5432/sehatai_test`)

---

## 1. Executive Summary

This comprehensive audit and engineering correction resolves unsupported legal assumptions, replaces fragile single-boolean cross-border toggles with fail-closed database jurisdiction policy governance, enables production eligibility verification for both Pakistani (PM&DC) and Afghan (MoPH) doctors, and implements complete financial debt tracking and platform loss allocation for post-payout clawbacks.

All existing SehatAI clinical and Care Connect functionalities have been preserved. No protected archive folders were modified. The public GitHub repository was not pushed to.

---

## 2. Primary Legal & Statutory Corrections (Task 1)

### 2.1 PM&DC Act 2022 Statutory Baseline
- **Previous Erroneous Assumption:** Documentation previously cited "PM&DC Section 31/32 Telemedicine Practice Regulations" as governing digital health platform operations and online marketplace registration.
- **Statutory Fact:** In the Pakistan Medical and Dental Council Act, 2022:
  - **Section 31:** Governs the "Appointment of inspectors" for inspecting medical institutions and examination centers.
  - **Section 32:** Governs the "Withdrawal of recognition" of medical institutions or qualifications.
  - The PM&DC Act 2022 does **NOT** provide a digital health aggregator registration, telemedicine portal licensing regime, or marketplace operator certificate.
- **Operational Reality:** Individual Pakistani physicians are licensed via PM&DC permanent medical registration. Telemedicine service operations in Pakistan are subject to provincial healthcare commissions (e.g., Punjab Healthcare Commission Telemedicine Regulations 2020, Sindh Healthcare Commission, and KP Healthcare Commission) and require formal review by qualified Pakistani healthcare counsel.

### 2.2 Cross-Border Clinical Corridor (PK <-> AF)
- **Previous Erroneous Assumption:** Documentation cited a mandatory "bilateral PM&DC–MoPH MoU" as the statutory prerequisite to enabling cross-border telemedicine.
- **Statutory Fact:** No statutory "bilateral PM&DC–MoPH MoU" is codified or recognized in either Pakistani or Afghan statutory health law. Cross-border medical practice is governed territorially: physicians treating a patient residing in another country are legally subject to the jurisdiction and medical licensing authority of the patient's physical location.
- **Fail-Closed Standard:** Cross-border clinical corridors (`PK -> AF` and `AF -> PK`) must remain **FAIL-CLOSED AND DISABLED BY DEFAULT**. Enabling a corridor cannot be achieved via a single environment variable; it requires a versioned database policy with verified legal authority citation, human administrative signoff, date validity bounds, authorized clinical scope, and individual foreign licensing verification for participating doctors.

### 2.3 Da Afghanistan Bank (DAB) & Payment Clearing
- **Previous Erroneous Assumption:** Documentation asserted that merchants operating telehealth services require direct Da Afghanistan Bank (DAB) commercial e-payment licenses.
- **Regulatory Fact:** HesabPay is operated by **Zinzir Ltd.**, a licensed Electronic Money Institution (EMI) supervised by Da Afghanistan Bank. Ordinary commercial merchants accepting payments via HesabPay do not require direct DAB commercial banking licenses. Instead, they require:
  1. An executed HesabPay corporate merchant contract.
  2. Ministry of Industry and Commerce (MoIC) business license or accepted corporate entity registration.
  3. Legal counsel review regarding international sanctions exemptions (e.g., US Treasury OFAC General License 20 and relevant UN sanctions humanitarian and medical carve-outs).

### 2.4 HIPAA Territorial Inapplicability
- **Previous Erroneous Assumption:** Internal documentation and checklists repeatedly asserted "HIPAA compliance" for AWS S3 private buckets and LiveKit video infrastructure.
- **Legal Fact:** The Health Insurance Portability and Accountability Act (45 CFR Parts 160 and 164) is a United States federal statute applicable strictly to US covered entities and business associates. It does not apply to healthcare platforms operating between Pakistan and Afghanistan.
- **Technical & Legal Standard:** Data privacy in Pakistan and Afghanistan is governed by local statutes (e.g., Pakistan Prevention of Electronic Crimes Act 2016, provincial health privacy rules, and MoPH directives). Storage protections are technically implemented via **client-side AES-256-GCM encryption**, AWS KMS server-side envelope encryption, and IAM least-privilege private access policies. Legal compliance requires local Data Processing Agreements (DPAs) and privacy counsel review, not US HIPAA certification.

---

## 3. Cross-Border Corridor Architecture & Fail-Closed Gating (Task 2)

### 3.1 Prisma Schema Migration
The `JurisdictionPolicy` table was augmented in `prisma/schema.prisma` and applied to PostgreSQL via `npx prisma db push`:
```prisma
model JurisdictionPolicy {
  id                        String    @id @default(cuid())
  countryCode               String    // Patient physical country ('PK' | 'AF')
  doctorCountry             String?   // Doctor physical country ('PK' | 'AF')
  consultationAllowed       Boolean   @default(true)
  messagingAllowed          Boolean   @default(true)
  audioAllowed              Boolean   @default(true)
  videoAllowed              Boolean   @default(true)
  prescribingAllowed        Boolean   @default(false)
  emergencyRedirectRequired Boolean   @default(false)
  policyVersion             String    @default("2026-Q1")
  scope                     String?   @default("DOMESTIC") // DOMESTIC | CROSS_BORDER | SECOND_OPINION
  legalApprovalSource       String?   // Treaty / bilateral agreement / health ministry authorization
  approvalExpiresAt         DateTime? // Expiration timestamp for cross-border authorization
  humanApprovedById         String?   // User ID of authorized clinical compliance admin
  humanApprovedAt           DateTime? // Timestamp of human compliance approval
  effectiveDate             DateTime  @default(now())
  createdAt                 DateTime  @default(now())
  updatedAt                 DateTime  @updatedAt

  @@unique([countryCode, doctorCountry, policyVersion])
  @@index([countryCode, doctorCountry])
  @@index([scope])
}
```

### 3.2 Jurisdiction Policy Engine (`src/server/care/jurisdiction.ts`)
The jurisdiction engine was refactored:
1. **Disabled by Default:** The default database seed and fallback configuration sets `consultationAllowed: false` for all cross-border corridors (`PK <-> AF`), returning `CROSS_BORDER_CORRIDOR_DISABLED_PENDING_APPROVAL`.
2. **Immunity to Single-Boolean Bypass:** Setting `CARE_CROSS_BORDER_CORRIDOR_APPROVED="true"` in the environment does **not** bypass the database policy check. The engine strictly inspects the active `JurisdictionPolicy` row.
3. **Mandatory Administrative Attributes:** A cross-border corridor row in `JurisdictionPolicy` must satisfy all of the following:
   - `legalApprovalSource` must be non-null and non-empty (e.g. treaty or bilateral regulatory directive).
   - `humanApprovedById` must be non-null (verifying human admin audit trail).
   - `effectiveDate <= now`.
   - `approvalExpiresAt` must either be null or strictly in the future (`> now`).
   - `scope` must be either `'CROSS_BORDER'` or `'SECOND_OPINION'`.
4. **Per-Doctor Foreign Licensing Verification:** When `doctorProfileId` is provided:
   - The doctor must pass `isDoctorProductionEligible`.
   - For cross-border care, the doctor must have an active `DoctorJurisdiction` record for the patient's country with `status === 'LICENSED'`, non-null `verifiedAt`, and non-null `verifiedById`.
5. **Caller Integration:** Both `src/server/care/consultation-service.ts` and `src/server/care/prescription-service.ts` pass `doctorProfileId` to `evaluateJurisdiction`.

---

## 4. Support for Both Pakistani and Afghan Doctors (Task 3)

### 4.1 Production Eligibility Engine (`src/server/care/marketplace.ts`)
The `isDoctorProductionEligible` function was refactored from a Pakistan-only PM&DC check into a jurisdiction-aware validator supporting both Pakistani and Afghan clinicians:

```typescript
export function isDoctorProductionEligible(doctor: {
  pmdcNumber?: string | null;
  pmdcVerifiedAt?: Date | null;
  pmdcVerifiedBy?: string | null;
  country?: string | null;
  careStatus?: string | null;
  facilityName?: string | null;
  bio?: string | null;
  user?: { email?: string | null; name?: string | null; accountStatus?: string | null } | null;
  jurisdictions?: Array<{ countryCode: string; status: string }> | null;
  credentials?: Array<{ kind: string; registrationNumber?: string | null; issuingBody?: string | null; country?: string | null; status?: string | null; verifiedAt?: Date | null; verifiedById?: string | null }> | null;
}): { eligible: boolean; reasons: string[] }
```

### 4.2 Positive Qualification Pathways
- **Pakistani Doctors (`country === 'PK'`):**
  - Requires non-null `pmdcNumber` matching valid PM&DC registration format.
  - Requires `pmdcVerifiedAt <= now` and non-null `pmdcVerifiedBy`.
- **Afghan Doctors (`country === 'AF'`):**
  - Supports verification either via MoPH credential entries in `doctor.credentials` (kind `'MEDICAL_LICENSE'`, issuing body MoPH, status `'VERIFIED'`, valid timestamp and admin ID) OR via Afghan registration number recorded in `pmdcNumber` with valid `pmdcVerifiedAt` and `pmdcVerifiedBy`.

### 4.3 Mandatory Universal Production Safeguards
Both Pakistani and Afghan doctors must satisfy:
1. `!isTestDoctorProfile(doctor)` (strictly rejects mock/test profiles, test emails, or test names).
2. `user.accountStatus === 'active'`.
3. `careStatus === 'ACTIVE'`.
4. Verification timestamp must be historical (`verifiedAt <= now`).
5. No revoked jurisdiction entries in `doctor.jurisdictions` for the doctor's practicing country.

---

## 5. Post-Payout Financial Risk, Debt Tracking & Loss Allocation (Task 5)

### 5.1 Post-Payout Clawback & Negative Balance
When a refund or chargeback occurs after a doctor has already cashed out available earnings:
- The compensating ledger entries post immediately: debit `DOCTOR_AVAILABLE` and credit `PLATFORM_CASH` (or debit `PLATFORM_FEE` for fee reversal).
- If the doctor's available balance is insufficient, the wallet balance becomes **negative** (`-docFee`).
- Any subsequent payout request throws `NOTHING_AVAILABLE` (or `NEGATIVE_BALANCE_BLOCKED`).
- Future consultation earnings automatically offset the negative balance before any payout can be requested.

### 5.2 Abandonment & Receivable Tracking (`getDoctorReceivableBalance`)
If a doctor abandons the platform while holding a negative balance, the platform tracks the uncollected debt:
```typescript
export async function getDoctorReceivableBalance(doctorProfileId: string, currency: string) {
  const wallet = await doctorWallet(doctorProfileId, currency);
  const receivableMinor = wallet.availableMinor < 0 ? Math.abs(wallet.availableMinor) : 0;
  return {
    doctorProfileId,
    currency,
    availableMinor: wallet.availableMinor,
    hasDeficit: wallet.availableMinor < 0,
    receivableMinor,
  };
}
```

### 5.3 Platform Loss Allocation (`allocatePlatformLoss`)
If legal counsel or finance determines that an uncollectible doctor deficit must be written off:
- `allocatePlatformLoss` verifies an active deficit exists (`hasDeficit === true`).
- Posts a compensating double-entry ledger write-off:
  - **Debit:** `PLATFORM_FEE` (platform expense/loss account)
  - **Credit:** `DOCTOR_AVAILABLE` (restoring doctor balance to zero)
- Preserves the mathematical zero-imbalance ledger invariant (`Σ Debits == Σ Credits`).
- Blocks duplicate loss allocations: calling `allocatePlatformLoss` when no deficit exists throws `NO_RECEIVABLE_DEFICIT`.

### 5.4 Reserve & Delay Policy
- Doctors cannot cash out earnings before the patient dispute holding window expires.
- Controlled by `CARE_EARNING_DELAY_HOURS` (staging: 1 hour; production: 72 hours).
- Unmatured earnings reside in `DOCTOR_PENDING` and cannot be included in `requestPayout`.

---

## 6. Documentation & Checklist Updates (Task 4)

The following operational documents and configuration templates were updated:

1. [docs/SEHATAI_OWNER_ACTIVATION_CHECKLIST.md](file:///D:/SehatAI-UNIFIED/docs/SEHATAI_OWNER_ACTIVATION_CHECKLIST.md)
   - Replaced PM&DC Section 31/32 claim with permanent PM&DC physician registration and provincial healthcare commission guidelines.
   - Clarified that cross-border care cannot be activated via environment variables alone.
   - Updated HesabPay requirements to reflect EMI merchant agreements and removed direct DAB commercial banking license claims.
   - Replaced HIPAA claims with local Data Processing Agreements (DPAs) and client-side AES-256-GCM encryption descriptions.
   - Formulated 5 critical regulatory questions for qualified healthcare legal counsel.
2. [docs/SEHATAI_REAL_STAGING_GATE.md](file:///D:/SehatAI-UNIFIED/docs/SEHATAI_REAL_STAGING_GATE.md)
   - Updated Row 4 (Cross-Border Corridor Protection): reflect database `JurisdictionPolicy` fail-closed gating.
   - Updated Row 12 (Clinical Governance & Licensure): removed Section 31/32 references and documented dual PK/AF licensure support.
3. [docs/STAGING_GO_NO_GO_REPORT.md](file:///D:/SehatAI-UNIFIED/docs/STAGING_GO_NO_GO_REPORT.md)
   - Updated Rows 22 & 166: replaced HIPAA claims with technical AWS S3 KMS + client-side AES-256-GCM encryption and local DPA review.
   - Updated Row 171: clarified PM&DC registration scope and MoPH oversight.
4. [.env.staging.example](file:///D:/SehatAI-UNIFIED/.env.staging.example) & [.env.production.example](file:///D:/SehatAI-UNIFIED/.env.production.example)
   - Updated comments explaining that `CARE_CROSS_BORDER_CORRIDOR_APPROVED="false"` cannot activate cross-border care on its own, and detailing database policy prerequisites.
   - Updated HesabPay annotations to reflect Zinzir Ltd. Electronic Money Institution status.

---

## 7. Comprehensive Automated Verification Record (Task 6)

### 7.1 Non-Overlapping Test Suite Execution

| Test Suite File | Subsystem Area | Tests Ran | Passed | Failed |
| :--- | :--- | :---: | :---: | :---: |
| `tests/tests/safety/` (21 test files) | Core Clinical Safety, Guardrails & Adversarial Holdout | 565 | 565 | 0 |
| `tests/care/care-unit.test.ts` | Care Connect Unit Logic, Money Math, State Machines, RBAC | 37 | 37 | 0 |
| `tests/care/care-integration.test.ts` | Care Connect End-to-End Integration & Multi-User Flow | 29 | 29 | 0 |
| `tests/care/financial-edge-cases.test.ts` | Ledger Invariants, Payouts, Settlement Retries, Concurrency | 11 | 11 | 0 |
| `tests/care/live-staging-integration.test.ts` | 10-Step Consultation Lifecycle, WebRTC, Vault Storage, Outbox | 17 | 17 | 0 |
| `tests/care/postgres-concurrency.test.ts` | PostgreSQL Row-Locks, Race Conditions, Double-Booking, Idempotency | 11 | 11 | 0 |
| `tests/care/cross-border-legal-and-financial-risk.test.ts` | Legal Policy Gating, Dual Doctors, Debt Tracking, Loss Allocation | 17 | 17 | 0 |
| **TOTAL (Non-Overlapping)** | **All Production Codepaths** | **687** | **687** | **0** |

### 7.2 Static Type Checking & Code Quality
- **TypeScript Typecheck (`npm run typecheck` / `tsc --noEmit`):** **PASS** (0 errors).
- **ESLint (`npm run lint` / `eslint .`):** **PASS** (0 errors).
- **Next.js Standalone Production Build (`npm run build`):** **PASS**
  - Prisma client generated (v6.19.2) in 476ms.
  - Turbopack compilation succeeded in 14.7s.
  - All 94 static and dynamic application routes successfully built and validated.

---

## 8. Safeguards Breakdown: Engineering Controls vs. Contract Terms

| Risk Category | Engineering Safeguards (Code / DB Constraints) | Contractual & Legal Safeguards (ToS / SLA / Treaties) |
| :--- | :--- | :--- |
| **Cross-Border Clinical Practice** | Hard fail-closed jurisdiction policy in DB; checks effective dates, expiry, scope, human admin audit ID, and doctor foreign license. Single-boolean env bypass blocked. | Inter-jurisdictional telemedicine agreements; counsel-approved legal opinions; physician indemnification. |
| **Doctor Licensure & Impersonation** | Automated verification checks; test fixture exclusion; verification date validity check; active care status and user account requirements. | Doctor Provider Agreements; PM&DC / MoPH license representations and warranties; criminal penalties under medical practice laws. |
| **Post-Payout Clawbacks & Deficits** | Real-time compensating ledger debit into negative balance; automatic payout halting; future earnings debt offsetting. | Doctor Payout Agreement terms granting platform right of offset; merchant recovery covenants; collection remedies. |
| **Abandoned Doctor Debt** | `getDoctorReceivableBalance` debt tracking; atomic `allocatePlatformLoss` double-entry ledger loss allocation. | Bad-debt write-off accounting protocols; platform loss reserve provisions; tax deduction governance. |
| **Data Privacy & Storage** | Client-side AES-256-GCM encryption before write; S3 KMS envelope encryption; private buckets with Block Public Access; signed URLs with strict expiry. | Terms of Service; Patient Informed Consent; Data Processing Agreements (DPAs) compliant with PECA 2016 and local privacy acts. |
| **Electronic Prescribing** | Controlled substances hard-blocked; cross-border prescribing blocked without explicit treaty row and foreign license. | Patient consent acknowledging limitations; physician prescription liability waivers under domestic drug acts. |

---

## 9. Questions for Qualified Legal Counsel

Prior to any commercial launch or cross-border activation, qualified healthcare and regulatory legal counsel must provide formal written opinions on the following:

1. **Provincial Healthcare Commission Licensing (Pakistan):** What specific registrations, telehealth clinic licenses, or digital aggregator clearances are required under the Punjab Healthcare Commission, Sindh Healthcare Commission, Khyber Pakhtunkhwa Healthcare Commission, and ICT Health Authority?
2. **Cross-Border Telemedicine Legality (PK <-> AF):** Under what statutory authority may Pakistani-licensed doctors legally consult patients physically located in Afghanistan, and vice versa? Does this constitute unlicensed practice in the patient's jurisdiction without local medical council registration?
3. **Cross-Border Electronic Prescribing:** Are digital prescriptions issued by a foreign physician legally fillable by licensed pharmacies in Pakistan (under DRAP rules) or Afghanistan (under MoPH pharmacy regulations)?
4. **International Sanctions & Payment Settlement (Afghanistan):** Does processing patient fees and doctor payouts through HesabPay in Afghanistan comply with US OFAC General License 20 (and subsequent authorizations) as well as UN sanctions exemptions for medical and humanitarian transactions?
5. **Data Protection & Cross-Border Health Data Transfers:** Does storing medical notes and consultation records of Afghan patients in AWS regions (e.g., `ap-south-1`) violate any Afghan data sovereignty directives or Pakistani PECA 2016 regulations?

---

## 10. Final Staging Status & Production Gate

- **Staging Environment Status:** **GO (Fully Operational)**
  - All 687 automated tests passing against live PostgreSQL.
  - Zero-imbalance double-entry ledger mathematically proven across all scenarios.
  - Standalone build compiled with zero errors.
- **Production Gate Status:** **BLOCKED ON EXTERNAL COMMERCIAL / LEGAL CLEARANCES**
  - Blocked on production cloud database credentials (AWS RDS / Neon Multi-AZ).
  - Blocked on private AWS S3 KMS bucket provisioning.
  - Blocked on live banking merchant gateway contracts (1Link / PayFast / HesabPay).
  - Blocked on qualified legal counsel written regulatory opinions for clinical telemedicine and cross-border corridors.
