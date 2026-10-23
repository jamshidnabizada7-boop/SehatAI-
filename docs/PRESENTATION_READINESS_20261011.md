# SehatAI presentation readiness — 11 October 2026

Presentation URL: https://sehatai.myariahub.com

The existing private staging gate remains enabled. Use the current key from `temp/PRESENTATION_ACCESS_PRIVATE.txt`, rather than an older deployment key. That private, ignored file also contains the synthetic patient and doctor logins and the shared consultation link. Unlock staging independently on each device, then log in with the corresponding role. Allow microphone/camera for the call and use headphones to prevent feedback.

## Changes

- Restored the valid Groq and Gemini credentials found in the owner's local `D:\SehatAI FINAL\SehatAI FINAL\.env`, without displaying or bundling secrets. Removed deployed placeholder provider values. Direct model-list and generation requests succeeded for both providers. Updated model fallbacks to names accepted by the actual accounts.
- New chats no longer silently inherit an earlier emergency conversation just because they reuse the same browser session. Explicit conversation continuation still retains emergency protection and ownership checks.
- Contextual red-flag handling no longer escalates negated seizures/loss of consciousness or standalone warning-sign questions. Misspelled headache queries can retrieve reviewed local guidance when vector retrieval returns no match.
- LiveKit configures server ICE before negotiation for embedded browsers. A successful LiveKit call returns immediately instead of also starting the obsolete relay and displaying a false signaling error. Failed connections display an actionable failure rather than claiming a connection.
- Call controls wrap on narrow screens. Ended calls disable media controls. Consultation deep links select Care Connect again after a page refresh.

## Verification

- TypeScript checking and production build passed.
- Safety suite: 566 passed, 0 failed, 6 database-dependent tests filtered because the local test database was unavailable. Actual staging database flows were exercised separately.
- LLM failover suite: 52 passed, 0 failed.
- HTTPS authentication, cache isolation and role authorization: 28/28 checks passed.
- Live staging API: 17/17 checks passed. These cover both credential logins, messages persisted and received over SSE in both directions, authorized LiveKit join tokens with distinct identities in the same room, retained true emergency behavior, explicit emergency follow-up, and four fresh mild-symptom chats using the same browser session after an emergency.
- Final browser rehearsal: both patient and doctor join tokens produced a connected LiveKit call. Both browser participants decoded remote video at 320×180 and remote audio with `readyState=4`, playing and unmuted; local video was 1280×720. Mute/unmute, camera off/on, audio-only mode, peer departure and rejoin passed. The false relay signaling banner did not recur. Both calls were left and cameras stopped afterward.
- The consultation link containing only `consultationId` reopened the correct workspace for both roles, verifying refresh/deep-link behavior.
- Final health: HTTP 200, status `ok`, database `connected`. SehatAI application and tunnel services active. ARIA service PIDs unchanged (620, 134252, 1733586). Root filesystem free space: 8.0 GB.

Evidence: `temp/presentation-live-verification.json`, `temp/https-domain-verification.json`, `temp/presentation-browser-media.json`, `temp/presentation-call-connected.png`, `temp/presentation-health.json`, `temp/presentation-safety.log`, `temp/presentation-llm-tests.log`, `temp/presentation-build.log`.

## Deployment

Active release: `/opt/sehatai/releases/20261011_presentation_final`, selected by `/opt/sehatai/current`. Previous healthy release: `/opt/sehatai/releases/20261011_presentation`; original domain release remains `/opt/sehatai/releases/20261011_v024`. Only SehatAI was restarted. Runtime dependencies were unchanged and reused from the verified Linux ARM64 release. The deployment bundle allowlist excludes environment files, credentials and unrelated workspace artifacts.

Final bundle SHA-256: `de46bb0947852eb0a100ed45d191737e17b7f09fcd74064c70643630a8172642`.

## Scope

This is the synthetic staging demonstration. Existing restrictions on payments, prescription issuance and other clinical production actions remain in place. No paid upgrade or Cloudflare Zero Trust billing enrollment was performed. Provider service availability and free quotas can change; both restored credentials successfully generated responses during this verification.

The rehearsal uses two browser participants on one computer. Physical phones, their permission prompts, microphones, cameras and separate mobile networks still require the owner's brief device rehearsal before presenting.
