# Pakistan & South Asia Healthcare / Digital-Health Market Research
**Task ID:** 6 (retry) · **Agent:** Pakistan & South Asia Market Researcher
**Purpose:** Evidence-based market analysis to inform what SehatAI (Pakistan-focused healthcare AI) should build, partner with, or differentiate against.
**Method:** ~38 web searches (raw results cached in `research/raw_06/*.json`), prioritizing WHO, World Bank, UNICEF, PTA, Dawn, official ministry/programme sites, and peer-reviewed literature. Confidence markers: ✅ verified this session (source cited), ⚠️ medium confidence (secondary source / partially verified), ❌ could not verify.

---

## 1. Macro context

| Indicator | Value | Source / confidence |
|---|---|---|
| Population | ~241.5M (2023 census); >250M est. 2025 | ✅ Pakistan Bureau of Statistics via census coverage; ⚠️ 2025 estimate |
| Urban / rural split | ~38–39% urban (2023 census) | ⚠️ widely cited; not directly verified this session |
| Cellular connections | 190M active connections = 75.2% of population (early 2025) | ✅ DataReportal "Digital 2025: Pakistan" |
| Households with mobile/smartphone access | >96% (HIES 2024–25, PTA) | ✅ PTA release |
| Literacy (age 10+, 2023 census) | National 60.7%; male 68.0%, female 52.8%; urban 74.1%, rural 51.6%; Punjab 66.3%, ICT 84% | ✅ Gallup Pakistan census analysis, Business Recorder (Jun 2025) |
| Mobile OS share | Android 91.2%, iOS 8.7% (Jul 2025–Jul 2026) | ✅ StatCounter |
| Mobile broadband coverage | 81% of adult population covered (GSMA, Aug 2024) | ✅ GSMA press release |
| Mobile internet gender gap | Largest of surveyed countries: 38% ownership gap; women's mobile internet use rose 33%→45% (2024) | ✅ GSMA / CDPR |

**The rural-user reality (numbers, not vibes):** a rural Pakistani user (≈61% of the population, literacy ~51.6%, female literacy far lower) most likely has household access to **one Android smartphone** (~91% Android share; locally assembled budget handsets dominate — PTA reports millions of locally assembled units/month), on a **3G/4G** connection where 81% broadband coverage exists but usage lags coverage (coverage–usage gap), with **cash, not cards**; women often don't own the phone (38% ownership gender gap). App size, offline capability, Urdu/regional language and voice UX are not nice-to-haves — they are the product.

---

## 2. Telemedicine landscape (Pakistan)

