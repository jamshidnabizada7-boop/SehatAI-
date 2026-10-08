> [!WARNING] DRAFT — COUNSEL REVIEW REQUIRED
> This document is an engineering draft prepared for architectural validation and requires comprehensive review by licensed legal counsel before production regulatory reliance.

# SehatAI Care Connect — Commercial Marketplace Agreement

> **DRAFT — REQUIRES COUNSEL REVIEW BEFORE ANY COMMERCIAL LAUNCH**  
> **Jurisdiction: PK (draft) / AF (draft)**  
> **Version:** 2026.10-draft · **Effective Date:** October 2026

---

## 1. Marketplace Structure and Operating Model

SehatAI Care Connect operates a digital, two-sided healthcare marketplace. The marketplace functions to:
1. Enable verified patients ("Buyers") to discover, schedule, and pay for telemedicine services.
2. Enable verified independent medical practitioners ("Providers") to publish service offerings, set professional consultation tariffs, manage availability, and deliver telemedicine care.

---

## 2. Platform Obligations & Governance

1. **Neutral Facilitator:** SehatAI acts as an intermediary communications and financial facilitation marketplace. The marketplace algorithmically matches patient symptoms to appropriate medical specialties based on deterministic clinical taxonomies, not commercial pay-to-play bids.
2. **Sponsored Listings Policy (§20):** If sponsored slots or promoted provider profiles are ever introduced in future phases, they must be explicitly labeled with an unambiguous visual tag ("Sponsored") and default to disabled in clinical triage matching.
3. **Double-Sided Review System (§44, §45):**
   - Reviews and numerical ratings are permitted exclusively for verified, completed consultations.
   - Unverified or self-booking reviews are prohibited and flagged by our automated fraud detection system.
   - Provider display scores utilize Bayesian dampening to prevent manipulative score inflation.

---

## 3. Financial Settlement and Escrow Principles

1. **Merchant of Record / Payment Intermediary:** The Platform facilitates payment collection via certified, hosted payment gateways (e.g., local Pakistan payment gateways, HesabPay for Afghanistan).
2. **Double-Entry Ledger (§8):** All commercial flows within the marketplace are recorded in an immutable, balanced multi-currency double-entry ledger.
3. **Funds Segregation:** Patient consultation fees are held in dedicated settlement accounts and credited to doctor pending balances until clinical delivery is completed and statutory cancellation/refund windows elapse.

---

## 4. Anti-Circumvention and Contact Sharing Policy (§61)

To protect patient safety and ensure clinical record continuity:
1. **In-Platform Communication:** Consultation conversations and clinical file exchanges must occur inside the secure, encrypted Care Connect workspace.
2. **Leakage Detection:** The Platform employs automated pattern detection to flag off-platform contact solicitations (e.g., personal phone numbers, external messaging applications, off-platform payment requests).
3. **Non-Hostile Detection Policy:** Messages flagged for contact information are highlighted for administrative review rather than abruptly censored, ensuring urgent patient-doctor communication is never interrupted in bad faith.
4. **Circumvention Prohibition:** Systematic efforts by providers or patients to divert commercial transactions off-platform to avoid platform fees or clinical audit trails will result in account suspension.
