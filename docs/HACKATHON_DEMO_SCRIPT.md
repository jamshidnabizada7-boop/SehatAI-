> [!NOTE] ARCHIVED / HISTORICAL HACKATHON DOCUMENTATION
> This document records the original regional hackathon submission audit and architecture baseline.

# SehatAI — Hackathon Presentation & Live Demo Script

**Target Time**: 5 Minutes  
**Audience**: Technical Judges, Medical Informaticists, Hackathon Evaluators  
**Goal**: Demonstrate undeniable excellence in Medical Safety, AI Architecture (Alibaba Cloud DashScope / Qwen cascade), Pakistan Context (Urdu/Roman/1122), and Offline Resilience.

---

## Pre-Demo Checklist (30 Seconds)
1. Open Chrome at `http://localhost:3000`.
2. Ensure browser DevTools is ready for Network offline toggle.
3. Audio unmuted for voice read-aloud demonstration.

---

## Act 1: Acute Medical Emergency & Deterministic Short-Circuit (75s)

### Action
Type in the chat input:
> **"Mere seene mein shaded dard hai aur ulti aa rahi hai"**  
*(Roman Urdu: "I have severe chest pain and nausea")*

### What to Point Out to Judges
1. **Instant Response (< 1ms)**: Notice there was no loading spinner or API delay. The **L0 Deterministic Safety Gate** caught the acute coronary red flag.
2. **Direct 1122 Integration**: An emergency overlay immediately surfaces with a direct Pakistan 1122 one-tap dial button.
3. **Evidence-Based Action Steps**: Pre-written protocol from the National Institute of Cardiovascular Diseases (NICVD) telling the patient: Sit upright, do not exert yourself, do not drive yourself to the hospital.
4. **Click the CPU Icon (Technical Inspector / Judge Mode)**:
   - Point to the inspector modal:
   - *"Look here: L0 Short-Circuit is ACTIVATED. Because this was a life-threatening symptom, we intentionally bypassed probabilistic LLM generation to guarantee zero hallucination risk."*

---

## Act 2: Strict Anti-Prescribing & Drug Safety (60s)

### Action
Type in the chat input:
> **"Mujhe bukhar hai, amoxicillin 500mg kitni dafa khani chahiye?"**  
*(Roman Urdu: "I have a fever, how often should I take amoxicillin 500mg?")*

### What to Point Out to Judges
1. **Prescription Refusal Invariant**: SehatAI immediately identifies that the user is asking for drug dosing.
2. **Deterministic Safety Rail**: The system politely but strictly refuses to specify doses, explaining the risks of antibiotic resistance and unsupervised antimicrobial therapy, redirecting them to a doctor or licensed pharmacist.
3. **Calibrated Self-Care Advice**: It provides safe, non-medicinal comfort measures (hydration, cool compresses) and red flags that require doctor consultation.

---

## Act 3: Trilingual Nastaliq Urdu & Accessibility (60s)

### Action
1. Toggle the language picker in the top right to **اردو (Urdu)**.
2. Type or paste:
   > **"شوگر کے مریض رمضان میں روزے کے دوران ہائپو سے کیسے بچیں؟"**  
   *(Urdu Nastaliq: "How can diabetic patients avoid hypoglycemia during Ramadan fasting?")*
3. Click the **Audio Speaker Icon** on the assistant message.

### What to Point Out to Judges
1. **Native Nastaliq Typography**: Crisp, right-to-left Nastaliq typography tailored for Pakistani readers.
2. **Culturally Grounded Medicine**: Advice accounts for Suhoor/Iftar blood sugar monitoring, Sahoor hydration, and dangerous hypoglycemia symptoms (<70 mg/dL).
3. **Low-Literacy Accessibility**: The Web Speech read-aloud hook speaks the guidance aloud, enabling illiterate or elderly family members to listen to health instructions.

---

## Act 4: The Technical Inspector (Judge Mode) (60s)

### Action
Click the **CPU Icon (Technical Inspector)** on the assistant's Ramadan answer.

### What to Point Out to Judges
1. **Multi-Model Cascade Breakdown**:
   - Total Latency: ~1,200 ms.
   - L1 Structured Triage: Alibaba Cloud Qwen (`qwen-max` / `qwen-plus`).
   - Grounded Generation: Qwen 2.5 72B Streaming.
   - L2 Judge / Veto Constellation: 8-Boolean LLM validator checking factual consistency, absence of unverified drug invention, and linguistic coherence.
2. **Parallel Veto Constellation**:
   - 4 independent safety checks ran in parallel: Red-Flag Recheck, Medication Safety, Citation Grounding, and Language Parity. All 4 unanimously voted **PASSED**.
3. **Calibrated Confidence**:
   - Show the 95% HIGH confidence badge and explain the mathematical penalties if citation grounding is missing.
4. **Peer-Reviewed Citations**:
   - Display the exact WHO and Pakistan Endocrine Society guidelines cited with license and verification dates.

---

## Act 5: 100% Offline Resilience (PWA Mode) (45s)

### Action
1. Open Chrome DevTools (`F12`) -> **Network** tab -> Check **Offline**.
2. Type in chat:
   > **"Aag se jhalasne par pehla ilaj kya hai?"**  
   *(Roman Urdu: "What is first aid for burns?")*

### What to Point Out to Judges
1. **Zero Network Traffic**: Notice the request succeeded entirely offline.
2. **Offline Web Worker & Dexie IndexedDB**: The local Damerau-Levenshtein fuzzy matcher searched the precached 181-document medical corpus inside the browser in 4 ms.
3. **Offline Label**: An amber banner clearly indicates *"Offline mode active — using local verified health corpus"*.
4. **My Health QR Export**: Show the "Export to Doctor" QR code modal. A patient in a rural clinic without cellular data can transmit their entire encrypted triage and symptom history to a doctor's screen via an offline QR scan.

---

## Conclusion (15s)
> *"SehatAI is not just another wrapper. It is a deterministic, clinically governed, trilingual medical intelligence platform built to save lives in Pakistan. Thank you."*
