# SehatAI — LiveKit Video Calling Readiness & Release Integrity Verification

**Date:** October 10, 2026  
**Canonical Repository:** `D:\SehatAI-UNIFIED`  
**Git Branch:** `production-activation`  
**Target Release Artifact:** `deploy/sehatai-staging-v0.2.1-arm64-standalone.tar.gz`  
**SHA-256 Checksum:** `D2CC3260ECCC899E3007B55328BCD31F605601CA1F1FAD012E08999792D4D854`  
**Execution Environment:** Isolated Local Development & Verification Battery (Zero Server Ingress / Oracle Protected)

---

## Executive Summary

This report establishes the comprehensive audit and technical completion record for:
1. **LiveKit SFU Client Integration (Task A)**: Frontend wiring of `livekit-client` into both telemedicine consultation workflows (`ConsultationWorkspace` / `CareCallModal`) and appointment workflows (`VideoCall`), ensuring full camera/microphone track publication, remote track subscription, mute/camera toggle, network reconnection, token expiry handling, and mobile browser compatibility (iOS Safari / Android Chrome).
2. **LiveKit Cloud Dashboard Setup (Task A.2)**: Step-by-step procedures for provisioning project keys on LiveKit Cloud Free Tier, environment configuration, and strict client-side credential isolation.
3. **Real Functional Testing Runbook (Task B)**: Two-device, dual-synthetic-account verification runbook establishing unambiguous boundaries between Mocked Unit Tests, Localhost WebSocket loopback signaling, and Genuine SFU Media sessions.
4. **Test Count Mathematical Reconciliation (Task C.2)**: Clarification reconciling previous mentions of 542 and 565 tests with the definitive 813 total test battery across all 4 suites.
5. **Full Verification Battery Execution (Task C.3)**: 100% green execution across TypeScript typechecking, security adversarial stress tests, Care Connect invariants, clinical safety regression suites, 4-tier E2E universal invariants, and real HTTP standalone server interception.
6. **Release Package Integrity & Secret Sanitization (Task C.1 & C.4)**: Full Git audit confirming zero PII, zero leaked API secrets, and exact cryptographic hash validation of standalone deployment artifacts.

---

## 1. Task A — LiveKit Readiness Audit & Client Integration

### 1.1 Technical Integration Audit Findings

Prior to this implementation:
- **Server-Side Video Abstraction (`src/server/care/video-service.ts`)**:
  - Contained `LiveKitVideoProvider` implementing standard RFC 7519 HMAC-SHA256 JWT generation with LiveKit claims (`roomJoin: true`, `canPublish: true`, `canSubscribe: true`, `canPublishData: true`, `recorder: false`).
  - Gated production activation on `CARE_VIDEO_PROVIDER=livekit` and credentials `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET`.
  - Fallback provider `MiniSignalProvider` signed local HMAC tokens for development.
- **Frontend Deficiencies Identified**:
  - `CareCallModal` in `src/components/care/consultation-workspace.tsx` only supported the local development WebSocket protocol (`mini-services/video-signal` on port 3004). When `CARE_VIDEO_PROVIDER=livekit`, the client attempted to open a raw WebSocket to the LiveKit SFU URL and send `{ type: 'join' }`, resulting in connection drops.
  - `CareCallModal` was not conditionally mounted within `ConsultationWorkspace` JSX for active sessions.
  - Remote audio in `CareCallModal` was omitted from the DOM when `mode === 'VIDEO'`, preventing peer audio playback.
  - `VideoCall` in `src/components/video/video-call.tsx` bypassed API token endpoints entirely and hardcoded loopback signaling (`XTransformPort=3004`).
  - Neither client component had `livekit-client` installed or wired for SFU room management.

### 1.2 Implemented Client-Side LiveKit Architecture

#### A. Dependency Provisioning
Installed official WebRTC client library `livekit-client@2.22.4` via Bun. Configured dynamic ESM imports (`await import('livekit-client')`) within browser-only `useEffect` lifecycles to eliminate server-side rendering (SSR) overhead and avoid bundle pollution.

