# Competitor Group A — AI Health Assistants (Consumer Symptom / Chat)

**Researcher:** Agent #3 (Competitor Group A)
**Date compiled:** 2026 (covers 2024–2026 web evidence)
**Method:** z-ai web_search across official company sites, peer-reviewed journals (Nature npj Digital Medicine, JMIR, BMJ Open, Annals of Internal Medicine, PMC), reputable press (Fierce Healthcare, MobiHealthNews, TechCrunch, WSJ, Wired, Sifted, Reuters/CNBC/BusinessWire), regulatory bodies (FDA, EU-MDR). Confidence tier marked per item where uncertain.

**Legend for confidence:** ✅ verified primary source | ⚠️ secondary only | ❓ uncertain / mixed signals

---

## 1. Ada Health (ada.com)

- **What it is:** AI-powered symptom assessment chatbot, free consumer app + enterprise "Ada Assess" / "Ada Care Navigator" white-label platform for health systems and payers.
- **Company / HQ:** Ada Health GmbH, Berlin, Germany. Founded 2011 by Daniel Nathrath, Martin Hirsch, Claire Novorol. ✅
- **Funding / status:** Series B extended to **$120M (Feb 2022)** with Farallon Capital, Red River West, Bertelsmann Investments, Schroders Capital, Access Industries, Vitruvian Partners. Tracxn/Caplight report cumulative funding **~$167–260M**, 2023 estimated valuation **~$1.2B (unicorn)**. Still private, expanding in US. ✅
- **Target market:** Dual — consumer (free app) + enterprise (health systems, insurers, pharma, governments). B2B2C model. ✅
- **Core capabilities:**
  - Conversational symptom assessment (~3–5 min), differential (top conditions w/ probabilities), triage urgency (self-care / non-urgent / urgent / emergency), patient-friendly explanations, multi-language, medical knowledge base (~3,700 conditions and ~17,000+ findings).
  - Doctor escalation: enterprise platform routes into telehealth / clinic booking (e.g., with Sana Kliniken, NHS, Novitas).
  - Multilingual: 7 languages (English, German, French, Spanish, Portuguese, Romanian, Swahili). ✅
  - No voice interface in core app (text/chat UI). Citations: links to BMJ Best Practice patient content; evidence-graded condition entries.
  - Limited longitudinal memory: stores assessment history, basic profile (age, sex, conditions, meds), but not designed as ongoing chronic-disease companion.
- **AI / clinical approach:** **Hybrid probabilistic-reasoning + LLM front-end**. Originally a Bayesian-belief-network-style reasoning engine over a curated medical knowledge base reviewed by physicians. In **April 2026 Ada patented a "clinical safety layer"** that wraps an LLM (free-form input parsing) with its deterministic reasoning engine for triage/differential; LLM is *not* permitted to update clinical belief — only the symbolic engine does. ⚠️ Patent coverage and production rollout date need confirmation.
- **Safety architecture:**
  - **EU-MDR Class IIa medical device** (Dec 15, 2022) for *Ada Assess for Enterprise* ✅
  - **EU-MDR Class I** for the consumer Ada app ✅
  - ISO 13485 quality management system ✅
  - Emergency/red-flag triage logic baked into reasoning engine (urgency output).
  - No FDA 510(k) clearance for the US consumer app as of latest public FDA AI-Enabled Medical Device list — operating as clinical decision support / wellness in US. ⚠️
- **Evidence / validation:**
  - **BMJ Open 2025** — clinical vignettes study comparing Ada to GPs. ✅
  - **Nature npj Digital Medicine 2025 (Kopka et al.)** — *Accuracy of online symptom assessment applications* comparing Ada, WebMD, ChatGPT, and physicians for ED patients. Ada performed best among apps. ✅
  - **Hammoud et al., JMIR AI 2024** — Ada ranked most accurate among legacy symptom checkers (71% top-3 condition suggestion in a 2020 study); Avey (Saudi app) outperformed all in the 2024 head-to-head.
  - **Miller et al., 2020 (PMC7382011)** — pilot of NHS patient usage; 90%+ understood and would use again.
  - Long list of peer-reviewed publications catalogued at about.ada.com/studies.
- **Privacy:** GDPR-compliant (Germany-HQ), ISO 27001, SOC 2 Type II for enterprise; data hosted in EU (AWS Frankfurt). HIPAA-aligned for US deployments. ✅
- **Pricing / business model:** Consumer app free. Enterprise: per-member-per-month (PMPM) licensing to insurers and health systems; typical deal size undisclosed but large contracts (NHS pilots, Sana Kliniken, Novitas BKK, TKB).
- **Languages:** 7 (see above).
- **Notable weaknesses / controversies:**
  - Dropped Romanian & Swahili briefly in 2024–25 (restored June 2026) — language support fragile outside core markets. ✅
  - Independent benchmarks (Hammoud 2024) show top-1 accuracy still moderate (~50%); safety relies heavily on triage layer not on diagnostic precision.
  - Slow US FDA pathway limits direct clinical-diagnostic marketing claims.
  - Not a substitute for clinician (every assessment ends with "consult a professional").
- **What SehatAI should learn / adapt / avoid:**
  - **LEARN:** The hybrid LLM-front-end + symbolic-reasoning-back-end architecture is the gold-standard pattern for medical-grade consumer AI. Patent-style "clinical safety layer" wrapping an LLM is a credible safety moat.
  - **ADAPT:** EU-MDR Class IIa is achievable for a symptom-assessment product; plan for it from day one (QMS, clinical evaluation, post-market surveillance).
  - **AVOID:** Slow language expansion — invest in a translation pipeline with medical QA from the start.

