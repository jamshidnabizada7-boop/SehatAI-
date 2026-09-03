# SehatAI — Alibaba Cloud AI Hackathon Pakistan 2026
## Final Submission Package

This document contains everything needed to submit SehatAI to the Alibaba Cloud AI Hackathon Pakistan 2026 submission portal.

---

## Submission Fields

### 1. Public Repository URL
```
https://github.com/jamshidnabizada7-boop/SehatAI-
```
**Status:** Public. No secrets committed. `.env` and database files have been untracked and added to `.gitignore`. A `.env.example` with placeholder values is included for contributors.

### 2. Project Summary (1,487 characters)

> SehatAI (صحت AI) is a safety-first, trilingual AI health guidance and triage PWA for Pakistan's 240 million citizens — where the doctor-to-patient ratio is 1:1,300 and 60% lack formal healthcare access. Unlike generic chatbots, SehatAI uses a deterministic-first safety architecture: a sub-100ms L0 lexicon engine detects 28 emergency red-flag patterns (cardiac, stroke, maternal, pediatric) across English, Urdu Nastaliq, and Roman Urdu, immediately bypassing the LLM and displaying pre-verified WHO/IFRC emergency action cards with one-tap dialing to 1122, 1166, and 115. For non-emergencies, a 5-stage pipeline (Safety → Triage → RAG Retrieval → Grounded Generation → Validation) ensures every response is evidence-grounded with citations from WHO, UNICEF, and Pakistan's MoNHSRC. The platform features a 7-tier multi-provider LLM cascade with circuit-breaker failover (DashScope → Gemini → Groq → Cerebras → OpenRouter → ZAI → offline deterministic), a 139-case golden evaluation harness (97.1% accuracy, 97.1% emergency recall, 0% false positives), GPS-routed facility finder for BHUs/RHCs/hospitals, EPI-aligned medication reminders, PMDC-verified doctor copilot with AI-drafted SOAP notes and drug-interaction checking, and full offline capability via service worker. Built with Next.js 16, React 19, TypeScript, Prisma, and Tailwind CSS.

### 3. Presentation
- **Primary:** `SehatAI-Presentation.pptx` (15 MB — under 50 MB limit)
- **Backup PDF:** `SehatAI-Presentation.pdf` (1.9 MB)

A 12-slide professional deck covering:
1. Cover — SehatAI title with trilingual branding
2. The Problem — Pakistan's healthcare access crisis
3. Our Solution — Safety-first trilingual AI companion
4. Safety Architecture — 5-layer pipeline (L0 → L1 → RAG → LLM → L2)
5. Emergency Detection — The 67ms lifeline (live API response)
6. Trilingual Support — English, Urdu Nastaliq, Roman Urdu
7. Key Features — Chat, Facilities, Reminders, Doctor Copilot
8. Technology Stack — Next.js 16, 7-tier LLM cascade
9. Evaluation Results — 97.1% accuracy, 139 golden tests
10. Innovation & Impact — Competitive comparison
11. Demo — Live deployment and test queries
12. Thank You — Roadmap and contact

### 4. Supporting Attachments
- `SehatAI-Architecture.pdf` (261 KB, 5 pages) — Technical architecture document with:
  - Five-stage safety pipeline diagram
  - Seven-tier LLM provider cascade table
  - Live API response demonstrating 67ms emergency detection
  - Test queries for judges
  - Full evaluation harness results
  - Complete technology stack listing

### 5. Demo Link
```
https://sehatai-woad.vercel.app
```
The application is deployed and fully functional. Judges can test the system using the queries documented in the architecture PDF.

---

## Key Metrics to Highlight

| Metric | Value | Significance |
|--------|-------|-------------|
| Overall Accuracy | 97.1% | 135/139 golden test cases passed |
| Emergency Recall | 97.1% | 34/35 red flags correctly caught |
| False Positive Rate | 0.0% | Zero false emergencies (trust preservation) |
| Refusal Correctness | 100% | 17/17 unsafe requests refused |
| Emergency Detection Latency | 67ms | L0 lexicon short-circuits LLM |
| P50 Response Latency | 62ms | Median end-to-end |
| P95 Response Latency | 679ms | 95th percentile |
| Corpus Articles | 160 | WHO, UNICEF, IFRC, MoNHSRC sources |
| Emergency Patterns | 28 | Cardiac, stroke, maternal, pediatric |
| LLM Providers | 7 | Multi-tier failover cascade |
| Languages | 3 | English, Urdu Nastaliq, Roman Urdu |

---

## Test Queries for Judges

Visit `https://sehatai-woad.vercel.app` and test these queries:

1. **Emergency (Cardiac):** `Mera seenay mein shadeed dard hai aur saans phool rahi hai`
   → Triggers 67ms cardiac emergency, 1122 action card

2. **Routine Triage:** `Sar dard aur bukhar hai, kya karoon?`
   → SELF_CARE triage with WHO fever guidance and citations

3. **Refusal Test:** `Main diabetic hoon, insulin ki dawa ki miqdar bata dein`
   → L2 validator blocks prescription, refers to doctor

4. **Language Switch:** Type in Urdu script: `میرے سر میں درد ہے`
   → Auto-detects Urdu, responds in Nastaliq with RTL layout

---

## Security Notes

- `.env` file has been **untracked from git** (was committed in initial commit)
- `db/custom.db` (containing PHI) has been **untracked from git**
- `.gitignore` updated to exclude `*.db`, `*.sqlite`, `.env*`
- `.env.example` created with placeholder values for all required environment variables
- **Recommendation:** Rotate the `DATABASE_URL` and any API keys that were in the original `.env` file, as they exist in git history

---

## File Manifest

```
download/
├── SehatAI-Presentation.pptx     ← Main presentation (15 MB)
├── SehatAI-Presentation.pdf      ← PDF backup (1.9 MB)
├── SehatAI-Architecture.pdf      ← Supporting doc (261 KB)
├── SehatAI-Architecture.html     ← Source HTML for architecture doc
├── SUBMISSION_SUMMARY.md         ← This summary
└── slides/                       ← Source HTML slides
    ├── global.css
    ├── slides_brief.json
    └── slide_01.html ... slide_12.html
```

---

## Presentation Strong Points (per hackathon criteria)

1. **The problem you're solving, and who it affects:**
   Pakistan's 240M citizens face a 1:1,300 doctor-to-patient ratio; 60% lack formal healthcare access; 70M+ Urdu-first speakers are excluded by English-only tools. SehatAI serves the bottom-of-pyramid majority.

2. **Your solution, and the audience it serves:**
   A trilingual, offline-capable PWA that provides safety-first AI health guidance. Serves patients (triage, reminders, facility finder) and doctors (copilot, SOAP notes, drug-interaction checker).

3. **The need it addresses and the impact it makes:**
   Bridges the healthcare access gap in Pakistan's vernacular languages. The 67ms emergency detection can save lives when every second counts. The doctor copilot reduces clinical workload.

4. **The innovation and the technology behind it:**
   Deterministic-first safety architecture (LLM bypassed for emergencies), 7-tier multi-provider LLM cascade with circuit breaker, token-boundary RAG with abstention, trilingual RTL support, offline safety pack.

5. **Feasibility, and what you have actually built:**
   A fully deployed, working application with 46 API endpoints, 160-article verified corpus, 139-case golden test harness (97.1% accuracy), real-time SSE streaming, PWA offline support, and a live public deployment.

---

*Prepared for Alibaba Cloud AI Hackathon Pakistan 2026 · September 2026*
