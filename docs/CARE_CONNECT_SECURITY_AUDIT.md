# SehatAI Care Connect — Security & Penetration Audit (§100)

> **Document Type:** Security Architecture, Threat Model & Vulnerability Audit  
> **Audit Date:** October 2026 · **Scope:** SehatAI Core Baseline + Care Connect Module

---

## 1. Threat Model & Security Posture Overview

Care Connect introduces commercial telemedicine, payments, and prescription exchange to SehatAI. Healthcare platforms operate under high-threat parameters: targeted Protected Health Information (PHI) theft, financial ledger manipulation, prescription forgery, and unauthorized eavesdropping on teleconsultations.

The architecture adopts a defense-in-depth posture:
1. **Zero-Trust Access Control:** Authentication alone never grants access to clinical records. Every consultation request evaluates a 4-factor authorization matrix: authenticated session + participant identity + valid role + valid clinical state.
2. **Encrypted Private Storage:** Health records and diagnostic uploads are strictly forbidden from public directories (`storage/care/` encrypted with AES-256-GCM).
3. **Short-Lived Signed Grants:** Video rooms and document downloads issue ephemeral cryptographic grants that expire within minutes.

---

## 2. Care Connect Security Assessment (Verified Defenses)

### 2.1 Insecure Direct Object Reference (IDOR) Defenses
- **Attack Vector:** An attacker with a valid patient account attempts to read consultation details, chat messages, or prescriptions belonging to another patient by guessing sequential or random cuid IDs.
- **Defense Implementation:** `src/lib/care/care-auth.ts` implements `authorizeConsultationAccess(consultationId, capability)`:
  - Validates that `session.user.id` matches either `consultation.patientId` OR `consultation.doctorUserId`.
  - Non-participant staff (support, finance, admin) are subject to granular capability checks (`hasCapability(role, capability)`).
  - Finance accounts are hard-blocked from reading clinical notes (`note.viewPrivate`).
  - Support accounts possess read-only access strictly for active dispute investigations.
  - All staff lookups generate immutable records in `AuditLog` and `ConsultationAuditEvent`.

### 2.2 Private Document Storage & Signed URL Tampering
- **Attack Vector:** Tampering with signed URL parameters to extend expiration time or download unauthorized patient attachments.
- **Defense Implementation:** `src/server/care/storage.ts`:
  - `signRead(storageKey, ttlSeconds)` calculates an HMAC-SHA256 signature over `${storageKey}.${expiresAtMs}` using server secret `CARE_STORAGE_KEY`.
  - Verification performs timing-safe constant-length comparisons. Expired timestamps (`expiresAtMs < Date.now()`) or tampered signatures immediately return 403.
  - Verified by test: `tests/care/care-integration.test.ts:encrypt at rest + signed URL expiry` (proves tampered signatures and expired signatures fail).

### 2.3 WebRTC Eavesdropping & Signaling Hijacking
- **Attack Vector:** Unauthorized third parties joining WebRTC consultation video calls or intercepting signaling streams.
- **Defense Implementation:** `src/server/care/video-service.ts`:
  - Before a user can receive signaling credentials, `/api/care/consultations/[id]/join` verifies that the caller is an authorized participant, the consultation is in an eligible active state (`PAID`, `SCHEDULED`, `WAITING`, `IN_PROGRESS`), and the scheduled time window is valid.
  - Generates a short-lived HMAC-SHA256 room token (`expiresAt: 15 minutes`).
  - Call recording is hardcoded to `false` in token issuance (`recording: false`).

### 2.4 Multi-Factor Authentication (TOTP 2FA)
- **Attack Vector:** Credential compromise of doctor, finance, or administrative accounts.
- **Defense Implementation:** `src/lib/care/totp.ts`:
  - Implements standard RFC 6238 TOTP (HMAC-SHA1, 30-second timestep, 6 digits) with zero external dependencies using Node.js `crypto`.
  - Enforces drift tolerance of ±30 seconds.
  - Rate limited to prevent brute-force attacks. Verified by unit test: `tests/care/care-unit.test.ts:TOTP`.

---

## 3. Pre-Existing SehatAI Core Defects (Recorded Baseline)

The following 9 security defects were identified during the Phase 0 audit (`docs/CARE_CONNECT_CURRENT_STATE.md §5`). Because Care Connect was strictly instructed **not to modify, refactor, or break legacy SehatAI core modules**, these defects remain in legacy routes and must be scheduled for core remediation:

| # | Vulnerability Description | Affected Legacy Routes / Files | Severity | Remediation Requirement |
|---|---|---|---|---|
| **1** | **Unauthenticated PHI Routes** | `/api/fhir/[resource]`, `/api/conversations*`, `/api/reminders*`, `/api/summary`, `/api/lhw/dashboard` | **HIGH** | Wrap legacy endpoints with `requireUser()` or session verification. |
| **2** | **Dead Doctor Status Gate** | `src/lib/auth.ts:requireActiveDoctor` | **MEDIUM** | Call `requireActiveDoctor()` on all doctor endpoints instead of role-only check. |
| **3** | **Irrevocable JWT Sessions** | NextAuth JWT strategy (30 days) | **MEDIUM** | Implement a token revocation blacklist or short-lived access tokens with refresh rotation. |
| **4** | **Hardcoded Insurer Secrets** | `src/app/api/insurer/triage/route.ts` | **MEDIUM** | Move demo insurance keys to `.env`. |
| **5** | **Unauthenticated AI Endpoints** | `/api/voice/*`, `/api/eval/*`, `/api/rwe-llm` | **MEDIUM** | Add session authentication and rate limiting to prevent cost abuse. |
| **6** | **Global TypeScript Error Bypass** | `next.config.ts:typescript.ignoreBuildErrors: true` | **LOW** | Clean legacy type errors so strict typechecking can be enforced globally. |
| **7** | **Doctor Docs in Static Public Dir** | `public/uploads/doctor-docs/` | **HIGH** | Migrate doctor verification documents to `storage/care/` private storage. |
| **8** | **Client-Side Consent Gate** | Pre-consultation disclaimer modal | **MEDIUM** | Enforce database-backed consent verification across legacy chat endpoints. |
| **9** | **Unregistered Dictionaries** | `src/lib/i18n/{pa,sd}.ts` | **LOW** | Formally register Punjabi and Sindhi dictionaries in `src/lib/i18n/index.ts`. |

---

## 4. Remediation Priorities for Post-Handover Engineering

1. **Immediate (P0):** Restrict `/api/fhir/*` and `/api/conversations*` behind session authentication.
2. **Immediate (P0):** Move doctor license uploads out of `public/` into encrypted private storage.
3. **High (P1):** Implement Redis or DB-backed session invalidation for JWTs.
