> [!WARNING] DRAFT — REQUIRES LEGAL COUNSEL REVIEW
> This document is an engineering draft prepared for architectural validation and requires comprehensive review by licensed legal counsel before production regulatory reliance.

# SehatAI Care Connect — Payment Terms

> **DRAFT — REQUIRES COUNSEL REVIEW BEFORE ANY COMMERCIAL LAUNCH**  
> **Jurisdiction: PK (draft) / AF (draft)**  
> **Version:** 2026.10-draft · **Effective Date:** October 2026

---

## 1. General Payment Principles

All commercial transactions on SehatAI Care Connect ("Platform") are processed under strict financial compliance standards:
1. **Integer Minor Units (§6):** All amounts in our software systems are calculated and stored exclusively as integer minor units (e.g., 1000 PKR = 100,000 paisas, or whole minor units without floating-point drift).
2. **Hosted Tokenized Checkout (§57):** SehatAI **never collects, processes, or stores raw payment card numbers (PANs) or sensitive cardholder security codes (CVVs)**. All payments are executed through PCI-DSS certified hosted checkouts provided by regulated payment partners.
3. **Idempotency Enforcement (§58):** Every payment and checkout creation request requires a client-provided or system-generated `Idempotency-Key` to strictly prevent duplicate debits.

---

## 2. Multi-Corridor Payment Rails

1. **Pakistan Corridor:** Supported payment methods include local debit/credit cards, 1Link/PayFast rails, and mobile wallets (JazzCash, Easypaisa).
2. **Afghanistan Corridor:** Supported payment rails include HesabPay and regional digital wallets.
3. **International Corridor:** International credit/debit card gateway integration for diaspora family care and cross-border consultations.

---

## 3. Commission Structure & Fee Split (§7, §10)

1. **Clear Total for Patients:** Patients see exactly one transparent total consultation fee at checkout. No surprise platform surcharges are appended after selection.
2. **Platform Commission:** The platform fee is calculated via deterministic `CommissionRule` configurations (based on country, consultation modality, and medical specialty) using basis points (bps).
3. **Doctor Net Earnings:** The doctor's net compensation equals:
   `DoctorNet = ConsultationPrice - PlatformCommission - PaymentProcessingFee`.
4. **Ledger Posting:** Upon successful payment capture, funds are posted across balanced ledger accounts (`CLEARING`, `PLATFORM_REVENUE`, `DOCTOR_PENDING`).

---

## 4. Doctor Disbursements (Payouts) (§13)

1. **Holding Period:** Doctor earnings remain in `PENDING` status for a standard maturity delay (72 hours) to accommodate dispute resolution and refund windows.
2. **Automated Promotion:** Once the holding duration expires, earnings are promoted to `AVAILABLE` balance.
3. **Payout Execution:** Doctors may request payouts to their registered, verified bank accounts or authorized local mobile money accounts. Minimum disbursement thresholds apply.
4. **Tax Compliance:** Healthcare providers are independently responsible for calculating and remitting applicable local income and sales taxes as mandated by local tax authorities (FBR in Pakistan; MoF in Afghanistan).
