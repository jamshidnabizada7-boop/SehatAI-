# SehatAI Structural Reconciliation Diff

This document groups all structural and architectural differences identified between the Old Hardened Copy (`D:\SehatAI FINAL\SehatAI FINAL`, commit `3082e25`) and the Current Complete Copy (`C:\Users\Computer House\.zcode\workspace\default\SehatAI-`, commit `83636a4`).

---

## 1. SECURITY
- **Conversation Ownership & IDOR**:
  - `src/app/api/conversations/[id]/route.ts`: Old hardened repo restricts conversation access to verified user ID, unowned guest token match, admin role, or consented doctor. Complete repo used naive sessionId parameter check.
  - `src/app/api/conversations/route.ts`: Old hardened repo queries by authenticated `userId` when session exists, preventing enumeration or access to other users' conversations.
  - `src/server/pipeline/run.ts`: Added conversation injection guard. User A cannot append messages to User B's conversation.
- **Summary Generation Authorization**:
  - `src/app/api/summary/route.ts`: Old hardened repo verifies that the caller owns the target conversation before generating a clinical doctor summary.
- **Private Health Document Storage**:
  - `src/app/api/doctor/upload-doc/route.ts` & `src/app/api/admin/doctor-doc/route.ts`: Uploaded PMDC certificates and credentials are stored in private storage outside web root (`storage/docs`), validated against magic bytes and size limits, and served via an authenticated admin streaming endpoint.
- **Security Headers**:
  - `next.config.ts`: Strict Content-Security-Policy, HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy. Permissions policy configured to allow camera and microphone for WebRTC teleconsultations and voice.

---

## 2. AUTH
- **Live Database Re-Verification & Session Revocation**:
  - `src/lib/auth.ts`: `requireUser()` re-queries the database directly for account status (`suspended`, `deleted`) and current role, ensuring demoted admins and suspended doctors lose access immediately rather than relying on stale JWT claims.
- **Explicit Consent**:
  - `src/app/api/auth/signup/route.ts`: Rejects missing or false consent (`body.consent === true`), enforcing affirmative consent recording with policy versioning (`2026-10-v1`).
- **Two-Factor Authentication (TOTP)**:
  - Care Connect introduced TOTP verification for privileged roles (`doctor`, `admin`, `finance`) during credential authorization in `authOptions`.
- **Brute-Force Rate Limiting**:
  - Care Connect introduced DB-backed rate limiting on credential authorization attempts (`login:<email>`) and signups (`signup:<ip>`).

---

## 3. AI SAFETY
- **Constellation Veto Enforcement**:
  - `src/server/pipeline/run.ts`: Re-verified critical veto logic. If constellation consensus triggers `mustAbstain = true` (e.g. `red-flag-recheck` or `medication-safety`), the returned payload is deterministically overridden with safe clinical guidance and 1122 escalation, rather than returning unsafe LLM output.
- **Emergency Continuity across Turns**:
  - If a patient experienced an emergency in prior turns, subsequent messages in that session do not downgrade to routine triage without clinical resolution.
- **Clinical Engine & Corpus Hardening**:
  - `src/lib/engine/safety-engine.ts`: Anaphylaxis pattern recognition, hypertensive urgency with headache, mild abdominal pain calibration, audience-specific scoring (child vs adult).
  - `src/data/corpus.ts`: 241 verified trilingual clinical items with expanded tags.
  - `src/data/emergency-templates.ts`: 27 trilingual emergency templates with actionable first-aid steps.

---

## 4. DATABASE
- **Care Connect Data Models**:
  - Complete repo introduced 15+ new Prisma models: `CareService`, `AvailabilitySlot`, `Consultation`, `ConsultationMessage`, `ConsultationAttachment`, `ConsultationNote`, `ConsultationHandoff`, `ConsultationDispute`, `ConsultationPrescription`, `Payment`, `PaymentAttempt`, `FinancialLedgerEntry`, `DoctorEarning`, `DoctorPayout`, `DoctorReview`, `DoctorFavorite`, `Notification`, `NotificationOutbox`, `Translation`, `ConsentRecord`, `JurisdictionPolicy`, `IdempotencyKey`, `FraudSignal`, `RateLimitCounter`, `Plan`, `Subscription`, `Clinic`, `ClinicMember`.
