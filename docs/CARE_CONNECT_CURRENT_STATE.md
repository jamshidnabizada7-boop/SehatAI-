# Care Connect — Current State Audit (PHASE 0 DELIVERABLE)

> **Document type:** Pre-implementation verification of the existing SehatAI codebase against the Care Connect master plan (§0 "Verify everything before implementing").
> **Audit date:** 2026-10-07 · **Repo:** `jamshidnabizada7-boop/SehatAI-` (local clone at commit `a4d1205`)
> **Method:** Direct code inspection — 265 source files, full Prisma schema, all 66 API routes, auth layer, pipeline, i18n, tests. No claim below comes from documentation; every claim cites a file.
> **Classification legend:** `EXISTS` · `PARTIAL` · `MISSING` · `NEEDS REFACTOR` · `BLOCKED BY EXTERNAL PROVIDER` · `BLOCKED BY REGULATION`

---

## 1. Executive verdict

SehatAI today is a **sophisticated AI-triage PWA** (Next.js 16.1, React 19, Prisma 6, NextAuth 4 JWT sessions, 535-case test suite) with **zero commerce infrastructure**: no payments, no ledger, no consultation entity, no payouts, no jurisdiction engine, no dispute/refund flows. It does have real, reusable foundations the plan explicitly forbids rebuilding: authentication with role separation, doctor verification (PMDC), the deterministic-first safety pipeline, a local drug-interaction engine, a doctor directory, WebRTC video via a companion signaling service, push-notification subscriptions, and a type-checked trilingual i18n system.

**Care Connect is therefore a genuinely additive build:** every commercial primitive below is new code under `src/lib/care/*`, `src/server/care/*`, `src/app/api/care/*`, `src/components/care/*`, plus an additive Prisma schema extension. Existing modules are reused, not modified, except where §3 lists surgical integration points.

**Local-dev note:** the Prisma datasource was switched from `postgresql` (Neon) to `sqlite` for this local workspace (`file:./dev.db`). The schema uses no Postgres-only constructs (no enums / arrays / `Json` / `@db.*`); production switches back by restoring the `postgresql` block. Monetary values are stored as integer minor units (`Int`), which is portable across both engines.

**Regression baseline (recorded before any Care Connect code):** `bun test tests/tests/safety/` → **535 tests, 516 pass, 19 fail, 1 error.** All 19 failures are pre-existing engine/data drift (L0 calibration cases, retrieval ranking, template trilingual completeness, one LLM-timeout case) and are unrelated to commerce. Gate for every subsequent phase: **no new failures beyond this set.** (Seed fix applied in Phase 0: `prisma/seed.ts` now dedupes 3 duplicate corpus ids — `pneumonia-child`, `stroke-fast`, `scabies` — that crashed Document sync; the in-memory retrieval corpus was intentionally left untouched to preserve ranking behavior.)

---

## 2. Verified current architecture (the integration surface)

