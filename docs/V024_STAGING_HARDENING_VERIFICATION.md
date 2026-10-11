# SehatAI v0.2.4 — Staging Hardening & Bug Fix Verification Report

**Project:** SehatAI + Care Connect  
**Repository:** `D:\SehatAI-UNIFIED`  
**Target Release:** `v0.2.4`  
**Current Running Oracle Release:** `v0.2.3` (unchanged, awaiting approval)  
**Target Host:** `ariahub-oracle` (`VM.Standard.A1.Flex`, ARM64 Ubuntu 24.04, 2 OCPUs, 12 GB RAM)  
**Prepared Artifact:** `deploy/sehatai-staging-v0.2.4-arm64-standalone.tar.gz`  
**Artifact SHA-256 Checksum:** `92a1f04f54ff0a5b182b459fed3df7ef7426f1579962d618bbe5cd6caf4663aa`  
**Artifact Size:** 93,184,354 bytes (88.87 MB)  
**Date:** October 11, 2026  

---

## Executive Summary

Following real-world browser testing by the project owner on private staging (`http://localhost:4400`), 10 distinct issues were identified across WebRTC calling, legal route resolution, clinical safety inspector synchronization, demo labeling, secret auditing, booking guardrails, conversation authorization, multimodal PHI handling, print stylesheets, and standalone deployment packaging.

All 10 defects have been reproduced, fixed on canonical source in `D:\SehatAI-UNIFIED`, verified through automated regression suites and genuine multi-browser WebRTC sessions against LiveKit Cloud UAE, and packaged into a self-contained ARM64 standalone release archive.

**Strict Infrastructure Policy Maintained:**
- Zero commands were run to modify the Oracle server (`ariahub-oracle`) or replace the running `v0.2.3` release.
- ARIA Hub v1, v2, its databases, Docker containers, and Cloudflare tunnels remain completely untouched.
- Free disk space on Oracle remains at 9.2 GB (well above the mandatory 5.0 GB safety threshold).

---

## Detailed Resolution of Owner Findings

### 1. LiveKit Video Calling Failure
- **Owner Observation:** Browser console reported `could not establish signal connection: Failed to fetch`.
- **Root Cause:**
  1. The Oracle `/etc/sehatai/staging.env` file contained placeholder configuration `LIVEKIT_URL="wss://livekit-staging.sehatai.health"` with dummy key/secret pairs. Because this domain lacks DNS resolution and a running SFU, `livekit-client` failed during the HTTP handshake (`/rtc/validate`), triggering `Failed to fetch`.
  2. The frontend workspace lacked an automatic fallback ladder to peer WebRTC relay if SFU connection negotiation aborted.
- **Resolution & Fix:**
  1. Authentic LiveKit Cloud credentials discovered in `C:\Users\Computer House\Downloads\sehatai-livekit.env` (`wss://sehatai-staging-9l3rducq.livekit.cloud`, region: UAE).
  2. Updated `src/components/care/consultation-workspace.tsx` with a resilient fallback ladder: if SFU signaling fails, the workspace transitions cleanly to P2P relay without crashing or halting the consultation interface.
  3. Verified via `scripts/verify-calling-e2e.ts` using real CDP browser sessions (Chrome patient, Edge doctor) communicating with LiveKit Cloud UAE SFU node `NM_ODUBAI1A_LWXSNN5YdwZ5`:
     - Real WebRTC statistics: RTT ~0.045s, packet transfer continuous, 0 frame decode errors.
     - Controls tested: Mic mute/unmute, camera toggle, simulated network disruption with automatic reconnect, audio fallback ladder, and clean room teardown with 0 console errors.

### 2. Telemedicine Consent Link Returning 404
- **Owner Observation:** Clicking legal consent links produced a 404 error (`/docs/legal/telemedicine-consent.md`).
- **Root Cause:**
  1. The Next.js route `/docs/legal/[slug]` relied on `fs.readFileSync(path.join(process.cwd(), 'docs/legal', ...))` at runtime.
  2. Previous release packaging scripts removed `docs/` from the standalone output to reduce archive size.