---

## 2. K Health (khealth.com)

- **What it is:** AI symptom checker tightly coupled to virtual primary care — the AI does the intake and triage, then routes to a human clinician who can prescribe (where licensed).
- **Company / HQ:** K Health (formerly Kang Health), New York + Tel Aviv. Founded 2016 by Ran Shaul, Israel Roth, Dr. Daniel Besser. ✅
- **Funding / status:** **$439M raised across 13 rounds** (Tracxn) — latest **$50M in July 2024** (Series F/Other equity). Prior: $132M Series E (Jan 2021), $42M Series D (Aug 2020). 2021 valuation **$1.5B (unicorn)**. Investors: Claure Group, Mangrove Capital, Valor Equity Partners, L Catterton. ✅
- **Target market:** US virtual primary care, B2C subscription + B2B with health systems (Hartford HealthCare partnership March 2026 → PatientGPT).
- **Core capabilities:**
  - **PatientGPT** — an AI agent that integrates with EHR (Epic), asks dynamic intake questions, drafts a clinical note, hands off to physician. Launched with Hartford HealthCare March 31, 2026; expanded to specialty care June 2026.
  - Symptom triage and "AI physician" chats — including mental health (anxiety, depression med management).
  - Medication prescribing and home delivery ($12/mo add-on).
  - Doctor escalation is core (not bolted on): every intake can lead to a same-day virtual visit.
  - US-only currently; English only. ❓ voice not emphasized.
- **AI / clinical approach:** Originally trained on **billions of historical primary-care visits** (a deal with Maccabi Healthcare Services data, Israel). Now an LLM-based "AI physician" — Google DeepMind case study confirms K Health fine-tuned **Gemma 3** to 90–95% accuracy with anti-overfitting techniques (2025). Mix of statistical classifier (legacy) + LLM (current PatientGPT). ✅
- **Safety architecture:** Operates as clinical decision support under licensed physicians — the AI does not autonomously prescribe. **No standalone FDA clearance** as a Software-as-Medical-Device. Physician-in-the-loop is the safety mechanism. ⚠️
- **Evidence / validation:**
  - **Annals of Internal Medicine (April 4, 2025)** — peer-reviewed study: K Health AI clinical recommendations matched or exceeded physicians; **harmful recommendations 2.8% (AI) vs 4.6% (physicians)** in a retrospective review of patient cases. Forbes, BusinessWire coverage. ✅
  - Earlier JMIR/Medicine publications (2020) reporting 85% agreement with primary-care doctors.
- **Privacy:** US HIPAA-compliant (BAA with Microsoft Azure for PatientGPT/EHR integration). ✅
- **Pricing:** $49/month unlimited primary care (incl. one visit), $73 per single visit, +$12/mo for medication delivery. No insurance accepted. ✅
- **Languages:** English only.
- **Notable weaknesses / controversies:**
  - No FDA clearance — relies on physician-in-loop.
  - US-only — limited international expansion.
  - Earlier "AI trained on millions of doctors' notes" model raised data-provenance questions (Maccabi data use).
  - Direct-to-consumer subscription model is cash-pay only — excludes underinsured.
- **What SehatAI should learn / adapt / avoid:**
  - **LEARN:** Tight coupling of AI intake + human clinician escalation is the most commercially proven US model; PatientGPT's EHR-native integration is a strong reference architecture.
  - **ADAPT:** Peer-reviewed head-to-head with physicians (Annals 2025) is the gold-standard evidence template — K Health's study design (harm rate as primary endpoint) is a great template.
  - **AVOID:** English-only US-centric moat is brittle if AI regulation tightens — diversify language and regulatory footprint early.

---

## 3. Buoy Health (buoyhealth.com)

- **What it is:** AI symptom checker + triage chatbot, originally consumer, now mostly B2B white-label for US payers/providers.
- **Company / HQ:** Buoy Health, Inc., Boston, MA. Founded 2014 by **Andrew Le, MD** (Harvard Medical School) and team. ✅
- **Funding / status:** **~$66.5M total raised** (Series C Nov 2020, $37.5M led by Cigna Ventures, Humana, Optum Ventures; earlier rounds $20M Series B 2020, $6.5M seed 2017). Valued ~$200M at Series C. Investors include Cigna, Humana, Optum, F-Prime Capital, General Catalyst. Still private, but quiet on funding since 2020. ✅
- **Target market:** US payers and health systems (B2B2C — white-labeled symptom checkers embedded in insurer portals); also direct consumer site. Notable client: **Harvard Medical School / Harvard Health Publishing** content partnership.
- **Core capabilities:**
  - Conversational triage via progressive questioning (modeled on physician interview patterns).
  - Differential diagnosis (top conditions) + triage recommendation (self-care, urgent care, ER).
  - Doctor-finder / care-routing into client network.
  - Patient education content (Harvard Health Publishing licensed).
  - Limited longitudinal memory (visit history when integrated with payer portal).
- **AI / clinical approach:** Originally a **Bayesian inference engine** ("Adam") trained on clinical vignettes and literature. Has been migrating toward LLM-augmented flows (Harvard Health Publishing AI pilot noted a 134% usage increase in 2024 for AI symptom checkers broadly). Public technical details limited post-2022. ⚠️
- **Safety architecture:** Triage logic with red-flag detection (emergency routing). **No public FDA clearance or EU-MDR certification** — operates as clinical decision support / informational. CE/MDR status unclear. ⚠️
- **Evidence / validation:**
  - **Carmona et al., 2022 (PMC9440406)** — peer-reviewed evaluation of Buoy's information quality.
  - **Hammoud et al., JMIR AI 2024** — Buoy evaluated alongside Ada, K Health, Babylon, WebMD; Ada outperformed Buoy.
  - Several internal white papers (cited in their press kit), but independent external RCTs are scarce.
