# SehatAI Clinical Compliance, Regulatory & Governance Matrix

**Document ID:** CLN-COMPL-2026-10-08-07  
**Jurisdiction Focus:** Pakistan (PMDC / DRAP), Afghanistan (MoPH), International (WHO/IMCI)  
**Classification:** CLINICAL GOVERNANCE & REGULATORY RECORD  
**Date:** October 8, 2026  

---

## 1. Regulatory Framework & Standards Alignment

SehatAI and Care Connect operate under a strict software-as-a-medical-device (SaMD) risk mitigation framework aligned with international guidelines:

| Domain | Regulatory Benchmark | Implementation in SehatAI |
| :--- | :--- | :--- |
| **Pediatric Emergencies** | WHO / UNICEF IMCI (Integrated Management of Childhood Illness) | Deterministic child danger signs (inability to drink, vomiting everything, chest in-drawing, floppy infant). |
| **Adult Emergencies** | WHO Emergency Care System Framework | Deterministic cardiac, severe bleeding, airway obstruction, poisoning, and trauma red flags. |
| **Stroke Recognition** | FAST Criteria (Face, Arms, Speech, Time) | Multilingual stroke syndrome detection in English, Nastaliq Urdu, and Roman Urdu. |
| **Maternal Safety** | WHO Managing Complications in Pregnancy Guidelines | Preeclampsia detection (severe headache, blurred vision, edema) and obstetric hemorrhage escalation. |
| **Mental Health** | WHO mhGAP Intervention Guide | Compassionate crisis stabilization; warm transfer to national crisis lines (Umang, 1122); zero self-harm advice. |

---

## 2. Jurisdiction-Aware Emergency Routing Matrix

The system dynamically selects emergency contact numbers based on the user's declared country or query context:

| Jurisdiction | Code | Primary Emergency Contacts | Secondary / Specialized Lines |
| :--- | :--- | :--- | :--- |
| **Pakistan** | `PK` | **1122** (Rescue 1122 Ambulance)<br>**115** (Edhi Ambulance)<br>**1023** (Alkhidmat) | **1166** (National Health Helpline)<br>**1099** (Madadgar Women Helpline)<br>**1152** (Umang Child Helpline)<br>**15** (Police) |
| **Afghanistan** | `AF` | **102** (Kabul Ambulance Service)<br>**112** (Afghan Red Crescent ARCS) | **119** (Police Emergency)<br>**166** (Health Crisis Helpline) |
| **International** | `INTL` | **112 / 911** (Universal Emergency Access) | Local Nearest Hospital Emergency Department |

**Localization Invariant:** Emergency guidance generated across triage buttons, hotlines, and pre/post generation veto triggers is strictly localized using the patient's jurisdiction profile. For Afghanistan (`AF`), primary contact numbers (102 / 112) replace Pakistan-specific numbers (1122 / 1023) across all user-facing output.

---

## 3. Clinician Verification & Licensing Lifecycle (§14 & §15)

The database maintains a strict clinician credentialing state machine:

```
[DRAFT]
   │  (Uploads PMDC Card, CNIC, MBBS Degree)
   ▼
[PENDING_VERIFICATION]
   │  (Admin review: verify against PMDC Registry)
   ├───> [REJECTED] / [MORE_INFO_REQUIRED]
   │
   ▼
[VERIFIED]
   │  (Clinician configures availability & payout method)
   ▼
[ACTIVE] (Eligible to receive patient bookings and sign prescriptions)
   │
   ├───> [SUSPENDED] (Dispute, malpractice flag, or license expiry)
   │       • Call joining BLOCKED (DOCTOR_SUSPENDED)
   │       • Marketplace listing HIDDEN
   │       • Prescribing authority REVOKED
   │
   └───> [EXPIRED] (Annual license re-validation required)
```

---

## 4. Controlled Substances & Prescribing Policy (§40 & §41)

1. **AI Prescribing Invariant:** **The AI NEVER issues or signs prescriptions**. All prescriptions must be authored, reviewed, and cryptographically signed by an authenticated clinician.
2. **Controlled Substance Hard Block (§41):**
   - Controlled drugs, narcotics, barbiturates, benzodiazepines, and high-abuse potential substances are **strictly blocked from the electronic prescription system**.
   - If a prescription draft contains any controlled substances, the engine throws `CONTROLLED_DRUGS_DISABLED` (HTTP 403).
3. **Cross-Border Corridor Enforcement (§16):**
   - Prescribing permissions are evaluated per consultation corridor.
   - Prescriptions between mismatched physical locations (e.g. Doctor in PK, Patient in AF) require explicit bilateral regulatory treaty rows in `JurisdictionPolicy`.
   - Without an explicit bilateral policy, `evaluateJurisdiction` blocks prescribing (`PRESCRIBING_NOT_ALLOWED_IN_JURISDICTION`).

---

## 5. Informed Patient Consent (§8.5)

- Every patient must review and accept bilingual (English & Urdu Nastaliq) informed consent before initiating AI triage or tele-consultation.
- Consent records capture exact policy versions, user IDs, timestamps, and IP addresses.
- Consent can be audited or revoked via `/api/user/consents`.
