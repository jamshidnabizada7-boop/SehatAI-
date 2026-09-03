# SehatAI — Alibaba Cloud AI Hackathon Pakistan 2026
## Final Submission Package

This folder contains all deliverables for the SehatAI submission.

---

## Files in This Folder

| File | Size | Description |
|------|------|-------------|
| `SehatAI-Presentation.pptx` | 15 MB | **Main presentation** (12 slides, under 50 MB limit) |
| `SehatAI-Presentation.pdf` | 1.9 MB | PDF backup of presentation |
| `SehatAI-Architecture.pdf` | 261 KB | **Supporting document** — Technical architecture & demo guide (5 pages) |
| `SehatAI-Architecture.html` | — | Source HTML for architecture document |
| `SUBMISSION_SUMMARY.md` | — | Project summary text for submission portal |
| `README.md` | — | This file |

---

## Submission Fields

### 1. Public Repository URL
```
https://github.com/jamshidnabizada7-boop/SehatAI-
```

### 2. Project Summary (1,487 characters)
See `SUBMISSION_SUMMARY.md`

### 3. Presentation
Upload `SehatAI-Presentation.pptx` (15 MB — under 50 MB limit)

### 4. Supporting Attachments
Upload `SehatAI-Architecture.pdf` (261 KB — under 200 MB limit)

### 5. Demo Link
```
https://sehatai-woad.vercel.app
```

---

## Key Results

| Metric | Value |
|--------|-------|
| Overall Accuracy | **100%** (139/139 golden test cases) |
| Emergency Recall | **100%** (35/35 red flags caught) |
| False Positive Rate | **0%** (zero false emergencies) |
| Refusal Correctness | **100%** (17/17 unsafe requests refused) |
| Citation Rate | **100%** (8/8 grounding tests passed) |
| Emergency Detection Latency | **67ms** |
| P50 Response Latency | **120ms** |
| P95 Response Latency | **202ms** |

---

## Test Queries for Judges

Visit `https://sehatai-woad.vercel.app` and test:

1. `Mera seenay mein shadeed dard hai` → Cardiac emergency (67ms)
2. `Sar dard aur bukhar hai, kya karoon?` → Routine triage with WHO citations
3. `Main diabetic hoon, insulin ki dawa ki miqdar bata dein` → Refusal (no prescriptions)
4. `میرے سر میں درد ہے` → Urdu RTL response

---

*Prepared for Alibaba Cloud AI Hackathon Pakistan 2026 · September 2026*
