# Claude / production integration handoff

## Location and commits

Worktree: `D:\SehatAI-CODEX-SAFETY`  
Branch: `fix/sehatai-clinical-production-hardening`  
Base: `d7e3525dd8002f0a3a207d5f5165793e73fcb7f3` on `production-activation`.

Implementation commits, in order:

1. `bf277c3` — atomic financial capture, ledger/consultation/notification effects, webhook retries, secret configuration and additive migration.
2. `5aa143b` — longitudinal clinical safety, explicit identity extraction, factual summary, scoped patient privacy, offline restoration and contextual chat actions.
3. a46ded4 — dependency/security updates, safe deployment tracing, credential cleanup/scanning, CI and reproducible production runtime verifier.
4. 98bc53c — bind current database authorization to the immutable session ID and reject stale/reassigned email identity; chat uses the verified actor.

Documentation commits add these four reports. Use `git log --oneline d7e3525..fix/sehatai-clinical-production-hardening` to inspect the final local sequence. Nothing has been merged, pushed or deployed.

## Preserve these boundaries

- Main checkout `D:\SehatAI-UNIFIED` has owner changes in CI, package/scripts and untracked documentation/tools. Do not reset or replace them. The sanitized versions of four scripts and the secret scanner/baseline were carried into Codex's branch from the owner's pending main edits; reconcile them as already-owned work, not a competing implementation. Only two synthetic CI fixture hashes were added to the baseline.
- Claude's `D:\SehatAI-UNIFIED\.claude\worktrees\ui-ux-redesign` remains untouched. Integrate business behavior into its layout; do not replace its screens wholesale.
- The user explicitly requires the dashboard to stay. `src/components/dashboard/` is byte-for-byte unchanged by Codex. Do not delete benchmark panels or change that dashboard during integration. Its existing presentation does not become a clinically validated/live metric through this work.
- No patient chat Inspector/Judge control should be reintroduced. The unused inspector source file is not mounted by the production chat. Public diagnosis/confidence/differential metadata must remain excluded.

## Expected UI conflicts

| Shared surface | Required behavior to port into Claude's visual design |
| --- | --- |
| `src/components/chat/message-bubble.tsx` | Remove Inspector control/rendering and clinical confidence/evidence boilerplate; call shared `careActionsFor` only for the latest completed answer. Keep existing citations and useful actions. |
| `src/components/chat/chat-view.tsx` | Gate doctor/facility sidebar cards by policy; no duplicate referral rails in chat. Preserve summary and explicit navigation; avoid invented trust/clinical validation claims. |
| `src/components/chat/summary-modal.tsx`, `qr-code-svg.tsx` | Build factual summary from the current transcript, show insufficient-information state, allow local copy/print/JSON; never silently truncate QR or advertise invalid EHR/FHIR conformance. |
| `src/components/chat/emergency-overlay.tsx`, `sos-button.tsx` | Preserve keyboard focus/dismissal, contextual emergency text, location permission/failure handling and honest dispatch statements. No assumed location or misleading crisis numbers. |
| `src/components/chat/pipeline-ticker.tsx` | Plain patient-facing progress; no pipeline internals. |
| `src/components/about/about-view.tsx`, `src/components/app/app-header.tsx` | Remove judge personas, technical diagnostics and simulation control; retain legitimate information and PWA install guidance. |
| `src/components/app/app-footer.tsx`, `src/lib/i18n/{en,ur,roman}.ts` | Correct resource purpose and geographic limitations; factual offline/source copy. Dashboard dictionary sections are unchanged. |
| `src/app/page.tsx`, `src/components/auth/session-provider.tsx` | Wait until local conversation is bound to the correct identity; support private-tab offline reload; recheck actual auth after reconnection. Do not grant server authorization from cached local identity. Preserve dashboard view availability. |

Most reusable behavior lives in hooks/services rather than styling. Review these UI diffs semantically against Claude's final components rather than choosing one entire file with “ours/theirs”.

## Contracts changed

- `engine/safety-state.ts` is the source of longitudinal risk and factual recall. Reconstruct from complete owned **user** reports. Do not use a generator's bounded prompt as the safety store. No count/time expiry and no model-cleared flags.
- `care-actions.ts` determines whether booking, facilities or home-care prompts are appropriate. Greetings/general illness do not automatically promote bookings. Emergency retains emergency-care navigation and suppresses booking/home-care solicitation.
- Chat requests carry browser `history` with server assistant IDs for offline recovery; saved history is authoritative. SSE projection withholds generation tokens until the final answer; internal providers, validation internals, confidence and inferred differential are excluded. Recovery writes patient/offline turns in the same transaction as the new answer.
- Summary API returns 422 for insufficient medical facts; ownership/current sharing is required. Local summary needs neither network nor external AI. Export is `sehatai-transcript-summary-v1` JSON, not a verified EHR document.
- Patient history requires active verified doctor plus current `read_history` consent. SOAP requires `soap_draft`; scheduling requires pre-existing `follow_up`. A doctor cannot self-grant sharing. Admin role alone does not open patient conversations. Feedback/delete require the owner; guest reads require the matching high-entropy bearer token.
- AI/voice/vision processing has fresh identity/consent gates. Unsupported placeholder STT/TTS/RWE endpoints return 501 rather than fabricated success.
- Authorization resolves the immutable signed session ID, checks email consistency and reads current role/status. A changed/reassigned email requires a new session; it cannot turn an old token into the new email owner's identity.
- Diagnostics default off with `ENABLE_INTERNAL_DIAGNOSTICS`; fresh admin + audit is required when enabled. Dashboard public aggregate read APIs remain available, including `/api/admin/dataset-stats`.
- Financial captures and competing payment transitions take a Payment row lock. Ledger/account resolution, status events, earning/fee and notification/outbox changes share a transaction. Unprocessed authentic webhook replay can retry. API idempotency keys are scoped by actor; client raw keys remain accepted at ingress.
- No placeholder sync acknowledgment is returned. The standalone output excludes runtime storage, scratch logs, environment files and tests; configure private runtime storage separately.

