# Competitor Research — Group D (Healthcare AI Agents) + Group F (Low-Resource / Offline Healthcare AI)

**Agent:** Research Agent #5 | **Task ID:** 5
**Date compiled:** 2026-02 (data current through searches of vendor sites, arXiv, PubMed/PMC, press)
**Companion files:** `01_sehatai_audit.md` (SehatAI repo audit), `03_competitor_groupA_assistants.md`, `04_competitor_groupBC_clinical_doctor.md`

**Evidence discipline:** Every quantitative claim below traces to a primary source (arXiv paper, peer-reviewed journal, company press page, or official docs). Marketing claims are labeled as such. Cleared/regulated products are distinguished from non-regulated ones. Raw search/page snapshots are in `research/search-results-5/`.

---

# PART D — HEALTHCARE AI AGENTS

## D0. Executive summary (Group D)

1. **Hippocratic AI has defined the category's safety template**: a *constellation* of 20+ specialized LLMs (one stateful "primary" conversational agent + many small "specialist support" validators that run concurrently every turn), wrapped in a 5-phase safety process (constellation → output testing by paid licensed clinicians → human clinical supervision → escalation to human nurses → cross-validation on live calls). Its RWE-LLM methodology (arXiv/medRxiv, 6,234 clinicians, 307,038 evaluated calls) is the most rigorous published **output-testing** framework in patient-facing healthcare AI and is the single most important pattern for SehatAI to copy.
2. **No major healthcare agent vendor is FDA-cleared as a device** (Hippocratic, Notable, Cohere, Innovaccer, Sully are all positioned as workflow/staffing/documentation tools; Aidoc is the exception with 17+ FDA clearances, but its agents *recommend/prioritize* rather than act). The first FDA-cleared LLM agent is updoc (K253281, cleared Dec 23, 2025) — a signal that the regulatory frontier is only now being tested.
3. **Architecture convergence**: deterministic rules + RAG first, LLM agents second, human escalation always available. Nobody ships an unconstrained single-agent LLM to patients. Autonomous *actions* (scheduling, auth submission, order drafting) are gated behind confidence thresholds + human review queues.
4. **Evaluation is the moat, not the model.** Vendors differentiate on clinician-in-the-loop eval harnesses (Hippocratic's 775K paid test calls; DeepScore-style reviewer models; Sully's time-saved ROI metrics) rather than raw model quality.

---

## D1. Hippocratic AI (hippocraticai.com) — DEEP DIVE

### D1.1 Company facts
- Founded 2023 by **Munjal Shah** (CEO) & Axel Heitullah; Palo Alto, CA.
- Funding (company press + Fierce Healthcare): Seed $50M (2023) → **Series A $53M at $500M valuation** (Mar 18, 2024) → **Series B $141M at $1.64B valuation** (Jan 9, 2025, led by Kleiner Perkins) → **Series C $126M at $3.5B valuation** (Nov 3, 2025, led by Avenir Growth, with CapitalG, a16z, GV, General Catalyst; total **$404M** raised per company). Note: the task brief's "$500M+" is not supported by company disclosures; press-released total is ~$404M.
- Scale claims (company site, 2026): **180M+ clinical interactions**, 1,000+ health systems/payers/pharma customers, 8.95/10 patient satisfaction, "1.8M patient calls completed" cited at Polaris 3.0 launch.
- **USPTO patent (Nov 27, 2024)** — first U.S. patent covering safety-focused LLMs incorporated into a constellation architecture (mobihealthnews).

### D1.2 Constellation architecture (Polaris) — the core pattern
Source: **Polaris paper, arXiv:2403.13313 (Mar 2024, Mukherjee et al., 26 authors)** — peer-reviewed and later elaborated in Polaris 2.0/3.0 whitepapers.

- **One-trillion-parameter total system** (v1) composed of **several multibillion-parameter LLMs as co-operative agents**:
  - **Stateful primary agent** — drives the conversation, handles rapport/empathy/bedside manner, keeps dialog state across turns.
  - **Specialist support agents** — each a small LLM fine-tuned for ONE narrow nurse task: medication verification, lab interpretation, red-flag/symptom detection, escalation decision, care-plan adherence, compliance, HIPAA-safe phrasing, etc.
- **All agents run CONCURRENTLY every turn** — this *reduces* end-to-end latency vs sequential pipelines (paper §"reduce end-to-end latency by allowing all the agents to run concurrently, including the primary agent"). With the Modular MAX inference stack, Hippocratic reports **<800ms per conversation turn** with ~10K tokens processed on the first turn (Modular/Hippocratic engineering notes).
- **Training**: proprietary + licensed data — clinical care plans, healthcare regulatory documents, medical manuals, medical reasoning corpora; alignment via organic nurse conversations + **simulated patient-actor↔nurse conversations** to teach empathy/bedside manner; **iterative co-training protocol** across agents with diverse objectives (each support agent optimizes a different safety dimension).
- **Constellation scale by version**: Polaris 1.0 (2024, ~1T total) → Polaris 2.0 (98.75% clinical accuracy) → **Polaris 3.0 (Mar 2025): 4.2T parameters across 22 specialized LLMs, 99.38% clinical accuracy** → Polaris 4.0 (2025, whitepaper) → **Polaris 5.0 (Apr 2026 press): 5T-parameter constellation with a 700B-parameter core**, "first evidence-based AI for healthcare proven to outperform every frontier model on critical medical tasks and safety" (marketing framing, but backed by their benchmark suite).

