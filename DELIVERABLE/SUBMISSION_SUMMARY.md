# SehatAI — Project Summary for Submission Portal

## Project Summary (1,487 characters — within 200-1,500 limit)

SehatAI (صحت AI) is a safety-first, trilingual AI health guidance and triage PWA for Pakistan's 240 million citizens — where the doctor-to-patient ratio is 1:1,300 and 60% lack formal healthcare access. Unlike generic chatbots, SehatAI uses a deterministic-first safety architecture: a sub-100ms L0 lexicon engine detects 28 emergency red-flag patterns (cardiac, stroke, maternal, pediatric) across English, Urdu Nastaliq, and Roman Urdu, immediately bypassing the LLM and displaying pre-verified WHO/IFRC emergency action cards with one-tap dialing to 1122, 1166, and 115. For non-emergencies, a 5-stage pipeline (Safety → Triage → RAG Retrieval → Grounded Generation → Validation) ensures every response is evidence-grounded with citations from WHO, UNICEF, and Pakistan's MoNHSRC. The platform features a 7-tier multi-provider LLM cascade with circuit-breaker failover (DashScope → Gemini → Groq → Cerebras → OpenRouter → ZAI → offline deterministic), a 139-case golden evaluation harness (100% accuracy, 100% emergency recall, 0% false positives), GPS-routed facility finder for BHUs/RHCs/hospitals, EPI-aligned medication reminders, PMDC-verified doctor copilot with AI-drafted SOAP notes and drug-interaction checking, and full offline capability via service worker. Built with Next.js 16, React 19, TypeScript, Prisma, and Tailwind CSS.

---

## Key Innovation: LLM-Free Emergency Path

SehatAI's defining innovation is the **deterministic-first safety architecture**. For life-threatening emergencies, the LLM is **never invoked** — the L0 lexicon engine uses pattern matching to detect emergencies in under 100 milliseconds, then displays pre-verified WHO/IFRC action cards. This eliminates three risks:
1. **Hallucination** — pre-verified cards, no LLM generation
2. **Latency** — 67ms vs 600-3000ms for LLM generation
3. **Availability** — zero external dependencies, works offline

For non-emergency queries, 7 LLM providers are cascaded with circuit-breaker failover to ensure zero downtime.

---

## Final Evaluation Results (100% Accuracy)

| Metric | Value | Cases |
|--------|-------|-------|
| **Overall Accuracy** | **100%** | 139/139 |
| **Emergency Recall** | **100%** | 35/35 |
| **False Positive Rate** | **0%** | 0/47 |
| **Refusal Correctness** | **100%** | 17/17 |
| **Citation Rate** | **100%** | 8/8 |
| **Under-triage Rate** | **0%** | 0/139 |
| **Emergency Detection Latency** | **67ms** | L0 lexicon |
| **P50 Response Latency** | **120ms** | Median |
| **P95 Response Latency** | **202ms** | 95th percentile |

---

## Submission Fields

| Field | Value |
|-------|-------|
| **1. Public repository URL** | `https://github.com/jamshidnabizada7-boop/SehatAI-` |
| **2. Project summary** | (text above — 1,487 characters) |
| **3. Presentation** | `SehatAI-Presentation.pptx` (15 MB, 12 slides) |
| **4. Supporting attachments** | `SehatAI-Architecture.pdf` (264 KB, 6 pages) |
| **5. Demo link** | `https://sehatai-woad.vercel.app` |