- **Database Engine Compatibility**:
  - Prisma schema supports PostgreSQL (Neon / Supabase) for production with SQLite dev fallback.
  - Removed dangerous `--accept-data-loss` flag from standard push scripts in `package.json`.

---

## 5. CARE CONNECT
- **Doctor Marketplace**:
  - Specialty filtering, language matching, physical jurisdiction checking, verified badge indicators, rating sorting.
- **Consultation Lifecycle**:
  - Draft -> Pending Payment -> Confirmed -> In Progress -> Completed / Cancelled / Disputed.
- **Clinical Handoff & AI Intake**:
  - Structured intake questionnaire, clinical summary handoff with disclaimer badges, private doctor SOAP notes.

---

## 6. PAYMENTS
- **Financial Architecture**:
  - Integer minor units (`priceMinor`), ISO currency codes, basis point fee calculation (`commissionBps`), strict idempotency keys.
  - Provider abstraction: `PaymentProvider` interface with `MockPaymentProvider`, `PKLocalAdapter`, `HesabPayAdapter`, and `CardAdapter`.
  - Mock payments strictly barred from production execution unless explicit test flags are set.

---

## 7. TELEMEDICINE
- **Jurisdiction & Telemedicine Consent**:
  - Active physical jurisdiction validation and affirmative telemedicine consent tracking before consultation creation.
- **Consultation Workspace**:
  - Multi-tab consultation interface: Messaging, attachments, medical notes, translation toggle, WebRTC call modal.

---

## 8. FRONTEND
- **Judge Inspector / Technical Panel**:
  - Ported `src/components/chat/judge-inspector-modal.tsx` into the UI, exposing inference telemetry (provider cascade, latency, L0 short-circuit status, validator votes, citations) without exposing internal chain-of-thought.
- **Mobile Responsive Drawer & Navigation**:
  - Mobile side-drawer navigation, responsive chat bubbles with latency tracking, copy transcript feature.

---

## 9. PWA
- Offline emergency guidance cards and caching strategies in `public/sw.js`.
- Emergency numbers and offline symptom triage accessible without active cellular network.

---

## 10. VOICE
- Speech-to-text integration with regional dialect support, rate limiting, and safe audio processing.

---

## 11. VISION
- Google Gemini Vision VLM integration for lab report and prescription OCR/interpretation, with PHI redaction guidelines.

---

## 12. ADMIN
- **Evaluation Endpoints**:
  - `/api/eval/run` and `/api/eval/results` protected with admin role verification.
- **Doctor Verification & Payouts**:
  - Admin doctor credential review, verification audit trail, manual payout authorization.

---

## 13. TESTS
- **Root TypeScript & Bun Compatibility**:
  - `tsconfig.json`: Added `bun-types` and updated target to `ES2022`.
  - Replaced relative parent imports (`../src/...`) with root alias (`@/...`).
  - Added full test suites: `tests/tests/safety/`, `tests/tests/e2e/`, and `tests/care/`.

---

## 14. CI
- Reconciled unified GitHub Actions workflow combining Prisma generation, full TypeScript verification (`tsc --noEmit`), ESLint, safety suite, Care Connect test suites, and Next.js production build.

---

## 15. DOCS
- Reconciled technical documentation:
  - Care Connect architecture, APIs, data models, and legal drafts preserved under `docs/CARE_CONNECT_*` and `docs/legal/`.
  - Hackathon submission audits archived with clear historical designations under `docs/HACKATHON_*`.

---

## 16. CONFIGURATION
- Unified `.env.example` capturing all database, AI provider, VAPID, VLM, and Care Connect configuration keys.
- Next.js configuration enabling React Strict Mode and removing `ignoreBuildErrors`.

---

## 17. OTHER
- License: Full MIT license established in `LICENSE`.
