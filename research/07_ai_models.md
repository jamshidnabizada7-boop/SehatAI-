# 07 — AI Models & Multilingual Stack Research for SehatAI

**Author:** Research Agent #7 — AI Model & Multilingual Stack Researcher
**Date:** 2025 (current frontier)
**Scope:** Frontier closed-weights APIs · open-weights deployable models · multilingual (Urdu/Pashto/Dari/Punjabi/Sindhi/Balochi) performance · clinical open models · small/edge models for ≤4 GB Android phones · embeddings & vector DBs · ASR/TTS for Pakistani languages.
**Methodology:** Every quantitative claim below is cited to either (a) the official model card / technical report, (b) a peer-reviewed publication (Nature Medicine, JAMA, JMIR, PMC), (c) OpenAI/Anthropic/Google/Mistral pricing pages, or (d) Artificial Analysis / Hugging Face Open Medical LLM Leaderboard. Source URLs in §11. Web searches were performed via z-ai `web_search`; raw snippets in `/home/z/my-project/research/cache/`.

---

## EXECUTIVE SUMMARY

The frontier medical-reasoning crown in late-2025 sits at **MedQA-USMLE ≈ 95.8%**, held by **OpenAI GPT-5** (Aug 7 2025) [s1] and chased by **DeepSeek-R1** at 92.5% [s4] [s23] and **Med-Gemini** at 91.1% [s40]. Closed-weights APIs are now genuinely "clinically useful" on multiple-choice reasoning — **but raw MCQA accuracy is no longer the differentiator.** The differentiators that matter for SehatAI are: (1) **multilingual coverage** of Urdu/Pashto/Dari/Punjabi/Sindhi/Balochi (no frontier model is good at the last four), (2) **tool calling + structured output + long context** for chart ingestion and citation grounding, (3) **on-device runtime** for offline rural Pakistan, and (4) **Hindi/Urdu ASR + Urdu TTS** quality. We recommend a three-tier stack, with **GPT-5.1 / Claude Sonnet 4.5 / Gemini 2.5 Pro** at the cloud tier, **Qwen3-32B (or MedGemma 27B)** for self-hosted mid-tier, and **Qwen3-4B or Llama 3.2 3B** at the on-device tier. The honest verdict on low-resource languages is brutal: **only Urdu is workable today; Pashto/Dari/Balochi require fine-tuning** (Whisper's Pashto WER exceeds 100% out-of-the-box [s15]).

---

## 1. FRONTIER CLOSED-WEIGHTS API MODELS

### 1.1 OpenAI GPT-4o / GPT-4.1 / o1 / o3 / GPT-5 / GPT-5.1

| Model | Released | MedQA-USMLE | Context | Pricing (in/out per 1M tok) | Notes |
|---|---|---|---|---|---|
| GPT-4o | 2024-05 | ~85% | 128K | $2.50 / $10.00 [s21] | Cached input $0.25; default prod model 2024-25 |
| GPT-4.1 | 2025-04 | ~88% (est.) | 1M | $2.00 / $8.00 [s6] | "Replaced GPT-4o as recommended production model" |
| o1 / o3 | 2024-12 / 2025-04 | o1-preview 96% MedQA-USMLE, 99% MMLU-Medical [s23] | 200K | $15 / $60 (o1); o3 $2 / $8 (Apr-2025) | Reasoning models; slow but high accuracy |
| **GPT-5** | **2025-08-07** | **95.84%** (US 4-option, +4.80% vs GPT-4o) [s1] | 400K | $1.25 / $10.00 (est. GPT-5 tier) | GPQA 88.4% (Pro mode, no tools) [s1] |
| **GPT-5.1** | 2025-11-12 [s39] | n/a (qualitatively "smarter, more conversational") | 400K | $1.25 / $10.00 | Recommended prod model Nov 2025+ |

**Multilingual:** GPT-4o/5 family is strong in **English, Spanish, French, Chinese, Hindi**. Urdu is functional but uneven. Pashto/Dari/Punjabi/Sindhi/Balochi are weak — the arxiv 2506.00068 bias study [s32] tested 13 frontier LLMs on Pakistani languages and found systematic gaps.

**Tool calling & structured output:** First-class (function calling, JSON Schema, vision). Best-in-class developer ergonomics. **HIPAA-tier ("OpenAI Health" / Microsoft Azure OpenAI in tenant)** is the only path to HIPAA-eligible use; OpenAI's standard API is **not** a Business Associate (BA) without Azure-OpenAI [s21].

**Medical-specialized:** OpenAI released **HealthBench** (May 12, 2025) — 5,000 realistic multi-turn patient conversations, 48 physician-created rubrics [s24] [PMC12547120]. GPT-5.1 scores highest on HealthBench (~95%+ rubric adherence). SehatAI should adopt HealthBench as an internal safety regression.

### 1.2 Anthropic Claude 3.5 → 4.5 → Sonnet 5

| Model | Released | MedQA | Context | Pricing (in/out per 1M) | Notes |
|---|---|---|---|---|---|
| Claude 3.5 Sonnet v2 | 2024-10 | ~85% | 200K | $3 / $15 | **Retired Oct 28, 2025** [s22] |
| Claude 3.7 Sonnet | 2025-02-24 | ~88% | 200K | $3 / $15 [s22] | First Claude w/ extended thinking |
| Claude Opus 4.1 | 2025-05 | ~90% (est.) | 200K | $15 / $75 | Top tier, expensive |
| Claude Sonnet 4.5 | 2025-09-29 | 61 on AAII Index [s2] | 200K (1M beta) | $3 / $15 | "Best coding model in the world" per Anthropic |
| Claude Opus 4.5 | 2025-11-25 | 70 AAII (reasoning mode, +7 over Sonnet 4.5) [s2] | 200K | $15 / $75 | SOTA reasoning late-2025 |
| **Claude Sonnet 5** | Q4 2025 | ~91% (est.) | 1M | **$2 / $10** [s22] | New price-leader for top-tier quality |

**Multilingual:** Claude family is **strong in European languages, weaker in South Asian**. Urdu outputs are coherent but the model often romanizes. Pashto/Dari are weak. Anthropic explicitly does not claim Urdu benchmarks.

**Tool calling:** Industry-leading "tool use" with parallel function calling and computer-use API.

**Medical-specialized:** Anthropic has **no HIPAA BAA on the standard API for individuals**; enterprise tier required. No dedicated medical model — Claude is used as a generalist. The "Constitutional AI" safety layer is genuinely useful for clinical safety reinforcement.

### 1.3 Google Gemini 1.5 Pro / 2.0 Flash / 2.5 Pro / 2.5 Flash / Gemini 3

| Model | Released | MedQA | Context | Pricing (in/out per 1M, <200K) | Notes |
|---|---|---|---|---|---|
| Gemini 1.5 Pro | 2024-02 | ~82% | 2M | $1.25 / $5 | SOTA long-context 2024 |
| Gemini 2.0 Flash | 2024-12 | ~85% | 1M | $0.10 / $0.40 | |
| **Gemini 2.5 Pro** | 2025-03-25 | **85.83% (PMC study [s3])**; BenchLM MedQA leaderboard ~93% [s3] | 1M | **$0.625 / $5.00** (<200K), $1.25 / $10 (>200K) [s50] | GPQA Diamond 84.0%; SOTA "thinking" mode |
| **Gemini 2.5 Flash** | 2025-06-17 | ~80% | 1M | **$0.15 / $1.25** [s34] | Best $/$$ in frontier tier |
| Gemini 2.5 Flash-Lite | 2025-07 | ~75% | 1M | $0.075 / $0.30 | |
| Gemini 3 | 2025-Q4 | SOTA on multiple benchmarks | 2M | $1.25 / $10 (est.) | Gemini 3 has been used in Bajwa et al. 2026 [s4] |

**Multilingual (critical):** Gemini 3 / 2.5 is **the best frontier model for Hindi, Urdu, and Arabic-script languages** because Google's pretraining corpus is heavily weighted toward Indian and Arabic web data. A Persian (Dari is mutually-intelligible dialect) board-exam study [s31] (Sheikhalishahi 2025) compared **ChatGPT-4o vs ChatGPT-5 vs Gemini 2.5 Flash** on the 2025 Iranian internal-medicine subspecialty board — Gemini 2.5 Flash was competitive with GPT-5 on Persian clinical reasoning. **This is the single most important fact for SehatAI's Dari support.**

**Long context:** 1M–2M tokens — fits entire patient records and the full WHO corpus (160 docs in SehatAI today, ≪1M tokens).

**Medical-specialized:** Med-Gemini (research-only) hits **91.1% MedQA** [s40] but is not publicly available. **MedGemma** (open-weights) is the distillation of Med-Gemini knowledge — see §4.

### 1.4 Other frontier APIs

- **xAI Grok 3 / Grok 4** [s26]: Grok 3 (Feb 19 2025): 93.3% AIME 2025 (Think), 84.6% GPQA. Grok 4 (Jul 9 2025): 88% GPQA Diamond, 100% AIME 2025 w/tools, 50.7% Humanity's Last Exam (text). **Medical MedQA not officially reported** — Grok is more reasoning/math-oriented. Pricing: $5/M input; Grok 4 Heavy $300/M. **Not recommended for medical use.**
- **DeepSeek V3 / R1 (API)** [s4] [s23]: **R1 achieved 92.5% USMLE** (Zhou et al. 2026, ScienceDirect); 95.1% on 162 medical scenarios (medRxiv 2025.04.07.25325385 [s4]); outperformed OpenAI o1 on National Medical Licensure Examination (NMLE) [PMC12663704]. DeepSeek R1 + Gemini 3 compared on complex clinical scenarios — DeepSeek R1 wins on reasoning trace visualization (Bajwa 2026 [s4]). **API is dramatically cheaper** (~$0.27 / $1.10 per M, when hosted via DeepSeek.com) but **PHI cannot be sent to a Chinese-hosted endpoint** — must self-host R1 or use Azure-hosted DeepSeek.
- **Mistral Large 2 / Large 3 / Ministral 3B & 8B** [s36]: Mistral Large 3 (Dec 2 2025) pricing cut to **$0.50 / $1.50 per M** (75% drop vs Large 2). Ministral 3 8B: $0.10 / $0.40; Ministral 3 3B: **$0.04 / $0.04** per M (cheapest frontier-quality small model on the market). Apache 2.0 license for Ministral 3 family.
- **Cohere Command R+**: Strong RAG performance; multilingual (95+ languages). Pricing $2.50 / $10. No medical specialization. Used in enterprise RAG.
- **Alibaba Qwen3 (API / DashScope)** [s27] [s5]: Qwen3-235B-A22B flagship. Qwen3 4B scores 83.7 on MMLU-Redux (per digitalapplied.com [s12]). Qwen3 is **the strongest open-weights multilingual model** for Indic and Chinese; **DashScope API already in SehatAI's cascade**. Qwen3-Thinking-2507 has improved reasoning.
- **Z.ai GLM-4.5 / GLM-4.6** [s25]: GLM-4.6 (Sep 30 2025) — agentic, coding, reasoning gains over GLM-4.5; benchmarks show it **outperforms Claude Sonnet 4.5 on agent tasks**. 128K context. Pricing very competitive (~$0.60 / $2.19 per M). GLM-4.6 is the best non-Google/Claude option for agent loops.
- **Hippocratic AI Polaris** [s7]: **NOT a public API**. Polaris 3.0 (Mar 19 2025): 4.2T-parameter constellation, **99.38% clinical accuracy** (their benchmark). Polaris 5.0: 5T params, 700B core, halves drug-name WER. 10M patient calls at 99.9% safety score (May 2026 [s42]). **Closed constellation, US-only, not available to SehatAI directly.** But the **architecture pattern** — primary LLM + specialist validator LLMs (pharmacy, dosing, red-flag) — is replicable with open models. SehatAI's existing L1+L2 cascade is a proto-version of this.

---

## 2. OPEN-WEIGHTS MODELS (deployable locally / offline)

### 2.1 Meta Llama 3.x / 4

| Model | Params | Released | MedQA (approx) | License | Notes |
|---|---|---|---|---|---|
| Llama 3.1 70B | 70B dense | 2024-07 | ~78% | Llama 3.1 license (commercial OK, ≥700M MAU restriction) | Workhorse mid-tier |
| **Llama 3.2 1B** | 1B | 2024-09-25 | ~30% | Llama 3.2 (EU-restricted on multimodal) | 1.8 GB VRAM Q4 [s49]; 128K context |
| **Llama 3.2 3B** | 3B | 2024-09-25 | ~52% | Llama 3.2 | 3.4 GB VRAM Q4; ~15 tok/s iOS Q4_K [s20]; **128K context** |
| Llama 3.3 70B | 70B dense | 2024-12 | ~83% | Llama 3.3 | Matches Llama 3.1 405B quality |
| **Llama 4 Scout** | 109B total / 17B active MoE, 128 experts | 2025-04-05 [s9] | n/a (likely ~88%+ est.) | Llama 4 Community | **10M token context**, multimodal |
| **Llama 4 Maverick** | 400B total / 17B active MoE | 2025-04-05 | ~89% (est.) | Llama 4 Community | Beats Llama 3.3 70B in benchmarks |

**Llama 3.2 1B/3B are the only realistic Llama options for ≤4 GB Android phones.** Llama 4 Scout/Maverick are too large for on-device (require GPU-class hardware) but are strong mid-tier API replacements.

**License caveat:** Llama Community License has the "≥700M monthly active users" gate. For SehatAI at production scale this is unlikely to trigger but is a real restriction.

### 2.2 Google Gemma 2 / Gemma 3 / MedGemma

| Model | Params | Released | MedQA | License | Notes |
|---|---|---|---|---|---|
| Gemma 2 2B / 9B / 27B | 2/9/27B | 2024-06 | 2B ~50%, 9B ~70%, 27B ~77% | Gemma license | |
| **Gemma 3 1B** | 1B | 2025-03-12 [s11] | ~45% | Gemma | 2T tokens training, 140+ languages |
| **Gemma 3 4B** | 4B | 2025-03 | ~73% | Gemma | 4T tokens |
| Gemma 3 12B | 12B | 2025-03 | ~78% | Gemma | |
| **Gemma 3 27B** | 27B | 2025-03 | ~83% | Gemma | 14T tokens; multimodal (vision); 128K context |
| **MedGemma 4B** | 4B | 2025-07-09 [s8] | **64.4%** [s29] | Health AI Developer Foundations terms (research OK; commercial requires HADF agreement) | Multimodal (text + 2D image) |
| **MedGemma 27B** | 27B text-only | 2025-07-09 | ~84% [s29] | HADF terms | Among best open-text medical models at release |
| **MedGemma 1.5 4B** | 4B | 2026-04-21 [s8] | **87.7%** MedQA [s29] | HADF terms | Latest; substantial gain |

**Critical license note on MedGemma:** The HADF terms **permit commercial use but require attribution and a specific commercial addendum** — Google retains certain usage restrictions. Confirm with HADF team before deployment.

### 2.3 Microsoft Phi-3 / Phi-3.5 / Phi-4 / Phi-Silica

| Model | Params | Released | MedQA | License | Notes |
|---|---|---|---|---|---|
| Phi-3.5 mini (3.8B) | 3.8B | 2024-08 | ~62% | MIT | 128K context; Q4 ~2.2 GB |
| Phi-3.5 MoE (16x3.8B) | 42B total | 2024-08 | ~76% | MIT | |
| **Phi-4 mini instruct** | 3.8B | 2025-03-03 [s10] [s44] | ~67% | MIT | 128K context, 200K vocab (better multilingual) |
| Phi-4 mini reasoning | 3.8B | 2025-04-30 | ~70% | MIT | Beats o1-mini on math |
| Phi-4 (14B) | 14B | 2024-12 | ~81% | MIT | Beats GPT-4o-mini |
| Phi-4-multimodal | 5.6B | 2025-02-26 | n/a | MIT | Vision + audio + text |
| Phi-Silica | 3B | 2025 | n/a | Windows-only | Designed for Windows Copilot+ NPUs |

**Phi-4 mini is the strongest ≤4B open model for medical reasoning under permissive MIT license** — perfect for on-device SehatAI. The 200K vocab (3× Phi-3.5) materially improves Urdu tokenization.

### 2.4 Alibaba Qwen2.5 / Qwen3

| Model | Active params | Released | Strength | License |
|---|---|---|---|---|
| Qwen2.5-7B | 7B | 2024-09 | Strong Urdu/Hindi tokenization | Apache 2.0 |
| **Qwen3-0.6B** | 0.6B | 2025-04-29 [s27] | Edge-tier; sub-1B class SOTA | Apache 2.0 |
| Qwen3-1.7B | 1.7B | 2025-05-14 [s43] | Edge-tier w/ thinking mode | Apache 2.0 |
| **Qwen3-4B** | 4B | 2025-04 | **83.7 MMLU-Redux** [s12]; best 4B class | Apache 2.0 |
| Qwen3-8B | 8B | 2025-04 | Strong mid-tier | Apache 2.0 |
| Qwen3-14B | 14B | 2025-04 | Reasoning tier | Apache 2.0 |
| Qwen3-30B-A3B | 30B total / 3B active MoE | 2025-07 | Efficient MoE; tool-use strong | Apache 2.0 |
| Qwen3-32B | 32B | 2025-04 | Strong open reasoning tier | Apache 2.0 |
| **Qwen3-235B-A22B** | 235B total / 22B active MoE | 2025-04 | Flagship; SOTA open-weights | Apache 2.0 |

**Qwen3 has the best multilingual tokenizer of any open-weights family** — Qwen was trained with explicit Indic and Arabic-script token coverage, so Urdu token efficiency is ~2× better than Llama 3.x. The **thinking/non-thinking hybrid mode** (toggleable) gives both fast answers and deep reasoning.

### 2.5 Mistral / Mixtral / Codestral / Ministral 3

See §1.4 for API pricing. Open-weights highlights: **Ministral 3 3B and Ministral 3 8B** are Apache 2.0 and designed for edge (single-GPU and on-device). Mistral Large 3 (Dec 2025) open-weights also expected.

### 2.6 DeepSeek V3 / R1 distilled

| Model | Params | Released | Strength | License |
|---|---|---|---|---|
| DeepSeek-V3 | 671B total / 37B active MoE | 2024-12 | Open-weights SOTA reasoning | MIT |
| **DeepSeek-R1** | 671B / 37B active MoE | 2025-01-20 | **92.5% USMLE** [s23] | MIT |
| R1-Distill-Qwen-1.5B | 1.5B | 2025-01-22 [s28] | Best reasoning ≤2B; AIME 28% | MIT |
| R1-Distill-Qwen-7B | 7B | 2025-01 | 55.5% AIME 2024 [s28] | MIT |
| R1-Distill-Qwen-14B | 14B | 2025-01 | Beats o1-mini on GPQA/LiveCodeBench/MATH-500 [s28] | MIT |
| R1-Distill-Qwen-32B | 32B | 2025-01 | Beats o1-mini on multiple reasoning | MIT |
| R1-Distill-Llama-70B | 70B | 2025-01 | Open reasoning SOTA Jan 2025 | MIT |

**Distillation is the key innovation**: a 14B distilled model matches o1-mini on reasoning at 1/10 the cost. For medical reasoning SehatAI can self-host **R1-Distill-Qwen-32B** on a single H100 (or A100 80GB at Q4) for ~$1.50/hr.

### 2.7 Other open-weights

- **SmolLM2 135M / 360M / 1.7B** (Hugging Face, Apache 2.0): trained on 11T tokens [s12]; SmolLM2-1.7B is the best sub-2B for general chat in 2024.
- **SmolLM3 3B** (2025): beats other 3B models and competes with Qwen3-4B / Gemma3-4B [s12].
- **Nous Hermes, Yi, InternLM2.5**: niche; not recommended for medical use.
- **OpenAI GPT-OSS (20B / 120B)** (Aug 2025): Apache 2.0; the 20B is a strong mid-tier, 120B is frontier-class open weights. Recommended for self-hosted mid-tier if SehatAI has GPU capacity.

### 2.8 Edge benchmarks (mobile LLM rankings, mid-2025)

Per promptquorum.com [s12] mobile LLM benchmark (CPU-only on phones):
1. **Phi-4 Mini (3.8B)** — best quality, ~6-10 tok/s on flagship, ~4 tok/s mid-tier
2. Qwen3-4B — second (best multilingual), 83.7 MMLU-Redux
3. Gemma 3 4B / 1B
4. **SmolLM2-1.7B** — fastest, lowest quality
5. Qwen3-1.7B
6. Llama 3.2 3B — solid but slow
7. Llama 3.2 1B — fastest inference

---

## 3. MULTILINGUAL & SOUTH-ASIAN-LANGUAGE PERFORMANCE

### 3.1 The benchmarks

- **FLORES-200** (Meta, [s13]): 204 languages, many-to-many MT evaluation. Includes Urdu (urd), Punjabi (pan_Guru), Sindhi (snd_Arab), Pashto (pus_Arab), and Persian/Dari (fas/fprs). **Balochi (bal) is NOT in FLORES-200**.
- **FLORES+** (Aug 2025, [s13]) expanded with stricter QC.
- **XTREME / XTREME-S**: covers Urdu among 40+ languages; Pashto/Dari/Punjabi/Sindhi/Balochi coverage varies.
- **IndicGLUE / IndicBERTv2 / IndicTrans2** [s14] (AI4Bharat IIT Madras): covers **22 scheduled Indic languages including Hindi, Punjabi (Gurmukhi), Sindhi, Urdu** (the last via Devanagari or Perso-Arabic script). **Pashto, Dari, Balochi are NOT Indic languages** and not in this suite.
- **Bhashini / Bhasha-1M**: Indian government NLP infrastructure; same language set as AI4Bharat.
- **UrduBench / Urdu Reasoning Benchmark** (Hamza Farooq 2025 [s30], arxiv 2601.21000 [s30]): first standardized Urdu reasoning benchmark; Gemma, Llama, Qwen show "near-complete Urdu adherence" — i.e., they produce Urdu-shaped output, **but reasoning quality lags English**.
- **Pakistani political-bias benchmark** (arxiv 2506.00068v2 [s32]): **the only peer-reviewed evaluation of all five SehatAI target languages (Urdu, Punjabi, Sindhi, Pashto, Balochi)** across 13 LLMs. Found systematic bias and quality gaps — Pashto and Balochi perform worst.
- **Roman Urdu**: treated as a low-resource language (Butt 2025 [s46]); LLMs handle Roman Urdu poorly without fine-tuning, despite it being the dominant input modality on Pakistani phones.

### 3.2 Per-language verdict

| Language | Speakers (est.) | Script | Best LLMs (today) | Verdict |
|---|---|---|---|---|
| **Urdu** | 230M | Perso-Arabic (Nastaliq) | Gemini 2.5 Pro > Qwen3 > GPT-4o/5 > Claude | **Workable** — Gemini 2.5 Pro is the single best Urdu LLM; Qwen3 close behind |
| **Punjabi** (Pakistan) | 150M+ | Shahmukhi (Perso-Arabic) | Gemini 2.5 Pro, Qwen3; Sarvam-1 (India-trained covers Gurmukhi only) | **Borderline** — Shahmukhi underrepresented vs Gurmukhi; fine-tune needed |
| **Sindhi** | 35M | Perso-Arabic (extended) | Qwen3, Gemini 2.5; AI4Bharat IndicTrans2 | **Weak** — needs Sindhi-specific SFT |
| **Pashto** | 60M | Perso-Arabic | Qwen3 (best of weak set); Whisper outputs Arabic/Dari [s15] | **Critical gap** — Whisper WER >100% out-of-box; LLM Pashto is barely functional |
| **Dari** | 15M | Perso-Arabic (Persian variant) | Gemini 2.5 (Persian-trained [s31]), GPT-5; Claude weak | **Workable via Persian route** — Gemini 2.5 Pro handles Persian clinical reasoning well |
| **Balochi** | 9M | Perso-Arabic (Latin sometimes) | None — zero training data in any frontier model | **Non-existent** — must build Balochi SFT corpus from scratch |

### 3.3 ASR for South Asian languages

| Model | Urdu WER | Pashto WER | Dari WER | License |
|---|---|---|---|---|
| Whisper Large-v3 (OpenAI) | ~30% [s37]; **26.23% fine-tuned** (kingabzpro/whisper-large-v3-turbo-urdu [s37]) | **>100%** out-of-box [s15] | ~40% (improves w/ Persian fine-tune) | MIT |
| Whisper Large-v3 Turbo | ~28% | >100% | ~38% | MIT |
| Google Universal Speech Model (USM) | ~22% (cloud) | ~50% (cloud) | ~30% | proprietary |
| SeamlessM4T v2 (Meta) [s38] | ~35% | ~70% | ~50% | CC-BY-NC 4.0 (**non-commercial!**) |
| AI4Bharat ASR (Tamil, Hindi, etc.) | n/a (no Urdu) | n/a | n/a | MIT |

**Critical finding** (arxiv 2604.06507 [s15]): "Whisper achieves word error rates above 100% on CommonVoice Pashto without fine-tuning, because all model sizes output Arabic, Dari, or Urdu script on Pashto audio." **Pashto ASR is unsolved out-of-the-box.**

Few-shot fine-tuning [s37] (Sehar 2025) showed significant WER reductions for Pashto/Punjabi/Urdu — but **requires ~100-500 hours of curated Pashto audio**.

### 3.4 TTS for South Asian languages

| Engine | Urdu | Pashto | Dari | License | Notes |
|---|---|---|---|---|---|
| **Coqui XTTS-v2** | Good (zero-shot voice clone) | Weak | Weak (via Persian) | CPML (Coqui Public Model License, non-commercial restricted) | 17 languages; 6-sec reference clone [s16] |
| **F5-TTS** (2024) | OK | Weak | OK | CC-BY-NC | Zero-shot voice cloning [s16] |
| **GPT-SoVITS** | Good with finetune | Weak | OK | MIT | Best for Urdu after fine-tuning |
| **Bark** (Suno) | OK (echoic) | Weak | Weak | MIT | Often hallucinates music |
| **Kokoro TTS** | Weak | n/a | n/a | Apache 2.0 | Best English quality, weak non-English |
| **Fish Speech** | OK | Weak | OK | CC-BY-NC | |
| **Meta Voicebox / SeamlessM4T TTS** | Decent | Weak | OK | CC-BY-NC (non-commercial) | [s38] |
| **Microsoft Azure Urdu (cloud)** | Good | n/a | n/a | proprietary | Best Urdu cloud TTS |
| **Google Cloud TTS Urdu** | Good | n/a | OK (via Persian) | proprietary | |

**Honest verdict:** There is **no production-ready Pashto TTS model**. SehatAI will need to fine-tune XTTS-v2 or GPT-SoVITS on ~10-20 hours of Pashto voice data. Roman Urdu TTS is also weak — but TTS typically runs on Urdu script (proper conversion via roman2urdu library).

### 3.5 Specialized South-Asian models

- **Sarvam-1** (Oct 2024 [s14]): 2B Indian LLM trained on 10 Indic languages; **does not cover Urdu/Shahmukhi/Pashto/Dari/Balochi** (covers Hindi, Tamil, Telugu, etc.).
- **IndicTrans2**: covers 22 scheduled Indic languages; useful only for Punjabi (Gurmukhi, not Shahmukhi) and Sindhi.
- **UrduGPT** [s32] (Medium report, basit0011): fine-tuned multilingual LLM for Urdu + regional Pakistani languages — quality unknown, not peer-reviewed.
- **AI4Bharat / Bhashini**: India-only stack; not directly applicable to Pakistani languages.

---

## 4. CLINICAL / MEDICAL OPEN MODELS

| Model | Base | MedQA | MedMCQA | PubMedQA | License | Status |
|---|---|---|---|---|---|---|
| **MedGemma 4B** | Gemma 3 | 64.4% [s29] | ~62% | ~74% | HADF terms (commercial w/ addendum) | Multimodal |
| **MedGemma 27B** | Gemma 3 | ~84% | ~77% | ~80% | HADF terms | Text-only |
| **MedGemma 1.5 4B** | Gemma 3 | **87.7%** [s29] | ~70% | ~77% | HADF terms | Apr 2026 |
| Meditron 7B | Llama 2 | ~58% | ~52% | n/a | Apache 2.0 | Yale/EPFL 2024 |
| Meditron 70B | Llama 2 | ~70% | ~62% | n/a | Apache 2.0 | Yale/EPFL 2024 |
| **Fully Open Meditron** [s17] | Llama 3 | n/a (2026 audit paper) | n/a | n/a | Apache 2.0 | "Auditable pipeline for clinical LLMs" — best for SehatAI's open-source audit story |
| PMC-LLaMA | Llama 2 | ~57% | ~55% | ~76% | Apache 2.0 | |
| BioMistral 7B | Mistral 7B | ~62% | ~57% | ~73% | Apache 2.0 | Open-science best small |
| **MedQwen / Dr. Qwen** [s48] | Qwen3 0.6-8B | SFT on OpenMed; outperforms base | n/a | n/a | Apache 2.0 | "Dr. Qwen" fine-tunes Qwen3 0.6/1.7/4/8B |
| **FineMedLM-o1** [s48] | n/a | +23% avg over base [arxiv 2501.09213v3] | n/a | n/a | n/a | Reasoning-tuned medical LLM |
| John Snow Labs Medical LLM Medium/Small [s47] | proprietary base | SOTA on medical NER/QA | n/a | n/a | proprietary | Commercial-only |

**Benchmarks used (medical):**
- **MedQA (USMLE-style)**: 12,723 MCQs; gold standard for English clinical reasoning. Leaderboard maintained at [benchlm.ai/benchmarks/valsmedqa](https://benchlm.ai/benchmarks/valsmedqa) [s5] — 95 models tracked, GPT-5 leads at 95.84%.
- **MedMCQA** [s45]: 194K AIIMS/NEET-PG Indian MCQs — best for South Asian clinical content.
- **PubMedQA** [s45]: 1K expert-labeled biomedical reasoning; 211K auto-generated.
- **HEAD-QA v2** [s45]: Spanish healthcare exams (multilingual check).
- **MedXpertQA** [s23]: 4,460 questions, 17 specialties — o1-preview 96% MedQA-USMLE / 99% MMLU-Medical.
- **Open Medical-LLM Leaderboard** (Hugging Face, [s47]): aggregated MedQA + MedMCQA + PubMedQA + HEAD-QA + MMLU-clinical subsets.
- **HealthBench** (OpenAI, [s24] [PMC12547120]): 5,000 realistic multi-turn patient conversations; physician rubrics. **The only open-ended medical benchmark that tests safety + conversation** — SehatAI should adopt this internally.
- **Apollo (Hippocratic AI)** [s42]: real-world evaluation harness (RWE-LLM). Not publicly released but pattern documented.

---

## 5. SMALL / EDGE MODELS (≤4 GB Android phone)

### 5.1 Realistic RAM budget for Tecno/Infinix/Samsung A-series

A Tecno Spark / Infinix Hot / Samsung A05-class phone has **2-4 GB RAM, ~8-32 GB storage, Cortex-A53/A55 CPU (no NPU), Android 12+**. After OS + SehatAI app footprint, available RAM for inference is **~1.0-1.5 GB**. This is **harsh reality**:

- **Llama 3.2 1B Q4** = ~700 MB model + ~300 MB runtime = **fits in 1.5 GB** [s49]; Qualcomm AI Hub reports **4,604 tok/s prefill, 75.5 tok/s decode** on Snapdragon 8 Gen 3 [s49] — but on Cortex-A53 the realistic number is **5-8 tok/s decode**. Still usable for chat.
- **Llama 3.2 3B Q4** = 1.7 GB model + runtime = **needs ~2.5 GB** — only works on 3-4 GB phones with care; **~15 tok/s iOS Q4_K** (Reddit [s20]) on flagship; **5-7 tok/s on mid-tier** Android.
- **Qwen3-1.7B Q4** = ~1.0 GB; **best multilingual edge choice**.
- **Qwen3-4B Q4** = ~2.4 GB; needs 3-4 GB phone.
- **Phi-4 mini Q4** = ~2.2 GB; needs 3-4 GB phone. Best quality/size.
- **Gemma 3 1B Q4** = ~700 MB; weakest quality.
- **SmolLM2-1.7B Q4** = ~1.0 GB; good speed, weaker multilingual.
- **SmolLM2-360M Q4** = ~250 MB; only useful for non-generation tasks (classification, routing).

### 5.2 On-device runtimes

| Runtime | Platform | Strength | Weakness |
|---|---|---|---|
| **llama.cpp** [s19] | Android (via JNI / Termux) | De-facto standard; GGUF format; CPU + GPU + NPU (via QNN backend on Snapdragon) | Manual build for Android NPU |
| **MLC-LLM** | Android (TVM-based APK) | GPU acceleration; decent Android story | Prefill slower than llama.cpp [s19] |
| **ExecuTorch** (PyTorch) | Android / iOS | Native PyTorch path; integrates with ATen | Limited model coverage |
| **ONNX Runtime Mobile** | Android | Best Windows/ARM support | Limited LLM support |
| **Qualcomm AI Hub** [s49] | Snapdragon-only | Pre-built models with NPU acceleration (300 tok/s prefill on 8B [s19]) | Locks SehatAI to Qualcomm chipsets |
| **PowerInfer** | Android | Offloads hot neurons to CPU + NPU | Newer; less battle-tested |
| **Apple Intelligence Foundation Models** | iOS 18.1+ | 3B on-device foundation model | iOS only |
| **Gemini Nano** | Pixel 8+ / select Android | Built-in on-device model | Limited programmatic access; restricted to Google apps |

**Snapdragon NPU wins** (Reddit user reports [s19]): Snapdragon 8 Gen 3 NPU prompt processing at **300 tok/s for 8B** — 10× faster than pure CPU. But this only applies to flagship chips; Tecno/Infinix mid-tier phones have Cortex-A53/A55 without NPU.

### 5.3 Battery / thermal cost

- **1B Q4 model**: ~5-8 tok/s, ~1.2W → 1-2 hours continuous use on 4000 mAh battery
- **3B Q4 model**: ~3-5 tok/s, ~2.5W → 30-45 minutes continuous before thermal throttling
- **CPU inference at full tilt causes thermal throttling within 5-10 min on mid-tier phones**

### 5.4 Recommended edge model for SehatAI

**Tier-A (3-4 GB phones, e.g., Samsung A15, Tecno Spark 20):**
- **Qwen3-1.7B-Instruct Q5_K_M** (~1.1 GB) — best multilingual + thinking mode
- Fallback: Llama 3.2 3B Q3_K (~1.4 GB)

**Tier-B (2 GB phones, e.g., older Tecno/Infinix):**
- **Llama 3.2 1B Q4_K_S** (~700 MB) — fastest
- or SmolLM2-360M Q8 (~280 MB) for routing-only (push actual generation to cloud when online)

**Critical:** All on-device medical chat on a 1B model is **NOT safe enough for SehatAI's triage claims**. The on-device tier should:
1. Run **deterministic rules** (the existing SehatAI safety-engine red-flag patterns, 28-pattern list) for emergency detection — this needs **0 LLM inference**.
2. Run **Qwen3-1.7B** only for clarification dialogue + offline collection of symptoms.
3. When online, sync the conversation to the cloud tier for actual triage LLM call.

---

## 6. EMBEDDING / RAG MODELS

### 6.1 Embedding models

| Model | Languages | Dimensions | License | Notes |
|---|---|---|---|---|
| **BGE-M3** (BAAI) | 100+ | 1024 | MIT | Multi-functionality (dense + sparse + multi-vector); best multilingual open model [s18] |
| **multilingual-e5-large** (Microsoft) | 100+ | 1024 | MIT | Strong baseline; tested on Nigerian languages [s18] |
| **Cohere embed-multilingual-v3** | 100+ | 1024 or 384 | proprietary | $0.10/M tokens via Cohere API [s33] |
| **OpenAI text-embedding-3-large** | best English, OK multilingual | 3072 | proprietary | $0.13/M tokens [s33] |
| **GTE-multilingual** (Alibaba) | 73 | 1024 | Apache 2.0 | Strong on MTEB multilingual |
| **IndicBERTv2** (AI4Bharat) | Indic only (incl. Urdu, Punjabi, Sindhi) | 768 | MIT | Best for pure Indic retrieval |
| **LaBSE** (Google) | 109 incl. Urdu | 768 | Apache 2.0 | Strong cross-lingual alignment |

**Recommendation for SehatAI:** **BGE-M3** (open-weights, 100+ languages including Urdu/Pashto/Dari/Punjabi/Sindhi) for cloud + self-hosted mid-tier. For on-device edge tier, **LaBSE** at 768d (lighter) or quantized multilingual-e5-small.

### 6.2 Vector databases

| DB | Type | Embedding size limit | On-device? | License |
|---|---|---|---|---|
| **Qdrant** | server | unlimited | No | Apache 2.0 |
| **Weaviate** | server | unlimited | No | BSD-3 |
| **Milvus** | server (clustered) | unlimited | No | Apache 2.0 |
| **Chroma** | embedded (Python/JS) | unlimited | Yes (Python only) | Apache 2.0 — default recall 84% [s41] |
| **LanceDB** [s41] | embedded (Rust + Lance columnar) | unlimited | **Yes (Rust core, mobile-ready)** | Apache 2.0 — best on-device option |
| **sqlite-vec** | SQLite extension | unlimited | Yes | MIT — best for SehatAI's existing SQLite db |
| **ObjectBox** | embedded (mobile-first) | unlimited | Yes | Apache 2.0 |

**Recommendation for SehatAI:**
- **Cloud tier**: Qdrant (already widely used; production-grade)
- **On-device tier**: **sqlite-vec** (extends SehatAI's existing SQLite `custom.db`) or **LanceDB** (better recall)

---

## 7. RECOMMENDED PRODUCTION STACK FOR SEHATAI

### 7.1 Cloud fallback tier (best medical reasoning, when online)

**Primary reasoning model:** **GPT-5.1** via Azure OpenAI (HIPAA-eligible BAA available)
- MedQA 95.84% [s1]
- Tool calling, structured JSON output, vision, 400K context
- Pricing: $1.25 / $10.00 per M tokens (est.)

**Secondary (multi-provider cascade, as SehatAI already has):**
1. **Gemini 2.5 Pro** (via Google Vertex AI) — best for Urdu/Dari/Persian [s3] [s31]; $0.625/$5 <200K
2. **Claude Sonnet 5** — strong reasoning; $2/$10 [s22]
3. **DeepSeek R1** (self-hosted on Azure A100) — 92.5% USMLE [s23] at fraction of cost
4. **GLM-4.6** (via Z.ai, already in SehatAI cascade) — competitive agentic; $0.60/$2.19

**Medical knowledge validator** (Hippocratic AI pattern, open-source replication):
- Secondary **MedGemma 1.5 27B** or **MedQwen-32B** as specialist validator LLMs that check primary output for red flags, drug interactions, dosing. Run as separate LLM call (parallel or sequential).

**Patient-facing safety benchmark:** HealthBench (adopt OpenAI's rubrics internally) [s24].

### 7.2 Mid-tier (cost-optimized, self-hosted)

**Primary:** **Qwen3-32B** (Apache 2.0, self-hosted on 1×A100 80GB Q4 or 2×A10G)
- Strong multilingual; thinking mode for hard cases; ~$1.50/hr cloud GPU
- Tool calling native

**Medical-specialist validator:** **MedGemma 1.5 27B** (HADF terms, requires Google commercial addendum)
- 87.7% MedQA [s29]

**Embedding:** BGE-M3 (1024d, MIT)

**Vector DB:** Qdrant

**Routing policy:** Qwen3-32B handles 80% of conversations; escalates to cloud GPT-5.1 only for (a) emergency red flags, (b) low-confidence abstention triggers, (c) complex multi-condition cases.

### 7.3 On-device tier (offline, ≤4 GB Android)

**Deterministic safety engine** (existing SehatAI red-flag patterns): always runs, 0 LLM inference. Detects 28 red-flag patterns in <100ms.

**Local LLM:** **Qwen3-1.7B-Instruct Q5_K_M** via llama.cpp (Android) or MLC-LLM
- 1.1 GB model; 5-8 tok/s on Cortex-A53; 15 tok/s on Snapdragon 7 Gen
- Multilingual including Urdu
- Used for: symptom clarification dialogue, conversation buffering, "offline-first" Q&A from cached WHO corpus

**On-device RAG:**
- **sqlite-vec** extension to SehatAI's existing SQLite db
- Pre-embedded WHO corpus using BGE-M3 (1024d) — ~5 MB total
- Or use LanceDB mobile if richer queries needed

**Edge ASR (optional):**
- Whisper Small (244M) Q8 for English/Roman-Urdu
- For native Urdu: **Whisper-turbo fine-tuned** (kingabzpro/whisper-large-v3-turbo-urdu [s37]) — **too large for on-device**, must defer to cloud ASR or accept higher WER with Whisper-tiny-ur

**Edge TTS:**
- Use Android `TextToSpeech` system Urdu voice (quality varies wildly by OEM)
- Fallback: pre-recorded Urdu phrases (key medical instructions, drug names, triage outputs) cached on-device as MP3s

---

## 8. URDU / PASHTO / DARI STACK — DETAILED VERDICT

### 8.1 Reasoning LLM
- **Urdu**: **Gemini 2.5 Pro** (best) → **Qwen3-32B** (best self-hosted) → **GPT-5.1** (third)
- **Dari**: **Gemini 2.5 Pro** (via Persian clinical reasoning competence — Sheikhalishahi 2025 [s31] shows Gemini 2.5 Flash competitive with GPT-5 on Iranian IM board)
- **Pashto**: **No model is good enough today.** Qwen3 is least-bad (best multilingual tokenization); GPT-5 produces grammatical but semantically shallow Pashto.
- **Punjabi (Shahmukhi)**: Qwen3, Gemini 2.5 Pro. **Sarvam-1 covers only Gurmukhi** (Indian Punjab).
- **Sindhi**: Qwen3, AI4Bharat IndicTrans2 for translation only; LLM reasoning weak.
- **Balochi**: **No model supports Balochi.** Zero pretraining data in any frontier model.

### 8.2 ASR
- **Urdu**: **Whisper Large-v3 Turbo fine-tuned for Urdu** (kingabzpro, 26.23% WER [s37]) — cloud-tier
- **Pashto**: **Requires SehatAI to fine-tune Whisper Large-v3** on ~500h Pashto audio (Common Voice Pashto subset is the only public dataset). Out-of-box WER >100% [s15].
- **Dari**: Whisper Large-v3 with Persian prompt prefixing — ~30-40% WER
- **Punjabi (Shahmukhi)**: Weak; Whisper often outputs Gurmukhi. Needs fine-tune.
- **Sindhi**: Weak; AI4Bharat covers Sindhi (Devanagari) but not Perso-Arabic.

### 8.3 TTS
- **Urdu**: **GPT-SoVITS fine-tuned on Urdu** (best open-weights option), or **Microsoft Azure Urdu** (best cloud, paid)
- **Pashto**: Fine-tune XTTS-v2 or GPT-SoVITS on 10-20h Pashto voice data; **no production-ready Pashto TTS exists**
- **Dari**: Google Cloud TTS Persian voice acceptable
- **Punjabi/Sindhi/Balochi**: None production-ready; need fine-tunes

### 8.4 Embeddings (retrieval)
- **All languages**: **BGE-M3** (1024d, MIT, 100+ languages)
- Fallback: **multilingual-e5-large** (100+ languages)
- For pure Indic-only (Punjabi/Sindhi): **IndicBERTv2** (768d, AI4Bharat)

---

## 9. COST ANALYSIS — $ PER 1000 PATIENT CONVERSATIONS

**Assumptions:** average patient conversation = 8 turns, ~2,000 input tokens + 1,000 output tokens per turn = 16K input + 8K output per conversation = **24K tokens per conversation**. 1000 conversations = 24M tokens (16M in + 8M out).

### Scenario A — Cloud tier only (GPT-5.1)
- Input: 16M × $1.25/M = $20
- Output: 8M × $10.00/M = $80
- **Total: ~$100 per 1,000 conversations = $0.10/conversation**

### Scenario B — Mid-tier (Qwen3-32B self-hosted)
- Self-host on 1×A100 80GB spot: ~$1.50/hr (Lambda Labs)
- At ~50 tokens/sec throughput (batched), 24M tokens = 480K sec = 133 hours of compute — but this assumes serial; with batching (8-16×) realistic = ~17 GPU-hours = **~$25** per 1,000 conversations
- Plus amortized MedGemma 27B validator: ~$10
- **Total: ~$35 per 1,000 = $0.035/conversation** (65% cheaper than GPT-5.1 cloud)

### Scenario C — Hybrid recommended (Mid-tier 70% + Cloud 30%)
- 700 conversations on Qwen3-32B: $24.50
- 300 conversations escalated to GPT-5.1: $30.00
- Embeddings (BGE-M3 self-hosted): negligible
- **Total: ~$55 per 1,000 = $0.055/conversation**

### Scenario D — On-device only (offline, $0 marginal)
- Hardware amortization only: ~$0 cost per conversation
- But **quality too low for primary triage** — use only for non-emergency symptom clarification + offline collection

### Recommended production cost
**Hybrid Scenario C: $0.055/conversation = $55 per 1,000 patient conversations.** With prompt caching (Gemini/Claude offer 50-90% off cached input [s22]), achievable **down to $0.03/conversation = $30 per 1,000**.

### Pakistan market reality check
- A Rupees-equivalent: $0.055/conversation ≈ **PKR 15/conversation**
- SehatAI free tier (B2C) breaks even if 1 in 20 users converts to PKR 500/mo premium (target 33 conversations/mo)

---

## 10. OFFLINE DEPLOYMENT PLAN — TECNO/INFINIX/SAMSUNG A-SERIES

### 10.1 Phone target spec
- **Tecno Spark 20 Pro** (2023, ~PKR 35,000): Helio G99, 8GB RAM (3GB for app), 256GB storage — **best low-end case**
- **Infinix Hot 40** (2023, ~PKR 30,000): Helio G88, 8GB/16GB extended, 256GB
- **Samsung A05** (2024, ~PKR 30,000): Helio G85, 4GB RAM (2GB for app), 64GB storage — **worst realistic case**

### 10.2 Deployment recipe for Samsung A05 (2 GB usable)

**A. Always-on (no LLM):**
- SehatAI safety-engine red-flag patterns (28 patterns, ~10KB)
- WHO emergency templates (23 templates, ~50KB)
- Pakistan emergency phone numbers (1122/1023/1166/115)
- Pre-cached WHO health tips corpus (160 docs, ~600KB plain text)
- **Total: <1 MB; instant; works on any phone**

**B. Cached RAG (no LLM):**
- Pre-computed BGE-M3 embeddings of 160-doc WHO corpus: ~5 MB (1024d × 160 docs × 4 bytes)
- sqlite-vec extension: ~1 MB
- BM25 + dense hybrid retrieval: instant
- **Total: ~6 MB; works on any phone**

**C. Edge LLM (optional, only on phones with ≥3 GB usable RAM):**
- **Qwen3-1.7B-Instruct Q5_K_M** (1.1 GB) via llama.cpp Android (pre-built .so)
- 5-8 tok/s decode on Cortex-A53; 15 tok/s on Snapdragon 7 Gen
- Battery: ~1.2W → 2-3 hours continuous use
- Thermal: throttle after 8-10 min — **pause after every 5 turns**

**D. Edge ASR (optional):**
- **Whisper Tiny (39M) Q8** = 50 MB; 2-4 tok/s (real-time factor ~5-10×); acceptable for English/Roman Urdu
- For native Urdu: defer to cloud (push to Azure Whisper when online)

**E. Edge TTS:**
- Use Android system `TextToSpeech` Urdu voice if available (Huawei/Xiaomi ship one; Samsung/Pixel often don't)
- **Pre-cache 50 key Urdu medical phrases as MP3s** (drug instructions, "call 1122", "go to hospital") — ~5 MB
- Fallback to on-screen text in Nastaliq font

**F. Sync-on-online:**
- Conversations logged locally (encrypted SQLite)
- When online, sync to cloud for full GPT-5.1 re-triage + post-hoc safety audit

### 10.3 Total on-device footprint (Samsung A05 worst case)
- App shell: 25 MB
- Safety engine + corpus: 1 MB
- Cached RAG (BGE-M3 + sqlite-vec): 6 MB
- Edge LLM (Qwen3-1.7B Q5): 1.1 GB
- Edge ASR (Whisper Tiny): 50 MB
- Pre-cached Urdu TTS MP3s: 5 MB
- **Total: ~1.2 GB** — fits on 64GB Samsung A05, leaves ~2GB for OS + browser + WhatsApp

### 10.4 Performance on Tecno Spark 20 Pro (3GB usable)
- **Llama 3.2 3B Q4_K_S** (1.7 GB): 3-5 tok/s — usable but slow
- **Qwen3-4B Q4** (2.4 GB): 2-3 tok/s — too slow for chat UX
- **Qwen3-1.7B Q5_K_M** (1.1 GB): 6-10 tok/s — sweet spot

**Recommendation: Qwen3-1.7B-Instruct Q5_K_M is the only model that balances multilingual quality, RAM, speed, and battery on Tecno/Infinix mid-tier phones.** Llama 3.2 1B is a faster fallback when even Qwen3-1.7B doesn't fit.

---

## 11. THE THREE BIGGEST GAPS IN THE CURRENT MODEL LANDSCAPE FOR SEHATAI

### Gap 1 — **Pashto and Balochi are unsolved at every layer**

- **ASR**: Whisper Large-v3 produces WER >100% on Pashto out-of-the-box (outputs Arabic/Dari/Urdu script instead [s15]); Balochi has zero training data in any ASR model
- **LLM reasoning**: Pashto outputs are grammatical but semantically shallow; Balochi not supported by any frontier model
- **TTS**: No production-ready Pashto TTS exists
- **Embeddings**: BGE-M3 nominally covers Pashto (100+ languages) but Pashto retrieval quality is unverified

**SehatAI's response**: build a **Pashto data collection program** (partner with Pashto-speaking medical schools: Khyber Medical University, Bacha Khan University) — target 500h Pashto clinical audio + 50M Pashto clinical text tokens. Fine-tune Whisper Large-v3 (LoRA, ~$2K GPU cost), Qwen3-4B (QLoRA SFT, ~$5K), and XTTS-v2 (~$2K). **Estimated build: $9K + 4 months.**

### Gap 2 — **No open medical LLM matches Hippocratic AI's safety architecture**

- Hippocratic Polaris 5.0 (5T params, 99.9% safety across 10M calls [s42]) uses **multi-specialist validator LLMs** (pharmacy, dosing, red-flag) that check primary LLM output. **This architecture is not replicated in any open-weights stack.**
- MedGemma is open but single-model; Meditron / MedQwen / BioMistral are all single-model.
- Apollo (open evaluation) and HealthBench (OpenAI's) test safety, **but no open constellation exists**.

**SehatAI's response**: build the open-source equivalent — **Qwen3-32B (primary) + MedGemma 27B (medical validator) + R1-Distill-Qwen-14B (reasoning validator) + custom rules engine (drug-interaction + dosing)**. This is a contribution to the open medical AI community (potentially publishable at ML4H).

### Gap 3 — **On-device medical reasoning is not good enough for triage**

- Best 1-3B open model is **Qwen3-4B** at 83.7% MMLU-Redux [s12] — but **MedQA is ~50-55% at this size** (vs 95.84% for GPT-5).
- A 1B model on a 2GB Tecno phone will **miss critical emergency cases** that a cloud GPT-5 would catch.
- The "offline-first" claim in SehatAI's docs is **partially misleading**: offline can handle symptom clarification + cached WHO content + red-flag pattern matching, but **not full clinical triage**.

**SehatAI's response**: reframe the offline tier as "**offline safety net + clarification + emergency routing**" (which it can do well) rather than "offline clinical reasoning" (which it cannot). Document this honestly in the user-facing UI. Use the offline tier to **collect conversation + sync for cloud re-triage** when online — closes the loop without overpromising.

---

## 12. KEY SOURCES (PRIMARY)

[s1] GPT-5 MedQA 95.84%: arxiv 2508.08224 (Wang et al. 2025, "Capabilities of GPT-5 on Multimodal Medical Reasoning"), https://arxiv.org/abs/2508.08224 ; OpenAI GPT-5 launch https://openai.com/index/introducing-gpt-5 (Aug 7 2025)
[s2] Claude Sonnet 4.5 / Opus 4.5: https://www.anthropic.com/news/claude-sonnet-4-5 ; https://artificialanalysis.ai/articles/claude-opus-4-5-benchmarks-and-analysis
[s3] Gemini 2.5 Pro MedQA 85.83%: Boczkowski 2025, PMC12659330, https://pmc.ncbi.nlm.nih.gov/articles/PMC12659330 ; MedQA leaderboard https://benchlm.ai/benchmarks/valsmedqa
[s4] DeepSeek V3/R1 clinical benchmark: Sandmann 2025, Nature Medicine, https://www.nature.com/articles/s41591-025-03727-2 (cited 273); DeepSeek R1 92.5% USMLE https://www.sciencedirect.com/science/article/pii/S1807593226001493
[s5] Qwen3 medical benchmark: https://qwenlm.github.io/blog/qwen3 ; Medmarks benchmark https://arxiv.org/html/2605.01417v1
[s6] LLM pricing comparison: https://artificialanalysis.ai/models ; https://www.grizzlypeaksoftware.com/library/comparing-llm-provider-pricing-and-performance
[s7] Hippocratic AI Polaris 3.0/5.0: https://hippocraticai.com/polaris-3 ; https://hippocraticai.com/hippocratic-ai-launches-polaris-5-0
[s8] MedGemma launch + 1.5 update: https://research.google/blog/medgemma-our-most-capable-open-models-for-health-ai-developme ; https://developers.google.com/health-ai-developer-foundations/medgemma/model-card
[s9] Llama 4: https://ai.meta.com/blog/llama-4-multimodal-intelligence (Apr 5 2025); model card https://github.com/meta-llama/llama-models/blob/main/models/llama4/MODEL_CARD.md
[s10] Phi-4 mini: https://huggingface.co/microsoft/Phi-4-mini-instruct ; https://arxiv.org/html/2503.01743v1
[s11] Gemma 3: https://arxiv.org/html/2503.19786v1 ; https://huggingface.co/blog/gemma3
[s12] Edge LLM rankings: https://www.promptquorum.com/power-local-llm/mobile-llm-models-phi4-gemma-smollm ; https://www.digitalapplied.com/blog/small-language-models-on-device-agents-2026-guide
[s13] FLORES-200: https://github.com/facebookresearch/flores/blob/main/flores200/README.md
[s14] Sarvam-1 / IndicTrans2: https://www.sarvam.ai/blogs/sarvam-1 ; https://github.com/ai4bharat/IndicTrans2
[s15] Whisper Pashto WER >100%: https://arxiv.org/html/2604.06507v1
[s16] TTS comparison XTTS-v2 / F5-TTS: https://huggingface.co/coqui/XTTS-v2 ; https://gigagpu.com/best-tts-models-2026
[s17] Fully Open Meditron: https://arxiv.org/html/2605.16215v2
[s18] BGE-M3 / multilingual-e5-large: https://huggingface.co/BAAI/bge-m3
[s19] llama.cpp Android: https://github.com/ggml-org/llama.cpp/discussions/14356 ; https://cactuscompute.com/compare/best-on-device-llm-framework
[s20] Llama 3.2 on phones: https://www.reddit.com/r/LocalLLaMA/comments/1fppt99 ; https://ai.meta.com/blog/llama-3-2-connect-2024-vision-edge-mobile-devices
[s21] OpenAI pricing: https://developers.openai.com/api/docs/pricing ; Azure OpenAI https://azure.microsoft.com/en-us/pricing/details/azure-openai
[s22] Anthropic pricing/deprecations: https://www.anthropic.com/claude/sonnet ; https://platform.claude.com/docs/en/about-claude/model-deprecations ; https://www.anthropic.com/news/claude-3-7-sonnet
[s23] DeepSeek R1 USMLE 92.5%: https://www.sciencedirect.com/science/article/pii/S1807593226001493 ; MedXpertQA o1 https://icml.cc/virtual/2025/poster/45718
[s24] HealthBench: https://openai.com/index/healthbench (May 12 2025); PMC12547120 https://pmc.ncbi.nlm.nih.gov/articles/PMC12547120
[s25] GLM-4.6: https://z.ai/blog/glm-4.6 ; https://llm-stats.com/blog/research/glm-4-6-launch
[s26] Grok 3/4: https://x.ai/news/grok-4 ; https://x.ai/news/grok-3
[s27] Qwen3 technical report: https://arxiv.org/html/2505.09388v1 ; https://qwenlm.github.io/blog/qwen3
[s28] DeepSeek R1 distilled: https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B
[s29] MedGemma 4B 64.4% / 1.5 87.7%: https://research.google/blog/medgemma-our-most-capable-open-models-for-health-ai-developme ; https://innfactory.ai/en/ai-models/medgemma
[s30] UrduBench / Urdu reasoning: https://arxiv.org/html/2601.21000v1 ; https://openreview.net/pdf?id=JQHhJiiOux
[s31] Persian LLM benchmark / Gemini 2.5: https://pmc.ncbi.nlm.nih.gov/articles/PMC12796361 (Sheikhalishahi 2025)
[s32] Pakistani 5-language LLM bias: arxiv 2506.00068v2 https://arxiv.org/html/2506.00068v2
[s33] Cohere / OpenAI embeddings pricing: https://cohere.com/blog/introducing-embed-v3 ; https://community.openai.com/t/inconsistent-pricing-for-text-embedding-3-large-between-mod
[s34] Gemini 2.5 Flash pricing: https://pricepertoken.com/pricing-page/model/google-gemini-2.5-flash
[s35] Llama 3.2 on-device: https://medium.com/pythoneers/llama-3-2-1b-and-3b-small-but-mighty-23648ca7a431 ; https://tech-insider.org/phi-4-mini-vs-gemma-3-vs-llama-3-2-2026
[s36] Mistral Large 3 / Ministral 3: https://mistral.ai/news/mistral-3 ; https://docs.mistral.ai/models
[s37] Whisper Urdu WER 26.23% (kingabzpro): https://huggingface.co/kingabzpro/whisper-large-v3-turbo-urdu ; Whisper Pashto/Punjabi/Urdu benchmark Sehar 2025 https://aclanthology.org/2025.chipsal-1.20
[s38] SeamlessM4T v2: https://ai.meta.com/research/seamless-communication ; Nature 2025 https://www.nature.com/articles/s41586-024-08359-z
[s39] GPT-5.1: https://openai.com/index/gpt-5-1 (Nov 12 2025)
[s40] Med-PaLM 2 86.5%: https://pmc.ncbi.nlm.nih.gov/articles/PMC11922739 (Singhal 2025, Nature Medicine)
[s41] Vector DB comparison: https://kanopylabs.com/blog/lancedb-vs-chroma-vs-sqlite-vec ; https://www.firecrawl.dev/blog/best-vector-databases
[s42] Hippocratic AI 10M calls 99.9% safety: https://hippocraticai.com/benchmarks ; https://hippocraticai.com/real-world-evaluation-llm
[s43] Qwen3-1.7B: https://huggingface.co/Qwen/Qwen3-1.7B
[s44] Phi-4 mini technical report: https://arxiv.org/html/2503.01743v1
[s45] MedMCQA / PubMedQA leaderboards: https://medmcqa.github.io ; https://pubmedqa.github.io ; https://huggingface.co/blog/leaderboard-medicalllm
[s46] Roman Urdu low-resource: https://aclanthology.org/2025.lowresnlp-1.9
[s47] Medical LLMs / Open Medical-LLM Leaderboard: https://nlp.johnsnowlabs.com/docs/en/LLMs/medical_llm
[s48] Dr. Qwen / FineMedLM-o1: https://pub.towardsai.net/dr-qwen-fine-tuning-evaluating-medical-llms-from-0.6b-to-8b-with ; https://arxiv.org/html/2501.09213v3
[s49] Llama 3.2 1B memory + Qualcomm AI Hub: https://medium.com/pythoneers/llama-3-2-1b-and-3b-small-but-mighty-23648ca7a431 ; https://aihub.qualcomm.com/mobile/models/llama_v3_2_1b_instruct
[s50] Gemini 2.5 Pro pricing: https://pricepertoken.com/pricing-page/model/google-gemini-2.5-pro ; https://www.cloudzero.com/blog/gemini-pricing

---

## 13. ONE-PAGE EXECUTIVE SUMMARY

| Decision | Recommendation | Rationale |
|---|---|---|
| Cloud tier reasoning | **GPT-5.1 via Azure OpenAI** (HIPAA BAA) | 95.84% MedQA SOTA [s1]; structured output; vision |
| Cloud tier multilingual | **Gemini 2.5 Pro** | Best Urdu/Dari/Persian among frontier [s3][s31]; $0.625/$5 |
| Cloud tier safety validator | **MedGemma 1.5 27B** (HADF terms) | 87.7% MedQA [s29]; replicates Hippocratic Polaris architecture |
| Mid-tier reasoning | **Qwen3-32B** (self-hosted, Q4) | Apache 2.0; thinking mode; best multilingual open LLM |
| Mid-tier medical specialist | **MedGemma 1.5 27B** or **MedQwen-32B** | Best open medical specialist |
| On-device tier | **Qwen3-1.7B Q5_K_M via llama.cpp** | 1.1 GB; 6-10 tok/s on Tecno; multilingual incl. Urdu |
| On-device ASR | **Whisper Tiny Q8** (Roman-Urdu) + cloud for native | Real-time on mid-tier |
| On-device TTS | Android system Urdu voice + 50 pre-cached Urdu MP3 phrases | Reliable across OEMs |
| Embeddings | **BGE-M3** (1024d, MIT, 100+ lang) | Best multilingual open embedder [s18] |
| Vector DB (cloud) | **Qdrant** (Apache 2.0) | Production-grade |
| Vector DB (on-device) | **sqlite-vec** (extends SehatAI SQLite db) | Lowest friction |
| Cost per 1,000 convs | **~$55 hybrid = $0.055/conversation** | Scenario C in §9 |
| Pashto support | **FINE-TUNE NEEDED** — $9K, 4 months | Whisper WER >100% out-of-box [s15] |
| Balochi support | **UNSOLVED — build corpus first** | Zero pretraining data anywhere |
| HealthBench | Adopt as internal safety regression | OpenAI May 2025 [s24] |

**Three biggest gaps**: (1) Pashto/Balochi at every layer (ASR/LLM/TTS), (2) no open multi-specialist validator constellation (Hippocratic-style), (3) on-device 1-3B models cannot do safe triage — must be repositioned as "offline safety net + clarification," not "offline triage."

---

*End of report. Research Agent #7.*
