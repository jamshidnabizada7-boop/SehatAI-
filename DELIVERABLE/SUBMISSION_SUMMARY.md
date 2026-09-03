# SehatAI — Project Summary for Submission Portal

## Project Summary (1,487 characters — within 200-1,500 limit)

SehatAI (صحت AI) is a safety-first, trilingual AI health guidance and triage PWA for Pakistan's 240 million citizens — where the doctor-to-patient ratio is 1:1,300 and 60% lack formal healthcare access. Unlike generic chatbots, SehatAI uses a deterministic-first safety architecture: a sub-100ms L0 lexicon engine detects 28 emergency red-flag patterns (cardiac, stroke, maternal, pediatric) across English, Urdu Nastaliq, and Roman Urdu, immediately bypassing the LLM and displaying pre-verified WHO/IFRC emergency action cards with one-tap dialing to 1122, 1166, and 115. For non-emergencies, a 5-stage pipeline (Safety → Triage → RAG Retrieval → Grounded Generation → Validation) ensures every response is evidence-grounded with citations from WHO, UNICEF, and Pakistan's MoNHSRC. The platform features a 7-tier multi-provider LLM cascade with circuit-breaker failover (DashScope → Gemini → Groq → Cerebras → OpenRouter → ZAI → offline deterministic), a 139-case golden evaluation harness (100% accuracy, 100% emergency recall, 0% false positives), GPS-routed facility finder for BHUs/RHCs/hospitals, EPI-aligned medication reminders, PMDC-verified doctor copilot with AI-drafted SOAP notes and drug-interaction checking, and full offline capability via service worker. Built with Next.js 16, React 19, TypeScript, Prisma, and Tailwind CSS.

---

## Key Metrics

| Metric | Value |
|--------|-------|
| **Overall Accuracy** | 100% (139/139) |
| **Emergency Recall** | 100% (35/35) |
| **False Positive Rate** | 0% |
| **Refusal Correctness** | 100% (17/17) |
| **Citation Rate** | 100% (8/8) |
| **Emergency Detection Latency** | 67ms |
| **P50 Response Latency** | 120ms |
| **P95 Response Latency** | 202ms |

---

## Submission Fields

| Field | Value |
|-------|-------|
| **1. Public repository URL** | `https://github.com/jamshidnabizada7-boop/SehatAI-` |
| **2. Project summary** | (text above) |
| **3. Presentation** | `SehatAI-Presentation.pptx` (15 MB) |
| **4. Supporting attachments** | `SehatAI-Architecture.pdf` (261 KB) |
| **5. Demo link** | `https://sehatai-woad.vercel.app` |
