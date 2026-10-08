# SehatAI Care Connect — Clinical Safety Audit (§100)

> **Document Type:** Clinical Governance, Triage Safety Boundaries & AI Medical Ethics Audit  
> **Audit Date:** October 2026 · **Scope:** Safety Pipelines, Prescriptions, Jurisdiction & Matching

---

## 1. Prime Directive: Emergency Upstream of Commerce (§85, §86)

In healthcare technology, commercial monetization must never impede urgent medical emergency interventions.

### 1.1 Architecture of the L0 Emergency Firewall
In Care Connect, AI triage and red-flag screening are placed **strictly upstream of doctor matching, scheduling, and checkout**:
1. When a patient uses the smart care matcher (`POST /api/care/match`) or clinical intake (`POST /api/care/intake`):
   - The input is routed through the deterministic L0 regex and lexical emergency scanner (<5 ms execution latency).
   - If an acute life-threat red flag is triggered (e.g., crushing chest pain, stroke FAST indicators, anaphylaxis, active hemorrhage, poisoning):
     - `emergency: true` is returned immediately.
     - The response delivers prominent emergency instructions and national rescue hotlines (**1122** Rescue in Pakistan, **115** Edhi, local emergency ambulance in Afghanistan).
     - Commercial doctor cards, booking forms, and payment checkouts are **completely suppressed**.
2. **Non-Bypassable Invariant:**
   - A patient cannot pay their way past an emergency red-flag triage block.
   - The safety engine is deterministic and runs locally without network or external LLM dependencies, guaranteeing that API timeouts or network outages cannot silence an emergency warning.

---

## 2. The AI-Never-Prescribes Invariant (§39, §40, §41)

Under medical ethics and healthcare regulations in Pakistan (PM&DC) and Afghanistan (Ministry of Public Health), **artificial intelligence models are strictly prohibited from prescribing medicines**.

### 2.1 Enforcement in Software:
1. **Mandatory Human Signature:**
   - In `src/server/care/prescription-service.ts:signPrescription()`, only a verified human doctor (`actorRole === 'DOCTOR'`) possessing an active licensing status can digitally sign and issue a prescription.
   - AI drafting tools can only construct draft prescription templates (`status: DRAFT`). A draft has zero legal or pharmacological validity until explicitly reviewed, modified, and signed by the doctor.
2. **Controlled Substance Hard Block (§40):**
   - In `src/server/care/prescription-service.ts:checkControlledDrug()`, every medicine item is cross-referenced against the local controlled substances formulary (narcotics, addictive opioids, scheduled benzodiazepines, amphetamines).
   - If a controlled drug is detected, the engine throws:
     `PrescriptionError('CONTROLLED_DRUG_BLOCKED', 403)`.
   - Telemedicine prescription of controlled substances is unconditionally blocked by software policy regardless of doctor preference.
3. **Automated Drug Interaction Safety Engine:**
   - Prior to signing, `checkDrugSafety()` in `src/lib/drug-interactions.ts` cross-checks prescribed items against the patient's declared allergies, chronic conditions, and concurrent medications.
   - High-severity drug interactions flag warnings in the doctor workspace before signing is permitted.

---

## 3. Labeled Clinical Handoff & Transparency (§31, §32)

When patient chat intake summaries are generated for the attending doctor:
1. **Explicit Visual & Metadata Labeling:**
   - Every AI-generated summary carries the metadata tag:
     `label: "AI-ASSISTED CLINICAL SUMMARY — REQUIRES CLINICAL VERIFICATION"`.
   - The consultation workspace forces the doctor to choose between: `ACCEPT`, `EDIT`, or `REJECT` before adopting the summary into the clinical SOAP note.
2. **Zero Chain-of-Thought Exposure (§33):**
   - Internal reasoning prompts, system tokens, or internal model deliberation chains are never exposed to patients or recorded in persistent medical records.

---

## 4. Jurisdiction & Telemedicine Regulatory Gating (§16)

Telemedicine practice is governed by the physical location of the patient:
1. **Declared Patient Location (§17):**
   - At the time of every consultation booking, the patient must declare their physical country (e.g., PK, AF).
   - Location is **never inferred silently from IP addresses or geolocation headers** to avoid VPN errors or cross-border borderland mistakes.
2. **JurisdictionPolicy Matrix:**
   - `src/server/care/jurisdiction.ts:evaluateJurisdiction()` evaluates the combination of:
     `PatientCountry × DoctorLicensingCountry × ConsultationModality`.
   - Prescribing rights are restricted based on cross-border legal treaties. If cross-border prescribing is unauthorized by current regulation, the consultation allows advice only, and prescribing is software-locked.