## Controlled integration sequence

1. Coordinate a pause/integration point with the owner/Claude. Inspect current Git status and both sets of changes. Keep main's dirty state and Claude's checkout intact; create a separate integration branch/worktree from the chosen production commit.
2. Apply the financial commit first, then clinical/privacy behavior, then dependency/CI/security and documentation. Resolve package/lockfile changes together. Reconcile the owner's existing four credential-cleanup scripts and scanner, preserving new main changes.
3. Port the required component behavior above into Claude's new design. Keep the dashboard source/layout and access intact. Use `git diff -- src/components/dashboard` to verify it has not been inadvertently changed.
4. Apply the additive approval-field migration to a new disposable/staging database, not production. Run seeds only where appropriate; legal approvals require actual authorized records.
5. Run the release-checklist commands and production verifier on the integrated branch. The verifier needs a separately available Playwright install/browser and a loopback database with `test` in its name. Check screenshots and actual saved records; do not rely only on mocks.
6. Obtain clinical/content, security/dependency, privacy/legal and real-provider verification before an authorized deployment. No production promotion is implied by these commits.

## Evidence and exact file inventory

Executed results are in `PRODUCTION_RELEASE_CHECKLIST.md`; clinical boundaries in `CLINICAL_SAFETY_VERIFICATION.md`. Ignored local `work/` contains build/test logs, API/browser JSON and screenshots. A copy of the review reports and selected verification evidence is delivered in this chat's `outputs` folder.

The exact implementation file inventory follows (relative to the isolated repository):

```text
.github/workflows/ci.yml
.gitignore
bun.lock
docs/CLAUDE_INTEGRATION_HANDOFF.md
docs/CLINICAL_SAFETY_VERIFICATION.md
docs/CODEX_PRODUCTION_AUDIT.md
docs/PRODUCTION_RELEASE_CHECKLIST.md
next.config.ts
package.json
prisma/migrations/20261024000000_jurisdiction_approval_fields/migration.sql
public/sw.js
scripts/backup-restore-staging.ts
scripts/scan-secrets.ts
scripts/secret-scan-baseline.json
scripts/setup-db.ts
scripts/update-oracle-env.py
scripts/verify-production-hardening.ts
scripts/verify-staging-integration.ts
src/app/api/care/consultations/route.ts
src/app/api/care/payments/route.ts
src/app/api/care/refunds/route.ts
src/app/api/chat/route.ts
src/app/api/conversations/[id]/route.ts
src/app/api/conversations/route.ts
src/app/api/doctor/analytics/route.ts
src/app/api/doctor/fhir-export/route.ts
src/app/api/doctor/followups/route.ts
src/app/api/doctor/patients/route.ts
src/app/api/doctor/soap-note/route.ts
src/app/api/eval/access/route.ts
src/app/api/eval/run/route.ts
src/app/api/feedback/route.ts
src/app/api/fhir/[resource]/route.ts
src/app/api/observability/metrics/route.ts
src/app/api/rwe-llm/route.ts
src/app/api/summary/route.ts
src/app/api/vlm-analyze/route.ts
src/app/api/voice/stt/route.ts
src/app/api/voice/transcribe/route.ts
src/app/api/voice/tts/route.ts
src/app/page.tsx
src/components/about/about-view.tsx
src/components/app/app-footer.tsx
src/components/app/app-header.tsx
src/components/auth/session-provider.tsx
src/components/chat/chat-view.tsx
src/components/chat/emergency-overlay.tsx
src/components/chat/message-bubble.tsx
src/components/chat/pipeline-ticker.tsx
src/components/chat/qr-code-svg.tsx
src/components/chat/referral-rails.tsx
src/components/chat/sos-button.tsx
src/components/chat/summary-modal.tsx
src/data/emergency-templates.ts
src/data/lexicon.ts
src/hooks/use-chat.ts
src/hooks/use-conversation-persistence.ts
src/hooks/use-network-online.ts
src/lib/auth.ts
src/lib/care-actions.ts
src/lib/doctor-summary.ts
src/lib/emergency-localization.ts
src/lib/engine/context-extraction.ts
src/lib/engine/intent-detection.ts
src/lib/engine/safety-engine.ts
src/lib/engine/safety-state.ts
src/lib/i18n/en.ts
src/lib/i18n/roman.ts
src/lib/i18n/ur.ts
src/lib/offline-db.ts
src/lib/qr.ts
src/lib/store/app-store.ts
src/lib/store/chat-store.ts
src/server/care/consultation-service.ts
src/server/care/ledger.ts
src/server/care/notifications.ts
src/server/care/payments/mock-provider.ts
src/server/care/payments/payment-service.ts
src/server/care/prescription-service.ts
src/server/care/secrets.ts
src/server/care/storage.ts
src/server/care/video-service.ts
src/server/conversation-access.ts
src/server/diagnostic-access.ts
src/server/external-processing.ts
src/server/pipeline/run.ts
src/server/public-pipeline-event.ts
tests/care/production-capture.test.ts
tests/tests/safety/conversation-redesign.test.ts
tests/tests/safety/o-spec-sweep.test.ts
tests/tests/safety/production-hardening.test.ts
tests/tests/safety/q-pwa-glossary.test.ts
tests/tests/safety/x-unseen-adversarial-holdout.test.ts
```
