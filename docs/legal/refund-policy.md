# SehatAI Care Connect — Refund Policy

> **DRAFT — REQUIRES COUNSEL REVIEW BEFORE ANY COMMERCIAL LAUNCH**  
> **Jurisdiction: PK (draft) / AF (draft)**  
> **Policy Version:** 2026.10-initial · **Effective Date:** October 2026

---

## 1. Overview and Core Invariants

This Refund Policy governs all commercial transactions on SehatAI Care Connect. The refund workflow is automated and strictly adheres to deterministic business rules implemented in `src/server/care/refund-service.ts`.

**Core Financial Invariant (§49):**
- A refund is **never marked successful in our systems until the external payment gateway confirms the transaction**.
- Every approved refund posts balanced compensating entries to our multi-currency double-entry ledger, debiting the platform clearing account and reversing doctor pending earnings.

---

## 2. Deterministic Refund Eligibility Ladder (§48)

Refund eligibility and refundable percentages are calculated automatically based on the following ladder:

| Trigger Scenario | Actor / Reason Code | Timing / State | Refund Amount | Policy Determination |
|---|---|---|---|---|
| **Doctor Cancellation** | Doctor-initiated or `doctor_cancelled` | Any time before delivery | **100% (Full Refund)** | Immediate full reimbursement to patient. |
| **Doctor No-Show** | Reported `doctor_no_show` | Scheduled slot passes without attendance | **100% (Full Refund)** | Immediate full reimbursement to patient. |
| **Request Expiry** | Platform auto-expiry (`EXPIRED`) | Doctor did not accept within window | **100% (Full Refund)** | Immediate full reimbursement to patient. |
| **Technical Failure** | Platform / `technical_failure` | Severe connection or system outage | **100% (Full Refund)** | Full reimbursement upon technical review. |
| **Patient Pre-Acceptance** | Patient-initiated (`patient_cancelled`) | Status: `PAYMENT_PENDING`, `PAID`, `REQUESTED` | **100% (Full Refund)** | Cancelled prior to doctor acceptance. |
| **Patient Scheduled (>24h)** | Patient-initiated (`patient_cancelled`) | `DOCTOR_ACCEPTED`, `SCHEDULED`, `WAITING` (>24 hours before start) | **100% (Full Refund)** | Timely cancellation allows slot re-allocation. |
| **Patient Late Cancellation** | Patient-initiated (`patient_cancelled`) | `DOCTOR_ACCEPTED`, `SCHEDULED`, `WAITING` (<24 hours before start) | **50% (Partial Refund)** | 50% retained to compensate doctor's reserved schedule. |
| **Post-Delivery** | Patient-initiated | Status: `IN_PROGRESS`, `COMPLETED` | **0% (No Refund)** | Service has been clinically rendered. |

---

## 3. Refund Request Submission Procedure

1. **Self-Service:** Patients may request a refund directly from the Consultation Workspace by clicking the "Request Refund" button.
2. **Support Escapes:** In cases involving clinical misconduct, severe technological disruption, or disputes, patients may submit a dispute ticket through Customer Support.
3. **Automated Processing:** Validated requests transition the database state to `REFUND_PENDING` and trigger an immediate API refund call to the underlying payment processor.
4. **Processing Times:** Once confirmed by the payment gateway, funds typically reflect in the patient's source account (card, digital wallet, or bank) within 3 to 10 business days depending on the financial institution.

---

## 4. Abuse Prevention and Fraud Signals (§60)

Repeated pattern cancellations, chargeback threats without following the refund procedure, or self-booking refund cycles trigger automated `FraudSignal` alerts and will result in temporary account restrictions pending human administrative review.
