# Production release checklist — 24 October 2026

## Readiness

Engineering fixes are prepared for controlled local integration. **Public production release remains blocked** by clinical/content approval, residual dependency review and unexercised real integrations/legal/privacy operations. No live deployment has occurred. No production credentials were requested or read.

## Executed verification

| Check | Result / evidence |
| --- | --- |
| Disposable database | New WSL PostgreSQL 18 cluster, loopback port 55432, database `sehatai_codex_test`; all committed migrations including the additive approval-field correction; corpus/facility and Care seeds succeeded. |
| Core safety + Care regression | 793 passed, 0 failed across 30 files; over 6,700 assertions. `work/regression-final.log`. |
| Authorization/security suites | 33 passed, 0 failed, 140 assertions. `work/security-final.log`. |
| Additional finance concurrency/rollback run | 17 passed, 0 failed; subset overlaps the full suite. `work/capture-final.log`. |
| Full commercial mock smoke | Booking → signed capture → replay → balanced ledger → doctor acceptance/completion → full refund/reversal: `SMOKE OK`. `work/care-smoke-final.log`. No real money. |
| TypeScript | Standalone typecheck passed; final Next production build also typechecks the complete repository. |
| ESLint | Passed; only Babel's large-corpus generation notice. `work/lint-final.log`. |
| Production build | Next 16.4.1, Prisma 6.19.2, compilation/typecheck/static generation succeeded. `work/build-final.log`. |
| Production API/Chrome | Passed against Node standalone output: real SSE, saved/insufficient summaries, ownership/consent scope/revocation, offline reload and reconnection, local summary/JSON export, keyboard focus, account switching, three RTL viewports and preserved dashboard. `work/production-verification.json` and `work/browser-api.log`. |
| Secret scan | No new hardcoded credentials; 36 inherited/reviewed fixture lines skipped. Two newly accepted hashes are only synthetic localhost CI connection strings. |
| Dependency audit | 109 initial findings reduced to two advisory groups; no critical finding in final snapshot. Residual high `deepmerge-ts` and moderate nested `uuid` require review. |
| Dashboard preservation | `src/components/dashboard/` has no changes; public results/dataset access retained; browser screenshot confirms access. Protected mutations require a current administrator and explicit diagnostics flag. |
| Workspace isolation | Main branch remains at `d7e3525`; main's pending edits retained; Claude worktree not modified. |

Expected Prisma unique-constraint log entries during duplicate-webhook tests are deliberate replay attempts, not test failures.

## Before integrating

- Read `CLAUDE_INTEGRATION_HANDOFF.md`; preserve main's pending CI/package/script/doc changes and Claude's independent layout redesign.
- Install with Bun 1.4.0 using the committed lockfile. Node 22+ is the CI target. Review the Sharp/transitive security overrides and remaining advisories.
- Apply the additive migration in a backed-up staging environment first. It adds columns to match an existing schema; it does not grant legal approval or change existing policies to enabled.
- Set dedicated production keys for authentication, storage encryption, checkout/video/mock signing only where the relevant operation is permitted. Production key validation is lazy and fails closed for missing/short/known-development values. Never rely on development fallbacks or rotate a storage encryption key without a data migration/recovery plan.
- Keep `ENABLE_INTERNAL_DIAGNOSTICS` disabled for normal production use. Authorized operational use still requires fresh admin status and writes an audit record.
- Confirm explicit consent scopes in the patient flow: `read_history`, `soap_draft`, `follow_up`; old appointments do not replace consent.
- Configure and observe the notification outbox worker; transactional creation is not delivery confirmation.

## Release blockers and unverified operations

Qualified clinical review of changed safety rules/templates/translations and the complete medical corpus is outstanding. Real AI/vision/voice generation, payment gateways/refund reconciliation, video, remote storage, notifications and production failover were not used. Verify vendor processing authorization, retention/deletion and financial/legal requirements with responsible owners. Verify Afghanistan resources/corridors before activation. Existing dashboard benchmark claims are preserved at the user's request and are not a new measurement from this work.

Audit the remaining dependency advisories for reachable exploit paths and resolve or formally accept them. Inspect Git history for previously exposed credentials and rotate through an authorized operational process; source cleanup does not revoke historical secrets.

## Reproduction

Use a fresh local database named with `test`; never a patient or commercial ledger. Set `DATABASE_URL` and `DIRECT_URL` to it, then run `bun install --frozen-lockfile`, `bunx prisma migrate deploy`, `bun prisma/seed.ts`, `bun prisma/seed-care.ts`, `bun run typecheck`, `bun run lint`, `bun run scan:secrets`, the CI test commands, `bun tests/care/care-smoke.ts`, and `bun run build`.

For actual browser/API verification, install Playwright with a browser separately. Set `PLAYWRIGHT_MODULE` to an absolute `playwright/index.mjs` if it is not a project dependency, optionally `PLAYWRIGHT_CHANNEL=chrome`, then `bun run verify:production`. The verifier refuses non-loopback/non-test databases and occupied ports, starts/stops its own Node standalone server on 3200, strips inherited provider credentials, and leaves synthetic test rows for inspection. Browser/API output and screenshots go to ignored `work/`.

## Monitoring and rollback

Monitor emergency routing/fallback counts, saved-turn failures, summary insufficiency/error rates, denied patient reads, consent changes, webhook retries, ledger balancing and outbox lag without logging patient transcripts. Do not equate internal routing confidence with clinical certainty.

Rollback application commits in a reviewed integration branch; do not reset main or Claude's checkout. Retain additive database columns during ordinary application rollback. Financial rows require compensating entries, never destructive ledger rewrites. Preserve encryption keys and backups, and verify the prior app can read existing records before promotion.
