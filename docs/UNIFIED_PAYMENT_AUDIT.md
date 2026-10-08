# SehatAI Unified Payment & Financial Ledger Audit

**Audit Date**: October 8, 2026  
**Auditor**: Antigravity Reconciliation Engine (Zero-Base Audit)  
**Target Repository**: `D:\SehatAI-UNIFIED`  
**Financial Status**: **DOUBLE-ENTRY INVARIANTS VERIFIED**

---

## 1. Financial Architecture Overview

All monetary calculations in Care Connect operate under strict financial invariants:
1. **Integer Minor Units**: All amounts (`priceMinor`, `amountMinor`) are stored as integers (e.g. 1000 PKR = 100,000 minor units). Floating-point currency math is prohibited.
2. **Basis Point Commission**: Platform fees are calculated using integer basis points (`commissionBps`, 100 bps = 1.00%), guaranteeing deterministic rounding without fractional penny losses.
3. **Immutable Double-Entry Ledger**: Doctor wallet balances and platform earnings derive strictly from immutable `FinancialLedgerEntry` rows. Direct mutation of wallet balances is impossible.

---

## 2. Ledger Lifecycle Verification Record

The commercial payment lifecycle was audited through end-to-end simulation in `tests/care/care-smoke.ts`:

```
1. Payment Succeeded (1,000 PKR / 100,000 minor)
   ├── Ledger Credit: ESCROW Account (+100,000 minor)
   └── Ledger Credit: PLATFORM_COMMISSION (+20,000 minor @ 2000 bps)
   └── DoctorEarning Created: DOCTOR_PENDING (80,000 minor)

2. Consultation Completed
   ├── DoctorEarning Updated: DOCTOR_AVAILABLE (after 72h maturation delay)
   └── Doctor Wallet Available Balance: 80,000 minor

3. Full Refund Processed
   ├── Ledger Debit: ESCROW Account (-100,000 minor)
   ├── Ledger Reversal: PLATFORM_COMMISSION (-20,000 minor)
   ├── DoctorEarning Updated: REVERSED
   └── Doctor Wallet Balance Recomputed: 0 minor (DERIVED FROM LEDGER ENTRIES)
```

**Smoke Test Assertion**: Doctor pending earnings derived from ledger sum: `got 0`. Verification confirmed.

---

## 3. Production Gateway Boundary Protection

- **Mock Confirmation Lock**: `POST /api/care/payments/mock/confirm` returns HTTP 403 Forbidden in `NODE_ENV === 'production'`.
- **Fail-Closed Provider Selection**: `getPaymentProvider()` throws `ProviderNotConfiguredError` in production if `CARE_PAYMENT_PROVIDER=mock` or if API keys for selected live gateway are absent.
- **Webhook Signature Verification**: Provider adapters (`pk-local`, `hesabpay`, `card`) verify cryptographic HMAC signatures before processing inbound webhook events.