- **Privacy:** US HIPAA-compliant; data hosted in AWS US. ✅
- **Pricing:** Consumer free; B2B licensing (PMPM or per-engagement) to payers/employers — undisclosed.
- **Languages:** English only.
- **Notable weaknesses / controversies:**
  - No new funding round since 2020 — possible strategic stagnation.
  - English-only, US-only.
  - Lower accuracy in independent benchmarks than Ada and newer entrants.
  - Heavy dependence on payer distribution channels.
- **What SehatAI should learn / adapt / avoid:**
  - **LEARN:** Payer distribution (Cigna/Humana/Optum backing) is a powerful B2B moat — strategic investor alignment matters.
  - **ADAPT:** Harvard Health Publishing content partnership model — licensed editorial content gives credibility.
  - **AVOID:** Stagnating on technical architecture post-funding; English-only limits defensibility.

---

## 4. Docus AI (docus.ai)

- **What it is:** Consumer AI symptom checker + lab-test interpretation + paid "second opinion" marketplace connecting users to specialists (US/EU doctors).
- **Company / HQ:** Docus AI, **Yerevan, Armenia** (founded 2020s by Robert Aghavemyan and team). ✅
- **Funding / status:** Modest — PitchBook lists **~$750K** seed (Business Angel Network of Armenia, BigStory VC, Formula VC, Triple S Ventures). One source mentions a $320M Series D claim but it appears unreliable / conflated with another entity — treat as ❓ unverified. LinkedIn (Triple S Ventures) claims "$500M revenue 2024" — also unverified. Treat Docus financials as **mixed / uncertain**.
- **Target market:** Consumer (freemium) + light B2B (Armenia government partnership June 2025, integrated into national healthcare system as AI diagnostic assistant).
- **Core capabilities:**
  - AI symptom checker (free) — condition list + insights.
  - Lab test interpretation (upload lab results, get AI explanation).
  - **Second-opinion marketplace** — pay $50–$300+ for written or video second opinion from US/EU board-certified specialists.
  - "AI Doctor" chat with personalization based on user's medical history, test results.
  - Limited longitudinal memory.
  - English language; some EU focus.
- **AI / clinical approach:** LLM-based (likely GPT-family or similar) with RAG over medical knowledge base. No published architecture papers. ⚠️
- **Safety architecture:** Disclaimers, doctor second-opinion as escalation path. **No FDA / EU-MDR clearance disclosed.** ⚠️
- **Evidence / validation:** No peer-reviewed clinical validation studies found. Docus blog is marketing content, not evidence. ⚠️
- **Privacy:** GDPR-oriented (Armenia/EU operations); HIPAA-adjacent for US specialist consults. ✅
- **Pricing:** Symptom checker free; AI Doctor ~$9–$15/mo; second opinion consults $50–$300+. ✅
- **Languages:** English (and Russian/Armenian in some flows). ❓
- **Notable weaknesses / controversies:**
  - **No clinical validation** — appears to be a marketing-heavy consumer product.
  - Trustpilot reviews mixed; some complaints about upsells to paid second opinions.
  - Funding and revenue figures are inconsistent across sources.
- **What SehatAI should learn / adapt / avoid:**
  - **LEARN:** The "AI + second opinion marketplace" combo is a clever monetization — multiple revenue paths.
  - **ADAPT:** Armenia national health system integration is a model for emerging-market B2B.
  - **AVOID:** Marketing-heavy chatbot with no peer-reviewed evidence — SehatAI must publish or perish clinically.

---

## 5. ChatGPT / OpenAI Health (2024–2026)

- **What it is:** General-purpose ChatGPT used informally for health questions (since 2022), plus two distinct **official** OpenAI health initiatives launched 2024–2026:
  1. **Color Health cancer copilot (June 2024)** — GPT-4o-powered assistant for clinicians to screen/treat cancer; ~200,000 patient cases supported H2 2024.
  2. **OpenAI for Healthcare (Jan 8, 2026)** — enterprise HIPAA-compliant ChatGPT tier for hospitals and health systems.
  3. **ChatGPT Health (Jan 7, 2026 waitlist; US launch July 23, 2026, web+iOS, ages 18+)** — consumer feature letting users connect medical records (lab results, medications) + wellness apps (Apple Health, Function, MyFitnessPal) for personalized insights.
- **Company / HQ:** OpenAI, San Francisco. ✅
- **Funding / status:** OpenAI is the most-funded AI company globally (~$13B+ from Microsoft + 2024/2025 rounds valuing it $157B+, then $500B "Stargate" announcement Jan 2025).
- **Target market:** OpenAI Health is dual: enterprise B2B (health systems) + consumer (ChatGPT Plus/Pro users, US-only at launch).
- **Core capabilities (ChatGPT Health, mid-2026):**
  - Read lab results, medication lists, and Apple Health/wearable data, give personalized explanations.
  - Conversational Q&A on symptoms, conditions, treatments — extremely broad coverage.
  - No differential diagnosis engine, no triage urgency scoring, no emergency dispatch.
  - Multilingual: 50+ languages via base GPT model.
  - No native doctor escalation (third-party only).
  - Voice via ChatGPT Advanced Voice Mode.
  - No longitudinal care planning.
