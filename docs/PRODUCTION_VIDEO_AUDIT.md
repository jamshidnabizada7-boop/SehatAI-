# SehatAI Care Connect Production WebRTC & Video Audit

**Document ID:** VID-AUDIT-2026-10-08-04  
**Target Module:** `src/server/care/video-service.ts` & Call Routes  
**Classification:** REALTIME INFRASTRUCTURE AUDIT  
**Date:** October 8, 2026  

---

## 1. Executive Summary (§26, §27, §28, §29)

Care Connect supports tele-consultations across text, audio, and video modalities. Video and audio consultations require low latency, high resilience across poor network corridors (2G/3G/rural broadband), and strict privacy controls.

The service provides a provider abstraction decoupling room token generation from the underlying signaling media infrastructure.

---

## 2. WebRTC Provider Architecture

```
                    VideoProvider Interface
                    ┌──────────┴──────────┐
                    ▼                     ▼
          MiniSignalProvider     LiveKitVideoProvider
          (Local WebRTC Dev)      (Production LiveKit SFU)
                    │                     │
                    ▼                     ▼
         HMAC Room Tokens        Standard LiveKit JWT
         Local Signal WebSocket  Managed Cloud SFU / TURN
```

### 1. `MiniSignalProvider` (Development Mode)
- **Status:** Development / Staging Only.
- Issues local HMAC-signed room tokens bound to `roomId = care-${consultationId}`.
- Relies on local signaling server (`mini-services/video-signal`).
- Uses public Google STUN servers (`stun:stun.l.google.com:19302`).

### 2. `LiveKitVideoProvider` (Production Engine)
- **Status:** Production Ready.
- Issues standard JSON Web Tokens (JWT) signed with `HS256` using `LIVEKIT_API_SECRET`.
- Issues full video room grants:
  - `room`: `care-${consultationId}`
  - `roomJoin`: `true`
  - `canPublish`: `true`
  - `canSubscribe`: `true`
  - `canPublishData`: `true`
  - `recorder`: `false` (§29 — recording disabled)
  - `hidden`: `false`
- Room metadata contains JSON encoded `{ role: opts.role, consultationId: opts.consultationId }`.
- Token validity is strictly time-bounded (15 minutes TTL).

---

## 3. Clinical Gating & Call Lifecycle State Machine

Before a call can be initiated or joined, `joinCall` verifies 4 critical boundaries:

1. **Participant Authentication:** Requester must be the explicit patient or doctor assigned to the consultation.
2. **Consultation State Validation:** Consultation status must be in an active eligible state (`DOCTOR_ACCEPTED`, `SCHEDULED`, `WAITING`, `IN_PROGRESS`, `PAID`, `REQUESTED`).
3. **Completed Consultation Lockout:** If consultation status is `COMPLETED`, `CANCELLED`, `REFUNDED`, or `EXPIRED`, attempts to join trigger `CONSULTATION_ALREADY_${status}` (HTTP 409).
4. **Doctor Suspension Gating (§14):**
   - Doctor's profile `careStatus` must NOT be `SUSPENDED` or `REJECTED`.
   - Doctor's user account `accountStatus` must NOT be `suspended`.
   - Any suspended clinician attempting to join is immediately blocked with `DOCTOR_SUSPENDED` (HTTP 403).

---

## 4. Privacy, Recording & Compliance Rules (§29)

- **Recording Invariant:** Tele-consultation recording is **disabled by default** across all providers (`recording: false`).
- In the LiveKit JWT claims, `video.recorder: false` is hardcoded.
- In the local WebRTC token, `recording: false` is strictly typed.
- Future recording features require explicit affirmative patient and doctor bilingual consent records.

---

## 5. Low-Bandwidth Degradation Ladder (§28)

To support patients in rural or constrained bandwidth environments:
- **Ladder Progression:** `VIDEO` → `AUDIO` → `SECURE TEXT CHAT`.
- If packet loss exceeds acceptable thresholds or video media fails, `reportCallState` transitions call state to `FELL_BACK` with `fallbackTo: 'AUDIO'` or `fallbackTo: 'TEXT'`.
- **Zero Data Loss Invariant:** A failed video session **NEVER terminates the consultation**. The consultation remains active, and messaging continues in encrypted real-time chat.

---

## 6. Production LiveKit Environment Configuration

| Variable | Description | Production Requirement |
| :--- | :--- | :--- |
| `CARE_VIDEO_PROVIDER` | Set to `livekit` | **YES** |
| `LIVEKIT_URL` | WebSocket URL of LiveKit SFU (e.g., `wss://livekit.sehatai.health`) | **YES** |
| `LIVEKIT_API_KEY` | LiveKit API Key identifier | **YES** |
| `LIVEKIT_API_SECRET` | LiveKit API Secret (used for HS256 signing) | **YES** |
| `CARE_STUN_URL` | Optional custom STUN URL | Optional |
| `CARE_TURN_URL` | Optional TURN server URL for symmetric NAT traversal | Recommended |
