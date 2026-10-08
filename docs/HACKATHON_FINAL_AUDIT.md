> [!NOTE] ARCHIVED / HISTORICAL HACKATHON DOCUMENTATION
> This document records the original regional hackathon submission audit and architecture baseline.

# SehatAI — Regional Hackathon Master Verification Audit
**Audit Date / Time:** 2026-10-06 08:52:00 PKT (03:52:00 UTC)  
**Target Deadline:** Regional Hackathon — 11 October 2026  
**Repository:** `https://github.com/jamshidnabizada7-boop/SehatAI-`  
**Inspected Branch:** `main` (verified upstream default and only branch)  
**HEAD Commit:** `a4d12052f402f2767bda2a6694df5d37b1aadcc8` ("Delete DELIVERABLE directory")  
**Environment Runtime:** Node.js v24.19.0, Bun v1.4.0, npm v12.0.2, Next.js 16.1.1, React 19.0.0, Prisma 6.11.1  

---

## 1. Executive Summary & Verification Methodology

Before modifying any source code, an independent audit of the current codebase and execution behavior was conducted in strict accordance with the Hackathon Meta-Rules.

Every claim and directive in the master task prompt was cross-referenced directly against:
1. Live source files in `src/`, `prisma/`, and `tests/`
2. Actual runtime execution via `bun test` and `bun x tsc --noEmit`
3. Database schema in `prisma/schema.prisma` and server authentication handlers in `src/lib/auth.ts`
4. Upstream git repository commits and branches (`git remote -v`, `git log`, `git fetch`)
5. Authoritative official Pakistani healthcare guidelines and emergency telephone registries (Rescue 1122, Pakistan National Health Helpline 1166, Edhi 115, Alkhidmat 1023).

---

## 2. Requirement Classification Matrix

| Category / Requirement | Classification | Concrete Code Evidence & Operational Finding |
| :--- | :--- | :--- |
| **3.1 Conversation Ownership** | **VERIFIED CURRENT ISSUE** | `GET /api/conversations` and `GET/DELETE /api/conversations/[id]` rely solely on client-provided query param `sessionId`. No server-side authenticated session or `userId` ownership check is performed. |
| **3.2 Conversation Injection** | **VERIFIED CURRENT ISSUE** | `persistTurn()` in `src/server/pipeline/run.ts` appends messages if `p.conversationId` exists in DB, without checking if the conversation belongs to the caller's user or session. |
| **3.3 userId Persistence** | **VERIFIED CURRENT ISSUE** | `db.conversation.create()` in `persistTurn()` only saves `{ sessionToken, language, offline }`. `userId` is never set, so conversations cannot be reliably associated with authenticated users. |
| **3.4 Summary Endpoint Protection** | **VERIFIED CURRENT ISSUE** | `POST /api/summary` has zero authentication or authorization check. Anyone providing a valid `conversationId` can exfiltrate clinical summaries and patient profile snapshots. |
| **3.5 Evaluation Endpoint Protection** | **VERIFIED CURRENT ISSUE** | `POST /api/eval/run` and `GET /api/eval/results` lack server-side auth guards (`requireAdmin()`). Anyone can trigger quota-burning benchmark runs and view raw test outputs. |
| **3.6 Auth Claim Revocation** | **VERIFIED CURRENT ISSUE** | NextAuth uses JWT strategy with 30-day lifetime. `requireUser()` / `requireDoctor()` / `requireAdmin()` check only JWT token claims. Revoked/suspended doctors or demoted admins retain elevated privileges until JWT expiry. |
| **3.7 Consent Evaluation** | **VERIFIED CURRENT ISSUE** | `src/app/api/auth/signup/route.ts` line 61 uses `const consent = body.consent !== false;`. When omitted, consent evaluates to `true`. Must require explicit `body.consent === true`. |
| **3.8 Doctor Doc Storage** | **VERIFIED CURRENT ISSUE** | `src/app/api/doctor/upload-doc/route.ts` saves files to `public/uploads/doctor-docs/` which Next.js serves publicly without auth. Private CNIC/PMDC documents are statically exposed. |
| **3.9 Ephemeral Local Storage** | **VERIFIED CURRENT ISSUE** | Vercel serverless functions have read-only/ephemeral filesystems; local disk persistence for uploads is non-viable in production. |
| **3.10 PHI Logging Audit** | **PARTIALLY CORRECT** | `src/lib/observability.ts` correctly excludes PHI. However, error handlers and unhandled exception routes must be audited against logging full query payloads. |
| **4.1 Constellation Parallel Veto** | **VERIFIED CURRENT ISSUE** | In `src/server/pipeline/run.ts`, `runConstellation()` runs pre/post generation, but only logs warnings and alters confidence. It never revises or replaces unsafe text with a safe fallback when `mustAbstain` is true. |
| **4.2 Pre-Generation Veto** | **VERIFIED CURRENT ISSUE** | Pre-generation critical flags only log a warning and don't short-circuit or switch to safe deterministic output. |
| **4.3 Emergency Short Circuit** | **ALREADY WORKING** | Sub-5ms L0 lexicon matches bypass LLM generation and output pre-written emergency templates. |
| **5.0 Emergency Numbers Audit** | **VERIFIED CURRENT ISSUE** | Pakistan Rescue 1122 is the primary national emergency service. Currently, emergency UI puts all numbers in an equal 2x2 grid without dominant 1122 prominence. One template lacked 1122 mention. |
| **6.0 Alibaba Cloud / Qwen Priority** | **VERIFIED CURRENT ISSUE** | Qwen/DashScope is configured as Tier 0, but there is no judge-facing technical panel in the UI to demonstrate live execution metrics to hackathon judges. |
| **7.0 LLM Message Architecture** | **VERIFIED CURRENT ISSUE** | `LlmMessage` interface only supports `'assistant' \| 'user'`, sending system prompts as assistant messages. DashScope and OpenAI support true `'system'` role. |
| **8.0 RAG Terminology** | **VERIFIED CURRENT ISSUE** | Vector RAG in `src/lib/vector-rag.ts` is TF-IDF + cosine similarity. Any docs claiming dense neural embeddings (BGE-M3) are inaccurate. |
| **11.0 Voice Transcription** | **VERIFIED CURRENT ISSUE** | `/api/voice/transcribe` uses Groq Whisper Large V3 (real). `/api/voice/stt` returns `ready: false` (planned). Docs must reflect this truth. |
| **15.0 CI/CD & Test Bypass** | **VERIFIED CURRENT CRITICAL ISSUE** | No GitHub Actions workflow exists in `.github/`. `package.json` had `"test:safety": "bun test tests/tests/safety/ \|\| npx tsx tests/tests/m4-failover.test.ts"`, masking 19 test failures! |
| **16.0 Next.js & TypeScript Bypass** | **VERIFIED CURRENT CRITICAL ISSUE** | `next.config.ts` had `typescript: { ignoreBuildErrors: true }` and `reactStrictMode: false`. `tsc --noEmit` fails with 116 errors across tests due to broken relative import paths (`../src`). |
| **30.0 LICENSE File** | **NEW ISSUE DISCOVERED** | README claims MIT license, but no `LICENSE` file exists in the repository root. |

