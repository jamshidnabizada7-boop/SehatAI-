> [!WARNING] DRAFT — REQUIRES LEGAL COUNSEL REVIEW
> This document is an engineering draft prepared for architectural validation and requires comprehensive review by licensed legal counsel before production regulatory reliance.

# SehatAI Care Connect — Doctor Master Service Agreement

> **DRAFT — REQUIRES COUNSEL REVIEW BEFORE ANY COMMERCIAL LAUNCH**  
> **Jurisdiction: PK (draft) / AF (draft)**  
> **Version:** 2026.10-draft · **Effective Date:** October 2026

---

## 1. Parties and Relationship

This Doctor Master Service Agreement ("Agreement") is entered into between SehatAI ("Platform Provider") and the healthcare practitioner registered and verified on the platform ("Doctor", "Practitioner").

The Doctor acts as an **independent medical contractor**. Nothing in this Agreement shall be construed to create an employer-employee, agency, partnership, or joint venture relationship between SehatAI and the Doctor. The Doctor maintains sole and absolute clinical autonomy and medical responsibility for all healthcare services provided to patients through the Platform.

---

## 2. Professional Licensing and Verification (§14, §15)

1. **Licensing Warranty:** In Pakistan, the Doctor represents and warrants that they hold an active, unrestricted license with the Pakistan Medical & Dental Council (PM&DC). In Afghanistan, the Doctor warrants holding a valid medical license recognized by the relevant health authorities.
2. **Mandatory Documentation:** Doctors must upload authentic credentials (license card, CNIC/national identity, verified medical degree) for administrative verification. Doctors are prohibited from offering commercial consultations until explicit administrative approval (`careStatus: ACTIVE`) is granted.
3. **Duty to Disclose:** The Doctor must immediately notify SehatAI in writing of any disciplinary proceeding, suspension, revocation, or malpractice claim concerning their medical license.

---

## 3. Clinical Conduct and Professional Standards

1. **Standard of Care:** The Doctor must exercise professional skill, care, and diligence equivalent to in-person medical standards.
2. **Emergency Escalation:** If during a consultation the patient exhibits red flags or acute clinical deterioration, the Doctor must promptly instruct the patient to access local emergency medical services (1122 in PK).
3. **Prescription Rules (§39, §40):** 
   - All prescriptions must be digitally signed by the Doctor.
   - AI draft suggestions are strictly advisory; the Doctor must independently verify dosages, drug-drug interactions, and clinical indications.
   - **Controlled Substances Hard Block:** The Doctor agrees never to attempt prescribing narcotics, controlled sedatives, or restricted psychiatric agents via telemedicine.
4. **Clinical Documentation (§42):** The Doctor must maintain accurate consultation records and finalize clinical notes within the specified window.

---

## 4. Availability, Scheduling & Consultations (§46, §47)

1. **Service Schedules:** The Doctor configures their own service catalog (Text, Audio, Video), pricing, and slot schedule.
2. **Double-Booking Prohibited:** Consultations must be honored punctually. Intentional or repeated failure to attend scheduled sessions constitutes grounds for immediate platform suspension.
3. **Instant Consultations:** When the Doctor toggles "Online Now", they agree to respond to incoming instant requests within the configured acceptance window (15 minutes).

---

## 5. Fees, Commissions, and Payouts (§7, §13)

1. **Pricing Freedom:** The Doctor sets their consultation fees (in integer minor units).
2. **Platform Commission:** The Platform deducts a facilitation commission as configured by the applicable CommissionRule before posting net earnings to the Doctor’s ledger account.
3. **Earnings Holding Period:** Net earnings are credited in `PENDING` state and mature to `AVAILABLE` after the configured holding delay (default 72 hours) to facilitate dispute and refund settlement.
4. **Payouts:** Available funds may be withdrawn via verified bank transfer or authorized local disbursement rails.

---

## 6. Confidentiality and Data Protection

The Doctor shall maintain strict confidentiality over all patient records, consultations, and communications in accordance with applicable medical secrecy laws and the SehatAI Privacy Policy. Doctors are strictly forbidden from copying or transferring patient records outside the secure Care Connect environment.

---

## 7. Indemnification and Termination

The Doctor agrees to indemnify and hold harmless SehatAI from any third-party medical malpractice, clinical negligence, or regulatory claims arising from their clinical conduct. SehatAI reserves the right to suspend or terminate a Doctor's account immediately upon suspicion of fraudulent credentials, unethical conduct, or patient safety violations.
