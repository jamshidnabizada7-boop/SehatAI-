# Video and Worker Audit

## Task D — Real LiveKit Connection Audit

### 1. Integration Analysis
- **LiveKit Integration**: The integration is natively present without requiring heavy SDKs. `LiveKitVideoProvider` exists in `src/server/care/video-service.ts` and uses standard `createHmac` from Node's `crypto` module to create an HS256 JWT that LiveKit expects (`generateLiveKitToken`).
- **LiveKit Provider vs MiniSignalProvider**: There is a real LiveKit provider (`LiveKitVideoProvider`) alongside a dev-only `MiniSignalProvider` (which uses `mini-services/video-signal/index.js`). The system uses `MiniSignalProvider` unless `process.env.CARE_VIDEO_PROVIDER === 'livekit'`.
- **Room Token Generation & Validation**: Handled by HMAC signatures (`issueRoomToken` and `verifyRoomToken`) for local WebRTC and custom LiveKit JWT generation (`generateLiveKitToken`). Tokens are bound to the consultation ID and have a short TTL (15 mins).
- **HS256 JWT**: Properly implemented via `createHmac('sha256')` with correct `base64url` encoding for headers and payload.
- **Unauthorized Users Rejected**: `joinCall` enforces that only the assigned patient or doctor can join the call. It verifies the consultation state.
- **Suspended Doctor Access**: Properly blocked. If `c.doctorProfile.careStatus` is 'SUSPENDED' or 'REJECTED' or `user.accountStatus` is 'suspended', joining is blocked with a 403 error.
- **Reconnection Handling**: Handled in the UI via `CareCallModal` which attempts to reconnect or fallback when connection state changes.
- **Audio-Only Fallback**: Implemented on the frontend (switches to `AUDIO` mode and disables video tracks on failure) and backend (`reportCallState` logs the `FELL_BACK` state and fallback mode).
- **Recording Consent**: Enforced off by explicitly setting `recorder: false` in the LiveKit token, and `recording: false` in the WebRTC token. There is currently no option to enable it.

### 2. Blocked Status
- **Status**: **BLOCKED**
- **Requirements**:
  - The project owner must provision a LiveKit Cloud project or a self-hosted LiveKit instance.
  - Required Environment Variables:
    - `LIVEKIT_API_KEY`
    - `LIVEKIT_API_SECRET`
    - `LIVEKIT_URL`
    - `CARE_VIDEO_PROVIDER=livekit`
- **What can be verified**: Token generation logic, authorization checks, doctor suspension checks, provider abstraction, fallback ladder logic.

### 3. Verification Points (Task D)
- **LiveKit SDK/Token Logic**: **PASS** (Uses manual HS256 JWT conforming to LiveKit spec)
- **Authorization & Access Checks**: **PASS**
- **Suspended Doctor Blocking**: **PASS**
- **Audio Fallback Logic**: **PASS**
- **Recording Disabled**: **PASS**
- **LiveKit Environment**: **BLOCKED** (Needs provisioned project)

## Task F — Worker Execution Test

### 1. Worker Analysis
- **Independent Startup**: The worker starts independently using `bun scripts/run-outbox-worker.ts`. It doesn't require the Next.js web application to be running.
- **Retry Logic**: Implemented in `src/server/care/push-delivery.ts` using exponential backoff up to a maximum attempt limit.
- **Dead-Letter Handling**: Implemented. Jobs failing repeatedly reach `DEAD_LETTER` status. The worker script provides a `--replay-dead-letters` flag to requeue them for operator intervention.
- **Concurrent Processing**: Multiple workers can safely run concurrently due to atomic queue claiming (`UPDATE ... WHERE status = 'PENDING'`).
- **Restarts and Stuck Jobs**: Restarts do not lose jobs. `recoverStuckJobs()` runs automatically to reclaim jobs stuck in 'CLAIMED' or 'PROCESSING' status older than a threshold (e.g., if a worker crashed mid-job).
- **Missing Credentials**: Handled gracefully. If `VAPID` keys are missing, the worker pushes jobs back to `PENDING` with a `VAPID_NOT_CONFIGURED` error and a short backoff, without marking them as delivered.
- **Visibility**: Metrics (processed, delivered, dead letter, reclaimed) are printed to the console on each batch interval.

### 2. Verification Points (Task F)
- **Independent Execution**: **PASS** (Verified by successfully running `bun scripts/run-outbox-worker.ts --once`)
- **Retry Logic**: **PASS**
- **Dead-Letter Handling**: **PASS**
- **Concurrent Worker Safety**: **PASS**
- **Stuck Job Recovery**: **PASS**
- **Graceful Credential Missing Handling**: **PASS**
- **Metrics/Logging Visibility**: **PASS**