#### B. Telemedicine Care Workspace (`src/components/care/consultation-workspace.tsx`)
- **Room Connection & Token Authentication**:
  - Server issues short-lived token (15-minute TTL per §26) with claims bound to `care-${consultation.id}`.
  - When `call.provider === 'livekit'`, `CareCallModal` initializes a LiveKit `Room` instance with `adaptiveStream: true` and `dynacast: true`.
  - Joins via `await room.connect(call.signalingUrl, call.token)`.
- **Media Track Management**:
  - Publishes local audio and video tracks via `await room.localParticipant.enableCameraAndMicrophone()`.
  - Attaches local video track to `<video ref={localVideoRef} autoPlay playsInline muted />`.
  - Subscribes to remote tracks on `RoomEvent.TrackSubscribed`: attaches video to `<video ref={remoteVideoRef} autoPlay playsInline />` and audio to `<audio ref={remoteAudioRef} autoPlay playsInline className="sr-only" aria-hidden="true" />`.
  - Remote audio element is permanently mounted in the DOM using `sr-only` (avoiding `hidden` / `display: none` which triggers WebKit/iOS Safari autoplay suspension).
  - Handles `RoomEvent.TrackMuted` and `RoomEvent.TrackUnmuted` to eliminate frozen video frames when a remote participant turns off their camera, displaying a polite status placeholder instead.
  - Detaches media elements cleanly on `RoomEvent.TrackUnsubscribed` and `RoomEvent.LocalTrackUnpublished`.
- **In-Call Controls**:
  - Mic toggle: invokes `room.localParticipant.setMicrophoneEnabled(!micOn)` and updates reactive UI state.
  - Camera toggle: invokes `room.localParticipant.setCameraEnabled(!camOn)`, dynamically re-attaching the video track to `localVideoRef` upon re-enabling or clearing `srcObject` upon disabling.
- **Degradation & Fallback Ladder (§28)**:
  - Bandwidth degradation: "Fallback to Audio" invokes `room.localParticipant.setCameraEnabled(false)`, switches viewport, and reports `reportCallState('FELL_BACK', 'AUDIO')` without disconnecting the room. UI mode state is decoupled from the connection lifecycle effect to guarantee continuous, zero-dropout audio.
  - Severe degradation: "Fallback to Text" cleanly disconnects LiveKit room, invokes `reportCallState('FELL_BACK', 'TEXT')`, and drops into secure asynchronous chat.
- **Connection Lifecycle & Token Expiry**:
  - Reconnection: listens to `RoomEvent.Reconnecting` (displays "Reconnecting…") and `RoomEvent.Reconnected` (restores "Connected").
  - Unauthorized/Expired Tokens: catches initial connection rejections and `RoomEvent.Disconnected` reason codes, rendering actionable user guidance: *"Room token expired or unauthorized. Please re-join the consultation."*
  - Clean Teardown: `handleLeave` invokes `await room.disconnect()`, unbinds media tracks, and records audit trail `reportCallState('ENDED')`.
- **Dual-Mode Fallback Preservation**:
  - Preserves 100% of existing `MiniSignalProvider` WebRTC loopback logic when `call.provider !== 'livekit'` for offline and development environments.
  - Aligns database persistence (`consultationCall.provider`) with the active provider (`livekit` vs `webrtc-local`).

#### C. Appointment Manager Video Call (`src/components/video/video-call.tsx` & `/api/video-call`)
- Enhanced `/api/video-call` GET and POST routes to check `liveKitConfigured()` and `process.env.CARE_VIDEO_PROVIDER === 'livekit'`. When enabled, issues a signed LiveKit JWT token for `roomId = appt-${appointmentId}`.
- Updated `VideoCall` component to inspect `/api/video-call` response: dynamically connects through LiveKit SFU when credentials are present, while gracefully falling back to port 3004 WebSocket signaling in local mock environments.
- Added remote audio playback sink (`className="sr-only"`), remote camera mute indicator, and full microphone/camera mute controls.

#### D. Cross-Browser & Mobile Compatibility
- Configured `<video playsInline>` and `<audio playsInline className="sr-only">` attributes across both components to adhere to mobile Safari (iOS) and Android Chrome full-screen and inline playback constraints.
- Eliminated `display: none` (`hidden`) on audio sinks to prevent iOS Safari WebKit power-management audio throttling.
- Ensured local video tracks are set to `muted` to prevent audio feedback loops and satisfy browser autoplay security policies.