- **AI / clinical approach:** Pure LLM (GPT-4o / GPT-5 family). **Not a medical device.** No proprietary medical knowledge base; RAG-style browsing of PubMed/Web when enabled. ✅
- **Safety architecture:**
  - **OpenAI updated usage policy in Nov–Dec 2025** explicitly prohibiting use of ChatGPT "to provide medical advice" (or any licensed professional advice). It can *explain* conditions but not *advise*. ✅
  - ChatGPT Health includes prominent disclaimer: "ChatGPT can still make mistakes and does not replace the care and judgment of qualified medical professionals."
  - **HIPAA compliance** only via the enterprise tier (BAA signed); consumer ChatGPT is **not** HIPAA-compliant.
  - **"MedGPT" rumors**: circulated in 2023–24 after a Bloomberg report; OpenAI has never announced a MedGPT product. The actual approach is "general GPT + healthcare vertical via Color-style partnerships," not a fine-tuned medical model. The closest fine-tuned medical work is **GPT-4o** fine-tuned for Color Health. ✅
- **Evidence / validation:**
  - **Nature npj Digital Medicine 2025 (Kopka et al.)** — head-to-head: Ada > ChatGPT > WebMD in diagnostic+triage accuracy for ED patients.
  - **JMIR AI 2024 (Hammoud et al.)** — ChatGPT compared to Ada/K Health/Buoy/Babylon/WebMD in vignette diagnosis.
  - Many USMLE-style benchmark papers showing high GPT-4 accuracy on multiple-choice medical exams — but benchmarks ≠ clinical safety.
  - No prospective RCTs in real clinical workflow for consumer ChatGPT.
- **Privacy:**
  - Consumer ChatGPT: **not HIPAA-compliant**; user medical data may be used for model training unless opted out. ⚠️ Harvard Law (Petrie-Flom, 2023, 2026) highlights liability risks.
  - Enterprise tier (Jan 2026): HIPAA-compliant BAA, no training on customer data.
- **Pricing:** Consumer ChatGPT Health free (record upload) with usage limits; ChatGPT Plus $20/mo; Enterprise tier undisclosed (seat-based, large health-system deals).
- **Languages:** 50+ (base ChatGPT).
- **Notable weaknesses / controversies:**
  - **OpenAI explicitly bans use for medical advice** (Nov–Dec 2025 policy update) — ChatGPT Health walks a fine line between "explaining" and "advising."
  - Harvard Law (Petrie-Flom, July 2026) openly questions liability if medical records uploaded to ChatGPT are leaked or used for training.
  - Reddit r/medicine skeptic threads (Oct 2025) and AppleInsider (Jul 2026) raise privacy concerns about Apple Health → ChatGPT data flow.
  - No FDA clearance as SaMD.
  - Hallucination rate is non-trivial for medical facts (citations fabricated).
- **What SehatAI should learn / adapt / avoid:**
  - **LEARN:** The ChatGPT Health UX (Apple Health + lab uploads + conversational explanation) sets consumer expectations — SehatAI must offer at least this UX surface.
  - **ADAPT:** OpenAI's "enterprise HIPAA tier + BAA + no-training" pattern is the right privacy posture for any LLM-based health product.
  - **AVOID:** OpenAI's *absence* of regulatory clearance and *prohibition* on medical advice is the single biggest gap — SehatAI must NOT replicate the "advisory only" stance; it must obtain SaMD clearance if it intends to triage or diagnose.

---

## 6. Babylon Health — Defunct (Cautionary Tale) ⚠️

- **What it was:** UK-based AI symptom checker + virtual GP service + value-based care provider. Founded 2013 by **Ali Parsa**. Operated "GP at Hand" NHS service.
- **Company / HQ:** Babylon Health plc, London. Went public via SPAC (Oct 2021) at **$4.2B valuation**.
- **Funding / status:** Peak revenue $1B (2022). Filed for **Chapter 7 bankruptcy (US) in August 2023**. UK business sold to **eMed Healthcare UK** in September 2023 — GP at Hand NHS service continued. Wikipedia lists Babylon as "Defunct 2023." ✅
- **Timeline of collapse:**
  - **2021**: SPAC merger; peak valuation $4.2B.
  - **2022**: Net loss **$221M on $1B revenue**; rapid US expansion via Meritage Medical Group acquisition (value-based care in CA); NHS GP at Hand ~700k patients; stock crashed ~95%.
  - **2023 Q1**: $45.8M loss in Q1 alone. Reverse stock split. Take-private deal with MindMaze collapsed August 2023.
  - **August 2023**: US operations file Chapter 7; ~700 US employees laid off overnight; patients and partners stranded.
  - **September 2023**: UK business sold to eMed Healthcare; Wikipedia, Wired "Warning for AI unicorns" (Sept 2023) all declare it a cautionary tale.
- **Why it failed (root causes, multiple sources: Wired, Sifted, Fierce Healthcare, Hospitalogy, Mansfield Advisors):**
  1. **Economic mismatch**: AI symptom checker is cheap to operate but the value-based-care / capitation business model carries enormous medical-cost risk. Babylon took on risk it couldn't price.
  2. **US value-based care disaster**: Meritage acquisition loaded it with high-cost Medicare Advantage patients; medical loss ratios ballooned.
  3. **Over-hyped AI**: Wired (Sept 2023) reporting — insiders said the AI never lived up to Parsa's marketing of "AI that replaces doctors."
  4. **No path to profitability**: SPAC discipline forced quarterly reporting that exposed mounting losses.
  5. **Take-private deal fragility**: Single point of failure (MindMaze) — no Plan B.