| Player | What it does | Scale & funding | AI usage | Confidence |
|---|---|---|---|---|
| **oladoc** (formerly MyDoctor.pk) | Doctor discovery/appointments, video consults, lab tests, medicine delivery; claims "#1 health app" | 25,000+ verified doctors listed (Google Play) | App Store listing advertises "Scan your meals with AI for instant nutrition insights" — a narrow, non-clinical AI feature. No verified clinical AI/triage | ✅ |
| **Marham.pk** | Health "super-app": PMDC-verified specialists, audio/video consults, home diagnostics; founded Jan 2016 from a Facebook community | $1M seed Aug 2021 (Indus Valley Capital); $3M Series A Dec 2023 | JCPSP paper claims Marham/doctHERS "use AI for diagnostics and triage" — ⚠️ not substantiated on product surfaces; treat as marketing-level | ✅ funding / ⚠️ AI claim |
| **Sehat Kahani** | All-female doctor teleconsult network (24/7 chat/audio/video) + network of walk-in **e-clinics** (48 clinics claimed 2022); founded by Dr. Sara Saeed Khurram & Dr. Iffat Zafar; doctHERS lineage; UNDP Digital X solution; Gavi-featured; hybrid CHW+telemedicine model for contraception/SRH (Malhotra 2023, PMC) | "Pakistan's largest telemedicine network" (self-claimed) | None verified | ✅ |
| **InstaCare** | "Super Health App": appointments, lab tests, medicine delivery in 50+ cities; B2B "Smart Clinic" clinic-management software | Presence in 50+ cities (Google Play) | None verified (Smart Clinic is records software, not AI) | ✅ |
| **DoctorOnCall.pk** | Online pharmacy + licensed doctor consultations; domain resolves to **doctoroncall.com.pk** (⚠️ the ".pk-only" branding is imprecise; distinct from Malaysia's DoctorOnCall) | Small; coverage details unverified | None verified | ✅ exists / ⚠️ scale |

**Verified gap:** none of these runs a verified, clinically-validated AI triage/symptom engine. Existing AI claims are marketing gloss (nutrition scanning, unverified "AI triage" citations).

## 3. E-pharmacy / medicine delivery

- **Dawaai.pk** — launched 2014, Karachi; "Pakistan's largest pharmaceutical marketplace"; $8.5M raised (2021, MobiHealthNews); B2B (retail pharmacies) + B2C; online doctor consults bundled. ✅
- **InstaCare** medicine delivery — 50+ cities. ✅
- **Others verified this session:** DVAGO (10,000+ medicines, 1-hour delivery in selected cities), Meri Pharmacy, D. Watson (2–4 hr Islamabad/Rawalpindi, nationwide shipping), Medlife.pk. ✅
- **DocMart, MediCart** — ❌ could NOT verify via search. Treat as unconfirmed; do not treat as competitors without direct verification.

## 4. Hospital apps

| Institution | App / portal features | Confidence |
|---|---|---|
| **AKUH** (Aga Khan University Hospital) | "AKUH Patient Care" app: lab reports, medication & vaccination schedules, health tips; "Family Hifazat" secure patient portal; CAP Gold-accredited clinical labs | ✅ |
| **SKMCH&RC** (Shaukat Khanum) | Shaukat Khanum App: appointments, medical reports; online lab results for Lahore & Peshawar; QR-based zakat/donation flows | ✅ |
| **Shifa International** (Islamabad) | "Shifa Patient" app + patient portal (records, reports, appointments, second opinions); **eShifa** subsidiary: teleconsultations → digital prescriptions → medicine home delivery, home health for elderly | ✅ |
| **Indus Hospital & Health Network** | Large charity network; no prominent patient-facing app found | ⚠️ |
| **SIUT** | No patient app found | ❌ |

**Pattern:** hospital apps are portals (reports/appointments), siloed per institution, English-first. No hospital offers AI-assisted triage or cross-institution anything.

## 5. Government digital health

### 5a. Sehat Sahulat Programme (PM health card) — VOLATILE, verified timeline
- Launched 2015 (pilot districts, PIDE/PMC), scaled after 2018; coverage up to **Rs 1 million/family/year** in 400+ public & private hospitals (Hasan 2022, PMC9223125); rebranded "Sehat Insaf Card" era ~2019-2021. ✅
- **April 2023:** Federal government suspended SSP financing amid fiscal crisis (noted in Dawn, Mar 2025 NA-body report). ✅
- **KP:** **Sehat Card Plus continues** — universal for KP domiciles; **10.6M families** receiving free inpatient care; beneficiary data from NADRA; panel-hospital locator & complaint app (sehatsahulat.com.pk, statehealth.com.pk). ✅
- **Punjab:** services at **government hospitals ended 30 June 2025** (notification; "financial inefficiencies" cited) with a shift to a targeted model; PHIMC FAQ insists the *insurance programme itself* was "not stopped," only discontinued in government hospitals (i.e., empanelled private hospitals continue for now). ✅ voicepk.net (Jul 1 2025) + PHIMC FAQ
- **Federal (2025–26):** restoration push — PID press release (12 Jan 2026) documents the 34th National Steering Committee briefed on "the Prime Minister's directives for immediate restoration of services"; claims of full restoration for Islamabad residents circulate. ⚠️ (PID confirmed committee + restoration directive; the "completed restoration" claim is lower confidence.)
- **Implication for SehatAI:** entitlement status is a moving target by province. Do not hard-code "Sehat Card accepted" assumptions; treat coverage as a per-province, per-facility, dated fact.

### 5b. EPI (Expanded Programme on Immunization)
- Operating since 1978; free vaccination, ~10 antigens, 6 visits (EPI Facebook/WHO EMRO). ✅
- Coverage is the problem: in rural Matiari, only **48.4% of children fully vaccinated** (Shahid 2023, PMC10124121). Zero-dose children cluster in remote/rural districts. ✅
- Digital maturity: largely paper registers + LHW mobilization; no national caregiver-facing reminder app verified. ⚠️

### 5c. DHIS2
- National TB programme adopted DHIS2 aggregate reporting in 2018 (StopTB assessment); **Balochistan scaled DHIS2 to 1,650+ health facilities**, replacing paper reporting; Punjab runs its own DHIS-2 deployment (dhispb.com / DGHS Punjab). ✅ dhis2.org, stoptb.org
- DHIS2 is facility-aggregate, not patient-level; no citizen-facing layer. ✅

### 5d. Lady Health Workers (LHW) Programme
- Established 1994 under National Programme for FP & PHC; **~100,000 LHWs** each covering ~1,000 people in rural/urban-slum catchments (Harvard Maternal Health Task Force; CHW Central). ✅ (≈100k figure widely cited; exact current headcount ⚠️)
- Digital maturity: pilots only. LHWs found an mHealth maternal-health app "easy to use and useful" ("Now You Have Become Doctors," PMC8594017), but core workflows remain paper registers. UNICEF Pakistan supports health-information-system strengthening and integrated MNCH (unicef.org/pakistan/health). ✅/⚠️

## 6. Emergency services

| Service | Number | Coverage & notes | Confidence |
|---|---|---|---|
| **Rescue 1122** (Punjab Emergency Service, est. 2004) | 1122 | All 36 Punjab districts; ~96+ stations (older official post: 33 districts → extended); replicated in KP/Balochistan/Sindh to varying degrees; free at point of use; ~2.2M emergencies handled in 2024 (claim); Punjab Air Ambulance now operating | ✅ core / ⚠️ volume figures |
| **Edhi Foundation** | 115 / 1020 | Largest NGO ambulance fleet nationally (1,500+ vehicles historically); 24/7, donation-funded | ✅ exists / ⚠️ fleet count |
| **Chhipa Welfare** | 1020 | Karachi/Sindh-focused, road-acc victim transport, 24/7 | ✅ |
| **Aman Foundation (Aman Ambulance)** | 111 (Karachi) | Karachi urban ambulance with trained paramedics | ✅ exists / ⚠️ current status |

**Gap:** numbers are fragmented by city/province and by ownership (state vs NGO); no unified national emergency dispatch app or in-app triage layer exists.

## 7. Regulatory landscape

- **DRAP** (Drug Regulatory Authority of Pakistan, DRAP Act 2012): regulates manufacture/import/sale of therapeutic goods including medical devices; has launched digital licensing (e-licensing). A legal commentary (CourtingTheLaw, Jun 2025) argues AI tools performing **diagnostics/triage are increasingly treated as "Software as a Medical Device" (SaMD)** — i.e., a truly diagnostic AI symptom-checker could fall under DRAP scrutiny. ✅
- **PM&DC** (Pakistan Medical & Dental Council): statutory register of medical practitioners; WFME-accredited; teleconsult platforms market "PMDC-verified" doctors — human-doctor involvement requires PMDC registration/ethics. ✅
- **MoNHSR&C:** houses SSP, EPI, national hepatitis framework; co-launched SSP with WHO (EMRO 2021). A National Digital Health (NDH) Framework covers telehealth, mHealth, wearables (ICLG Digital Health 2024). ✅
- **Data protection:** **Personal Data Protection Bill 2023 — still NOT enacted** (completed consultation; pending as of 2026 per Chambers/DataGuidance). Health data would be "sensitive/critical data" under the draft (localization expectations). **PECA 2016 + PECA (Amendment) Act 2025** (criminal/cybercrime law, expanded state powers over online content). ✅
- **Digital Nation Pakistan Act 2025** — in force 29 Jan 2025; creates the Pakistan Digital Authority. **National AI Policy 2025** — approved by federal cabinet 30 Jul 2025 (first dedicated AI policy; MoIT&T-led). ✅ (digitalpolicyalert.org, Global Law Experts, MoITT)
- **HEC:** university accreditation; tangential to an AI health app.

**What an AI symptom-checker must do (practical read):**
1. Position as **triage/health-information, not diagnosis** (avoids SaMD classification under DRAP risk); explicit disclaimers in Urdu + English.
2. Route to PMDC-registered humans (embed doctor verification, align with telemedicine practice norms).
3. **Data hygiene as if PDPB were law**: Urdu-language consent, minimization, encryption, in-country hosting, no sale of data; PECA-aware content moderation.
4. Emergency pathways must be conservative (Rescue 1122 / nearest facility) — under-triage is the existential legal/reputational risk.
5. Track DRAP's evolving SaMD stance and the (pending) PDPB; design for retro-compliance.

## 8. Disease burden (verified figures)

| Condition | Burden | Source |
|---|---|---|
| **Hepatitis C** | **9.8M people (4.3% of population)** — world's 2nd-largest HCV burden; National Hepatitis Strategic Framework 2024–2030 exists | ✅ Qureshi 2024 (PMC11662946), JPMA |
| **Diabetes** | **~33M adults, ~26% prevalence — among the world's highest** (IDF); ~65k–226k attributable deaths (IDF range) | ✅ IDF Atlas, Health Policy Watch (Nov 2024), Azeem 2022 |
| **TB** | 5th–6th highest burden globally; **6.3% of global TB cases** (WHO 2025); incidence ~276/100k, deaths ~34/100k (~50k+/yr) | ✅ WHO TB Report 2025, Ullah 2024 (PMC11491547) |
| **Maternal mortality** | **186/100k live births (2019)**, rural decline slower (rural −42% vs urban −11% since 2007); modeled ~160/100k (2022) | ✅ Midhet 2025 (PLOS ONE/PMC), Macrotrends/WHO modeled |
| **Under-5 mortality** | **56/1000 live births (2024, UNICEF)** (was 140 in 1990); Pakistan among the 3 countries with the largest absolute under-5 deaths | ✅ UNICEF data (data.unicef.org/country/pak) |
| **Neonatal mortality** | ~47% of under-5 deaths globally are neonatal; Pakistan among highest in region (~40/1000; regional comparison) | ⚠️ global share ✅ / Pakistan value ⚠️ |
| **CVD / NCDs** | NCDs are the leading cause of death (ischaemic heart disease #1); NCD share ~50-58% of deaths | ⚠️ WHO NCD profile figures — not directly re-verified this session |
| **AMR** | **160,517 deaths associated with bacterial AMR (39,676 attributable) in 2021**; WHO/NIH: AMR contributes ~200k deaths/yr; projected 63k attributable + 262k associated by 2050 | ✅ One Health Trust, WHO EMRO |
| **Road traffic injuries** | Major cause of death/disability in young adults; exact national figure not verified this session | ⚠️ |

## 9. Languages (2023 census mother tongues)

Punjabi **36.98%** (~89M), Pashto **18%**, Sindhi **14%**, Saraiki **12%**, Urdu **9%**, Balochi **3–4%**, Hindko **2%**, Brahui **1%** (Gallup Pakistan 2023-census analysis; Wikipedia/ISSRA concur). Urdu is the national lingua franca (media/education) even where not the mother tongue. **Implication:** Urdu-first UI covers the widest comprehension; Punjabi, Pashto, Sindhi and Saraiki voice support is a genuine differentiator for rural trust — none of the verified competitors offers regional-language voice UX. ✅

## 10. Regional comparisons — what to learn / avoid

- **India eSanjeevani:** >**276M teleconsultations** by Nov 2024 (Sood 2025) — the world's largest state telemedicine programme; hub-and-spoke (health & wellness centres → specialists). **Lesson:** government-anchored distribution + ASHA/community-health-worker-assisted teleconsults drive scale that consumer apps cannot. ✅
- **India ABDM (Ayushman Bharat Digital Mission, Sept 2021):** national digital health ID/infrastructure. **Lesson:** integration rails (ABHA-style ID) create the ecosystem an AI assistant can plug into; Pakistan has no equivalent yet. ✅
- **India private:** Practo (appointments/consults/meds), Apollo 24|7 (consult in 15 min, 1000+ specialists), Tata 1mg (pharmacy + free consults) — marketplace economics, urban. **Qure.ai** (Mumbai, 2016): WHO-evaluated AI radiology (TB screening) — the regional proof that vertical AI diagnosis can scale via public-private TB programmes. ✅
- **Bangladesh Praava Health** (2018, Dhaka): integrated clinics + own diagnostics + app; HBS case study on trust-brand primary care. **Maya Apa:** women-focused anonymous advice (SRH/mental wellness) — evidence women engage with empathetic digital channels when privacy is protected. **Lesson:** privacy-first, female-friendly UX is a requirement, not a feature (gender disparity in telehealth usage documented by Rahman 2021). ✅
- **Sri Lanka oDoc:** largest digital health company; 300k+ users, 70+ corporates, **corporate/insurer-paid B2B2C model**, trilingual (English/Sinhala/Tamil), ~3-min doctor connect. **Lesson:** employer/insurer payment beats consumer payments in South Asia. ✅

---

## ANSWERS TO THE 7 CRITICAL QUESTIONS

### 1. The 5 biggest unsolved problems SehatAI could target
1. **No trusted first-contact health guidance** for ~150M rural/low-income Pakistanis (0.5–1 doctor per 1,000 people; 60-70% out-of-pocket spending ⚠️); people default to self-medication, pharmacists, or quacks.
2. **Maternal & child mortality**: MMR 186/100k, U5MR 56/1000, ~half of child deaths neonatal — ANC/danger-sign triage + immunization reminders reach only ~100k LHWs on paper workflows.
3. **NCD tsunami**: world's-highest diabetes prevalence (~33M, 26% of adults) with almost no structured self-management, screening nudges, or diet/medication adherence support in local languages.
4. **Infectious-disease detection & adherence**: HCV 9.8M (4.3%), TB ~6.3% of global cases — symptom-based screening triage, linkage to DHIS2/TB programmes, and treatment-adherence chatbots are absent at population scale.
5. **Health misinformation + medication-safety/AMR**: 160k AMR-associated deaths/yr; antibiotic self-medication is endemic; no authoritative Urdu voice answers "should I panic / where do I go?"

### 2. Is any Pakistan app using real AI today?
**Essentially no — not verified at clinical scale.** oladoc's App Store listing advertises an AI meal-scanner (nutrition, not clinical) ✅. A JCPSP paper asserts Marham/doctHERS "use AI for diagnostics and triage," but no product evidence substantiates this ⚠️. ADB has announced $950K for AI-in-healthcare capacity across Pakistan/Bangladesh/Indonesia ✅ — i.e., pre-emptive capacity building, confirming the field is nascent. One new entrant, **ilaaj.ai**, markets itself as an "AI health app" for Pakistan (self-published comparison blog, 2026) ⚠️ — worth monitoring, unverified. Qure.ai (Indian) operates AI TB screening in 80+ countries; Pakistani deployment not verified ⚠️.

### 3. Rural user device/connectivity/literacy reality
Household mobile access >96% (HIES 2024-25); Android = **91%** of mobile OS; 190M cellular connections (75% of population); mobile-broadband coverage 81% of adults but usage lags (women's mobile internet 45%, 38% ownership gender gap — world's largest); smartphone penetration ~51% (2020) growing; rural literacy 51.6% (women far lower). Net: **design for one shared, low-end Android, intermittent 3G/4G, Urdu/regional-language voice, low literacy, cash economy.**

### 4. Regulatory reality for an AI symptom-checker
No dedicated AI-health law yet. DRAP may classify diagnostic/triage AI as SaMD (legal commentary direction) → stay "information + triage + escalation"; PMDC registration for any human doctor in the loop; PDPB 2023 **still unenacted** → self-impose GDPR-grade practice (consent in Urdu, minimization, localization); PECA 2016/2025 content liability; Digital Nation Pakistan Act 2025 (Pakistan Digital Authority) + National AI Policy 2025 create the coming oversight architecture. Conservative emergency escalation is non-negotiable.

### 5. Existing infrastructure to integrate with
- **Rescue 1122** (1122) — emergency routing/dispatch UX layer (no unified national dispatch app exists to compete with).
- **Sehat Sahulat/Sehat Card Plus (KP 10.6M families)** — coverage/eligibility checks, panel-hospital finders (per-province, dated).
- **DHIS2** (national aggregate reporting; TB, Punjab, Balochistan 1,650+ facilities) — anonymized surveillance feedback loops, referral data.
- **LHW Programme (~100k workers, ~1,000 people each)** — the human last-mile channel for assisted-mode AI (e-clinic model à la Sehat Kahani).
- **AKUH / Shifa / SKMCH patient portals** — referral and second-opinion routing for paying users; eShifa's teleconsult→pharmacy rail.
- **EPI cold-chain/immunization schedule** — reminder/targeting layer for the 51.6% zero-dose-adjacent coverage gap.

### 6. Sehat Sahulat current status (2024–25)
**Fragmented by province and in flux.** KP: Sehat Card Plus running (10.6M families, universal for KP domiciles). Punjab: withdrawn from *government* hospitals 30 June 2025 ("financial inefficiencies"), insurance continues in empanelled private hospitals under a retargeted model per PHIMC. Federal: suspended April 2023; restoration directives and a Jan 2026 National Steering Committee are documented; "full restoration for Islamabad" is reported but lower confidence. **Build for entitlement volatility.**

### 7. Single biggest white-space opportunity
**Verified, offline-first, Urdu+regional-language VOICE AI health guidance & triage for the bottom-of-pyramid majority — with human/physical escalation rails.** Every verified incumbent is an urban, English-or-basic-Urdu, marketplace/teleconsult monetization play (oladoc, Marham, InstaCare) or a siloed hospital portal (AKUH, Shifa, SKMCH). Nobody owns: (a) symptom triage + first-aid in Punjabi/Pashto/Sindhi/Saraiki voice, (b) low-bandwidth/offline PWA behavior, (c) LHW-assisted mode, (d) emergency routing to 1122/Edhi/Chhipa with facility finders. India's eSanjeevani/ABDM prove public-rail scale; oDoc proves B2B2C monetization on top. SehatAI's defensible wedge: **the trusted, verifiable health-information and triage layer for the ~100M+ Pakistanis no current app is built for**, monetized later via insurers (Sehat Sahulat-adjacent), employers, NGOs/donors (UNICEF/Gavi/Global Fund-style procurement), and pharmacy/lab referral fees — while staying inside the information-not-diagnosis regulatory line.

---

## Source appendix (key citations)
- WHO data.who.int/countries/586; WHO Global TB Report 2024/2025 (Pakistan 6.3% of global cases)
- UNICEF data.unicef.org/country/pak (U5MR 56/1000, 2024); unicef.org/pakistan/health
- Midhet et al. 2025, PLOS ONE (Pakistan MMR 186/100k, 2019)
- IDF Diabetes Atlas (Pakistan ~33M adults, ~26%); Health Policy Watch (Nov 2024)
- Qureshi et al. 2024, PMC11662946 (HCV 9.8M, 4.3%); JPMA national hepatitis framework 2024–2030
- One Health Trust + WHO EMRO/NIH (AMR deaths)
- Gallup Pakistan 2023-census analyses (languages; literacy urban 74.1% vs rural 51.6%); Business Recorder (Jun 2025)
- PTA HIES 2024–25 highlights; DataReportal Digital 2025 Pakistan; GSMA (Aug 2024, 81% broadband coverage, gender gap); StatCounter (Android 91.2%)
- voicepk.net (Jul 1, 2025, Punjab Sehat Card closure); phimc.punjab.gov.pk FAQ; sehatsahulat.com.pk (KP 10.6M families); Dawn (Mar 2025, NA body on SSP); PID press release (Jan 2026, SSP restoration)
- rescue.gov.pk; Wikipedia "Rescue 1122"; chhipa.org; siehs.org; Dawn Herald (ambulance landscape)
- DRAP dra.gov.pk; ICLG Digital Health Pakistan 2024; CourtingTheLaw (Jun 2025, SaMD commentary); Chambers/DataGuidance/DLA Piper (PDPB 2023 pending; PECA 2025 amendment); digitalpolicyalert.org (Digital Nation Pakistan Act 2025); Global Law Experts (National AI Policy 2025)
- Sood et al. 2025 (eSanjeevani 276M teleconsults); PIB (ABDM 2021); HBS Praava case; oDoc LinkedIn/Airtel (300k users, 70+ corporates, trilingual)
- Funding: MobiHealthNews (Marham $3M Series A, Dec 2023; Dawaai $8.5M, 2021); MAGNiTT/MENABytes (Marham $1M seed, 2021)
- oladoc Google Play / App Store listings (25,000+ doctors; AI meal scan); Sehat Kahani site, Gavi, UNDP Digital X, PMC9924177 & PMC8594017 (mHealth among CHWs/LHWs)
- dhis2.org (Balochistan 1,650+ facilities; Pakistan TB DHIS2 since 2018); dhispb.com (Punjab)
- Raw search JSON: `/home/z/my-project/research/raw_06/` (files 01–44)

*All unverified/low-confidence items explicitly marked ⚠️/❌ above. No local competitors were fabricated: DocMart, MediCart, and SIUT apps could not be verified and are flagged as such.*