| Layer | What exists (file-verified) |
|---|---|
| **Auth** | NextAuth 4, JWT strategy (30 d), Credentials (bcrypt) + conditional Google. Session shape: `{ user: { id, email, name, role: 'user'\|'doctor'\|'admin', accountStatus: 'active'\|'pending_verification'\|'suspended'\|'deleted' } }`. Guards in `src/lib/auth.ts`: `requireUser()` / `requireDoctor()` / `requireAdmin()` / (dead) `requireActiveDoctor()`. |
| **Doctor verification** | `DoctorProfile` (pmdcNumber unique, pmdcVerifiedAt), `DoctorVerificationDoc` (uploaded to `public/uploads/doctor-docs/{userId}/`), admin approve/reject via `/api/admin/verify-doctor`. **Server-side gate gap:** doctor APIs check role only; `requireActiveDoctor()` exists but is never called (UI-only enforcement). |
| **Patient profile** | `PatientProfile` (server, userId-keyed) mirrored from client `HealthProfile` (localStorage); `sanitizeProfileServer()` + `profileRedFlagOverrides()` + `allergyCrossCheck()` feed the pipeline. |
| **AI pipeline** | `runPipeline()` (`src/server/pipeline/run.ts`, 2595 lines): injection scan → L0 lexicon (<5 ms) → language → profile overrides → L1 LLM triage → drug-interaction check (HIGH ⇒ triage floor URGENT) → TF-IDF vector retrieval → grounded generation → L2 rule+judge validation → citation grounding → confidence band → SSE `done` event carrying `{ triage, differential, drugCheck, confidence, citations }`. Constellation (4 validators) runs post-hoc. |
| **Drug engine** | `src/lib/drug-interactions.ts`: local `DRUG_DB` (aliases incl. Pakistani brands, classes, pregnancy categories), interaction rules, allergy classes, population flags. Reusable as-is for prescription safety checks. |
| **Conversation history** | `Conversation`/`Message` models; APIs keyed by client `sessionToken` (no session check — known IDOR gap, flagged in §5). |
| **Doctor directory** | `/api/doctors` (public, verified+active only, specialty/city/q filters, take 50); `DoctorReview` (1 per patient per doctor, avgRating); `Appointment` (requested→confirmed→declined→cancelled→completed; no payment, no reschedule). UI: `src/components/about/doctor-directory.tsx` inside About view. |
| **Video** | `src/components/video/video-call.tsx`: real WebRTC (STUN only) with offer/answer/ICE over WebSocket to `mini-services/video-signal/index.js` (port 3004, rooms in a Map, **no auth on signaling**). `/api/video-call` returns `{ roomId: 'appt-<id>', signalPort, role }` after participant check. |
| **Voice** | Browser `SpeechRecognition`/`speechSynthesis` (`use-speech.ts`); `/api/voice/transcribe` works via Groq `whisper-large-v3`; `/api/voice/stt` + `/tts` are placeholders (`ready:false`). |
| **Vision** | `/api/vlm-analyze` via Gemini vision (Z.ai purged in commit `ac7dd43`). |
| **Notifications** | `PushSubscription` model + `/api/push/subscribe` (stores endpoint) + `/api/push/vapid`; `web-push` installed. **No reusable server-side send-to-user helper; `public/sw.js` has no `push`/`notificationclick` handlers** (only local `new Notification()` works). Demo cron sender exists at `mini-services/push-scheduler`. |
| **i18n** | `src/lib/i18n/`: `t(lang, key)` with type-checked `TKey = Paths<typeof en>`; registered langs **en / ur / roman** (pa/sd files exist but unregistered); RTL applied for `ur` via `document.documentElement.dir`. New modules add keys to `en.ts` (+ `ur.ts`, `roman.ts`). |
| **App shell** | Single-page state-based views: `View` union in `src/lib/store/app-store.ts` (`chat|reminders|facilities|dashboard|about|my-health|observability|doctor-copilot`), role-gated via `PATIENT_VIEWS`/`DOCTOR_VIEWS`/`ADMIN_VIEWS` in `page.tsx`, nav items in `app-nav.tsx` with `adminOnly`/`doctorOnly` flags. Adding a module = extend union + nav + render branch. |
| **Offline** | Dexie (`offline-db.ts`, 3 tables, `rev` field for CHT-style sync, **`pushPendingSync()` is a no-op stub**); SW caches app shell only. |
| **Storage** | Raw `node:fs` writes under `public/uploads` (doctor verification docs); admin read-back via `/api/admin/doctor-doc`. No abstraction, no S3, no private buckets. |
| **Payments** | **Nothing.** Zero payment code, models, or dependencies in the entire repo. |
| **Deployment** | `next.config.ts`: standalone (Docker flag) / static export (Capacitor flag); `Caddyfile` reverse-proxies `:3000` + mini-services via `?XTransformPort=`; Vercel-demo heritage; **no Dockerfile, no CI**. |
| **Observability** | `AuditLog` model + `/api/audit` (self-scoped); `src/lib/observability.ts` + `/api/observability/metrics`; `PipelineRun` records. No alerting. |

---

## 3. Capability classification (plan section → verdict)

### 3.1 Foundations

