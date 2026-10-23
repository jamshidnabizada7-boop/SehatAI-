# Clinical safety verification — engineering scope

## Runtime path

Raw input → normalization → ownership-checked full transcript → structured patient-report safety reconstruction → active-risk follow-up guard → conversational intent/identity or factual recall → deterministic current-turn triage → optional authorized model/retrieval path → validation/fallback → final public event projection → atomic transcript persistence → later safety reconstruction. The independent client/offline path provides essential guidance before network latency and uses the same safety state.

Prompt history is limited for generation; safety history is not truncated to that window. Assistant text is excluded from patient symptom evidence. A patient's explicit report is not a confirmed diagnosis. Original English/Urdu/Roman Urdu quotations remain identifiable in summaries and recall.

## Safety invariants

1. An unresolved serious patient report cannot be cleared by a newer greeting, unrelated wellness question, assistant reassurance, token limit, elapsed time or message count.
2. Concerns retain category, subject, quoted report, timestamp when known, severity/onset when stated, resolution status and resolution evidence. Self-harm ideation and possible imminent intent are recorded separately; pending immediate-safety questions and uncertainty remain explicit.
3. Historical and hypothetical reports do not create a current emergency merely by naming a symptom. A new current report overrides historical framing. Negation is evaluated by the existing clinical context rules.
4. A narrowly supported correction can correct that concern only. Reported symptom resolution moves to reassessment; reported clinician assessment **and** matching resolution can close that concern. A doctor mention alone does not establish stability. No model can mutate these rules.
5. Current medical status/stability cannot be confirmed remotely. For the chest pain → wanting to die → status question, the response quotes both concerns, recommends urgent in-person assessment, supports involving a trusted person and asks about immediate danger.
6. First-aid templates remain specific to the current emergency where available. Subsequent multi-risk follow-ups prioritize the actual remembered concerns. Unknown location does not imply a national emergency number works.
7. Unvalidated model generation is not streamed to patients or saved as the authoritative response. Validation failure uses deterministic/local guidance or abstention; no fabricated clinical confidence or differential is exposed.
8. Medical summaries only extract patient reports; assistant advice is labeled as prior guidance, never converted into patient diagnoses or measured vitals. Empty or greeting-only transcripts are insufficient. JSON export is a transcript summary format, not a certified EHR/FHIR document.

## Tests and interpretation

`tests/tests/safety/production-hardening.test.ts` adds the exact nine-message sequence, rejected false-name patterns, explicit introductions, three-language illness/distress/small talk, active/historical/hypothetical distinctions, negation, correction, self-harm context, long-history retention, role separation, factual summaries, action policies, final-event filtering, QR capacity and honest unavailable sync.

Existing safety suites cover red flags, pregnancy, children, medication intent/refusals, trauma, injection, unseen adversarial cases, translation and offline contracts. Their passing result is regression evidence, not population sensitivity/specificity, clinical outcome evidence or proof of perfect detection. Several expected fixtures were intentionally changed because the old behavior accepted arbitrary names, fictional-current emergencies, unverified emergency numbers or deletion of unrelated caches. Clinical adjudication of changed contracts is required.

Production API/browser verification uses synthetic transcripts and actual local PostgreSQL. The saved full transcript contains all 18 messages of the observed sequence. The final stored assistant content matches the content delivered over SSE. Chrome exercises greetings without referral solicitation, safety continuity across reload, local summary creation/export, account switching, emergency dialog keyboard focus, and three RTL viewports. Offline reload results are recorded explicitly in the release checklist.

## Clinical review required before public release

Have qualified clinicians review urgency thresholds, false positives/negatives, self-harm wording and immediate-risk escalation, third-person wording, resolution criteria, maternal/pediatric rules, medication safety, translations and applicable local services. Evaluate representative patient populations and adversarial mixed contexts beyond repository fixtures. Review every source's applicability, freshness, permitted usage and claim support. Run provider-integrated evaluations with consented synthetic data, then a clinically supervised release process. Do not describe this work as medical certification, universal safety, calibrated clinical confidence or regulatory compliance.
