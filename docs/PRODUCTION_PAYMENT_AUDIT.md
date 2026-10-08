# SehatAI Care Connect Production Payment & Ledger Audit

**Document ID:** PAY-AUDIT-2026-10-08-05  
**Target Module:** `src/server/care/ledger.ts`, `payments.ts`, & Checkout Routes  
**Classification:** FINANCIAL INTEGRITY SPECIFICATION  
**Date:** October 8, 2026  

---

## 1. Executive Summary (§8 & §58)

Care Connect implements a bank-grade **double-entry financial ledger**. 

**Primary Financial Invariant:** Doctor balances and platform revenues are **NEVER calculated by aggregating consultation rows**. Balances are strictly derived by summing immutable ledger entries.

Every monetary transaction posts a balanced transaction where:
$$\sum \text{Debits} = \sum \text{Credits} \quad \text{per currency}$$

Old ledger entries are immutable and never updated or deleted. Corrections create compensating entries.

---

## 2. Ledger Account Structure

| Account Kind | Code Format | Purpose |
| :--- | :--- | :--- |
| `PLATFORM_CASH` | `platform:cash:${ccy}` | Inbound cleared funds from payment processors. |
| `PLATFORM_FEE` | `platform:fee:${ccy}` | Retained platform commission. |
| `PROCESSOR_FEE` | `processor:fee:${ccy}` | Fees retained by payment gateways. |
| `DOCTOR_PENDING` | `doctor:pending:${doctorId}:${ccy}` | Escrow hold for booked consultations prior to completion. |
| `DOCTOR_AVAILABLE` | `doctor:available:${doctorId}:${ccy}` | Cleared funds available for doctor payout request. |
| `REFUND_RESERVE` | `refund:reserve:${ccy}` | Funds set aside for disputed or pending refunds. |
| `PAYOUT_CLEARING` | `payout:clearing:${ccy}` | Outbound funds awaiting banking settlement. |

---

## 3. Financial Lifecycle & Money Movements

### Scenario A: Successful Consultation Flow
1. **Patient Pays 2,500 PKR (via JazzCash/EasyPaisa/Stripe):**
   - **DEBIT** `PLATFORM_CASH`: 2,500 PKR
   - **CREDIT** `DOCTOR_PENDING` (Doctor A): 2,000 PKR (80% net)
   - **CREDIT** `PLATFORM_FEE`: 500 PKR (20% platform commission)
   - *Sum Debits = 2,500; Sum Credits = 2,500. Balanced.*
2. **Doctor Completes Consultation:**
   - **DEBIT** `DOCTOR_PENDING` (Doctor A): 2,000 PKR
   - **CREDIT** `DOCTOR_AVAILABLE` (Doctor A): 2,000 PKR
   - *Doctor available balance rises from 0 to 2,000 PKR.*

### Scenario B: Cancellation & Full Refund Prior to Service
1. **Consultation Cancelled by Patient / Doctor:**
   - **DEBIT** `DOCTOR_PENDING` (Doctor A): 2,000 PKR
   - **DEBIT** `PLATFORM_FEE`: 500 PKR
   - **CREDIT** `PLATFORM_CASH`: 2,500 PKR
   - *Sum Debits = 2,500; Sum Credits = 2,500. Reversal complete.*

---

## 4. Idempotency & Replay Immunity (§58)

Every transaction requires a unique, deterministic `idempotencyKey`:
- Sub-legs receive keyed identities `${idempotencyKey}:${index}`.
- If leg 0 exists, `postTransaction` detects replay and returns `{ posted: false, reference }`.
- Verified in `tests/tests/safety/x-unseen-adversarial-holdout.test.ts`: duplicate requests with identical idempotency keys never post duplicate legs or alter wallet balances.

---

## 5. Integer Minor Units & Rounding Safety (§6)

- Floating-point numbers are prohibited in financial code.
- All amounts are stored as integers in **minor currency units** (cents / paisas):
  - 1 PKR = 100 paisas (250000 = 2,500.00 PKR)
  - 1 USD = 100 cents
  - 1 JPY = 1 yen (zero-decimal currency supported)
- Basis points (bps) calculations use integer math with remainder allocation to guarantee zero penny leakage:
  $$\text{splitMoney}(1000, 2000 \text{ bps}) = 200 \text{ and } 800$$

---

## 6. Gateway Integration & Activation Status

| Provider | Currency | Technical Implementation | Production Activation Status |
| :--- | :--- | :--- | :--- |
| **JazzCash** | PKR | Mobile wallet & card redirect API | **ENGINEERING COMPLETE** — Pending corporate merchant activation. |
| **EasyPaisa** | PKR | OTC & mobile wallet API | **ENGINEERING COMPLETE** — Pending corporate merchant onboarding. |
| **Stripe** | USD/EUR/GBP | PaymentIntents + Webhook signature verification | **ENGINEERING COMPLETE** — Pending live production API keys. |
| **Mock Gateway** | ALL | Automated verification harness | Active in test/staging; **disabled in production mode**. |