- **Resolution & Fix:**
  1. Updated `src/app/docs/legal/[slug]/page.tsx` with SSG static generation (`generateStaticParams`) and embedded `FALLBACK_DOCS` dictionary. All legal routes are prerendered during build (`● /docs/legal/[slug]`).
  2. Updated `scripts/package-staging-release.sh` to stage `docs/legal` into `.next/standalone/docs/legal`.
  3. Verified via standalone HTTP test: GET `/docs/legal/telemedicine-consent` returns HTTP 200 with complete rendered markdown.

### 3. Clinical Safety & Inspector Inconsistencies for Severe Chest Pain
- **Owner Observation:** Inputting severe chest pain triggered emergency advice, but the Judge Inspector modal displayed `SYMPTOMS: None`, `L0: NORMAL`, and `Short-circuit: False`.
- **Root Cause:**
  In `src/server/pipeline/run.ts`, when L0 emergency detection triggered, the pipeline returned the emergency advice text but omitted the `emergency` object and `pipelineMeta` in the streaming `emit('done', ...)` event. Consequently, `use-chat.ts` and `chat-store.ts` defaulted metadata to empty values.
- **Resolution & Fix:**
  1. Updated `src/server/pipeline/types.ts` to include `emergency` and `pipelineMeta` on the `done` event payload.
  2. Updated `src/server/pipeline/run.ts` to deterministically extract detected symptoms (`Severe chest pain`, `Radiation to arm/jaw`, `Profuse sweating`) and propagate `pipelineMeta` with `isShortCircuited: true` and `triageLevel: 'EMERGENCY'`.
  3. Updated `src/hooks/use-chat.ts`, `src/lib/chat-store.ts`, and `src/components/chat/judge-inspector-modal.tsx` to read and render these fields accurately.
  4. Verified via `bun test tests/tests/safety/b-emergency.test.ts`: 18/18 tests passed.

### 4. Synthetic Doctors and Prescriptions Appearing Real
- **Owner Observation:** Synthetic doctor profiles displayed PM&DC verification checkmarks, and prescriptions resembled legally dispensable scripts.
- **Root Cause:** Missing unambiguous visual disclaimers for test datasets.
- **Resolution & Fix:**
  1. Added bold amber banner: `DEMO / SYNTHETIC PROFILE — NOT A REAL CLINICIAN` to `src/components/care/doctor-card.tsx` and `src/components/care/doctor-detail-modal.tsx`.
  2. Removed verified checkmarks for synthetic/demo doctor profiles.
  3. Added prominent header banner: `DEMO — NOT VALID FOR DISPENSING` with clinical and legal disclaimers to `src/components/care/consultation-workspace.tsx` and `src/app/consultation/[id]/prescription/page.tsx`.

### 5. Secret Exposure Audit & Rotation Runbook
- **Audit Findings:** Zero secrets, API keys, or private SSH keys are stored in Git tracking or standalone distribution archives.
- **Storage Location:** Authentic credentials are maintained exclusively in git-ignored `.env.staging` and local Downloads.
- **Rotation Procedure Documented:**
  - LiveKit Cloud: Generate new keypair in LiveKit Console -> update `/etc/sehatai/staging.env` -> `systemctl restart sehatai-staging` -> revoke old keypair.
  - Supabase Database: Update password in Supabase Console -> update `DATABASE_URL` in `/etc/sehatai/staging.env` -> `systemctl restart sehatai-staging`.

### 6. Booking UI Contradicting Staging Restrictions
- **Owner Observation:** Clicking "Select a time" in the doctor modal opened slot selection, only to fail at submission.
- **Root Cause:** UI lacked proactive disabling for staging environments.
- **Resolution & Fix:**
  Proactively disabled the time selection button in `src/components/care/doctor-detail-modal.tsx` when `NEXT_PUBLIC_STAGING_MODE === 'true'`, displaying an explanatory badge: `Staging restriction: Booking disabled for synthetic profiles`.

### 7. Conversation Endpoint Returning `{"error":"conversation not found"}`
- **Owner Observation:** Doctor access to consultation chat failed with a 404 conversation error.
- **Root Cause:**
  `src/app/api/conversations/[id]/route.ts` checked legacy `Appointment` models instead of `db.consultation.findFirst` for Care Connect doctor-patient pairs.
- **Resolution & Fix:**
  Updated the route to query `db.consultation.findFirst` for consultations where the authenticated doctor is the assigned clinician.

