# Competitor Analysis: Doctor Dignity & DoctorGPT (vs SehatAI)

**Audit date:** 2026-08-31
**Auditor:** Research Agent #2
**Method:** Downloaded both repos in full via `codeload.github.com` tarballs (238 files / 18 MB for Doctor Dignity; 2 files / 1.7 MB for tmc/DoctorGPT), read every doctor-relevant file, fetched HuggingFace model repos + configs via the HF API, scraped GitHub HTML pages for stars/forks/issues (REST API was rate-limited), and read community issues (#13, #16, #21, #24, #27, #30–#36) including the maintainer's own replies. Every claim below is cited to a real file, cell, or issue.

**Bottom line up front:** Neither repo is a product. **Doctor Dignity is a marketing README stapled onto a fork of Apache-2.0 MLC-LLM runtime code, plus a fine-tuned Llama-2-7B checkpoint on HuggingFace with an empty model card.** **tmc/DoctorGPT is a 2-file frozen snapshot fork of Siraj Raval's original DoctorGPT repo — its owner (GitHub user `tmc`, Travis Cline) has made zero commits to it.** Both are dead since Aug–Sep 2023. Neither contains any safety architecture, emergency handling, evaluation, or app code of its own. The one genuinely strong idea — **a private, offline, on-device medical LLM** — is a positioning SehatAI can and should absorb into its offline tier.

---

# PART A — REPO 1: Doctor Dignity (`llSourcell/Doctor-Dignity`)

## A1. Overview

| Field | Value |
|---|---|
| Repo | `https://github.com/llSourcell/Doctor-Dignity` (default branch `main`) |
| Author | Siraj Raval (`llSourcell`) — AI YouTuber/educator (~750k subscribers); companion video "I Built a Medical AI in 24 Hours" (Aug 2023) |
| Created | 2023-08-06T18:02:55Z (originally named `DoctorGPT`, renamed mid-Sep 2023) |
| Last commit | **2023-09-21** — dead for ~3 years |
| Stars / Forks / Watchers | **3,821 / 408 / 53** (scraped from repo HTML) |
| Open issues | ~22 (none triaged; repo abandoned) |
| Commits / Releases | 417 / **0 releases** |
| License | **Apache-2.0** (`LICENSE`, inherited from the MLC-LLM fork) |
| Repo description | "Doctor Dignity is an LLM that can pass the US Medical Licensing Exam. It works offline, it's cross-platform, & your health data stays private." |
| Size | 18 MB, 238 files |

**What it actually is.** The repo is a near-verbatim copy of **`mlc-ai/mlc-llm`** (the Apache TVM-based "Machine Learning Compilation" LLM runtime — `cpp/`, `mlc_llm/`, `python/mlc_chat/`, `ios/MLCChat`, `android/MLCChat`, `docs/`, `site/`, `3rdparty/` with TVM/tokenizers-cpp/googletest submodules per `.gitmodules`). Siraj's own contributions are essentially:
1. A rewritten `README.md` (the Doctor Dignity pitch), and
2. One educational notebook `Machine_Learning_Compilation_for_Beginners.ipynb` (companion to his "MLC for Beginners" video; builds a numpy char-level LM — mentions "Dr Dignity" only in the intro),
3. Two small community PRs merged for the bundled Android app (from `bowels`: "fixed crash / added keyboards due to input type field", "added devices restrictions from a12 and higher. Fixed UI buttons / Positioning / Theme (dark mode)" — commit log).

The actual "Doctor Dignity model" is **not in this repo** — it lives on HuggingFace: [`llSourcell/medllama2_7b`](https://huggingface.co/llSourcell/medllama2_7b) (the 7B fine-tune) and [`llSourcell/doctorGPT_mini`](https://huggingface.co/llSourcell/doctorGPT_mini) (a smaller MLC-quantized variant). The README instructs users to install the **stock MLC Chat app** and manually add the model URL.

**Maintenance status:** Abandoned. Last commit Sep 21, 2023. Issues from Sep 2023 ("Model URL fails to import into MLCChat for Android" #10, "Where is training.ipynb" #16, "Where is the training code??" #27, "unable to build code is incomplete non working demo" #21) remain unanswered to this day. The README itself contains typos and broken links ("Find the right version of MLC LLM for your system **ere**", `ttps://huggingface.com/...`, a Google Drive wget that requires manual confirmation) — signs of a rushed YouTube-demo repo, not a maintained project.

## A2. Tech Stack (verified)

**In the repo (all inherited from MLC-LLM):**
- **C++ / CMake** (`cpp/llm_chat.cc`, `CMakeLists.txt`) — the on-device inference engine
- **TVM (Tensor Virtual Machine)** — `apache-tvm`, submodule `3rdparty/tvm` → `mlc-ai/relax`; compiles Llama/RedPajama/RWKV to iOS Metal / Android Vulkan / CPU
- **Python**: `mlc_llm` build pipeline, `python/mlc_chat` bindings, `python/mlc_chat/rest.py` = FastAPI + uvicorn OpenAI-compatible REST server
- **iOS**: Swift app `ios/MLCChat/` (MLCChat.xcodeproj, ChatView.swift, AppState.swift…)
- **Android**: Kotlin/Compose app `android/MLCChat/` (`ai.mlc.mlcchat` MainActivity/ChatView)
- **Docs**: Sphinx site (`docs/` — verbatim MLC-LLM docs)
- Dependencies listed in README: numpy, torch, datasets, transformers, trl, bitsandbytes, sentencepiece, peft, onnx, TVM, **openai**

**Training stack (only in the notebook, see Part B — deleted from this repo, still in the tmc fork):** QLoRA via PEFT + TRL SFTTrainer on Llama-2-7b-chat-hf, bitsandbytes NF4 4-bit quantization, `paged_adamw_32bit`, Google Colab Pro A100, 24h.

**Notably absent:** no `requirements.txt`/`pyproject` covering the training deps in this repo (`pyproject.toml` is MLC-LLM's build config), no Docker, no CI for anything medical (only `.github/workflows/documentation.yml` = "Build Docs" Sphinx deploy).

## A3. Architecture (how it works end to end)

There is **no Doctor-Dignity-specific application architecture**. The end-to-end flow, reconstructed from the README + files:

1. **Training (out-of-repo / notebook):** Llama-2-7b-chat-hf → QLoRA fine-tune on ~9 MedAlpaca `medical_meadow` instruction datasets → push to HF as `medllama2_7b`. (RLHF/Constitutional-AI stage claimed but non-functional — see B4.)
2. **Deployment target:** the user separately clones **mlc-ai/mlc-llm** (or this fork), builds the TVM runtime + iOS/Android app from source (Xcode + `prepare_libs.sh` + `prepare_params.sh`, or Android Gradle), then in the running stock **MLC Chat** app taps "add model variant" and pastes the HF URL for `doctorGPT_mini`. Inference then runs fully on-device.
3. **Inference:** raw chat completion through the MLC conversation template (see A4) — no retrieval, no tools, no memory beyond the KV-cache chat window, no safety layer.

**Verification the app is stock:** `ios/MLCChat/app-config.json` lists `rwkv-raven-3b` + `RedPajama-INCITE-Chat-3B-v1` (not the doctor model); `android/.../assets/app-config.json` lists `Llama-2-7b-chat-hf-q4f16_1` + RedPajama; `android/.../strings.xml` has `<string name="app_name">MLCChat</string>`. The README's own "iOS QuickStart v2" step says "make sure builtin_list only contains **RedPajama-INCITE-Chat-3B-v1-q4f16_1**" — i.e., following the README verbatim builds an app that ships **RedPajama, not the doctor model**.

## A4. AI Model & Prompt Design

- **Model:** Llama-2-7B fine-tune ("medllama2_7b"); claimed "3 GB" (4-bit quantized). The mobile variant `doctorGPT_mini`'s `mlc-chat-config.json` (fetched from HF) says `"model_lib": "RedPajama-INCITE-Chat-3B-v1-q4f16_0"`, `"conv_template": "redpajama_chat"`, `"estimated_vram_req": 2254857830` (~2.25 GB) — i.e., the "mini" model is packaged on a **RedPajama-3B base/lib, not a quantized Llama-2-7B**, contradicting the README narrative.
- **System prompt: NONE.** The persona lives entirely in the fine-tune. Verified in `cpp/conv_templates.cc`:
  - `Conversation Llama2()` uses the stock Meta prompt: "[INST] <<SYS>>\n\nYou are a helpful, respectful and honest assistant…" — a **generic assistant**, not a doctor.
  - `Conversation RedPajamaChat()` — the template `doctorGPT_mini` actually runs with — has **`conv.system = ""`** (empty string), roles `<human>`/`<bot>`.
  - There is no doctor/medical system prompt anywhere in the repo (grep for "doctor|dignity|medllama|medical" across non-notebook files matches only `README.md`).
- **Training data** (from the notebook): concatenation of 9 MedAlpaca datasets — `medical_meadow_mediqa`, `mmmlu`, `medical_flashcards`, `wikidoc_patient_information`, `wikidoc`, `pubmed_causal`, `medqa`, `health_advice`, `cord19`. Preprocessing: `tokenizer(examples["instruction"] + " " + examples["input"])` with max_length 512, labels = output — plain SFT, no preference data actually usable.
- **"Reinforcement Learning & Constitutional AI" claim:** the PPO cells reference a `medalpaca/medical_meadow_medqa`-derived CSV and a GPT reward prompt ("I want you to act as a reward model trained in the field of medicine… rate 1-10… constitution: (1) as a licensed well-renowned doctor would (2) align with state-of-the-art medical knowledge (3) from a real clinical session, not a website… (4) harmless, helpful, and empathetic (5) like a human psychologist") — a genuinely interesting constitutional prompt — but the code around it **does not run** (see B4).

## A5. Features (classified)

🟢 **Real, working (because MLC-LLM provides them):**
- 🟢 Truly local, on-device inference (iOS Metal / Android Vulkan) — no API key, no data leaves the phone
- 🟢 Offline chat after model download
- 🟢 Open weights (MIT-licensed checkpoints on HF) + Apache-2.0 runtime
- 🟢 OpenAI-compatible REST server (`python/mlc_chat/rest.py`, FastAPI) if you self-host
- 🟢 Cross-platform runtime (iOS/Android/WebGL via MLC) — generic capability, not a doctor feature

🟡 **Partially true / aspirational:**
- 🟡 "Passes the USMLE" — author admitted in issue #32 that this rests on a **semantic-similarity threshold** ("doesn't have to be a verbatim response, thus the accuracy was higher"); independent `lm-evaluation-harness` evaluation in the same issue: **38% on MedQA-USMLE** (a failing score; passing ≈60%+). See A6.
- 🟡 "Fine-tuned with RLHF + Constitutional AI" — code exists in the old notebook but is non-executable; the published checkpoint almost certainly never went through PPO.
- 🟡 "Available on iOS, Android, and Web" — you must build stock MLC Chat yourself and manually add the model; there is **no** Doctor-Dignity app; Web is literally marked "TODO" in the README ("flask run" with no app.py in the repo).

🔵 **Announced / vaporware:**
- 🔵 Online-learning loop ("After each query, a human can rate the model's response… used to further improve the model through reinforcement learning") — no code exists for this anywhere.
- 🔵 "DIY Training" via `training.ipynb` — **file does not exist** (issues #16, #27). The Colab link in the README points to `llSourcell/DoctorGPT/blob/main/llama2.ipynb` (the pre-rename repo path).

🔴 **Absent (and marketed nowhere, to be fair):**
- Any triage, emergency detection, red-flag handling, or safety gate
- Citations / grounding / RAG
- Multi-turn memory, user profile, session persistence
- Voice input/output
- Any language other than English
- Any in-app disclaimer (the only disclaimer is in the README, see A6)

## A6. Safety / Emergency / Medical-Accuracy Approach

**There is none. Be clear about this.**

- The **only** safety text in the entire project is the README banner: *"DISCLAIMER - Do not take any advice from Doctor Dignity seriously yet. This is a work in progress and taking any advice seriously could result in serious injury or even death."* Nothing surfaces in any app UI; nothing is enforced in code.
- **No emergency detection**: chest pain, stroke, suicide ideation, overdose → all go straight to the base model's raw chat continuation. With the RedPajama template, even the generic Llama-2 safety system prompt is **absent** (empty string).
- **No grounding/citations**: outputs are unconstrained token continuations; the "constitution" (in the broken reward prompt) explicitly *penalizes* web/forum-style answers but nothing checks medical accuracy at inference time.
- **Evaluation methodology is the safety hole:** Cell 19 of the notebook "evaluates" on **2 questions** with `is_correct = cosine_similarity >= 0.3` between the model's free-text response and the gold answer using `paraphrase-MiniLM-L6-v2` — "Adjust the threshold as needed, >30% threshold". A second eval function (Cell 21) extracts `generated_text[0]` (the first character of the *echoed prompt*, not the answer) as the predicted letter and runs on the **train** split. Community issue #32 (still open) evaluated with the standard harness and got **38% USMLE / 36% MedMCQA / 73.9% PubMedQA**, i.e., "barely above llama2 7b". Siraj's reply confirms the fuzzy-threshold methodology.
- **Community backlash on record:** Issue #13 "Missing ethical disclosures": *"You can't just make a robot that dispenses medical advice with absolutely no disclosures of risk… It should be physically impossible to engage with this LLM without being clear on the fact it may just tell you to poison yourself. Right now the only safety net is that you need to be computer-literate enough to run a pip command."* Also #12 "Who actually thought of this", #14 "LLM Bros the next Crypto Bros?".

## A7. Privacy / Offline / Local-First

**This is the repo's one genuine, verified differentiator — but it comes from MLC-LLM, not from any Doctor-Dignity engineering:**
- ✅ Inference is 100% on-device; no API calls; `site/privacy.md` (MLC's policy, shipped in the fork): "MLC Chat run all generation locally. All data stays in users' device and is not collected by the app."
- ✅ No accounts, no telemetry in the bundled apps, no server component required.
- ❌ But: the model-download step requires internet + manual URL entry (and per issue #10/#35, the URL import **fails** in current MLC Chat versions — "RedPajama-INCITE-Chat-3B-v1-q4f16_0 not compatible"), so "works offline" is true only *after* a fragile setup that most users never complete (evidence: `doctorGPT_mini` shows **0 downloads** on HF).
- ❌ The **training pipeline depends on OpenAI's API** (synthetic/reward data) — ironic for a privacy-branded project, though it doesn't affect end-user privacy.

## A8. Multilingual / Accessibility

- **Language:** English only. `medllama2_7b` HF tags: `language: en`. Training data is English medical corpora. No i18n layer, no Urdu/Pashto/etc., no RTL.
- **Accessibility:** none beyond stock MLC Chat UI. No voice (STT/TTS) anywhere. No low-literacy or low-vision affordances. Android PR merely restricted devices to Android 12+.

## A9. Strengths

1. **The pitch is right:** free + offline + private + "your own doctor in your pocket" resonated (3.8k stars, 408 forks). The demand signal is real and validated.
2. **Genuine local-first architecture** (via MLC-LLM): on-device 4-bit inference on phones was cutting-edge in Aug 2023 and is still the strongest privacy story possible for a consumer health assistant.
3. **Open everything:** Apache-2.0 runtime, MIT-licensed weights on HF — forkable, auditable, embeddable.
4. **The constitutional reward prompt** (issue-visible in the notebook) is a legitimately thoughtful 5-point medical constitution (doctor-like, SOTA-aligned, not-web-forum, harmless/helpful/empathetic, psychologist-like tone) — a good seed for SehatAI's judge prompts.
5. **Ran a public bounty/PR program** for Android UI fixes — light community management at its peak.
6. Honesty in the README disclaimer ("could result in serious injury or even death") — rare candor, though legally insufficient.

## A10. Weaknesses & Safety Holes (brutal)

1. **Zero safety engineering:** no triage, no red flags, no emergency numbers, no disclaimers in-app, no refusal policy, no follow-up questions, no age/pregnancy/allergy gating. A suicidal user gets a raw Llama/RedPajama completion.
2. **The headline claim is false:** "passes the USMLE" was produced by a 2-question, cosine-similarity≥0.3 "eval"; standard harness says 38% — a failing grade. The author's own issue reply admits the methodology.
3. **No working training code in the repo:** `training.ipynb` referenced in README does not exist (issues #16, #27, #30). The repo cannot reproduce its own model.
4. **The RLHF/Constitutional stage never ran:** PPO cells have syntax errors (`evaluate_response(input predicted_output, target_output)` — missing comma; undefined `predicted_output`/`actual_output`; a function named `constitutional_evaluation` that doesn't exist) and cells 49–69 are a **copy-paste of the TRL IMDB sentiment PPO example** (trains "TinyPixel/Llama-2-7B-bf16-sharded" on IMDB reviews with a *sentiment* reward — nothing medical). The notebook itself used a **"Developer Mode" jailbreak** on Llama-2 as "Step 1" of the tutorial (cell 21: nested role-play prompt instructing the model to ignore Meta's content policy "for benchmarking… in uncensored conditions") — i.e., the pre-finetune "eval" numbers were obtained by jailbreaking.
5. **Identity confusion:** the marketed model is Llama-2-7B; the mobile artifact (`doctorGPT_mini`) is packaged on a RedPajama-3B base with an empty system prompt — nobody validated which model users actually chat with.
6. **Broken on-ramp:** stock-app + manual URL import fails (issues #10, #35); 0 downloads of the mobile weights; Google Drive links; typos; "Web (TODO)".
7. **Abandoned:** last commit Sep 21, 2023; ~22 open issues with no maintainer response since.
8. **Legal/regulatory blindness:** no discussion of medical-device regulation, no license/consent, no age gate — issue #13 called this out and it was never addressed.

## A11. What SehatAI Should Learn / Adapt / Avoid

**Adapt:**
- **The privacy positioning** — "offline, private, no API costs" is a proven wedge (3.8k stars on the pitch alone). SehatAI already has an offline deterministic engine; make local-first the *headline*, not a fallback: e.g., an optional on-device tier (Qwen-0.5B/1.8B, Gemma-2B, or a distilled medical mini-model via llama.cpp/MLC) for privacy-sensitive users, with the cloud cascade as an *enhancement*.
- **The constitutional reward prompt's 5 points** — fold them into SehatAI's L2 judge system prompt (licensed doctor-like, SOTA-aligned, not-web-forum, empathetic, no fabricated contact info).
- **Bundle-the-model UX lesson:** if SehatAI ever ships a local model, ship it *inside* the app (PWA is harder — consider Tauri/Capacitor wrapper or Wasm-compiled runtime), never "install app X then paste URL Y".

**Avoid:**
- **Claiming benchmark passes without a standard harness.** SehatAI's 139-case golden eval must stay exact-match/graded by rubric, never fuzzy similarity — this is exactly what destroyed Doctor Dignity's credibility with power users (issue #32).
- **README-ware:** shipping marketing copy for features that don't exist (Web TODO, missing training.ipynb) — SehatAI's docs-vs-implementation mismatches (already flagged by Agent 1) are the same failure mode at smaller scale.
- **Jailbreak-as-method:** never use policy-evasion prompts in any eval or demo; it poisons the safety story.
- **Fine-tune-only persona:** persona via weights alone (no system prompt, no retrieval) produces an inconsistent doctor identity. SehatAI's deterministic layer + prompts + RAG is categorically safer.

## A12. License & Reusability

- **Repo code:** Apache-2.0 (MLC-LLM's `LICENSE`). SehatAI (MIT) **may legally borrow** runtime/deployment code (TVM build scripts, iOS/Android MLC bindings, `rest.py` FastAPI/OpenAI-compatible server) with attribution + NOTICE file. Note the code is 2023-vintage; today `mlc-ai/mlc-llm` upstream (still active, now under Apache) is the better fork point.
- **Weights:** `llSourcell/medllama2_7b` and `doctorGPT_mini` are tagged **MIT on HuggingFace** — commercially reusable. Practically: the model scores 38% on USMLE (worse than most modern base models), so there is **nothing worth borrowing** from the weights; modern alternatives (Llama-3.1-8B, Qwen2.5, Gemma-2, or medical-tuned BioMistral/MedGemma) dominate it.
- **Training notebook:** no explicit license in tmc's fork (see B12); the methodology (QLoRA on MedAlpaca) is public-domain-ish know-how, but the datasets themselves (MedAlpaca/medical_meadow derived from MedQA/ChatGPT-generated content) carry their own licensing/ethical questions — **do not train SehatAI on medical_meadow**.

---

# PART B — REPO 2: DoctorGPT (`tmc/DoctorGPT`)

## B1. Overview

| Field | Value |
|---|---|
| Repo | `https://github.com/tmc/DoctorGPT` (default branch `main`) |
| Owner | GitHub user **`tmc` = Travis Cline** (verified from profile vcard). ⚠️ Often described online as "DoctorGPT by Tom Chiu" — **the repo itself contains no Tom Chiu attribution**; the task brief's attribution could not be verified against any file or commit (the README credits only "Meta, MedAlpaca, Apache, MLC Chat & OctoML" and instructs `git clone https://github.com/llSourcell/DoctorGPT.git`). Flagged as an attribution discrepancy. |
| What it is | A **fork snapshot of Siraj Raval's original DoctorGPT repo** (created 2023-08-13, fork lineage `llSourcell/Doctor-Dignity`), made days after Siraj's video, **before** Siraj deleted the notebook and rebuilt his repo into the MLC-LLM fork (renaming it Doctor Dignity) |
| Last commit | **2023-08-12** (by `llSourcell`; the fork's owner has **0 commits**) — dead ~3 years |
| Stars / Forks / Watchers | **3 / 4 / 0** |
| Commits | 37 — all by `llSourcell` (35) + `web-flow` merge bot; **zero original commits by tmc** |
| License | **None** (no LICENSE file; GitHub shows no license) |
| Contents | **Exactly 2 files:** `README.md` (79 lines) + `llama2.ipynb` (1.7 MB, 76 cells) |
| Description | "DoctorGPT is an LLM that can pass the US Medical Licensing Exam. It works offline, it's cross-platform, & your health data stays private." |

**Why it exists / why anyone references it:** it is the only surviving copy of Siraj's original 2-file DoctorGPT repo (README + the actual `llama2.ipynb` training notebook that the current Doctor-Dignity repo **no longer contains**). It's a fossil, not a fork in any active sense: 3 stars, no README edits by the owner, no issues worth mentioning, no releases.

## B2. Tech Stack (verified)

Everything is inside `llama2.ipynb` (Colab metadata: GPU A100, `accelerator: GPU`):
- **PyTorch + Transformers + PEFT (LoRA) + TRL (SFTTrainer/PPOTrainer) + bitsandbytes (NF4 4-bit) + sentencepiece + sentence-transformers + openai (reward model) + onnx + tvm**
- Model: `meta-llama/Llama-2-7b-chat-hf`, quantized via `BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type='nf4', bnb_4bit_compute_dtype=…)` (cell 8–10)
- Training: `LoraConfig(lora_alpha=16, lora_dropout=0.1, r=64, bias="none", task_type="CAUSAL_LM")` (cell 33); `TrainingArguments(per_device_train_batch_size=4, gradient_accumulation_steps=4, optim='paged_adamw_32bit', learning_rate=2e-4, fp16=True, max_steps=5000, max_seq_length=512)`; `SFTTrainer` with `DataCollatorForLanguageModeling(mlm=False)`
- Data: 9× `medalpaca/medical_meadow_*` concatenated via `concatenate_datasets` (cell 24)
- Deployment sketch: `torch.onnx.export` → `relay.frontend.from_onnx` → `lib.export_library("tvm")` (cells 72–74), then prose instructions for cross-compiling TVM for iOS (cell 75)
- **No app code, no server code, no tests, no requirements.txt** — the README's "flask run" web section has no Flask app behind it.

## B3. Architecture

A single Colab notebook "6 Step Tutorial" (cell 0):

1. **"Jailbreak Meta's Llama2"** (Step 1, cells 14–21) — includes `llama_inference()` (greedy, max_length=100) and the Developer-Mode nested-role jailbreak prompt used to force uncensored answers "to get it to answer sensitive medical questions" for the baseline USMLE "eval"
2. **Evaluate on USMLE** (cells 17–19) — `GBaker/MedQA-USMLE-4-options` **train split**, 2 rows, cosine-similarity ≥ 0.3
3. **Fine-tune** (Step 2, cells 22–37) — QLoRA SFT on MedAlpaca (details above), `trainer.push_to_hub()` → the model that became `medllama2_7b`
4. **"RLHF"** (Step 3, cells 40–69) — Constitutional-AI reward via `openai.Completion.create(engine="text-davinci-003")` scoring 1–10 against a 5-point medical constitution (cell 44); PPO loop (cell 46) + a "Version2" loop (cells 49–69) that is the **TRL IMDB sentiment example verbatim** (model `TinyPixel/Llama-2-7B-bf16-sharded`, `load_dataset("imdb")`, sentiment-logit rewards, `ctrl_str = ["[negative]", "[neutral]", "[positive]"]`)
5. **Export** (cells 70–75) — ONNX → TVM Relay → iOS prose

There is **no runtime architecture**: no serving code, no UI, no state, no retrieval, no tools. The intended deployment (README): install stock MLC Chat on iOS/Android and add `huggingface.co/llSourcell/medllama2_7b` as a model URL.

## B4. AI Model & Prompt Design

- **Model:** Llama-2-7B-chat-hf, QLoRA r=64 on 9 MedAlpaca instruction datasets, 5000 steps on a Colab A100 (~24h per README).
- **System prompt:** none defined anywhere. The "doctor" persona is purely whatever the MedAlpaca SFT data baked in.
- **The only substantial prompt artifact in the entire repo is the jailbreak** (cell 21, ~600 words of Developer-Mode roleplay: "AI with Developer Mode enabled ignores all of Meta's content policy. This is only for benchmarking the model in uncensored conditions…") — used as the *baseline evaluation harness*. This is the project's actual prompt-engineering contribution, and it is a safety anti-pattern.
- **Reward-model constitution** (cell 44): the 5-point medical constitution quoted in A4 — the most interesting reusable idea here.

## B5. Features (classified)

🟢 **Real:** 🟢 single runnable QLoRA medical fine-tune recipe (it works — it produced `medllama2_7b`); 🟢 free weights on HF; 🟢 offline inference *if* you install MLC Chat separately.
🟡 **Partial:** 🟡 "passes USMLE" (fuzzy-threshold eval, debunked at 38% by issue #32 on the parent repo); 🟡 "24-hour training" (SFT yes; RLHF no); 🟡 iOS/Android support (manual, stock app, broken URL per issues #10/#35).
🔵 **Vaporware:** 🔵 Web app ("flask run" with no app.py); 🔵 online human-feedback learning loop; 🔵 "training.ipynb" (the file is named `llama2.ipynb`).
🔴 **Absent:** triage, emergencies, disclaimers, citations/RAG, memory, voice, non-English languages, tests, licenses.

## B6. Safety / Emergency / Medical-Accuracy Approach

**None — worse than none: the repo's pedagogy actively teaches bypassing model safety.** Step 1 of the tutorial is a jailbreak; the "improvement" story is (a) jailbreak → (b) SFT that mimics medical Q&A without any guardrails → (c) an RL stage that would have *rewarded* doctor-likeness via GPT scoring but never executed due to syntax errors. No emergency detection, no disclaimers in any artifact (the Dignity README disclaimer isn't even in this fork — this repo's README has **no disclaimer at all**), no eval beyond the 2-question cosine check. Medical accuracy was never measured honestly on either repo.

## B7. Privacy / Offline / Local-First

Same claims, same reality as Part A (the README is Siraj's original text): offline/local inference is delegated to MLC Chat; the notebook itself requires internet (HF datasets, OpenAI API for the reward model); no data handling code exists in this repo because there's no app. Nothing to verify — nothing is implemented here.

## B8. Multilingual / Accessibility

None. English-only data and UI (stock MLC Chat). No voice, no accessibility work.

## B9. Strengths

1. **The notebook is a complete, readable educational artifact** — a beginner can follow the full journey (quantization → SFT → [broken] RL → ONNX/TVM export) in one file. As teaching material it's decently structured (76 cells, markdown explanations, diagrams).
2. **Preserves the actual training code** that the parent repo lost when it was rebuilt — it is the *only* place the DoctorGPT/Doctor-Dignity methodology survives.
3. Honest about dependencies (lists all of them, single pip install line).
4. The constitutional reward prompt (shared with parent repo).

## B10. Weaknesses & Safety Holes (brutal)

1. **It is not a project — it's a mirror.** Zero commits, zero issues engagement, no license, 3 stars. Using it as a "competitor" flatters it; it's a 2-file fossil of a 2023 YouTube demo.
2. **Teaches jailbreaking as step 1** of a medical AI pipeline — normalizes safety-bypass for an audience of beginners.
3. **Non-functional RLHF with fake provenance:** syntax errors (`evaluate_response(input predicted_output, target_output)`; undefined `constitutional_evaluation`, `predicted_output`, `actual_output`; `conversation history = ''` — a space in a variable name, cell 48) plus a pasted IMDB-sentiment PPO example that would train a movie-review classifier, not a doctor. A reader who "runs the notebook" trains a model that was never validated, then runs unrelated code.
4. **Evaluation fraud-adjacent:** 2 questions, cosine ≥ 0.3, train split, first-character answer extraction — the "passes USMLE" claim's entire evidentiary basis.
5. **Deprecated/imaginary APIs:** `openai.Completion.create(engine="text-davinci-003")` was already sunset in 2023; GPT2Tokenizer for a Llama model (cell 42).
6. **No license at all** — legally, no one may reuse this code (default copyright). 
7. No safety, no disclaimers, no multilingual, no app, no maintenance (dead since Aug 12, 2023).

## B11. What SehatAI Should Learn / Adapt / Avoid

- **Learn:** the pedagogical value of an end-to-end notebook (SehatAI could publish a reproducible "how we built/evaluated the safety engine" notebook — it would be a differentiator vs both these repos and most competitors); the 5-point constitutional prompt as judge-prompt seed.
- **Adapt:** nothing code-wise (unlicensed + obsolete stack). If pursuing a local model tier, skip Llama-2 and use modern sub-2B models with an actual eval harness.
- **Avoid:** unlicensed forks; jailbreak framing; sim-threshold evals; claiming RLHF you didn't run; "3 GB LLM passes USMLE" headline marketing that collapses under the first external audit.

## B12. License & Reusability

- **No LICENSE file** → default copyright; **SehatAI may NOT legally copy** `llama2.ipynb` or the README from this fork (the same content on the parent repo is covered by Apache-2.0 for the runtime code, but the notebook itself was never re-published under a license). Ideas (LoRA config, constitution text, dataset list) are not copyrightable per se, but verbatim code reuse is off-limits.
- The linked weights (`llSourcell/medllama2_7b`) are MIT — reusable, but not worth reusing (38% USMLE).

---

# PART C — Comparison Table

Dimensions: Doctor Dignity vs tmc/DoctorGPT vs **SehatAI** (per Agent 1's audit of `jamshidnabizada7-boop/SehatAI-`, file `01_sehatai_audit.md`).

| # | Dimension | **Doctor Dignity** (llSourcell) | **DoctorGPT** (tmc fork) | **SehatAI** (typical current state) |
|---|---|---|---|---|
| 1 | What it is | README + forked MLC-LLM runtime + HF weights | 2-file fossil fork (README + training notebook) | Next.js 16 PWA, 12-phase triage pipeline |
| 2 | Origin / maturity | YouTube demo (Aug 2023), abandoned Sep 2023 | Mirror of the above (Aug 2023), 0 owner commits | 4-day-old prototype, single author, MIT |
| 3 | Stars / community | 3,821 ⭐ / 408 forks / ~22 open issues | 3 ⭐ / 4 forks | 1 ⭐ / 0 forks |
| 4 | Primary AI approach | Local fine-tuned Llama-2-7B (QLoRA, MedAlpaca) | Same (this fork documents the training) | Cloud LLM cascade (7 providers: Qwen/Gemini/Groq/Cerebras/OpenRouter/Mistral/ZAI) + deterministic rules + RAG over 160-item WHO-based corpus |
| 5 | LLM location | 100% on-device (privacy moat) | Same (aspiration; via external MLC Chat app) | Server-side (API keys), offline deterministic fallback engine |
| 6 | System prompt | **None** (Llama template = generic assistant; RedPajama = empty) | None (notebook only) | 5 engineered prompts (L1 triage, generation w/ 12 hard rules, abstention, judge, translation) |
| 7 | Safety architecture | **Zero** (README disclaimer only) | Zero | 28 red-flag regexes, 23 emergency templates, L0/L1/L2 layered gates, sub-100ms emergency short-circuit |
| 8 | Emergency handling | None | None | 4 Pakistan emergency numbers (1122/1023/1166/115), emergency overlay UI |
| 9 | Medical grounding | None (raw SFT continuation) | None | RAG w/ citations, citation-grounding step, abstention path |
| 10 | Evaluation | 2-question cosine≥0.3 + broken char-match; independent: **38% USMLE (fail)** | Same (defines it) | 139 golden cases, 6 categories, under-triage/FP/refusal/citation metrics (early but real) |
| 11 | RLHF / judges | Claimed; code broken + IMDB-example paste; constitution prompt never ran | Same (the code lives here) | LLM-as-judge in pipeline w/ 1 regeneration (no RLHF) |
| 12 | Multilingual | English only | English only | Urdu/Roman-Urdu/English (3 of Pakistan's languages; no Pashto/Sindhi/Punjabi/Balochi) |
| 13 | Voice / accessibility | None | None | STT (ZAI) + TTS (browser SpeechSynthesis — weak on low-end devices) |
| 14 | Offline capability | ✅ True local inference (after painful setup) | Aspirational | ✅ Deterministic offline engine (rules + corpus; no LLM offline) |
| 15 | Privacy model | ✅ Best possible (nothing leaves device) | Same claim, nothing implemented | ❌ Weakest link: PHI in SQLite committed to repo, no auth, cloud LLM calls |
| 16 | Deployment | DIY: build MLC app from source, paste model URL | None (notebook) | Vercel PWA + Docker + Caddy |
| 17 | License | Apache-2.0 (code) + MIT (weights) — reusable | **None** — not reusable | MIT |
| 18 | Maintenance / last activity | Dead since 2023-09-21 | Dead since 2023-08-12 | Active (4 days old) |

**Net assessment:** SehatAI is categorically more engineered on safety/grounding/eval than either repo (they have literally zero of those layers), but **Doctor Dignity still beats SehatAI on the privacy dimension** (true on-device inference vs SehatAI's cloud calls + committed PHI database) and on community proof-of-demand (3.8k stars for the local-first pitch). Neither repo offers anything worth borrowing at the code level except the *strategy* of an offline/private tier and the constitutional judge prompt.

---

# Appendix — Evidence Index

**Doctor Dignity repo (files inspected in full):** `README.md` (disclaimer quote; "iOS QuickStart v2" RedPajama builtin; Web TODO; broken links `ere]`, `ttps://`; HF links medllama2_7b + doctorGPT_mini; Colab link pointing to old repo name `llSourcell/DoctorGPT/blob/main/llama2.ipynb`), `LICENSE` (Apache-2.0), `CONTRIBUTORS.md` (MLC LLM Contributors), `.gitmodules` (tvm=mlc-ai/relax), `.github/workflows/documentation.yml` (docs CI only), `ios/MLCChat/app-config.json` (rwkv + RedPajama), `ios/prepare_model_lib.py`, `ios/prepare_params.sh`, `android/.../assets/app-config.json` (Llama-2-7b + RedPajama), `android/.../strings.xml` (`app_name` = MLCChat), `cpp/conv_templates.cc` (`Conversation Llama2()` generic system prompt; `Conversation RedPajamaChat()` with `conv.system = ""`), `python/mlc_chat/rest.py` (FastAPI OpenAI-compat server), `tests/evaluate.py` (MLC debug tool, default prompt "The capital of Canada is"), `site/privacy.md` ("All data stays in users' device"), `docs/README.md` (vanilla MLC Sphinx docs), `Machine_Learning_Compilation_for_Beginners.ipynb` (42 cells, numpy char-LM tutorial), `version.py` (0.1.dev0). `find . -name "*.ipynb"` → only 2 notebooks; `training.ipynb` absent; `llama2.ipynb` absent (404 via raw.githubusercontent).

**tmc/DoctorGPT repo:** `README.md` (79 lines; "DoctorGPT… can pass the US Medical Licensing Exam… 3 Gigabytes… iOS, Android, and Web"; `git clone https://github.com/llSourcell/DoctorGPT.git` remnant; no disclaimer), `llama2.ipynb` (76 cells; key cells 0/8/10/17/19/21/24/28/31/33/39/42/44/46/49–69/72–74 quoted above; md5 `99ec0b53360d5437444d370d50bbb577`).

**HuggingFace API:** `llSourcell/medllama2_7b` — lastModified 2023-08-21, downloads 200, likes 132, tags incl. `en`, MIT, `dataset:medalpaca/medical_meadow_medqa`, model card body **empty** (frontmatter only); files = 2× pytorch_model .bin shards + configs. `llSourcell/doctorGPT_mini` — lastModified 2023-08-14, downloads **0**, likes 40, tags MIT; files = mlc-chat-config.json + ndarray-cache.json + params shards; `mlc-chat-config.json`: `model_lib: RedPajama-INCITE-Chat-3B-v1-q4f16_0`, `conv_template: redpajama_chat`, `estimated_vram_req: 2254857830`.

**GitHub HTML-scraped metadata:** Dignity — createdAt 2023-08-06T18:02:55Z, stargazerCount 3821, forksCount 408, watcherCount 53, commitCount 417, Apache-2.0, no releases, last commit Sep 21 2023; recent commit subjects incl. "Update README.md", "Add files via upload", "Merge pull request #34 from bowels/main", "removed hardcoded id", "fixed crash / added keyboards…", "model update for ios", "[Android] llama2 app (#869)". tmc/DoctorGPT — createdAt 2023-08-13T16:36:34Z, isFork:true (parent llSourcell/Doctor-Dignity), stars 3, forks 4, commitCount 37, authors: 35× llSourcell + web-flow, **no tmc commits**, last commit Aug 12 2023, no license. GitHub profile `tmc` = Travis Cline.

**Issues (Doctor Dignity):** #4 (OOM on EC2), #5 (missing config.json), #7 ("Better than GPT-4？[USMLE]"), #10 (model URL fails to import into MLCChat Android), #12 ("Who actually thought of this"), #13 (Missing ethical disclosures — quoted in A6), #14 ("LLM Bros the next Crypto Bros?"), #16 ("Where is training.ipynb"), #21 ("unable to build code is incomplete non working demo"), #24 ("is there any info constitutional_evaluation function??"), #26 (RuntimeError shape), #27 ("Where is the training code??"), #29 (no module named tvm), #30 (notebook link not responding), #31 (rwkv not found iOS), #32 (**"Impossible to reproduce results, model performs poorly" — lm-eval-harness: 38% USMLE / 36% MedMCQA / 73.9% PubMedQA; Siraj's reply admitting semantic-similarity threshold methodology**), #33 (confused how to run on Linux), #35 (MLCChat can't import URL — RedPajama not compatible), #36 (how to "Web (TODO)"?).

*Note on attribution: the brief labels DoctorGPT as "by Tom Chiu." The repo `tmc/DoctorGPT` is owned by GitHub user `tmc` (Travis Cline) and contains zero original commits — it is a fork snapshot of Siraj Raval's repo. No verifiable connection between Tom Chiu and this repo was found in the repo files, README, commit history, or (due to sandbox search-engine limitations) the web. This is flagged rather than asserted.*