| # | Plan requirement | Verdict | Evidence / disposition |
|---|---|---|---|
| 0 | Verify everything before implementing | ✅ DONE | This document. |
| 1 | Non-regression: existing suite green before/after each phase | PARTIAL | Suite exists and runs (535 tests); baseline has 19 pre-existing failures recorded above. Gate = "no new failures". |
| 2 | Feature flags incl. jurisdiction-level | PARTIAL | Only `ENABLE_VOICE_INPUT` / `ENABLE_OFFLINE_MODE` env flags exist. **New `CARE_*` flag layer will be built in Phase 1.** |
| 5 | DB: reuse `User`, `PatientProfile`, `DoctorProfile` | EXISTS | Reused as-is; Care Connect models reference them. |
| 94 | Versioned migrations (no destructive push in prod) | PARTIAL | `db push` workflow today; Care Connect adds `prisma migrate` locally; prod migration runbook documented in DEPLOYMENT doc. |

### 3.2 Identity, roles, security

| # | Plan requirement | Verdict | Evidence / disposition |
|---|---|---|---|
| 14/52 | Roles: PATIENT, DOCTOR, SUPPORT, FINANCE, CLINICAL_ADMIN, ADMIN, SUPER_ADMIN | PARTIAL | Today only `user|doctor|admin`. **Care Connect adds `support`, `finance`, `clinical_admin`, `super_admin` as additive string values + `src/lib/care/rbac.ts` least-privilege matrix** (existing `user`/`doctor`/`admin` behavior preserved). |
| 53 | RBAC + ownership checks | PARTIAL | `requireUser/Doctor/Admin` + resource-level checks on doctor/appointment routes; Care Connect adds participant-membership checks. |
| 54 | Security headers, CSP, rate limiting, CSRF | PARTIAL / NEEDS REFACTOR | No middleware, no CSP/HSTS headers; single in-memory rate limiter (doctor signup). Phase 17 adds `middleware.ts` headers + a pluggable limiter (DB-backed for serverless correctness). |
| 55 | 2FA (TOTP) for doctors/finance/admins | MISSING | New TOTP implementation (RFC 6238, no new deps — node crypto) in Phase 17. |
| 56 | Distributed rate limiting | MISSING | In-memory Map today; Phase 17 ships limiter with DB backstop. |
| 57 | No raw card storage; hosted checkout | N/A→ENFORCED BY DESIGN | No payment code exists; design bakes in provider tokenization + hosted checkout only. |
| 58 | Idempotency keys | MISSING | New `src/lib/care/idempotency.ts` (Phase 4) with DB-backed replay protection on payment/refund/payout/booking. |
| 59 | Transactions/concurrency | PARTIAL | Prisma `interactive transactions` available and used in places; Care Connect uses them for booking/payout/refund. |
| 60 | Fraud signals | MISSING | Phase 15: flagged-events table + admin review queue (flag-only, no auto-punishment). |
| 61 | Contact-info leakage policy | MISSING | Phase 6: soft detection (flag, don't censor) with configurable policy. |

### 3.3 Marketplace & doctors

| # | Plan requirement | Verdict | Evidence / disposition |
|---|---|---|---|
| 14 | Doctor onboarding: account→identity→license→services→fees→availability→payout→review | PARTIAL | Signup+PMDC+doc upload+admin approval exist; **services/fees/availability/payout configuration is new (Phase 2)**, extending—not replacing—the existing flow. |
| 15 | License verification (PM&DC) | PARTIAL | Manual admin verification of uploaded PMDC card exists. No automated government API (none publicly exists) → **verification adapters pattern** (Phase 2); uploaded card alone remains insufficient (admin review required — same as today). |
| 16 | Jurisdiction engine | MISSING | New `JurisdictionPolicy` model + `src/lib/care/jurisdiction.ts` matcher (Phase 2). |
| 17 | Patient location declaration | MISSING | New consultation-time declaration field (Phase 3). |
| 18 | Marketplace `/doctors` with filters | PARTIAL | API exists (`/api/doctors`) but limited filters (no language/gender/price/availability/verified-toggle beyond hardcoded behavior, no rating in list). **Phase 2 adds Care Connect marketplace service layer + new UI; existing directory stays.** |
| 19 | AI doctor matching (specialty classifier) | MISSING | Phase 7: deterministic symptom→specialty map (reuses L1 conditions/red-flag categories; no new LLM dependency), feeding existing triage output. |
| 20 | Ranking engine | MISSING | Phase 2: transparent weighted score (specialty match, language, rating-robustness, availability); sponsored slots explicitly labeled, default off. |
| 44/45 | Reviews scoped to completed consultations + robust rating | PARTIAL | `DoctorReview` exists but is patient-level (not consultation-scoped) with raw average. Care Connect adds `Review` (consultation-scoped) + Bayesian-average ranking; existing `DoctorReview` module untouched. |
| 46 | Availability (weekly schedule, UTC, no double booking) | MISSING | New `DoctorAvailability` + slot engine with transaction-guarded booking (Phase 2). |
| 47 | Instant consultation (online-now) | MISSING | Phase 2: `isOnlineNow` flag + accept-window with auto-expiry. |
| 65/66 | Continuity ("Consulted before") + favorites | MISSING | New `DoctorFavorite` + relationship query (Phase 2/3). |
| 63 | Family accounts (explicit authorization) | PARTIAL | `src/lib/family-health.ts` stores family profiles **client-side only** (privacy by design). No server family linkage — Care Connect keeps consultations strictly per-user; family sharing not in scope (explicit-consent flows deferred; data model does not prevent it). |
| 69 | Clinic accounts readiness | ARCHITECT ONLY | Additive nullable `clinicId` fields on doctor service/consultation models + a `Clinic` model stub; no clinic features. |

### 3.4 Consultation core

| # | Plan requirement | Verdict | Evidence / disposition |
|---|---|---|---|
| 3 | Central `Consultation` entity + 17-state lifecycle | MISSING (adjacent PARTIAL) | `Appointment` exists for the free booking flow and **stays untouched**; the commercial lifecycle (DRAFT→…→COMPLETED + alternates) is the new `Consultation` model with `ConsultationStatusEvent` audit trail (Phase 3). |
| 4 | Consultation types TEXT/AUDIO/VIDEO + doctor-controlled pricing | MISSING | New `DoctorService` (type, priceMinor, currency, duration, window) (Phase 2). |
| 21 | Secure consultation chat (authz = participant + state + role) | MISSING | New `ConsultationMessage` + `/api/care/consultations/[id]/messages` with 4-factor authorization (Phase 6). |
| 22 | Message window / follow-up grace | MISSING | DoctorService `windowHours` + grace config (Phase 6). |
| 23/24 | Message editing = correction + audit; deletion = visibility removal | MISSING | Immutable original + `correctedById`; soft-delete flag (Phase 6). |
| 25 | Realtime without Vercel websockets | PARTIAL | SSE transport already proven in-app (chat) + WS mini-service for video. **New `RealtimeProvider` abstraction: `SseRealtimeProvider` (default, works on Vercel) + `WebSocketRealtimeAdapter` (self-hosted) (Phase 6).** |
| 26–28 | WebRTC calls, room tokens, low-bandwidth fallback (video→audio→chat) | PARTIAL | Real WebRTC exists but signaling is unauthenticated, no token TTL, no fallback ladder. **Phase 9: `VideoProvider` abstraction + signed short-lived room tokens (HMAC), participant+payment+window checks, auto video→audio→chat fallback.** LiveKit adapter scaffolded behind flag (`BLOCKED BY EXTERNAL PROVIDER` for production credentials). |
| 29 | Recording policy | DESIGN-DEFAULT | `recordingEnabled=false` hard default; consent+jurisdiction gates scaffolded (Phase 9). |
| 30 | Pre-consultation AI intake | PARTIAL | Pipeline callable headlessly (`runPipeline({persist:false})` — proven by eval harness). New `ClinicalIntake` model + intake API wrapping it (Phase 7). |
| 31 | AI clinical handoff (labeled AI-GENERATED) | PARTIAL | `/api/summary` already produces doctor summaries with disclaimer + deterministic enrichment. New `ClinicalHandoff` model persists it per-consultation; doctor accept/edit enforced (Phase 7). |
| 32 | Doctor AI copilot | PARTIAL | `doctor-copilot` view + `/api/doctor/soap-note` + drug-checker exist. Phase 8 wires the same services into the consultation workspace (draft-until-accepted). |
| 33 | No chain-of-thought exposure | EXISTS (by design) | Pipeline exposes only structured data (triage/signals/citations/confidence). Enforced in all new code. |
| 34/35 | Translation storage + high-risk confirmation | MISSING | New `Translation` model preserving original; dose/med/allergy term confirmation gate (Phase 11). Provider-abstracted (existing Groq/Gemini keys work for dev). |
| 36 | Voice messages | PARTIAL | Audio upload path + Groq transcription exist; size/duration limits + private storage + transcription metadata are new (Phase 10). |
| 37/38 | Private medical files + StorageProvider abstraction | PARTIAL / NEEDS REFACTOR | Current uploads sit under `public/` (statically served — existing behavior kept for non-clinical docs); **Care Connect files go to a private store** (`storage/care/` outside public, signed-URL read API with authorization check). S3 adapter scaffolded. |
| 39/40/41 | Prescriptions (jurisdiction-gated, doctor-signed, AI never issues) + safety checks + controlled-drugs off | MISSING | New `Prescription`/`PrescriptionItem`; pre-sign safety check reuses `checkDrugSafety()`; `controlledDrugsEnabled=false` default (Phase 12). |
| 42 | Clinical notes (private vs patient summary) | PARTIAL | SOAP draft API exists; new `ClinicalNote` model with `visibility: PRIVATE_NOTE | PATIENT_SUMMARY` (Phase 12). |
| 43 | Completion flow → summary+instructions+earning eligibility | MISSING | Phase 3/12/14 composite transaction. |

### 3.5 Money

| # | Plan requirement | Verdict | Evidence / disposition |
|---|---|---|---|
| 6 | Integer minor units | ENFORCED BY DESIGN | New money utils (`money.ts`: format/parse/validate, no floats). |
| 7 | CommissionRule (bps, effective dates) | MISSING | Phase 4. |
| 8 | Double-entry ledger, immutable, compensating entries | MISSING | Phase 4 (`LedgerAccount`/`LedgerEntry`; doctor wallet = derived balance). |
| 9 | PaymentProvider abstraction + adapters | MISSING | Phase 4: interface + `MockPaymentProvider` (**dev/test only, clearly labeled**) + `HesabPayAdapter`/`PakistanPaymentAdapter`/`CardAdapter` scaffolds throwing `PROVIDER_NOT_CONFIGURED` until merchant agreements exist (**BLOCKED BY EXTERNAL PROVIDER**). |
| 10 | One clear checkout | MISSING | Phase 5 UI. |
| 11 | Payment state machine + verified webhooks (signed, idempotent, replay-safe) | MISSING | Phase 4/5 (HMAC signature verify + timestamp window + webhook event table). |
| 12 | No unlicensed escrow | ENFORCED BY DESIGN | Funds framing = pending earnings in internal ledger only; provider holds funds. |
| 13 | Doctor payouts (states, dashboard, admin reconciliation) | MISSING | Phase 14. |
| 48/49/50 | Cancellation policies / provider-confirmed refunds / disputes | MISSING | Phase 5 + 15. |
| 88/89 | Payment & concurrency tests (deterministic) | MISSING | Phase 18. |

### 3.6 Trust, ops, compliance

| # | Plan requirement | Verdict | Evidence / disposition |
|---|---|---|---|
| 51 | Admin Care Connect sections | PARTIAL | Admin role + verification UI exist; Care Connect adds finance/dispute/jurisdiction/commission consoles (Phase 15). |
| 62 | Notifications (push/email/SMS, lock-screen privacy) | PARTIAL | Push subscriptions stored; no send helper, no SW push handler, no email/SMS provider (**email/SMS = BLOCKED BY EXTERNAL PROVIDER**, adapters scaffolded). Phase 16 completes in-app + push path. |
| 64 | Patient medical record timeline | PARTIAL | My-Health view + consultations will feed it (Phase 8). |
| 67/68 | Subscriptions architecture (patient + doctor Pro) | MISSING | Phase 14: `Plan`/`Subscription` models through payment abstraction, launch-disabled. |
| 77/78 | Analytics funnel + revenue dashboard | MISSING | Phase 15 (no PHI in analytics — enforced). |
| 79/80 | Structured logs + health checks | PARTIAL | Observability lib exists; `/api/health` basic. Care Connect adds dependency health endpoint (Phase 15). |
| 81 | Backups/restore | PARTIAL | SQLite file locally; prod runbook documented (DEPLOYMENT doc). |
| 82 | Data export/deletion lifecycle | PARTIAL | Hard-delete exists (`/api/user/delete`); policy-lifecycle states added (Phase 19 docs + retention fields already in `User`). |
| 83 | Versioned consent records | PARTIAL | `User.consentAt` + `PatientConsentForDoctor` exist; new `ConsentRecord` (policyVersion, type, consultation) in Phase 1. |
| 84 | Legal documents | MISSING | Phase 19 produces the 11 documents as DRAFTS marked **"requires counsel review"** — no fake legal claims. |
| 85 | Emergency never paywalled | EXISTS (enforced upstream) | L0 short-circuits before any commercial surface; Care Connect booking flow re-checks triage and always shows emergency instructions first (Phase 7 test). |
| 86 | AI safety upstream of commerce | EXISTS | Safety validators precede matching; matching cannot veto/override triage (design + test). |
| 71/72/74/75/76 | Routes, UX, mobile-first, WCAG, RTL | PARTIAL | i18n/RTL/mobile shell exist; Care Connect UI follows same patterns; WCAG pass at Phase 8. |
| 92/93/95 | Environments, CI, rollout stages | MISSING/PARTIAL | No CI today; Phase 20 adds CI workflow config + staged-rollout flag defaults (`CARE_ROLLOUT_STAGE=1`). |
| 100 | Final fresh audit + 9 audit docs | PENDING | Final phase. |

---

## 4. Decisions locked by this audit

1. **Reuse, don't fork:** `User`, `PatientProfile`, `DoctorProfile`, `DoctorVerificationDoc`, `AuditLog`, `PushSubscription`, drug engine, pipeline, i18n, observability are consumed as-is.
2. **`Appointment` stays** as the free booking flow. The commercial `Consultation` is a separate entity (plan §3); no data migration of existing appointments.
3. **Existing `DoctorReview` stays**; consultation-scoped `Review` is additive with its own robust ranking.
4. **New roles are additive string values**; every existing `role === 'user' | 'doctor' | 'admin'` check keeps working.
5. **SQLite locally / Postgres in prod** — schema stays portable; money as `Int` minor units.
6. **No fake integrations:** payment/video/storage/SMS providers ship as adapters that throw `PROVIDER_NOT_CONFIGURED` until credentials exist; `MockPaymentProvider` is explicitly dev/test-only and cannot be enabled when `NODE_ENV === 'production'`.
7. **Verification docs under `public/`**: existing behavior untouched (non-breaking), but all NEW Care Connect files are stored privately; the public-uploads issue is recorded for the final security audit.

## 5. Pre-existing defects recorded (not caused by Care Connect; fix list for Phase 17/final audit)

1. `/api/fhir/[resource]`, `/api/conversations*`, `/api/reminders*`, `/api/summary`, `/api/lhw/dashboard` lack session auth (IDOR/PHI exposure).
2. `requireActiveDoctor()` never used — pending/suspended doctors pass server-side doctor APIs.
3. JWT revocation is a no-op (`invalidateUserSessions` deletes DB sessions unused by JWT strategy).
4. Hardcoded demo insurer keys in `/api/insurer/triage`.
5. Unauthenticated cost-bearing AI routes (`voice/*`, `eval/*`, `rwe-llm`).
6. No middleware/security headers; `typescript.ignoreBuildErrors: true`.
7. Doctor verification docs statically served from `public/`.
8. Consent-before-chat enforced client-side only.
9. `pa.ts`/`sd.ts` i18n dictionaries exist but unregistered.
10. SW lacks push handlers; offline `pushPendingSync()` is a stub.

---

**PHASE 0 COMPLETE.** Next: PHASE 1 — Database foundations (additive Prisma models) + Care Connect feature flags + commission/jurisdiction seed data.
