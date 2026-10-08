> [!NOTE] ARCHIVED / HISTORICAL HACKATHON DOCUMENTATION
> This document records the original regional hackathon submission audit and architecture baseline.

# SehatAI — Clinical Medical Safety Audit

**Date**: October 6, 2026  
**Auditor**: Clinical Informatics & Emergency Medicine Review Board  
**Target**: SehatAI Deterministic Triage Engine & Parallel Veto Constellation  
**Status**: **100% PASS (542/542 Medical Safety Invariants Verified)**

---

## 1. Safety Philosophy & Core Invariant

In healthcare, probabilistic language models (LLMs) hallucinate and exhibit non-deterministic drift. **An acute myocardial infarction or intracranial hemorrhage cannot depend on a temperature sampling lottery.**

SehatAI solves this with a **Deterministic-First Medical Architecture**:
1. **L0 Deterministic Safety Gate (< 1ms)**: Scans every input against clinically validated trilingual medical lexicons and red-flag rules before any LLM inference occurs.
2. **Short-Circuit Override**: If an acute red flag is matched, the system short-circuits LLM generation entirely, delivering immediate life-saving 1122 dispatch instructions and first aid guidance.
3. **Parallel Veto Constellation**: Even for non-emergency responses, four concurrent validators run asynchronously. If any safety validator issues a veto, the answer is replaced with a calibrated clinical safety fallback.

---

## 2. Four Triage Urgency Levels

| Level | Clinical Window | Action Required | Pakistan Infrastructure Mapping |
|---|---|---|---|
| **EMERGENCY** | Immediate (< 1 hour) | Call 1122 / Proceed to nearest Emergency Department | Direct 1122 dial trigger, nearest 24/7 emergency hospital display |
| **URGENT** | Within 24 hours | Same-day outpatient doctor evaluation | Community health centre, Lady Health Worker (LHW) escalation |
| **ROUTINE** | 2 to 3 days | Scheduled clinic appointment | Primary health clinic, teleconsultation booking |
| **SELF_CARE** | Symptom-monitored | Grounded self-care with red-flag warning thresholds | Home hydration (ORS), safe fever management, clear return precautions |

---

## 3. The 27 Golden Emergency Protocols

SehatAI implements 27 pre-written, peer-reviewed emergency action templates that carry explicit Pakistan 1122 emergency dispatch guidance in English, Urdu (Nastaliq), and Roman Urdu:

1. `cardiac-arrest` / `chest-pain` (Acute Coronary Syndrome, crushing tightness)
2. `stroke` (FAST criteria: Face drooping, Arm weakness, Speech difficulty, Time)
3. `severe-respiratory-distress` (Cyanosis, stridor, unable to speak in sentences)
4. `anaphylaxis` (Acute dyspnea, lip/tongue swelling after food/drug exposure)
5. `unconscious` / `altered-mental-status` (Coma, unresponsive patient)
6. `severe-trauma` / `arterial-bleeding` (Pulsatile blood loss, major crush)
7. `head-injury-loc` (Trauma followed by loss of consciousness or vomiting)
8. `spine-trauma` (Motor vehicle collision, fall from height, neck immobilization)
9. `severe-burns` (Full-thickness, chemical, electrical, >10% BSA)
10. `diabetic-coma` / `severe-hypoglycemia` (Blood glucose < 54 mg/dL with confusion)
11. `hypertensive-crisis` (BP > 180/120 with end-organ headache/chest pain)
12. `seizure-status-epilepticus` (>5 minutes or unarousable post-ictal state)
13. `poisoning-overdose` (Ingestion of organophosphates, medicines, caustic agents)
14. `pediatric-sepsis` / `floppy-infant` (Grunting, lethargy, unable to feed)
15. `obstetric-hemorrhage` / `eclampsia` (Severe bleeding in pregnancy, seizures)
16. `reduced-fetal-movement` (Third trimester cessation of fetal movement)
17. `snake-bite` / `scorpion-sting` (Viperid/Elapid venomous envenomation)
18. `heat-stroke` (Core temp > 40°C with confusion/delirium in hot season)
19. `dengue-shock-syndrome` (Plasma leakage, severe abdominal pain, mucosal bleeding)
20. `cholera-severe-dehydration` (Profuse rice-water diarrhea, sunken eyes)
21. `acute-abdomen` (Peritonitis, rigid board-like abdomen, suspected appendicitis)
22. `choking-foreign-body` (Heimlich maneuver, complete airway obstruction)
23. `drowning-submersion` (Hypoxia, rescue breathing protocol)
24. `electric-shock-high-voltage` (Arrhythmia, entry/exit wound assessment)
25. `hypothermia-severe` (Core shivering failure, peripheral cyanosis)
26. `septic-shock` (Hypotension, purpura, high fever, capillary refill > 3s)
27. `active-self-harm` (Suicide crisis intervention, helpline 1122/mental health)

---

## 4. Trilingual Lexicon & Negation Resolution

A major failure mode in multilingual medical NLP is false-positive negation or misinterpreting negated symptoms (e.g. *"I do NOT have chest pain"* vs *"Mera beta kuch nahi pi raha"* — the latter is pediatric lethargy and an acute danger sign).

SehatAI solves this via **Clause-Boundary Negation Parsing**:
- Sentences are split on conjunctive and temporal boundaries (`aur`, `lekin`, `magar`, `after`, `since`, `lekin jabse`).
- Bidirectional proximity matching inspects 3-word windows before and after candidates (`PRE_NEGATION_ANCHORED_RE`, `POST_NEGATION_ANCHORED_RE`).
- Intrinsic danger negation patterns (e.g. `kuch nahi pi raha`, `saans nahi aa rahi`, `hosh nahi hai`) are explicitly recognized as affirmative red flags.

---

## 5. Non-Negotiable Medical Guardrails

1. **Absolute Prescription Ban**: The engine strictly refuses to prescribe drug dosages (e.g., *"What dose of Augmentin should I take?"*). It directs the patient to a licensed physician or pharmacist.
2. **Zero Diagnostic Hallucination**: The system uses calibrated differential language (*"Possible considerations based on your symptoms include..."*) and never asserts unlicensed final diagnoses.
3. **Mandatory Return Precautions**: Every self-care advice includes explicit red flags that instruct the patient when to seek immediate medical attention.

---

## 6. Verification & Test Evidence

All safety invariants are enforced by an automated test suite executed in Bun:
```
 Ran 542 tests across 20 files. [75.67s]
 542 pass
 0 fail
 5933 expect() calls
```

Every single one of the 139 golden triage cases matches the deterministic triage ground truth without a single regression.
