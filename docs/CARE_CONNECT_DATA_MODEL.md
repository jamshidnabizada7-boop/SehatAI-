# SehatAI Care Connect — Data Model & Schema Specification (§100)

> **Document Type:** Database Schema Reference, Entity Relationships & Immutability Rules  
> **Schema Location:** `prisma/schema.prisma` (lines 520–1348)  
> **Storage Portability:** SQLite compatible (development); PostgreSQL portable (production).

---

## 1. Core Invariants of the Data Model

1. **Money Stored Exclusively in Minor Units (`Int`):**
   Every monetary column (`priceMinor`, `amountMinor`, `feeMinor`, `netMinor`) is typed as `Int`. Floating-point types (`Float`, `Decimal`) are strictly avoided across all models to eliminate rounding errors. 1 PKR = 100 minor units (paisas).
2. **Immutability of the Accounting Ledger:**
   Rows in `LedgerEntry`, `PaymentWebhook`, `ConsultationStatusEvent`, `ConsultationAuditEvent`, and `AuditLog` are **strictly append-only**. Database mutations (`UPDATE`, `DELETE`) are prohibited by code invariant; corrections occur solely via new balancing or compensating rows.
3. **Additive Architecture:**
   Care Connect models reference core SehatAI entities (`User`, `PatientProfile`, `DoctorProfile`) via foreign keys with `onDelete: Cascade` or `SetNull` without altering legacy columns.

---

## 2. Entity Group Catalog

### 2.1 Governance & Feature Flags
- **`FeatureFlag`:** DB-backed runtime feature toggles (`key`, `enabled`, `scope: global | country:PK`, `valueJson`).
- **`JurisdictionPolicy`:** Regulatory matrix governing patient country × doctor country rules (`consultationAllowed`, `prescribingAllowed`, `controlledDrugAllowed`, `policyVersion`).
- **`ConsentRecord`:** Versioned patient legal consents (`type: TELEMEDICINE | TERMS | PRIVACY`, `policyVersion`, `grantedAt`, `revokedAt`, `ip`).

### 2.2 Marketplace & Doctor Catalog
- **`DoctorService`:** Catalog of doctor modalities (`type: TEXT | AUDIO | VIDEO`, `priceMinor`, `currency`, `durationMinutes`, `windowHours`, `followUpGraceHours`).
- **`DoctorAvailability`:** Weekly recurring availability template (`weekday: 0..6 UTC`, `startMinute`, `endMinute`, `slotMinutes`, `bufferMinutes`).
- **`DoctorAvailabilityException`:** Calendar date overrides (`date: YYYY-MM-DD`, `kind: UNAVAILABLE | CUSTOM`, `startMinute`, `endMinute`).
- **`DoctorJurisdiction`:** Verified licensing jurisdictions per doctor (`countryCode: PK | AF`, `status: LICENSED | PENDING | REVOKED`).
- **`DoctorLanguage`:** Indexed language proficiency (`languageCode: en | ur | pa | sd | ps | fa`).
- **`DoctorCredential`:** Degree and qualification credentials (`degreeName`, `institution`, `yearGraduated`, `verifiedAt`).
- **`DoctorFavorite`:** Patient bookmarked doctors (`patientId`, `doctorProfileId`).

### 2.3 Consultation Lifecycle & Clinical Records
- **`Consultation`:** Central commercial entity tracking the 17-state lifecycle:
  `DRAFT` → `PAYMENT_PENDING` → `PAID` → `REQUESTED` → `DOCTOR_ACCEPTED` → `SCHEDULED` → `WAITING` → `IN_PROGRESS` → `COMPLETED`  
  *Alternates:* `DECLINED`, `CANCELLED`, `EXPIRED`, `NO_SHOW_PATIENT`, `NO_SHOW_DOCTOR`, `TECHNICAL_FAILURE`, `REFUNDED`, `DISPUTED`.
  Key fields: `id`, `patientId`, `doctorProfileId`, `doctorUserId`, `type`, `status`, `priceMinor`, `scheduledAt`, `windowOpensAt`, `windowClosesAt`, `instant`.