---

## 3. Critical Blockers & Plan of Action

### Blocker 1: TypeScript Build & Test Bypass Masking Failures
- **Problem:** `ignoreBuildErrors: true` in `next.config.ts` masks 116+ TypeScript compiler errors. Test runner hides 19 failing safety tests with `|| npx tsx`.
- **Action:**
  1. Fix broken path imports (`../src` $\to$ `@/...` or proper relative paths) in `tests/tests/`.
  2. Add `bun-types` to `tsconfig.json` compilerOptions types.
  3. Fix the 19 failing safety tests in `tests/tests/safety/`.
  4. Fix `package.json` scripts to run real tests and clean CI.
  5. Remove `ignoreBuildErrors: true` from `next.config.ts` and verify `bun x tsc --noEmit` exits with 0.

### Blocker 2: Auth Ownership, IDOR & Claim Invalidation
- **Problem:** Conversations, summaries, and eval endpoints have no session/user authorization checks. JWT claims are cached for 30 days without DB verification on privileged routes.
- **Action:**
  1. Bind `Conversation.userId` in `persistTurn()` for authenticated users; use secure cookie/crypto session token for guests.
  2. Enforce server-side ownership checks in `/api/conversations`, `/api/conversations/[id]`, and `/api/summary`.
  3. Require `requireAdmin()` on `/api/eval/run` and `/api/eval/results`.
  4. In `requireUser()`, verify user against live database to revoke suspended doctors/demoted admins immediately.
  5. Require explicit `body.consent === true` in `/api/auth/signup`.
  6. Prevent static exposure of private doctor documents in `public/`.

### Blocker 3: Constellation Veto Must Enforce Abstention & Safe Fallback
- **Problem:** `runConstellation` evaluates candidate answers but only logs vetoes. Unsafe answers are still emitted to users.
- **Action:**
  1. In `src/server/pipeline/run.ts`, when Constellation flags `mustAbstain` (or critical veto), immediately replace response with a safe deterministic refusal / clinical escalation template.
  2. When `shouldRevise` is flagged, attempt one safe revision pass, re-validate, and if still failing, abstain safely.

### Blocker 4: Emergency UI Hierarchy & Phone Number Grounding
- **Problem:** Emergency overlay presents numbers in a flat grid.
- **Action:**
  1. Redesign `EmergencyOverlay` with a dominant, unmistakable primary CTA: **CALL 1122 NOW**.
  2. Group secondary verified services (1166 Health Helpline, 115 Edhi, 1023 Alkhidmat) under "Other Verified Support".
  3. Ensure all emergency templates include 1122 reference across EN/UR/Roman.

### Blocker 5: Judge Mode & Alibaba Cloud DashScope Visibility
- **Problem:** Hackathon judges cannot inspect pipeline telemetry or verify Alibaba Cloud Qwen execution.
- **Action:**
  1. Add system prompt message support (`role: 'system'`) in `src/server/llm.ts`.
  2. Implement an interactive "Judge Mode / Technical Inspector" in the frontend chat view that exposes operational metadata:
     - Provider (Alibaba Cloud DashScope / Fallback)
     - Model (`qwen-plus`, `qwen-max`, etc.)
     - L0 Deterministic Safety status
     - Retrieval corpus sources and count
     - Parallel Constellation validator results (4/4 passed)
     - Latency (ms)
     - Confidence band

### Blocker 6: Repository Polish, Deliverables & CI/CD
- **Action:**
  1. Create `.github/workflows/ci.yml` covering lint, typecheck, safety tests, and build.
  2. Create standard `LICENSE` (MIT).
  3. Create updated `.env.example` with clear categorization.
  4. Write comprehensive hackathon documentation deliverables:
     - `docs/HACKATHON_SECURITY_AUDIT.md`
     - `docs/HACKATHON_SAFETY_AUDIT.md`
     - `docs/HACKATHON_TEST_REPORT.md`
     - `docs/HACKATHON_DEMO_SCRIPT.md`
     - `docs/HACKATHON_ARCHITECTURE.md`
  5. Update `README.md` to reflect real current architecture and achievements.