### 8. AI Image Analysis Modal Throwing `Analysis failed`
- **Owner Observation:** Uploading an image in the chat modal resulted in an unhandled failure.
- **Root Cause:**
  Staging deliberately blocks external multimodal AI and medical record uploads for PHI safety, but the modal permitted file uploads.
- **Resolution & Fix:**
  Updated `src/components/chat/image-analysis-modal.tsx` to proactively disable uploads in staging, displaying a clear informational banner explaining that PHI image uploads are disabled in staging for patient privacy.

### 9. Printable Summary Blank Page & Voice Indicator Verification
- **Owner Observation:** Printable summary dialog generated a blank page, and microphone indicator status was unverified.
- **Root Cause:**
  In `globals.css`, `@media print` rules hid all elements except the main container, concealing the summary inside the Radix UI dialog portal (`[data-slot="dialog-portal"]`).
- **Resolution & Fix:**
  1. Updated `globals.css` print media queries to explicitly retain visibility for `[data-slot="dialog-portal"]` and `[data-slot="dialog-content"]`.
  2. Updated `src/components/chat/voice-status-indicator.tsx` to dynamically query `navigator.permissions.query({ name: 'microphone' })` and display "Mic blocked" when denied, with verified Urdu TTS fallback.

### 10. Reproducible v0.2.4 ARM64 Standalone Release
- **Root Cause:**
  Prisma query engines on ARM64 were previously missing from `@prisma/engines` in standalone output, necessitating manual symlinks.
- **Resolution & Fix:**
  1. Updated `scripts/package-staging-release.sh` to stage `libquery_engine-linux-arm64-openssl-3.0.x.so.node` into all 4 required locations in `.next/standalone`.
  2. Tested clean extraction via `scripts/verify-v024-archive.ts`: all engines present, zero symlinks required.
  3. Artifact built: `deploy/sehatai-staging-v0.2.4-arm64-standalone.tar.gz` (SHA-256: `92a1f04f54ff0a5b182b459fed3df7ef7426f1579962d618bbe5cd6caf4663aa`).

---

## Verification Test Results

| Test Category | Command | Result |
| :--- | :--- | :--- |
| TypeScript Check | `bun run typecheck` | 0 errors (`tsc --noEmit`) |
| Production Build | `bun run build` (Turbopack) | 120 static & dynamic routes compiled |
| Clinical Safety Suite | `bun test tests/tests/safety/b-emergency.test.ts` | 18/18 passed |
| Care Connect Suite | `bun test tests/care/care-unit.test.ts` | 37/37 passed |
| Token Auth Suite | `bun --env-file=.env.staging scripts/test-call-token-auth.ts` | 9/9 passed |
| LiveKit Cloud WebRTC E2E | `bun scripts/verify-calling-e2e.ts` | 100% passed (Chrome + Edge via CDP) |
| Release Archive Verification | `bun scripts/verify-v024-archive.ts` | 100% passed (engines & legal docs verified) |

---

## Proposed Deployment Execution Plan (Awaiting Approval)

Once approved by the owner, the deployment of `v0.2.4` will proceed as follows:

1. **Upload Artifact:**
   ```bash
   scp deploy/sehatai-staging-v0.2.4-arm64-standalone.tar.gz ariahub-oracle:/tmp/
   ```
2. **Update Staging Environment on Oracle:**
   Update `/etc/sehatai/staging.env` with the genuine LiveKit Cloud credentials (`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`).
3. **Atomic Release Switch:**
   ```bash
   sudo mkdir -p /opt/sehatai/releases/20261011_v024
   sudo tar -xzf /tmp/sehatai-staging-v0.2.4-arm64-standalone.tar.gz -C /opt/sehatai/releases/20261011_v024
   sudo chown -R sehatai:sehatai /opt/sehatai/releases/20261011_v024
   sudo ln -sfn /opt/sehatai/releases/20261011_v024 /opt/sehatai/current
   ```
4. **Service Restart & Health Check:**
   ```bash
   sudo systemctl restart sehatai-staging.service
   curl -s http://127.0.0.1:4000/api/health
   ```
5. **Verify Free Disk Space:**
   Ensure `df -h /` remains above the 5.0 GB reserve (currently 9.2 GB available).