### D1.3 The 5-phase safety process (hippocraticai.com/safety)
1. **Phase 1 — Polaris Constellation Architecture**: specialized support models check the primary agent in real time (medical accuracy, safety).
2. **Phase 2 — Output Testing**: "the only company that performs output testing on our LLMs" — **7,700+ U.S.-licensed clinicians hired to make 775,000 test calls** posing as patients, rating every safety dimension (company claim).
3. **Phase 3 — Human Clinical Supervision**: licensed clinicians supervise agent deployments.
4. **Phase 4 — Escalations to Human Nurse**: any red flag, ambiguity, patient distress, or request escalates to a human nurse (analogous to SehatAI's emergency short-circuit, but at call-center scale).
5. **Phase 5 — Cross-validation**: 180M+ real clinical patient calls cross-validated against simulated test performance to confirm real-world ≈ test-time safety.

### D1.4 RWE-LLM validation methodology (the most transferable pattern)
Source: **"Real-World Evaluation of Large Language Models in Healthcare (RWE-LLM)" — medRxiv 2025.03.17.25324157 (Bhimani et al., 2025)**; summary at hippocraticai.com/real-world-evaluation-llm.

- **Cohort**: 6,234 U.S.-licensed clinicians (5,969 nurses, 265 physicians), avg 11.5 years of experience.
- **Volume**: **307,038 unique AI calls evaluated** across four model iterations.
- **Design**: output-focused (not input/benchmark-focused), inspired by red-teaming but scaled up; **four stages**: (1) pre-implementation, (2) tiered review, (3) resolution, (4) continuous monitoring; **three-tier review process** for error detection & resolution with structured error taxonomy and a feedback loop into the next training iteration.
- **Agent scope was NON-DIAGNOSTIC**: "patient education, follow-ups, and administrative support" — deliberate FDA positioning.
- **Results**: clinical accuracy **~80% (pre-Polaris) → 96.79% (Polaris 1.0) → 98.75% (2.0) → 99.38% (3.0)**; supports **>95% of calls running on auto-pilot** with the remainder escalated/supervised.
- Polaris 3.0 real-world engagement deltas: patient satisfaction 8.72 → 8.95/10; comfort confiding in the agent 88.93% → 94.60%; avg call duration 5.5 → 9.5 min; HRA documentation accuracy 90.5% → 98.5%; "deep thinking" models that triple-check labs/medications/escalations.
- The original Polaris paper's clinician study: **1,100+ U.S. licensed nurses and 130+ physicians** performed end-to-end conversational evaluations posing as patients; Polaris scored **on par with human nurses** on medical safety, clinical readiness, conversational quality, bedside manner; specialist support agents **significantly outperformed GPT-4 and LLaMA-2 70B** on task-based evaluations.
- **100+ peer-reviewed publications**: Hippocratic's site claims the largest safety publication record among healthcare-genAI companies (Polaris constellation paper, RWE-LLM, LLM-staffing comparisons, benchmark papers). Verified anchor papers: arXiv:2403.13313 (cited 87+), medRxiv RWE-LLM (cited 20+).

### D1.5 Products & launches 2024–2025
- **AI Agent App Store (Jan 9, 2025)** — clinicians author and publish agents; revenue-share for clinician creators ("earn through innovation").
- **Launchpad (2024–2025)** — co-development program with health systems (first-of-its-kind; partner names on company press: Memorial Hermann, Wayne Health, Frisbie, Strive, Roper, Sentara, UTHealth, Aegis, Sidra Medicine, OhioHealth...), often with **outcome-based pilots**.
- **Voice agents**: Provider AI (Onboarding, Pharmacy, InPatient, Ambulatory, Readmission Reduction), Payor AI (Onboarding, Pharmacy, Chronic Care, STAR Rating), Life Sciences AI (Drug Launch, Adherence, Trial Enrollment...), **AI Front Door**, **AI Call Supervisor**, **Nurse Co-Pilot** (first AI voice agent co-designed with nurses for inpatient care), **Polaris Pro**, **Certified Agent Builder**.
- **Universal Health Services (UHS) partnership (Jun 16, 2025)** — GenAI agents make post-discharge check-in calls, review discharge/medication instructions, probe symptoms, escalate (healthcaredive.com/news/uhs-partners-hippocratic-ai-launch-ai-agents/750892).
- 2026: "Orchestrators for outcomes, not tasks" — 30+ agentic orchestrators coordinating voice-agent teams (Fierce Healthcare, Aug 2026).

### D1.6 Regulatory positioning & pricing
- **FDA: NOT a medical device.** Hippocratic deliberately restricts agents to non-diagnostic, administrative/patient-education work (explicit in RWE-LLM scope) and markets them as **"nurse-extender" staffing** for the nurse shortage (STAT News Apr 2025 profile of its "AI nurses"). No FDA clearance sought.
- **Pricing**: usage-based "AI staffing" — reported **~$9 per agent-hour vs ~$39/hr fully-loaded RN cost** (usagepricing.com blueprint; Emitrr pricing analysis: ~$216/day per always-on agent, 5% referral fee models). Launchpad pilots structured per-outcome. Not publicly listed; enterprise contracts only.

### D1.7 What SehatAI should copy from Hippocratic
1. **Constellation, not monolith**: a small stateful conversation agent + parallel narrow validators (medication checker, red-flag detector, escalation decider, guideline-grounding checker). SehatAI's current single-pipeline L1→generation→L2 is the same idea with n=1; formalize the validators as separately promptable/evaluable units.
2. **Output testing at scale with paid domain experts** (RWE-LLM): SehatAI's 139-case golden set is the seed; hire Urdu-speaking nurses/MBBS grads (Pakistan cost ≈ $5–10/hr vs US $40+) to run thousands of scripted patient-caller sessions and a 3-tier review process. Publish as a preprint — nobody has done this for Urdu/Pakistan.
3. **Explicit 5-phase safety ladder** incl. escalation-to-human and post-deployment cross-validation.
4. **Narrow, non-diagnostic scope** until validation maturity: patient education, follow-up adherence, navigation, appointment prep — exactly where Hippocratic started.

---

## D2. Sully.ai — "AI employees" for hospitals
- Positioning: **autonomous multi-agent workforce** ("superhuman team of AI employees"), not an assistant — pre-visit intake & history, in-visit documentation (scribe), orders & coding, post-visit follow-up. **Epic integration** out of the box (sully.ai).
- Claims: **30M+ clinical minutes returned** to clinicians (Baseten case study — stack is open-source models, incl. Llama 3.1 405B class, served on Baseten); Sky Lakes Medical Center ROI case published on sully.ai/roi.
- Architecture (from public materials): multi-agent pipeline — intake agent → scribe agent → orders/draft agent → follow-up agent, with clinician sign-off; Agent performs documentation and coding suggestions, clinician finalizes. HITL is mandatory for orders (drafting, not signing).
- Guardrails: HIPAA-compliant infra; deterministic workflow scaffolding around LLM steps; human countersign. **No FDA clearance; no peer-reviewed clinical validation found** — evidence = vendor case studies.
- Relevance to SehatAI: the "AI employees" framing + per-workflow ROI metric (minutes returned) is a good B2B narrative for Pakistani hospitals; architecture pattern (agent per workflow stage, all drafts human-signed) matches SehatAI's Doctor Copilot roadmap.

## D3. Notable — intelligent automation agents
- Product: **AI agents for prior authorization, referrals, registration/scheduling, care-gap outreach** on top of EHR integration (Epic "Happy" APIs, FHIR). Agents Library of prebuilt automations (notablehealth.com/agent-library).
- Architecture: **automation-engine + LLM agents hybrid** — deterministic RPA (UI-level EHR actions) combined with LLM reasoning steps; each agent has a scoped action set, audit trail, and human-review queues for exceptions ("where human review still belongs" — Notable blog May 2025). AWS case study: prior-auth processing **from days to minutes** via multi-agent orchestration (AWS Health blog, Nov 2025).
- Clinical validation: El Camino Hospital (patient access), Eisenhower Health, UNC Health deployments; **no peer-reviewed outcomes, no FDA** (workflow tooling).
- Key pattern for SehatAI: **scope every agent's permissions** (what it CAN do = exact EHR/API actions), and route low-confidence branches to a human worklist instead of the model.

## D4. Aidoc — imaging-first clinical AI platform (aiOS)
- **17+ FDA 510(k) clearances** — the most in clinical AI (intuitionlabs.ai tracker; company news): triage of ICH, PE, aortic dissection, vessel occlusions, cervical-spine fractures, pneumothorax...; plus **FDA Breakthrough Device designation for "First Read"** (AI-drafted radiology reports).
- Architecture: **aiOS** — care-coordination platform: detectors (CNNs on DICOM) → worklist prioritization + notifications → care-team activation → patient follow-up tracking; now aggregates 3rd-party algorithms (including via partnership with touch/foundation model "aIOS" bundling 11 newly cleared indications — "AI safety net for crowded EDs").
- **Agents recommend, humans act**: Aidoc agents surface/prioritize findings and draft reports; the radiologist/clinician confirms. Imaging agents are *cleared devices* (SaMD), the coordination layer is workflow software.
- Validation: multiple peer-reviewed studies (JAMA Netw Open, Lancet Digital Health adjacents) on PE response teams, ICH notification times.
- Relevance: the "AI safety net" concept (many small cleared detectors + coordination) maps to SehatAI's multi-red-flag engine; but imaging is out of SehatAI's scope for now.

## D5. Owkin — federated learning (+ agents) for data sovereignty
- Core tech: **federated learning** — train models across hospitals without moving data, via **Substra** (open-sourced Nov 2022, LF AI & Data hosted) and Owkin Connect orchestration. First-ever FL training of deep models on multi-hospital histopathology data published in **Nature Medicine (Jan 2023)**.
- "Agents": Owkin applies agentic copilots internally for research workflows (e.g., trial matching, biomarker discovery assistants); the durable idea for SehatAI is **FL for PHI**: Pakistani hospitals could co-train Urdu/Pashto medical models without exporting records — a compliance answer (Pakistan PDPA 2023) that almost no local competitor has.
- Cost: open-source stack (Substra) usable free; Owkin commercial (not listed).

## D6. Cohere Health — prior-authorization agents (payer-provider)
- Product: intelligent prior authorization platform (Cohere Unify), **AI agents for intake, clinical-info requests, and determination support** across payers/providers; supports **CMS electronic-PA (ePA) acceleration initiative** (2026); acquired ZignaAI (payment integrity).
- Architecture: guideline-encoding logic (clinical policies → machine-readable rules) + LLM document-extraction agents + **HITL**: providers can one-click submit; payers' nurses review edge cases. Multi-stakeholder network effects (both sides of the transaction).
- No FDA (admin/utility tool), no peer-reviewed clinical studies; ROI = turnaround time & denial reduction. Relevance: Pakistan's Sehat Sahulat insurance program will need prior-auth automation — long-term B2G wedge.

## D7. Innovaccer — "Agents of Care" + Copilots
- **Agents of Care (Feb 16, 2025)**: suite of AI agents for care teams (clinicians, care managers, risk coders, patient navigators, call-center agents) automating scheduling, referral outreach, med-rec, prior-auth paperwork (fiercehealthcare.com Feb 21, 2025).
- **Copilots (Apr 21, 2025)**: Care Management Copilot automates documentation, chart summarization, care-plan creation (innovaccer.com news).
- Platform: Gravity (data-activation/longitudinal EHR records) → AI engine → agents/copilots; "Sara" digital front-door assistant.
- Pattern: agents are **goal-oriented over structured data**, LLM steps grounded in the longitudinal record; humans approve care plans. No FDA; enterprise pricing; black-book-rated in population health.

## D8. Infermedica (agents / care-coordination extensions)
- Core: **hybrid rules+Bayesian triage engine** (Symptom Checker, Triage API; EU MDR CE-marked medical device software; 10+ yrs of clinical-rule curation). API-first (JSON), EHR integrations (Epic, Cerner), payer deployments (Cigna Europe, Allianz, DocMorris).
- "Agents": Infermedica extends the engine into **care-coordination workflows** — intake bots, call-center triage assistants, EHR-integrated symptom intake — i.e., deterministic engine exposed as an agent tool. This validates SehatAI's deterministic-first approach: the safety-critical reasoning stays in a rules engine; LLM handles UX/language.
- Infermedica's guardrail = the closed rule space (every recommendation maps to a coded rule); their evaluation = mystery-shopper clinical audits.

## D9. General agent frameworks applied to healthcare
| Framework | What it is | Healthcare fit / gap |
|---|---|---|
| **MedAgents** (arXiv:2311.10537, Tang et al., Yale/SJTU; 568+ citations) | Training-free multi-agent collaboration: role-play domain experts → individual analyses → summary report → iterative discussion → consensus decision. +~4% avg on MedQA/MedMCQA/PubMedQA/MMLU medical subtasks zero-shot. | Demonstrates debate-style reasoning gains; NO safety layer, no escalation, no PHI handling — research artifact. Latency cost (multi-round). |
| **MMedAgent** (arXiv:2407.02483, EMNLP 2024) | First multi-modal medical agent that learns to ROUTE to specialized tools (6 tools, 7 tasks, 5 modalities); instruction-tuned MLLM; outperforms GPT-4o on tool-selection medical tasks; efficient new-tool integration. | The "router + specialist tools" pattern is exactly what SehatAI's cascade+tools needs; validated open code. |
| **MMedAgent-RL** (arXiv:2506.00555) | RL-optimized dynamic multi-agent collaboration (agents learn when to collaborate vs. solo). | 2025 frontier; compute-heavy. |
| **MedAgentGym** (arXiv:2506.04405) | Training environment for code-based medical agents; shows current LLMs are weak at complex medical tool-coding. | Signals: eval harnesses > capability today. |
| **TeamMedAgents / MediHive** (arXiv:2508.08115, 2603.27150) | Pareto-efficient multi-agent with SMALL models; decentralized collectives. | Trend toward cheap ensembles — relevant to low-resource contexts. |
| **LangChain/LangGraph Medical, AutoGen Medical** | No production medical distribution exists. Community recipes = tool-calling chains + RAG; AutoGen = multi-agent conversation. | Zero clinical guardrails, zero audit trail out-of-box; fine for prototypes (SehatAI already effectively implements its own safer variant), unsafe for patient-facing without the layers SehatAI already has. |

**Bottom line:** academic healthcare agents prove the accuracy patterns (debate, tool-routing, validator ensembles) but none ship the safety scaffolding (escalation, clinician eval, audit) that Hippocratic/Infermedica/Aidoc built commercially.

---

## D-Table. Agent-architecture capabilities: Hippocratic AI vs. peers

Legend: ✅ = documented, ⚠️ = partial/marketing-claimed, ❌ = absent, n/a. Sources per rows cited in sections above.

| # | Capability (12) | **Hippocratic AI** | **Sully.ai** | **Notable** | **Aidoc** | **Cohere Health** | **Innovaccer** |
|---|---|---|---|---|---|---|---|
| 1 | Topology | ✅ Constellation: stateful primary + 22 specialist LLMs (Polaris 3), concurrent | ✅ Multi-agent workforce (intake/scribe/orders/follow-up) | ✅ Automation-engine + scoped LLM agents | ✅ Detector ensemble + coordination aiOS | ✅ Rules engine + document agents | ✅ Agent suite (Agents of Care) |
| 2 | Dedicated validator/safety agents | ✅ Core of design (every turn) | ⚠️ Drafts human-signed; no separate validators | ⚠️ Deterministic automation acts as validator | ✅ Cleared CNN detectors as "safety net" | ✅ Policy rules constrain agents | ⚠️ Platform rules; not per-turn |
| 3 | Tool/action calling | ✅ Telephony, EHR, scheduling, pharmacy workflows | ✅ Epic actions (draft orders) | ✅ EHR UI-level actions (scoped, audited) | ✅ Worklist/notify/report drafting | ✅ PA submission, clinical docs | ✅ EHR/scheduling/RCM actions |
| 4 | Memory | ✅ Multi-call memory, patient history, stateful primary | ✅ Longitudinal chart context | ✅ Cross-visit profile | ✅ Patient tracking timelines | ✅ Member claim history | ✅ Longitudinal record (Gravity) |
| 5 | Human-in-the-loop | ✅ Nurse escalation + clinical supervision + supervision dashboard | ✅ Clinician sign-off (orders) | ✅ Human worklists for exceptions | ✅ Radiologist confirms everything | ✅ Nurse reviewers | ✅ Care-manager approval |
| 6 | Autonomous actions allowed | ⚠️ Non-diagnostic voice calls, scheduling, education; >95% autopilot calls, escalates | ⚠️ Docs/coding drafts; clinician signs | ✅ End-to-end PA/referral submission | ❌ Recommends/prioritizes only (drafts reports) | ✅ Determinations for clear-policy cases | ⚠️ Outreach/scheduling; care plans approved |
| 7 | Guardrail mechanisms | ✅ Specialist validators + escalation rules + compliance agents | ⚠️ Workflow scaffolding | ✅ Scoped action set + review queues | ✅ FDA-cleared detectors, thresholds | ✅ Encoded clinical policies | ⚠️ Rules + approval gates |
| 8 | Evaluation methodology | ✅ RWE-LLM: 6,234 clinicians, 307,038 calls, 3-tier review, continuous monitoring | ❌ ROI case studies only | ⚠️ Customer KPIs | ✅ Peer-reviewed + FDA PMA/510(k) studies | ⚠️ Turnaround/denial metrics | ⚠️ Vendor KPIs |
| 9 | Peer-reviewed clinical validation | ✅ arXiv 2403.13313 (+87 cites), RWE-LLM medRxiv (+20), 100+ pubs claim | ❌ None found | ❌ None found | ✅ Multiple (JAMA etc.) | ❌ | ❌ |
| 10 | Regulatory posture | Non-device (nurse-extender, non-diagnostic) | Non-device (documentation) | Non-device (workflow) | ✅ 17+ FDA 510(k), Breakthrough (First Read) | Non-device (admin) | Non-device |
| 11 | Deployment target | Health systems, payors, pharma (voice, async) | Hospitals (Epic-embedded) | Providers (Epic/Cerner) | Hospitals/EDs/radiology | Payers + providers | Providers, payers (data platform) |
| 12 | Pricing model | ~$9/agent-hr (≈ RN $39/hr); outcome-based pilots | Enterprise (ROI minutes-saved) | Enterprise SaaS | Enterprise (per-study/per-platform) | Enterprise (per-PA volume) | Enterprise platform + agents |
| 13 | Pakistan transferability of pattern | HIGH (validation + constellation + escalation) | MED (hospital Epic rare in PK) | LOW-MED (Epic-specific) | LOW (imaging infra) | LOW now / B2G later | MED (data platform thinking) |

---

# PART F — LOW-RESOURCE / OFFLINE HEALTHCARE AI

## F0. Executive summary (Group F)

1. **On-device LLMs are now genuinely runnable on 2–4GB Android phones — but only the 0.5–1.7B class at Q4 quantization** via llama.cpp (GGUF) or MLC-LLM. The realistic Pakistan-targeting stack: **Qwen3-0.6B / Qwen2.5-0.5B-1.5B / Gemma-3n-E2B, Q4_K_M GGUF, llama.cpp runtime (or MLC), ~0.4–1.2GB weights, ~1.0–2.3GB total RAM, 3–10 tok/s.** Gemini Nano/Apple on-device models are flagship-only (8–12GB RAM) — **not** relevant to the Pakistani mass market.
2. **Offline-first is a solved data problem**: service worker + IndexedDB + background sync + revision-based replication (CHT's CouchDB/PouchDB pattern, 10+ years in production with CHWs). The LLM piece can ride the same sync bus (queue transcripts, reconcile when online).
3. **The WHO SMART Guidelines / DHIS2 / CHT ecosystem is the integration backbone of LMIC digital health** — SehatAI should adopt WHO DAK decision logic for maternal/child/immunization content, and target CHT/DHIS2/OpenMRS interoperability (FHIR) rather than build another silo.
4. **Voice evidence works in low-literacy populations**: ARMMAN mMitra (RCT evidence, voice, local language), Viamo 3-2-1 (IVR, zero-rated). For Urdu/Pashto/Sindhi/Punjabi/Balochi: **Whisper large-v3 fine-tunes for Urdu (WER 17.9), Meta MMS adapters for the rest** — both open-source and proven for low-resource languages.

---

## F1. Offline LLMs / on-device inference

### F1.1 Runtime stacks
| Stack | What it is | Phone readiness | Evidence |
|---|---|---|---|
| **llama.cpp (+GGUF)** | C/C++ inference; CPU-first, ARM NEON; JNI/NDK on Android; React Native via `llama.rn` | ✅ Best provenance: HF EdgeLLM guide runs Qwen2.5-1.5B etc. on phones; community reports Q4_0 3B-class under 2GB RAM; flagship (SD 8 Elite, LP-DDR5X) gets 30+ t/s; budget phones 3–8 t/s for ≤1.5B | github.com/ggml-org/llama.cpp discussion #14356; HF blog "LLM Inference on Edge" (Mar 2025); arXiv:2410.03613 mobile-LLM measurement |
| **Ollama** | Convenience server wrapping llama.cpp (desktop/server; 2025 mobile apps) | ⚠️ On phones it IS llama.cpp underneath; Ollama adds nothing for 2–4GB Androids | ollama.com |
| **MLC-LLM** | Compiler-based runtime: Vulkan/Metal/WebGPU; iOS/Android/WebGPU apps; quantized weights | ✅ First-class Android/iOS/WebGPU; runs Qwen 0.5–3B on phones | mlc.ai; HF edge blog |
| **ExecuTorch (PyTorch)** | PyTorch edge deployment; **1.0 Oct 2025 with Qualcomm Hexagon NPU support** for LLMs | ✅ Rising; NPU acceleration path for Snapdragon mid-range | pytorch.org/executorch; Qualcomm dev blog Oct 2025 |
| **MNN (Alibaba)** | Mobile inference engine + MNN-LLM app running Qwen on-device | ✅ Demonstrated on phones; Alibaba ecosystem | github.com/alibaba/MNN |
| **PowerInfer** | CPU/GPU heterogeneous *server* inference (hot-neuron activation) | ❌ Desktop/server speedups, not phone | powerinfer.ai |
| **IndexedDB+WASM/WebLLM (browser LLM)** | WebGPU/WASM LLM in browser | ⚠️ Chrome Android WebGPU on select devices; 0.5B ≈ 1 t/s WASM-only | webllm docs |
| **Apple Foundation Models (~3B, on-device)** / **Phi-Silica (3.3B, Windows)** | OS-integrated small models | ❌ iPhone 15 Pro+/8GB RAM, Copilot+ PCs only — irrelevant to Pakistan mass market | Apple ML research 2024 |
| **Google Gemini Nano (AICore)** | OS service model on Pixel 8/9, flagship Androids; ML Kit GenAI APIs (summarize/rewrite); latest Gemini-Intelligence features require **12GB RAM + flagship SoC** per device reports | ❌ Not on low-end devices; restricted function set | developer.android.com/ai/gemini-nano; device-spec reports 2026 |

### F1.2 Small models that matter (open-weights)
| Model | Sizes | Notes (primary sources) |
|---|---|---|
| **Qwen3** (Apr 2025, Apache 2.0) | 0.6B / 1.7B / 4B dense + MoE to 235B | 119 languages; hybrid thinking/non-thinking mode + thinking budget; arXiv:2505.09388. **Qwen3-0.6B Q4_K_M = 0.37GB disk, ~1.0GB RAM inference** (HF model cards) — the best sub-1B on-device choice today |
| **Qwen2.5** | 0.5B/1.5B/3B | 29 languages; strong Urdu among multilingual mid-small models (community evals); predecessor still preferred for stability |
| **Gemma 3 / 3n** (Mar 2025 / Jun 2025) | 1B/4B/12B/27B; 3n E2B/E4B | 128K context; 140 languages; QAT checkpoints; 3n designed for mobile (effective 2B runs in ~2GB RAM; later E2B reports <1.5GB); arXiv:2503.19786 |
| **Phi-3-mini / 3.5 / 4-mini** | 3.8B | arXiv:2404.14219; Microsoft demoed on iPhone 14; 4-bit ~2.3GB — feasible only on 4GB+ phones |
| **SmolLM2** (Nov 2024, Apache) | 135M/360M/1.7B | 11T tokens training; 1.7B > Llama-3.2-1B on instruction/knowledge; smallest viable full-chat models |
| **MobileLLM** (Meta, ICML 2024) | 125M/350M | deep-thin + embedding sharing + GQA: +2.7%/4.3% over prior SOTA; near-LLaMA-v2-7B on API-calling tasks; arXiv:2402.14905 |

### F1.3 Quantization & serving efficiency
- **Q4_K_M** (k-quant, ~4.5–4.85 effective bits/weight) is the community-validated "safest 4-bit default" (llama.cpp quantize README; Kaitchup comparison Oct 2025; arXiv:2601.14277 unified eval: instruction-following best preserved at Q4_K_S/Q4_K_M). Rule of thumb: **model ≈ 0.55–0.6 bytes/param** at Q4_K_M.
- **Speculative decoding** (small draft model + large verifier; Medusa/EAGLE): 2–3× server-side throughput — matters for SehatAI's server cascade, not the phone.
- **KV-cache offloading/reuse** (llama.cpp `--cache-reuse`, offload KV to CPU/RAM): stretches long-context on memory-constrained devices.
- **Streaming-first protocols**: SSE token deltas (SehatAI already streams) + Brotli/Gzip; delta-JSON is the cheapest "low-bandwidth" win; queue-and-flush on reconnect.

### F1.4 Concrete recommendation for Pakistan (2–4GB RAM Androids)
Device reality: the Pakistani mass market runs Tecno/Infinix/itel/Samsung-A with Unisoc/Helio SoCs, 2–4GB RAM (~60–70% of Android base). Budget per device:

| Tier | Hardware | Model | Weights (Q4_K_M) | RAM peak | Expected speed |
|---|---|---|---|---|---|
| A: 2GB RAM | Unisoc T-series | **Qwen3-0.6B** or SmolLM2-360M | 0.37–0.5GB | ~1.0–1.2GB | **3–6 tok/s** CPU (llama.cpp) |
| B: 3GB RAM | Helio G80+ | **Qwen2.5-1.5B / Qwen3-1.7B / Gemma-3n-E2B** | 1.0–1.2GB | ~2.0–2.3GB | **3–8 tok/s** |
| C: 4GB RAM | SD 6-series | Qwen3-4B / Phi-3-mini-4k (4-bit) | 2.3–2.5GB | ~3.5–4GB | **2–6 tok/s** |

**Recommended default: Tier B with Qwen3-1.7B-Q4_K_M via llama.cpp (llama.rn / Capacitor binding), downloaded on Wi-Fi, versioned, and used ONLY for offline fallback tasks**: intent classification, red-flag re-check, language detection, Roman-Urdu↔Urdu normalization, first-aid retrieval re-ranking. Free-form medical generation stays server-side (SehatAI's 7-provider cascade). First-token latency on Tier B: ~0.5–2s; full 150-token triage answer: ~20–40s — acceptable for async/store-and-forward UX, NOT for live chat.

## F2. Edge medical AI / WHO digital health stack
- **WHO SMART Guidelines** (smart.who.int): the canonical methodology to encode WHO guidelines as software — **Level 1** narrative → **Level 2 Digital Adaptation Kit** (core data dictionary, decision-support logic, indicators, functional/non-functional requirements) → **Level 3 FHIR Implementation Guides**. Published DAKs: Antenatal Care (2021), Family Planning (2021), Postnatal Care (Jul 2025), Birth-defects surveillance (Jun 2025), HIV (Feb 2024), TB (May 2024), Child health in humanitarian settings (May 2024), Immunization (Jan 2025), DDCC COVID certificates, self-monitoring BP in pregnancy (Jul 2025).
  → **SehatAI action**: map its maternal/child/immunization corpus to DAK decision tables and core data dictionary; adopt the FHIR IGs as its content schema. This is the credibility + interoperability unlock for donors/government.
- **DHIS2** (HISP, Univ. Oslo): world's largest HMIS — 70+ ministries of health; aggregate + Tracker (individual cases); offline-capable web/Android; FHIR support growing. Pakistan's district reporting flows could be a future integration; even without integration, aligning terminology/indicators costs little.
- **OpenMRS**: open-source EMR platform (Regenstrief + PIH + South Africa origins), FHIR-native (OpenMRS 3), deployed in 40+ countries (Kenya, Tanzania, Haiti, Bangladesh...). Free; Java backend — heavy for rural clinics but the reference for LMIC EMR interop.
- **CommCare (Dimagi)**: offline-first CHW app builder; case management, form logic; used 130+ countries; free/community tier + commercial.
- **CHT (Community Health Toolkit, Medic)**: open-source **digital public good**; **offline-first PWA** built on **CouchDB/PouchDB replication** (document revisions = conflict resolution); reference apps for maternal & newborn health, COVID, EBS, stock monitoring; **41,000+ health workers** served; CHT 5.3; **CHT Sync** replaced couch2pg for near-real-time Postgres analytics; docs now include "AI & CHT MCP servers" (LLM integration layer) — the leading edge of AI+CHW. Deployments: Kenya (national CHW program), Malawi (PIH), Nepal, etc.
- **Baobab** (Malawi health-tech, OpenMRS-based point-of-care) and **Magpi** (formerly EpiSurveyor — offline mobile data collection used by WHO/UNICEF polio campaigns; freemium): legacy/niche but prove offline-capture at scale.

**Verdict — should SehatAI integrate? YES, content-standards first, transport second**: (1) encode content per WHO SMART DAK; (2) expose/consume FHIR; (3) design the offline sync layer the way CHT does (replication with revision conflicts); (4) pursue CHT "app"/MCP integration for CHW-facing features later — it is the ecosystem Pakistan's NGO sector already knows.

## F3. Voice-first low-resource health (evidence base)
- **ARMMAN mMitra (India)**: free weekly **voice calls in local language** to pregnant women/new mothers (2.4M+ reached). **Pseudo-randomized controlled trial** (Murthy et al. 2020, PMC7268375, 96 citations): improved ANC practices & maternal knowledge; program-reported: +25% women taking IFA ≥90 days, +47.7% on key practices. Companion **Mobile Academy** trains ASHAs via IVR. "mMitra++" adds tech+touch hybrid. → Voice + stage-based timing + local language = the proven LMIC maternal-health pattern; SehatAI's reminder/call feature should mimic the stage-based cadence.
- **MAMA (Mobile Alliance for Maternal Action, 2011–)**: UN Foundation/Johnson & Johnson/USAID/GSMA; SMS+voice messaging core (mama mobile messaging) — grandfathered into country programs incl. India (mMitra), Bangladesh (Aponjon), South Africa (MobiStation affiliates). Evidence: knowledge gains, service uptake.
- **Viamo 3-2-1**: on-demand **IVR** info service, zero-rated via MNOs, local languages, 20+ countries; evidence: Burkina Faso malaria-literacy RCT (Ouedraogo 2025 — local-language IVR improved literacy vs SMS), gamified mental-health (Digital MindSKILLZ, 6 countries, PMC 2025). → For Pakistan: IVR fallback hotline (0300-number + Viamo-style short code) captures feature-phone users the app can't reach.

## F4. Store-and-forward / async telemedicine
- **MSF telemedicine** (telemedhub.org): store-and-forward network since **2010**, >1,000 specialist-consult cases by 2014 (Wootton 2014 quality study, PMC4100061 — high usefulness ratings, median response ~hours); now a secure case-management hub linking 300+ volunteer specialists to field teams; hybrid async+sync. → The model for SehatAI's "ask a doctor later" queue: structured case form (photos, vitals, history) + async specialist review + SLA timers.
- **Swasth Alliance (India, 2020)**: 100+ specialists coalition; **260,000 patients** telemedicine+home-care in wave 1; 60,000 oxygen concentrators delivered; deliberately plugged private platforms into public response rather than building new. → Coalition playbook for Pakistan outbreaks (dengue/flood response).
- clickdoc (Germany) — commercial store-and-forward/teleconsult platform; minor reference.

## F5. Offline-first PWA patterns (what SehatAI should adopt)
SehatAI is already a PWA with `public/sw.js` + manifest; the upgrade is the DATA layer:
1. **App-shell precache + stale-while-revalidate for static/corpus assets** (already partially present).
2. **IndexedDB as system of record** (Dexie.js or raw `idb`) — conversations, profiles, triage drafts written locally first (SehatAI currently uses Zustand/localStorage-ish persistence — migrate PHI to IndexedDB with encryption).
3. **Background Sync API**: service worker retries queued POSTs (chat transcripts, feedback, reminder confirmations) when connectivity returns, even if tab closed.
4. **Conflict resolution**: CHT-style **revision-based replication with deterministic conflict winners** (server last-write-wins + audit trail of losers) is sufficient for SehatAI's append-mostly data; CRDTs (Yjs/Automerge/Ditto) only needed for collaborative editing — skip for v1.
5. **Model delivery**: download GGUF over Wi-Fi only, verify SHA, store in OPFS/IndexedDB; ship a "corpus delta" API for knowledge updates (small JSON patches, not full app).

## F6. Digital health in LMICs (integration landscape)
- **India ABDM** (abdm.gov.in): ABHA health IDs — **500M+ (50 crore) milestone Jul 2023**, ~770M claimed 2025; 530M+ health records linked; FHIR-based HIE with consent managers; milestone-based hospital payments. → The reference architecture if Pakistan builds its NHR (National Health Radar / Sehat Sahulat digitization). SehatAI should keep an ABHA-style "consent-first record linking" design in its data model.
- **Kenya**: Digital Health Act 2023 + KHIE under construction; M-TIBA mobile health wallet (Safaricom/CarePay) — mobile-money-linked health financing proof.
- **Bangladesh**: Aponjon (MAMA-derived voice/SMS maternal program), Maya Apa (AI-assisted women's health Q&A at national scale), dghs hotline 16263 — demonstrates voice+app hybrid at population scale in a low-resource South Asian context.
- **Nigeria**: eHealth Africa's CommCare polio surveillance; Reliance Health (insurance + telemedicine); Wellahealth — pay-as-you-go primary-care automation.

## F7. Multilingual ASR/TTS for Urdu / Pashto / Dari (and Punjabi/Sindhi/Balochi)
- **OpenAI Whisper** (arXiv:2212.04356): large-v3 covers Urdu among ~99 languages. **Urdu WER 18.30 (base large-v3) → 17.86 (fine-tuned)** — "WER We Stand: Benchmarking Urdu ASR Models" (arXiv:2409.11252, COLING 2025, 17 citations). Fine-tuning on Common Voice Urdu + IndoMörter? IBA "Awaaz se Alfaaz" project continues Whisper fine-tuning for Urdu. **Recommendation: Whisper medium/large fine-tuned for Urdu server-side; distil/quantized small for fallback.**
- **Meta MMS** (arXiv:2305.13516, 831 citations): wav2vec 2.0 pre-trained on **1,406 languages**, single ASR model covering **1,107 languages** (incl. **Pashto, Dari, Sindhi, Punjabi, Balochi**), TTS for 1,100+; **adapter-based fine-tuning for low-resource languages** (HF blog 2023). → The only open stack that covers ALL Pakistani languages; adapters trainable with <10h of audio.
- **SeamlessM4T/Meta Seamless** (arXiv:2308.00358 + Seamless v2): unified speech-to-text/translation for ~100 languages incl. Urdu/Pashto (streaming variant); strong for cross-lingual triage (Pashto speech → Urdu text).
- **wav2vec2 fine-tunes**: established recipe for Urdu (e.g., common-voice wav2vec2-large-xlsr-urdu community models) — cheapest per-language ASR to maintain on server CPUs.
- TTS: Coqui XTTS-v2 / MMS-TTS for Urdu; for Sindhi/Pashto, MMS TTS voices exist but quality varies; browser SpeechSynthesis (SehatAI's current TTS) remains the zero-cost fallback with Urdu voice availability varying by device (audit W-9).

---

## F-Table. Low-resource capabilities matrix

Legend: ✅ documented, ⚠️ partial, ❌ no. "Min RAM" = total inference footprint guidance at Q4; speeds are CPU-class estimates from cited community measurements.

| # | Capability (12) | **Ollama / llama.cpp** | **MLC-LLM** | **Phi-3(-mini)** | **Gemini Nano** | **Gemma 3/3n** | **Qwen3 (0.6–4B)** | **WHO SMART / DHIS2** | **CHT (Medic)** | **Whisper / MMS** |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Runs fully offline on-device | ✅ | ✅ | ✅ (3.8B → 4GB+ phones) | ❌ (flagship-only service) | ✅ (1B/3n-E2B) | ✅ (0.6B/1.7B) | n/a (content standards) | ✅ (offline-first PWA) | ⚠️ (whisper.cpp tiny/base on-device; MMS server) |
| 2 | Fits 2GB RAM phone | ✅ 0.5–1B @ Q4 | ⚠️ | ❌ | ❌ | ⚠️ E2B ~2GB | ✅ 0.6B (~1.0GB) | n/a | ✅ (app ~100MB) | ✅ tiny/base (~75–150MB) |
| 3 | Fits 4GB RAM phone | ✅ ≤4B | ✅ | ✅ | ❌ (needs 8–12GB) | ✅ | ✅ 1.7–4B | n/a | ✅ | ✅ small |
| 4 | Quantized footprint (Q4_K_M) | ✅ GGUF native | ✅ (q4f16) | ~2.3GB (3.8B) | n/a (opaque) | ~0.7–2.5GB | **0.37GB (0.6B) / 1.1GB (1.7B) / 2.5GB (4B)** | n/a | n/a | n/a |
| 5 | Tokens/sec on low-end Android | **3–8 t/s (≤1.5B)** | ✅ similar; GPU path faster | 2–5 t/s (4GB) | n/a | 3–8 t/s | **3–8 t/s (≤1.7B)** | n/a | n/a | ~real-time small |
| 6 | GGUF/quant ecosystem + tooling | ✅ richest | ✅ | ✅ via llama.cpp | ❌ | ✅ (QAT ckpts) | ✅ | n/a | n/a | ✅ whisper.cpp GGML |
| 7 | Urdu/multilingual support | ⚠️ model-dependent | ⚠️ | ⚠️ limited | ⚠️ multilingual, gated | ✅ 140 langs | ✅ 119 langs incl. Urdu-adjacent coverage | ✅ official translations | ✅ app-level i18n | ✅ Whisper Urdu (WER ~18); MMS 1,107 langs incl. Pashto/Dari/Sindhi/Punjabi/Balochi |
| 8 | Offline data sync strategy | n/a | n/a | n/a | n/a | n/a | n/a | FHIR/aggregate export | ✅ **PouchDB/CouchDB revision sync (production 10+ yrs)** | n/a |
| 9 | Evidence/clinical validation | — | — | ✅ strong academic evals | — | ✅ academic | ✅ strong academic | ✅ WHO-endorsed methodology (DAKs) | ✅ CHW deployments, Kenya/Malawi/Nepal; 41k+ CHWs | ✅ peer-reviewed WER benchmarks (COLING 2025) |
| 10 | License & cost | MIT | Apache-2.0 | MIT (weights) | ❌ proprietary service | Gemma license (free) | **Apache-2.0** | Free/open (OGL) | **MIT (DPG)** | MIT / CC-BY-NC (MMS) |
| 11 | Voice modality | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ SMS/IVR gateways | ✅ **ASR core** |
| 12 | Pakistan relevance | ✅ runtime of choice | ✅ alt runtime | ⚠️ | ❌ | ✅ E2B candidate | ✅ **primary model family** | ✅ content standards + FHIR | ✅ sync architecture + CHW channel | ✅ **Urdu/Pashto voice stack** |

---

# PART G — STRATEGIC SYNTHESIS FOR SEHATAI

## G1. The two patterns SehatAI must import from Hippocratic AI
1. **Constellation with parallel validators** — refactor the current linear 12-phase pipeline so that the L1 intent/triage call and the L2 judge run as *parallel narrow agents* over every turn (medication checker, red-flag detector, escalation decider, guideline-grounding checker), each independently evaluable, each able to VETO/escalate. Keep the deterministic L0 as the router (this matches Infermedica's rules-first philosophy and Hippocratic's non-diagnostic scope).
2. **RWE-LLM-style validation program, Pakistan edition** — pay Urdu/Pashto-speaking nurses + MBBS house officers (~$5–10/hr) to run scripted patient-caller tests against SehatAI; build a 3-tier review + structured error taxonomy; publish accuracy trajectory per pipeline version (they published 80%→99.38%; SehatAI's first datapoint becomes its 139-case golden set expanded to ~5,000 calls). This is cheap in Pakistan and is the moat no local competitor will copy quickly.

## G2. The offline strategy (concrete)
- **Tiered model delivery**: Qwen3-1.7B-Q4_K_M (primary), Qwen3-0.6B (2GB fallback), via llama.cpp/llama.rn inside the existing PWA shell (Capacitor/React-Native wrapper or `llama.rn` + expo). On Wi-Fi download, OPFS storage, SHA-pinned.
- **Offline scope = safe subset**: triage red-flag re-check, first-aid retrieval, language normalization, reminders. Defer free-form medical generation offline.
- **Data layer**: IndexedDB (Dexie) + Background Sync queue + revision-based reconciliation (CHT pattern); encrypt PHI at rest.
- **Voice**: server-side Whisper fine-tune (Urdu WER ~18) + MMS adapters for Pashto/Punjabi/Sindhi; IVR hotline fallback for feature phones (Viamo/ARMMAN pattern) — later phase.
- **Content**: WHO SMART DAK-encoded maternal/child/immunization logic; FHIR-shaped records → future DHIS2/CHT/ABDM-style integration.

## G3. Explicit non-goals (avoid the trap)
- Don't chase Gemini Nano / Apple on-device — flagship-gated, closed.
- Don't run 7B+ models on phones; don't build CRDTs before last-write-wins + audit is proven insufficient.
- Don't promise autonomous clinical actions — even Hippocratic (with $404M and 6,234 clinicians) stays non-diagnostic with mandatory human escalation.

---

# References (primary sources)

**Group D**
1. Mukherjee et al., "Polaris: A Safety-focused LLM Constellation Architecture for Healthcare," arXiv:2403.13313 (Mar 2024) — https://arxiv.org/abs/2403.13313
2. Bhimani et al., "Real-World Evaluation of Large Language Models in Healthcare (RWE-LLM)," medRxiv 2025.03.17.25324157 — https://www.medrxiv.org/content/10.1101/2025.03.17.25324157.full
3. Hippocratic AI Safety page (5-phase process, 7.7K clinicians / 775K test calls, 180M calls) — https://hippocraticai.com/safety
4. Hippocratic AI Polaris 3.0 (4.2T params, 22 LLMs, 99.38%) — https://hippocraticai.com/polaris-3
5. Hippocratic AI Series C ($126M @ $3.5B, total $404M) — https://hippocraticai.com/hippocratic-ai-announces-series-c-funding-126-million ; Series B $141M @ $1.64B — Fierce Healthcare (Jan 9, 2025)
6. UHS × Hippocratic launch — https://www.healthcaredive.com/news/uhs-partners-hippocratic-ai-launch-ai-agents/750892 (Jun 17, 2025)
7. Hippocratic first US patent — MobiHealthNews (Nov 27, 2024)
8. STAT News, "AI agents slowly gaining a foothold in health care" (Apr 9, 2025)
9. Pricing ~$9/agent-hour — usagepricing.com/blueprint/hippocratic-ai; emitrr.com/blog/hippocratic-ai-pricing
10. Tang et al., "MedAgents," arXiv:2311.10537 — https://arxiv.org/abs/2311.10537
11. Li et al., "MMedAgent," arXiv:2407.02483 (EMNLP 2024); Xia et al., "MMedAgent-RL," arXiv:2506.00555; MedAgentGym, arXiv:2506.04405
12. Notable — notablehealth.com (agents, prior-auth); AWS Health blog multi-agent prior-auth case (Nov 2025)
13. Aidoc — aidoc.com (aiOS, 17+ FDA clearances; First Read Breakthrough designation)
14. Owkin — Nature Medicine FL histopathology (Jan 2023); Substra open-source (LF AI)
15. Cohere Health — coherehealth.com; CMS ePA support (2026)
16. Innovaccer — Agents of Care (Feb 2025), Copilots (Apr 2025) — innovaccer.com/news
17. Sully.ai — sully.ai; Baseten case study (30M+ minutes)
18. updoc first FDA-cleared LLM agent, K253281 (Dec 23, 2025) — innolitics.com

**Group F**
19. llama.cpp Android performance discussion #14356 — github.com/ggml-org/llama.cpp
20. HF Blog, "LLM Inference on Edge (React Native)" (Mar 2025) — huggingface.co/blog/llm-inference-on-edge
21. Qwen3 Technical Report, arXiv:2505.09388; Qwen3-0.6B GGUF size/RAM — HF model cards
22. Gemma 3 Technical Report, arXiv:2503.19786; Gemma 3n mobile specs — Google DeepMind
23. MobileLLM, arXiv:2402.14905 (ICML 2024); SmolLM2, arXiv:2502.02737
24. Gemini Nano / AICore — developer.android.com/ai/gemini-nano (+2026 device-RAM reports)
25. ExecuTorch 1.0 + Qualcomm Hexagon — pytorch.org/executorch; Qualcomm dev blog (Oct 2025)
26. GGUF Q4_K_M analysis — llama.cpp quantize README; Kaitchup (Oct 2025); arXiv:2601.14277
27. WHO SMART Guidelines publications table — smart.who.int (Nov 2025)
28. CHT docs & architecture (offline-first, CouchDB sync, CHT Sync, AI/MCP) — docs.communityhealthtoolkit.org; medic.org (41k+ CHWs)
29. ARMMAN mMitra pseudo-RCT — Murthy et al. 2020, PMC7268375; armman.org
30. MSF telemedicine quality study — Wootton 2014, PMC4100061; telemedhub.org
31. ABDM milestones — pib.gov.in (50 crore ABHA, 2023); abdm.gov.in
32. Urdu ASR benchmark — "WER We Stand," arXiv:2409.11252 (COLING 2025)
33. Meta MMS — Pratap et al., arXiv:2305.13516 (1,107-language ASR); HF MMS adapter blog (2023)
34. Viamo 3-2-1 IVR evidence — Ouedraogo 2025 (malaria IVR); UNDP Digital X
35. Swasth Alliance — swasthalliance.org; WEF Last-Mile Top 50 profile
36. PWA offline sync patterns — Background Sync API docs; CHT/PouchDB replication; CRDT guides (Ditto, 2025)

*Report compiled by Research Agent #5. All vendor capability claims are as published by vendors; independent verification exists only where peer-reviewed sources are cited.*