- **`ConsultationStatusEvent`:** Append-only lifecycle journal (`fromState`, `toState`, `actorId`, `actorRole`, `reason`).
- **`ConsultationParticipant`:** Multi-party participation and connection state tracking (`userId`, `role`, `joinedAt`, `leftAt`).
- **`ConsultationMessage`:** Realtime consultation chat logs (`senderId`, `senderRole`, `kind: text | correction | system`, `body`, `correctedById`, `flagged`).
- **`ConsultationAttachment`:** Private document records (`storageKey`, `mimeType`, `sizeBytes`, `checksumSha256`, `scanStatus`).
- **`Translation`:** Stored message translations (`targetLanguage`, `translatedText`, `needsConfirmation`, `confirmedAt`).
- **`ClinicalIntake`:** Pre-consultation symptom responses (`symptomsJson`, `triageLevel`, `redFlagsJson`).
- **`ClinicalHandoff`:** Structured doctor briefing (`summaryJson`, `status: PENDING | ACCEPTED | EDITED | REJECTED`, `label`).
- **`ClinicalNote`:** Doctor medical notes (`type: SOAP | PROGRESS`, `visibility: PRIVATE_NOTE | PATIENT_SUMMARY`, `content`).
- **`Prescription`:** Doctor-signed medical prescriptions (`status: DRAFT | SIGNED | DISPENSED | CANCELLED`, `doctorSignedAt`, `digitalSignatureSha256`).
- **`PrescriptionItem`:** Individual medication rows (`medicine`, `strength`, `frequency`, `durationDays`, `instructions`).
- **`Review`:** Completed consultation ratings (`overall: 1..5`, `comment`, `publicResponse`).
- **`ConsultationCall`:** WebRTC session records (`roomId`, `state: ACTIVE | ENDED | FAILED | FELL_BACK`, `fallbackTo: AUDIO | TEXT`, `qualityMetricsJson`).
- **`Dispute`:** Formal consultation complaints (`reason`, `status: OPEN | INVESTIGATING | RESOLVED_REFUND | RESOLVED_REJECTED`, `resolutionNote`).

### 2.4 Financial & Double-Entry Ledger Subsystem
- **`CommissionRule`:** Platform fee rules (`country`, `consultationType`, `specialty`, `percentageBps`, `fixedFeeMinor`).
- **`Payment`:** Captured payments (`amountMinor`, `currency`, `provider: mock | pk-local | hesabpay | card`, `providerRef`, `status`, `breakdownJson`).
- **`PaymentAttempt`:** Tracking individual gateway attempts (`attemptNo`, `status`, `providerRef`).
- **`PaymentWebhook`:** Deduplicated webhook audit log (`provider`, `eventId`, `signatureValid`, `payloadJson`).
- **`Refund`:** Processed refunds (`amountMinor`, `state: REQUESTED | REFUND_PENDING | REFUNDED | FAILED`, `reason`, `policyVersion`).
- **`LedgerAccount`:** Multi-currency accounts (`code`, `kind: CLEARING | DOCTOR_PENDING | DOCTOR_AVAILABLE | PLATFORM_REVENUE | PLATFORM_FEE | DISPUTE_RESERVE`, `ownerDoctorProfileId`, `currency`).
- **`LedgerEntry`:** Balanced double-entry transactions (`accountId`, `direction: DEBIT | CREDIT`, `amountMinor`, `currency`, `consultationId`, `idempotencyKey`, `memo`).
- **`DoctorEarning`:** Doctor earning maturation records (`netMinor`, `state: PENDING | AVAILABLE | PAID_OUT | REVERSED`, `availableAt`).
- **`Payout`:** Doctor bank/wallet disbursements (`amountMinor`, `state: PENDING | PROCESSING | PAID | FAILED | REVERSED`, `destinationJson`).

### 2.5 Security, Ops & Future Subscriptions
- **`IdempotencyKey`:** DB-backed replay protection (`key`, `scope`, `status: IN_PROGRESS | COMPLETED | FAILED`, `resultJson`, `expiresAt`).
- **`FraudSignal`:** Automated security and anti-abuse alerts (`userId`, `kind`, `severity: LOW | MEDIUM | HIGH`, `state: OPEN | REVIEWED | ACTIONED`).
- **`RateLimitCounter`:** Distributed sliding rate limits (`key`, `windowStart`, `count`).
- **`Plan` / `Subscription` / `SubscriptionUsage`:** Subscription infrastructure (launch-disabled).
- **`Clinic` / `ClinicMember`:** Multi-provider clinic readiness stubs.