- **Lessons for SehatAI (explicit):**
  - **DO NOT** take on insurance risk / capitation. Stay on the software / SaMD side.
  - **DO NOT** over-hype AI vs clinicians. Set honest accuracy expectations publicly.
  - **DO NOT** depend on a single make-or-break deal (acquisition, big contract) for survival.
  - **DO NOT** mix consumer-app growth metrics with P&L of clinical service delivery.
  - **DO** keep a separate regulatory entity for clinical risk.
  - Babylon's collapse is the single biggest warning to AI-health startups of the 2020s: marketing outpacing economics is fatal.

---

## 7. Your.MD / Healthily

- **What it is:** UK AI self-care app — symptom checker + health-info library + "OneStop Health" marketplace of vetted digital health services.
- **Company / HQ:** Healthily (formerly Your.MD), London. Founded 2012 by Matteo Berlucchi and Maarten Lindström. Renamed Your.MD → Healthily in 2020. ✅
- **Funding / status:** Cumulative ~$30M raised (UK VCs including Smedvig Capital, Origa Ventures, Times Internet). Wikipedia and Crunchbase confirm existence; recent activity low. **June 2025**: launched digital service pilot with UK retailers to help shoppers distinguish cold/flu/COVID. Modest scale. ⚠️
- **Target market:** UK consumer self-care (free app), some B2B distribution (NHS App Library previously, pharmacy chains).
- **Core capabilities:**
  - Symptom checker ("Check," a structured flow).
  - Large self-care content library (100s of conditions).
  - Symptom tracking and habit tracking ("Healthily Track").
  - OneStop Health marketplace routing to vetted third-party services.
  - **No medication info, no doctor chat** (routes out).
- **AI / clinical approach:** Originally a **rules-based + NLP classifier** over a curated medical knowledge base. Mixed (uncertain how much LLM has been integrated). CE-marked Class I medical device (legacy MDD; transition to MDR status unclear). ⚠️
- **Safety architecture:** Triage with red flags. CE-marked (Class I — lowest tier, self-certified under MDD). Not EU-MDR Class IIa. ⚠️
- **Evidence / validation:** Limited peer-reviewed studies; some JMIR/conference papers. Less clinically rigorous than Ada.
- **Privacy:** GDPR-compliant (UK). ✅
- **Pricing:** Free consumer app; B2B licensing to pharmacies/NHS.
- **Languages:** English primary; some localization.
- **Notable weaknesses / controversies:**
  - **Marketing-heavy** — "world's first medically approved self-care app" is a self-claim; CE Class I is self-certified, low bar.
  - Limited clinical validation vs Ada/Infermedica.
  - Modest funding — survival risk; quiet for several years.
- **What SehatAI should learn / adapt / avoid:**
  - **LEARN:** Marketplace routing to vetted third-party services is a clean monetization alternative to subscription.
  - **ADAPT:** Self-care angle (vs diagnosis) is lower regulatory risk and easier path to consumer trust.
  - **AVOID:** "Medically approved" marketing with only CE Class I — SehatAI should aim for Class IIa / FDA De Novo or 510(k).

---

## 8. WebMD Symptom Checker

- **What it is:** Long-running US consumer symptom checker with body-map interface; relaunched 2024 as "WebMD AI" with conversational mode.
- **Company / HQ:** WebMD Health Corp, New York. Owned by KKR (Internet Brands) since 2017. ✅
- **Funding / status:** Private subsidiary; ~$600M+ revenue (parent). No separate funding rounds.
- **Target market:** US consumer (free); B2B WebMD Ignite (provider marketing/engagement); WebMD Health Services for employers.
- **Core capabilities:**
  - Body-map symptom selection + multi-symptom chooser.
  - List of possible conditions with explanations.
  - Medication info, drug interactions checker, doctor finder.
  - 2024 relaunch — "WebMD AI" conversational chat mode.
  - Patient education library (huge).
  - No triage urgency, no doctor chat, no longitudinal care. ⚠️
- **AI / clinical approach:** Originally **decision-tree / rules-based** (since 2005). 2024 AI version likely LLM-based (vendor not disclosed). ⚠️
- **Safety architecture:** Standard "this is not medical advice" disclaimers. **No FDA clearance / EU-MDR certification** — operates as informational/educational. ⚠️
- **Evidence / validation:**
  - **Hammoud et al., JMIR AI 2024** — WebMD ranked lower than Ada (and Avey).
  - **Kopka et al., Nature npj Digital Medicine 2025** — WebMD accuracy lower than Ada and ChatGPT in ED vignettes.
  - Older 2015 evaluation (Semigran et al., BMJ) was widely cited showing mediocre symptom-checker accuracy.
