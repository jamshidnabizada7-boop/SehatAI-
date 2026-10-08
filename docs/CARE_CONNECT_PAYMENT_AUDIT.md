# SehatAI Care Connect — Payment & Ledger Audit (§100)

> **Document Type:** Financial Architecture, Accounting Invariants & Payment Gateway Audit  
> **Audit Date:** October 2026 · **Scope:** Care Connect Payment Subsystem (§4, §5, §6, §7, §8, §9, §10, §11, §13, §48, §49)

---

## 1. Accounting Invariants & Double-Entry Ledger (§6, §8)

Care Connect replaces ad-hoc balance calculations with an enterprise multi-currency double-entry ledger. All financial transactions are validated against mathematical invariants:

### 1.1 Invariant Rules & Evidence:
1. **Zero-Float Minor Units Rule (§6):**
   - Monetary values are stored strictly as `Int` minor units in the database (`amountMinor`, `priceMinor`).
   - Floating-point calculations (`number * 0.2`) are forbidden in financial paths; integer division with remainder preservation (`splitMoney(amount, bps)`) ensures not a single fractional paisa is lost.
   - *Test Evidence:* `tests/care/care-unit.test.ts:splitMoney: 20% of 1000 = 200/800, never loses a unit`.
2. **Balanced Transaction Invariant (Σ Debits == Σ Credits) (§8):**
   - In `src/server/care/ledger.ts:postTransaction()`, every journal entry requires at least two legs.
   - The engine computes: `sum(DEBIT) === sum(CREDIT)`. If legs do not balance to zero within the same currency, a `LedgerError('UNBALANCED_TRANSACTION')` is thrown and the database transaction rolls back.
   - *Test Evidence:* `tests/care/care-smoke.ts:ledger balance` (verified across payment, promotion, and refund legs).
3. **Derived Doctor Balance:**
   - Doctor balances (`DOCTOR_PENDING`, `DOCTOR_AVAILABLE`) are never stored as mutable scalar columns on the user profile. Balances are derived dynamically by aggregating immutable ledger entries (`SUM(amountMinor) GROUP BY direction`).
   - *Test Evidence:* `tests/care/care-smoke.ts:doctor pending reversed to 0 — got 0`.

---

## 2. Commission Resolution Architecture (§7)

Platform fees are determined dynamically through `src/server/care/payments/payment-service.ts:resolveCommission()`:
1. **Specificity Hierarchy:**
   Rules in `CommissionRule` table are evaluated against the transaction context:
   - Match Score = `(CountryMatch ? 4 : 0) + (TypeMatch ? 2 : 0) + (SpecialtyMatch ? 1 : 0)`.
   - The most specific rule wins.
2. **Fail-Closed Default:**
   If no matching rule is enabled in the database, the engine defaults safely to 2000 bps (20.00%) with 0 fixed fee.
3. **Split Calculation:**
   `computeSplit({ priceMinor, percentageBps, fixedFeeMinor, processorFeeMinor })` generates the immutable breakdown recorded in `Payment.breakdownJson`.

---

## 3. Webhook Security & Replay Defense (§11)

All external payment confirmations enter through webhook processors:
1. **Cryptographic Signature Verification:**
   - Every provider adapter verifies HMAC signatures over the raw request payload before parsing JSON (`verifyWebhook`).
   - In `MockPaymentProvider`, webhooks require HMAC-SHA256 signature generated with `CARE_MOCK_PAYMENT_SECRET` and timestamp within ±5 minutes.
2. **Idempotency & Replay Protection:**
   - Handled events are recorded in `PaymentWebhook` table with a unique composite key (`provider`, `eventId`).
   - Replay attempts immediately return cached processing results without double-posting ledger entries.
   - *Test Evidence:* `tests/care/care-smoke.ts:webhook signature verify & idempotent replay`.

---

## 4. Refund Waterfall & Compensation Mechanics (§48, §49)

Refund requests execute through `src/server/care/refund-service.ts`:
1. **Deterministic Ladder (`computeRefundEligibility`):**
   - Doctor cancellation / no-show / request expiry: **100% Full Refund**.
   - Technical system failure: **100% Full Refund**.
   - Patient pre-acceptance: **100% Full Refund**.
   - Patient scheduled (>24h notice): **100% Full Refund**.
   - Patient late cancellation (<24h notice): **50% Partial Refund**.
   - Delivered consultation (`IN_PROGRESS`, `COMPLETED`): **0% (No Refund)**.
2. **Hard Invariant (§49):**
   - Refunds are **never marked successful in our database until confirmed by the payment gateway**.
   - Once confirmed, compensating ledger entries reverse the original booking legs:
     - `DEBIT: DOCTOR_PENDING` (or `DOCTOR_AVAILABLE`)
     - `CREDIT: CLEARING`
   - *Test Evidence:* `tests/care/care-smoke.ts:earning REVERSED after full refund`.

---

## 5. Production Gatekeeper: Provider Verification (§100)

| Provider Adapter | Production Readiness | Code Status | Action Required for Launch |
|---|---|---|---|
| **Mock (`mock`)** | **FORBIDDEN IN PROD** | `src/server/care/payments/mock-provider.ts` | Throws `403 MOCK_FORBIDDEN_IN_PRODUCTION` if `NODE_ENV === 'production'`. |
| **Pakistan Rails (`pk-local`)** | **BLOCKED-BY-PROVIDER** | `src/server/care/payments/adapters.ts` | Throws `PROVIDER_NOT_CONFIGURED`. Requires live merchant contract with 1Link / PayFast / JazzCash. |
| **HesabPay (`hesabpay`)** | **BLOCKED-BY-PROVIDER** | `src/server/care/payments/adapters.ts` | Throws `PROVIDER_NOT_CONFIGURED`. Requires signed merchant agreement with HesabPay Kabul. |
| **International Card (`card`)** | **BLOCKED-BY-PROVIDER** | `src/server/care/payments/adapters.ts` | Throws `PROVIDER_NOT_CONFIGURED`. Requires Stripe/Checkout merchant credentials. |