---

## 2. LiveKit Cloud Setup & Secret Isolation Protocol

### 2.1 LiveKit Cloud Project Provisioning (Step-by-Step)

1. **Account Registration**:
   - Navigate to [https://cloud.livekit.io/](https://cloud.livekit.io/) and create an account.
2. **Project Creation**:
   - Create a new project (e.g., `sehatai-production` or `sehatai-staging`).
   - Select the closest regional cluster to Pakistan/MENA (e.g., `South Asia / Mumbai` or `Middle East / Bahrain`) for lowest WebRTC round-trip latency (target `<80ms`).
3. **Free Tier Allocation & Limits**:
   - Bandwidth: **50 GB/month** included.
   - Participant Minutes: **10,000 minutes/month** included.
   - Max Concurrent Participants: 100 participants.
   - Zero Transcoding Cost: Direct WebRTC SFU pass-through without server-side composition/recording fees.
4. **Credential Extraction**:
   - Navigate to **Project Settings > Keys**.
   - Generate a new Key Pair:
     - Copy the **WebSocket URL** (format: `wss://<project-subdomain>.livekit.cloud`).
     - Copy the **API Key** (e.g., `APIxxxxxxxxxxxx`).
     - Copy the **API Secret** (e.g., `secretxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`).

### 2.2 Server Environment Configuration

Place the following configuration in the server environment (e.g., `/etc/sehatai/staging.env` or systemd service overrides):

```bash
# ============================================================
# SehatAI LiveKit Cloud Production Video Configuration
# ============================================================
CARE_VIDEO_PROVIDER="livekit"
LIVEKIT_URL="wss://<project-subdomain>.livekit.cloud"
LIVEKIT_API_KEY="APIxxxxxxxxxxxx"
LIVEKIT_API_SECRET="secretxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 2.3 Strict Credential Isolation Rule
- **API Secrets MUST NEVER be prefixed with `NEXT_PUBLIC_`**.
- Tokens are generated exclusively on the server side in `src/server/care/video-service.ts` using HMAC-SHA256.
- The browser receives only the short-lived, single-session token containing the participant's user identity and room permissions.
- In accordance with SehatAI Clinical Safety Specification §29, server-side room recording is strictly disabled (`recorder: false`).

---

## 3. Task B — Real Functional Testing Runbook (Two Devices)

### 3.1 Unambiguous Verification Boundaries

To maintain rigorous engineering honesty, verification is partitioned into three distinct tiers:

| Tier | Scope | Media Delivery Path | Status in this Audit |
| :--- | :--- | :--- | :--- |
| **Tier 1: Mocked Unit Tests** | JWT signature, claims, TTL, tamper detection (`tests/security/`, `tests/care/`) | None (Node.js cryptographic assertions) | **VERIFIED (Automated)** |
| **Tier 2: Localhost Loopback Tests** | WebSocket signaling relay, SDP offer/answer exchange on port 3004 | Local simulated sockets / loopback | **VERIFIED (Automated)** |
| **Tier 3: Genuine SFU Two-Device Test** | Real physical audio/video transmission over LiveKit Cloud between two separate hardware endpoints | LiveKit Cloud SFU (UDP/WebRTC) | **PENDING LIVE CLOUD CREDENTIALS** |

> [!IMPORTANT]
> **Engineering Invariant**: Video calling cannot and must not be declared "100% end-to-end verified in production" until a physical session between two disparate physical devices transmits audio and video packets through LiveKit Cloud.

---

### 3.2 Two-Device Verification Runbook Procedure

```
[Device 1: Doctor (Desktop Chrome/Edge)]
   │
   ├─ 1. Authenticate as doctor-cardio-1@sehatai.local
   ├─ 2. Access /care/portal (or /care/doctor/consultations)
   ├─ 3. Accept consultation / Click "Join Call"
   │     └─ Server issues LiveKit JWT bound to Room: care-<consultationId>
   │
   ▼
[LiveKit Cloud SFU (wss://<project>.livekit.cloud)]
   ▲
   │     ┌─ Server issues matching LiveKit JWT bound to Room: care-<consultationId>
   ├─ 3. Click "Join Call" in patient consultation workspace
   ├─ 2. Access /care/consultation/<consultationId>
   ├─ 1. Authenticate as synthetic patient (patient-cardio-test@sehatai.local)
   │
[Device 2: Patient (Mobile Safari / Android Chrome / Second Laptop)]
```

#### Step 1: Pre-requisites & Setup
1. Device 1: Workstation/Desktop running Chrome or Edge with webcam and microphone.
2. Device 2: Mobile handset (iOS Safari or Android Chrome) or separate laptop on external Wi-Fi/4G.
3. Configure server environment with LiveKit Cloud credentials:
   ```bash
   CARE_VIDEO_PROVIDER=livekit
   LIVEKIT_URL="wss://sehatai-prod-xxxx.livekit.cloud"
   LIVEKIT_API_KEY="API_KEY_HERE"
   LIVEKIT_API_SECRET="API_SECRET_HERE"
   ```
4. Confirm synthetic accounts exist in database (`doctor-cardio-1@sehatai.local` and a test patient).

#### Step 2: Session Initiation & Token Verification
1. On Device 1 (Doctor):
   - Sign in as `doctor-cardio-1@sehatai.local`.
   - Open active consultation workspace (`/care/consultation/<id>`).
   - Click **"Join Call"** (`CareCallModal` mounts).
   - In browser DevTools Network tab, inspect `POST /api/care/consultations/<id>/join`:
     - Verify response contains:
       ```json
       {
         "provider": "livekit",
         "roomId": "care-<id>",
         "signalingUrl": "wss://sehatai-prod-xxxx.livekit.cloud",
         "token": "ey..."
       }
       ```
     - Verify local video preview appears in the picture-in-picture window.
     - Verify modal status indicates *"Waiting for other participant…"*.
2. On Device 2 (Patient):
   - Sign in as the synthetic patient account.
   - Navigate to `/care/consultation/<id>`.
   - Click **"Join Call"**.
   - Accept camera and microphone system permissions when prompted by iOS/Android browser.

#### Step 3: Peer Connection & Media Exchange Verification
1. Verify modal status shifts on both devices to **"Connected"** (green indicator).
2. **Video Verification**:
   - Device 1 displays live video feed from Device 2 in full view.
   - Device 2 displays live video feed from Device 1 in full view.
3. **Audio Verification**:
   - Speak into Device 1 microphone; confirm audible voice playback on Device 2 speakers/earpiece.
   - Speak into Device 2 microphone; confirm audible voice playback on Device 1.

#### Step 4: In-Call Controls & State Verification
1. **Mute Microphone**:
   - On Device 1, click Mic mute. Verify UI button turns red.
   - Speak into Device 1; verify Device 2 receives no audio.
   - On Device 1, click Unmute; verify audio transmission resumes.
2. **Toggle Camera**:
   - On Device 2, click Video toggle. Verify UI button turns red.
   - Verify Device 1 displays placeholder / black frame instead of video.
   - On Device 2, turn Camera on; verify video transmission resumes immediately.
3. **Network Degradation / Fallback Ladder (§28)**:
   - On Device 1, click **"Fallback to Audio"**.
   - Verify Device 1 camera turns off, UI displays audio phone icon, and server call state updates to `state: FELL_BACK, fallbackTo: AUDIO`.
   - On Device 1, click **"Fallback to Text"**.
   - Verify call disconnects cleanly and consultation remains active in secure messaging mode.

#### Step 5: Clean Teardown
1. On Device 2, click red **"Leave"** button.
2. Verify:
   - Media tracks cease immediately (camera indicator light turns off).
   - Room disconnects cleanly via `room.disconnect()`.
   - Server call record marks state as `ENDED`.
   - No lingering WebRTC tracks or zombie socket connections remain.

---

## 4. Task C — Release Integrity & Verification

### 4.1 Git Status & Secret Sanitization Audit

Full audit of all working copy changes and untracked files on branch `production-activation`:

```
Changes not staged for commit:
  modified:   .gitignore
  modified:   bun.lock
  modified:   package.json
  modified:   prisma/schema.prisma
  modified:   prisma/seed-care.ts
  modified:   src/app/api/appointments/route.ts
  modified:   src/app/api/doctor/upload-doc/route.ts
  modified:   src/app/api/video-call/route.ts
  modified:   src/app/api/vlm-analyze/route.ts
  modified:   src/components/care/consultation-workspace.tsx
  modified:   src/components/video/video-call.tsx
  deleted:    src/middleware.ts
  modified:   src/server/care/consultation-service.ts
  modified:   src/server/care/marketplace.ts
  modified:   src/server/care/payments/payment-service.ts
  modified:   src/server/care/push-delivery.ts
  modified:   src/server/care/storage.ts
  modified:   src/server/care/video-service.ts

Untracked files:
  deploy/sehatai-staging-v0.2.1-arm64-standalone.tar.gz.sha256
  deploy/sehatai-staging.service
  deploy/smoke-test.sh
  docs/LIVEKIT_READINESS_AND_RELEASE_INTEGRITY.md
  docs/ORACLE_SEHATAI_STAGING_PREPARATION.md
  scripts/test-standalone-http.ts
  scripts/verify-synthetic-db.ts
  src/app/api/care/health/
  src/app/api/staging/
  src/app/staging/
  src/proxy.ts
  tests/security/staging-adversarial-challenger3.test.ts
  tests/security/staging-adversarial-verification.test.ts
```

#### Secret Audit Findings:
- Executed regex pattern scan across all staged and unstaged diffs for `api_key`, `secret`, `password`, `token`, `bearer`, and `private_key`.
- **Zero Real Credentials Committed**: All LiveKit and auth references strictly pull from runtime process environment (`process.env.LIVEKIT_API_KEY`, `process.env.LIVEKIT_API_SECRET`).
- `scripts/verify-synthetic-db.ts` verified **259 user accounts** and **172 doctor profiles** in the database; **0 real CNICs, 0 un-whitelisted emails, and 0 real PII detected**.

---

### 4.2 Test Count Mathematical Reconciliation

Earlier engineering documentation cited test suite totals of 542 and 565 tests. Below is the exact, definitive breakdown reconciling those citations with the current **813 total automated tests**:

| Test Suite | File Scope | Test Count | Suite Purpose |
| :--- | :--- | :---: | :--- |
| **Clinical Safety & Triage Engine** | `tests/tests/safety/` (21 test files) | **565** | Clinical safety invariants, red-flag emergency detection, Urdu/Roman triage, medication safety checks, dosage validation, and doctor suspension gating. *(Earlier baseline had 542 tests; 23 additional tests were incorporated for edge-case emergency keywords and Nastaliq script boundary tests, bringing the safety total to 565).* |
| **Care Connect Telemedicine** | `tests/care/` (6 test files) | **127** | Telemedicine consultations, booking state machines, double-entry financial ledger idempotency, cross-border currency conversions, and live staging integration. |
| **Security & Adversarial Hard-Blocks** | `tests/security/` (3 test files) | **45** | Section 22 red team boundaries, payment hard-blocks, synthetic profile validation, document upload blocks, staging proxy interception, and LiveKit JWT token HMAC validation. |
| **Universal 4-Tier Invariants Runner** | `tests/tests/e2e/e2e-runner.ts` | **76** | Multi-model consensus constellation, strict token-boundary RAG citation isolation, structural role isolation, and zero-latency failover cascade. |
| **TOTAL TEST BATTERY** | **Full Repository Verification** | **813** | **Exact Mathematical Sum:** $565 + 127 + 45 + 76 = 813$ |

---

### 4.3 Full Verification Battery Execution Record

Every test battery was executed directly on `D:\SehatAI-UNIFIED`:

#### 1. TypeScript Strict Typecheck
```bash
bun run typecheck (tsc --noEmit)
# Result: Exit Code 0 (Zero errors)
```

#### 2. Security & Adversarial Suite
```bash
bun test tests/security/
# Result: 45 passed, 0 failed (3 files, 168 expect calls, 893ms)
```

#### 3. Care Connect Suite
```bash
bun test tests/care/
# Result: 127 passed, 0 failed (6 files, 470 expect calls, 13.88s)
```

#### 4. Clinical Safety Suite
```bash
bun test tests/tests/safety/
# Result: 565 passed, 0 failed (21 files, 5986 expect calls, 13.22s)
```

#### 5. Universal 4-Tier Invariants & E2E Runner
```bash
bun tests/tests/e2e/e2e-runner.ts
# Result: 76 passed, 0 failed
# Breakdown:
#   Tier 1 (Feature Coverage):        31/31 passed
#   Tier 2 (Boundary & Corner Cases): 24/24 passed
#   Tier 3 (Cross-Combinations):     10/10 passed
#   Tier 4 (Real-World Scenarios):   11/11 passed
# Universal Invariants:
#   1. Structural Role Isolation:     16/16 passed
#   2. Strict Token-Boundary RAG:     23/23 passed
#   3. Chief Complaint vs Danger:     20/20 passed
#   4. Multi-Provider & Failover:     17/17 passed
```

#### 6. Real HTTP Standalone Server Interception Suite
```bash
bun scripts/test-standalone-http.ts
# Result: 13/13 passed
# Interception Checks Verified on Port 4099:
#   ✓ Health check exemption (/api/care/health) -> 200
#   ✓ Unauthorized request rejected (/care/checkout/result) -> 401
#   ✓ URL query param key strictly rejected -> 401
#   ✓ Header authenticated request allowed (x-staging-access-key) -> 200
#   ✓ Staging unlock UI accessible (/staging/unlock) -> 200
#   ✓ Query key rejected across all endpoints -> 401
#   ✓ Unlock endpoint sets cookie (/api/staging/unlock) -> 200
#   ✓ Cookie authenticated request allowed -> 200
#   ✓ Legacy booking hard-blocked (POST /api/appointments) -> 403
#   ✓ Care booking hard-blocked (POST /api/care/consultations) -> 403
#   ✓ Payment processing hard-blocked (POST /api/care/payments) -> 403
#   ✓ Doctor upload hard-blocked (POST /api/doctor/upload-doc) -> 403
#   ✓ Vision model upload hard-blocked (POST /api/vlm-analyze) -> 403
```

**Grand Total Automated Verification:** **813 Unit/E2E Tests + 13 Real HTTP Standalone Tests = 826 passing automated tests.**

---

### 4.4 Release Packaging & Artifact Validation

The production-ready standalone ARM64 deployment tarball was audited on disk:

- **Target Archive:** `deploy/sehatai-staging-v0.2.1-arm64-standalone.tar.gz`
- **File Size:** `125,496,137 bytes (~119.7 MB)`
- **SHA-256 Calculated:**
  ```powershell
  Get-FileHash -Algorithm SHA256 deploy/sehatai-staging-v0.2.1-arm64-standalone.tar.gz
  D2CC3260ECCC899E3007B55328BCD31F605601CA1F1FAD012E08999792D4D854
  ```
- **Checksum File Check:** Matches `deploy/sehatai-staging-v0.2.1-arm64-standalone.tar.gz.sha256` exactly.
- **Embedded ARM64 Prisma Engines:** Confirmed presence of `libquery_engine-linux-arm64-openssl-3.0.x.so.node` for native execution on Oracle Cloud Ampere A1 (ARM64) instances.

---

## 5. Compliance with Infrastructure Safeguards

During the entirety of this audit and implementation:
- **Oracle Server (`ariahub-oracle`)**: Zero network connections, zero SSH sessions, and zero file modifications executed.
- **Systemd Service**: `sehatai-staging.service` was never restarted.
- **Cloudflare / DNS**: Zero DNS record adjustments or tunnel modifications performed.
- **Protected Directories**: Backups in `D:\SehatAI-BACKUPS` and `D:\SehatAI FINAL` remained untouched.
- **Hackathon Remote**: No pushes or commits made to `https://github.com/jamshidnabizada7-boop/SehatAI-`.
- All development and testing remained strictly local to `D:\SehatAI-UNIFIED`.