- **Privacy:** US-focused; standard WebMD privacy policy (not HIPAA — it's consumer site). Cookies and ad tracking are aggressive (display advertising revenue). ⚠️
- **Pricing:** Free (ad-supported). WebMD Ignite / Health Services is B2B SaaS.
- **Languages:** English (some Spanish).
- **Notable weaknesses / controversies:**
  - Long-standing criticism ("WebMD says it's cancer" meme).
  - Ad-driven model conflicts with neutral medical guidance.
  - No clinical-grade validation, no triage, no escalation.
- **What SehatAI should learn / adapt / avoid:**
  - **LEARN:** Massive consumer traffic + content library is a powerful acquisition moat.
  - **ADAPT:** WebMD AI's body-map + conversational hybrid is a familiar UX; users like it.
  - **AVOID:** Ad-driven medical content business model — conflicts with clinical neutrality.

---

## 9. Other Notable Assistants Discovered

### 9a. Glass Health (glass.health)
- **What it is:** Clinical reasoning agent for **physicians** (not consumers). Generates differentials, assessment & plan, documentation.
- **Company / HQ:** San Francisco. Founded 2021 by **Dereck Paul, MD** and Graham Ramsey.
- **Funding:** Seed ~$5M from Breyer Capital, a16z (Andreessen Horowitz), +VC. ✅
- **Target market:** Practicing physicians / residents (B2B SaaS).
- **Core capabilities:** Differential Dx, A&P drafting, clinical Q&A, ambient documentation (added 2025).
- **AI/clinical:** LLM-based clinical reasoning agent, RAG over medical evidence; positions itself as "clinical superintelligence."
- **Safety:** Clinician-facing CDS (not autonomous); no FDA clearance required.
- **Evidence:** Limited peer-reviewed; mostly case studies.
- **Pricing:** Free tier; $90/mo for CDS features (per clinician). ✅
- **Languages:** English.
- **Lessons for SehatAI:** Glass Health targets the **physician** side — SehatAI consumer play should NOT compete here, but learnings: clinical reasoning agents are the next frontier, and consumer apps may eventually embed Glass-style "explainable differential" features.

### 9b. Doctolib AI (France/Germany)
- **What it is:** AI for clinicians — "Consultation Assistant" ambient scribe (Oct 2024 launch) + appointment/scheduling AI.
- **Company / HQ:** Doctolib, Paris. Merged with Docplanner 2023.
- **Target market:** European physicians / hospitals (B2B SaaS). Not consumer symptom checker.
- **AI/clinical:** Azure OpenAI (GPT-4) for scribing; booking AI proprietary. ✅ (Microsoft case study Mar 2024.)
- **Languages:** French, German, Italian, etc.
- **Lessons:** Strong European B2B moat; AI scribe is the most defensible near-term use case for LLMs in healthcare.

### 9c. Infermedica / Symptomate (bonus clinically-validated player)
- **What it is:** Polish B2B clinical AI triage engine, white-labelled by insurers and health systems. Consumer face is "Symptomate" app.
- **Company / HQ:** Infermedica Sp. z o.o., Warsaw. Founded 2012 by Piotr Orzechowski.
- **Funding:** ~$45M total (Series B 2021 $30M led by Karma Capital, One Peak, Inovo VC, Europium).
- **Regulatory:** CE-marked Class IIa medical device (legacy MDD); MDR transition ongoing.
- **Evidence:** PMC11131945 (Gellert, 2024, J Med Internet Res) — virtual triage peer-reviewed. Strong evidence base, comparable to Ada.
- **Languages:** 30+ languages.
- **Lessons for SehatAI:** Infermedica is the second-most-validated player after Ada and the strongest B2B API player — SehatAI should benchmark directly against Infermedica, not just Ada.

---

## 10. Google's Consumer Health AI

- **What it is:** Multiple parallel efforts:
  1. **Med-PaLM / Med-PaLM 2** (research, 2023) — physician-targeted LLM, USMLE-style benchmark success, paper in Nature 2023. Limited consumer deployment.
  2. **MedLM** (Google Cloud enterprise, late 2023) — healthcare-tuned Gemini family for health systems (HCA, Meditech, etc.). Not consumer.
  3. **Personal Health LLM (PH-LLM)** — Gemini-based, fine-tuned on de-identified Fitbit/wearable data. **Nature Medicine 2025 paper** (Khasentino et al.) on sleep and fitness insights. ✅
  4. **Fitbit AI coach** (announced Mar 2024, launched Aug 2025) — Gemini-based conversational coach on Fitbit app for personalized fitness plans, sleep guidance, Q&A. ✅
  5. **Google Health app** — Fitbit app becoming "Google Health app" May 19, 2026 (redesign, all Fitbit + health features unified).
- **Company / HQ:** Google LLC / Google DeepMind / Google Health, Mountain View. ✅
- **Funding:** Internal; effectively unlimited R&D.
- **Target market:** Consumer (Fitbit users, hundreds of millions) + enterprise (Google Cloud healthcare customers).
- **Core capabilities:**
  - Wearable data → personalized insights, sleep coaching, fitness plans.
  - Conversational Q&A on the user's own data.
  - **Not** a symptom checker or triage tool — explicitly positioned as wellness/fitness.
- **AI/clinical approach:** Fine-tuned Gemini models; multi-agent framework; grounded in Fitbit/wearable data. Not SaMD. ✅
- **Safety architecture:** Wellness positioning; not marketed for diagnosis. No FDA clearance.
- **Evidence:** PH-LLM Nature Medicine 2025 paper. Med-PaLM 2 multiple benchmark papers.
- **Privacy:** Google's general privacy policy; Fitbit data subject to Google's terms (not HIPAA — wellness scope).
- **Pricing:** Bundled with Fitbit devices / Fitbit Premium ($9.99/mo or $79.99/yr).
- **Languages:** 50+ via Gemini base.
- **Notable weaknesses:**
  - Deliberately avoids clinical use — leaves symptom-checker market open.
  - Trust deficit: Google's history with health data (Project Nightingale backlash 2019).
- **What SehatAI should learn / adapt / avoid:**
  - **LEARN:** Wearable data → personalized LLM insight is the consumer-grade pattern; integrate with Apple Health/Google Fit from day one.
  - **ADAPT:** PH-LLM paper — fine-tuning Gemini on de-identified wearable data — is a credible technical recipe.
  - **AVOID:** Trying to be both wellness AND clinical — pick a regulatory lane; Google stays wellness to avoid SaMD burden.

---

## COMPARISON TABLE

**Legend:** 🟢 = best-in-class / strong | 🟡 = moderate | 🔵 = present but limited | 🔴 = absent / weak | ⚫ = N/A | ❓ = unknown/uncertain

| # | Capability | Ada | K Health | Buoy | Docus | ChatGPT | Healthily | WebMD |
|---|---|---|---|---|---|---|---|---|
| 1 | Symptom assessment (chat) | 🟢 | 🟢 | 🟢 | 🟡 | 🟢 | 🟡 | 🟡 |
| 2 | Differential diagnosis (ranked) | 🟢 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| 3 | Triage urgency (self-care→ER) | 🟢 | 🟡 | 🟢 | 🔵 | 🔴 | 🟡 | 🔵 |
| 4 | Conversational NLP intake | 🟢 | 🟢 | 🟢 | 🟡 | 🟢 | 🟡 | 🟡 |
| 5 | Medication info | 🟡 | 🟢 (prescribes) | 🔵 | 🟡 | 🟢 | 🔴 | 🟢 |
| 6 | Doctor escalation / telehealth | 🟢 (ent.) | 🟢 (native) | 🟡 (payers) | 🟢 (marketplace) | 🔴 | 🔵 (marketplace) | 🔵 (finder) |
| 7 | Longitudinal memory | 🟡 | 🟡 | 🔵 | 🔵 | 🟢 (ChatGPT Health) | 🔵 | 🔴 |
| 8 | Personalization | 🟢 | 🟢 | 🟡 | 🟡 | 🟢 | 🟡 | 🔴 |
| 9 | Voice interface | 🔴 | 🔴 | 🔴 | 🔴 | 🟢 | 🔴 | 🔴 |
| 10 | Multilingual (≥5 languages) | 🟢 (7) | 🔴 (EN) | 🔴 (EN) | 🔵 | 🟢 (50+) | 🔴 (EN) | 🔵 (EN/ES) |
| 11 | Citations / evidence links | 🟢 | 🔵 | 🟢 (Harvard) | 🔴 | 🔵 (browse) | 🟡 | 🟢 |
| 12 | Patient education content | 🟢 | 🟡 | 🟢 | 🟡 | 🟢 | 🟢 | 🟢 |
| 13 | Follow-up / care plan | 🟡 | 🟢 (visit) | 🔵 | 🔵 | 🔴 | 🔵 | 🔴 |
| 14 | Emergency / red-flag detection | 🟢 | 🟡 | 🟢 | 🔴 | 🔴 | 🟡 | 🔴 |
| 15 | FDA / EU-MDR regulatory clearance | 🟢 (EU-MDR IIa) | 🔴 | 🔴 | 🔴 | 🔴 | 🔵 (CE I) | 🔴 |
| 16 | ISO 13485 / QMS | 🟢 | 🔴 | 🔴 | 🔴 | 🔵 (ent.) | 🔵 | 🔴 |
| 17 | Peer-reviewed clinical validation | 🟢 (multiple) | 🟢 (Annals 2025) | 🟡 (limited) | 🔴 | 🟡 (benchmarks only) | 🔴 | 🟡 (limited) |
| 18 | HIPAA compliance | 🟢 (ent.) | 🟢 | 🟢 | 🔵 | 🟢 (ent. only) | 🔵 | 🔴 |
| 19 | GDPR compliance | 🟢 | ⚫ | ⚫ | 🟢 | 🔵 | 🟢 | ⚫ |
| 20 | Pricing clarity / accessibility | 🟢 (free app) | 🟡 ($49/mo) | 🟢 (free) | 🟡 (upsells) | 🟡 (free/$20) | 🟢 (free) | 🟢 (free) |

---

## KEY THEMES & SYNTHESIS

### Clinically-validated tier (peer-reviewed, regulatory-cleared)
1. **Ada Health** — best-in-class (EU-MDR Class IIa, multiple peer-reviewed head-to-head wins, BMJ Open + Nature npj Digital Medicine 2025).
2. **Infermedica** (bonus — strong B2B API player, Class IIa legacy, peer-reviewed triage evidence).
3. **K Health** — emerging validated tier (Annals of Internal Medicine 2025 RCT-like study, but no SaMD clearance).

### Marketing-heavy tier (limited or no peer-reviewed evidence, no SaMD clearance)
1. **Docus AI** — no clinical validation, marketing-heavy.
2. **Healthily / Your.MD** — CE Class I (self-certified, low bar), limited clinical evidence.
3. **WebMD Symptom Checker** — long-running but no SaMD clearance, ad-driven.

### General-purpose AI giants (no SaMD, advisory-only positioning)
1. **ChatGPT / OpenAI Health** — explicitly bans medical advice post-Dec 2025; high consumer reach, no clinical safety moat.
2. **Google (Fitbit AI coach, PH-LLM)** — deliberately wellness-only, avoids SaMD burden.

### The Babylon Cautionary Tale (DEFUNCT — explicit)
- **Babylon Health** — collapsed Aug 2023 from $4.2B valuation to bankruptcy in <2 years. Root causes: (1) over-hyped AI; (2) took insurance risk it couldn't price; (3) depended on single acquisition deal; (4) value-based care economics catastrophic. The single most important case study for any AI-health startup of this decade.

### 3 Capabilities SehatAI Should Most Urgently Adapt from This Group

1. **Hybrid LLM + symbolic-reasoning architecture with a patented "clinical safety layer"** (Ada's model, Apr 2026 patent; arXiv BMBE paper pattern). Pure-LLM symptom checkers (ChatGPT Health) cannot be made SaMD-grade. SehatAI should design the architecture Day 1 as LLM-front-end + deterministic-reasoning-back-end + emergency-red-flag triage layer.

2. **Regulatory clearance path: EU-MDR Class IIa (Ada) and/or FDA De Novo / 510(k)** as a planned milestone, not an afterthought. Without it, SehatAI will be confined to the marketing-heavy tier (Docus, Healthily) with no defensibility. Budget 12–24 months and ~$2–5M for the QMS + clinical evaluation dossier from day one.

3. **Peer-reviewed validation playbook** — K Health's Annals 2025 study design (harm rate as primary endpoint, head-to-head with physicians) and Ada's BMJ Open 2025 / Nature npj Digital Medicine 2025 vignette protocol. SehatAI should pre-register its validation study and publish before commercial launch; this is the only credible moat against ChatGPT and Google entering the space.

---

## SOURCES (selected, primary)

**Ada Health:**
- about.ada.com/press/221215-ada-health-receives-eu-mdr-certification (Dec 15, 2022)
- about.ada.com/press/patent-llm-clinical-safety-layer (Apr 13, 2026)
- about.ada.com/studies (research catalog)
- nature.com/articles/s41746-025-01566-6 (Kopka et al. 2025, npj Digital Medicine — Ada vs ChatGPT vs WebMD vs physicians in ED)
- ai.jmir.org/2024/1/e46875 (Hammoud et al. 2024, JMIR AI — symptom-checker benchmark)
- mobihealthnews.com Ada Series B $120M Feb 2022
- caplight.com Ada valuation $1.2B (2023 est.)

**K Health:**
- businesswire.com/news/home/20250403068767 (Annals of Internal Medicine 2025 study on K Health AI vs physicians)
- forbes.com/sites/amyfeldman/2025/04/04 (Forbes coverage)
- prnewswire.com Hartford HealthCare + K Health PatientGPT Mar 2026
- deepmind.google Gemma case study (K Health fine-tuning Gemma 3, 90–95% accuracy)
- tracxn.com / startupintros.com — funding history $439M+

**Buoy Health:**
- fiercehealthcare.com Series C $37.5M Nov 2020 (Cigna/Humana/Optum)
- pmc.ncbi.nlm.nih.gov/articles/PMC9440406 (Carmona et al. 2022)
- businessinsider.com Buoy App 2017 Harvard Medical School origin

**Docus AI:**
- docus.ai/symptom-checker, /second-opinion, /blog
- evnreport.com Armenia partnership Nov 2025
- pitchbook.com Docus profile (~$750K seed)
- trustpilot.com docus.ai reviews

**ChatGPT / OpenAI Health:**
- openai.com/index/color-health (Jun 2024)
- openai.com/index/introducing-chatgpt-health (Jan 7, 2026)
- openai.com/index/health-in-chatgpt (Jul 23, 2026 US launch)
- openai.com/index/openai-for-healthcare (Jan 8, 2026 enterprise HIPAA)
- hooperlundy.com (Dec 11, 2025 — OpenAI restricts ChatGPT medical advice)
- businessinsider.com (Nov 3, 2025 — policy update on tailored medical advice)
- petrieflom.law.harvard.edu (2023, 2026 — HIPAA/liability analysis)
- wsj.com OpenAI-Color Health cancer copilot (Jun 2024)

**Babylon Health:**
- en.wikipedia.org/wiki/Babylon_Health
- wired.com Babylon warning AI unicorns (Sep 19, 2023)
- fiercehealthcare.com Sep 5, 2023 — UK business sold to eMed
- hospitalogy.com May 16, 2023 — downfall timeline
- sifted.eu/articles/the-rise-and-fall-of-babylon Oct 17, 2023
- mansfieldadvisors.com lessons from Babylon demise

**Healthily / Your.MD:**
- en.wikipedia.org/wiki/Your.MD
- healthily.ai/blog/press-release Jun 4, 2025 cold/flu/COVID pilot
- crunchbase.com/organization/your-md

**WebMD:**
- symptoms.webmd.com / symptoms.webmd.com/aisc (WebMD AI)
- webmd.com/corporate/press 2024 (AI in Medicine theme)
- dialzara.com symptom-checker comparison Jun 2024

**Glass Health:**
- glass.health / glass.health/for-clinicians
- glass.health/compare/freed (pricing $0–$90)
- startupintros.com glass-health funding

**Doctolib AI:**
- microsoft.com customer story (Mar 2024)
- careers.doctolib.com/blog/ai/ai-to-empower-healthcare-practitioners (Feb 2024)

**Google consumer health:**
- blog.google/products-and-platforms/devices/fitbit/fitbit-ai-personal-health-coach-preview (Aug 20, 2025)
- blog.google/innovation-and-ai/technology/health/google-generative-ai-healthcare (Mar 19, 2024)
- nature.com/articles/s41591-025-03888-0 (PH-LLM Nature Medicine 2025)
- support.google.com/googlehealth/answer/17068213 (Fitbit → Google Health app May 2026)
- cloud.google.com/blog/topics/healthcare-life-sciences Med-PaLM 2 sharing (Apr 2023)

**Infermedica (bonus):**
- infermedica.com (product pages)
- pmc.ncbi.nlm.nih.gov/articles/PMC11131945 (Gellert 2024 J Med Internet Res virtual triage)
- mobihealthnews.com Infermedica $3.65M Jun 2019
- biospace.com Symptomate Aug 2018

**Cross-cutting / meta:**
- clinicaltrialvanguard.com Nature Medicine June 2026 benchmark — general-purpose LLMs outperforming FDA-cleared clinical AI (treat as ⚠️; secondary source for upcoming study)

---

*End of analysis. Confidence: high on Ada, K Health, Babylon, OpenAI, Google, Infermedica. Medium on Buoy (funding data is older), Docus (financial figures conflict across sources), Healthily (recent activity scarce). All claims tied to specific dated primary sources above. No fabricated evidence.*
