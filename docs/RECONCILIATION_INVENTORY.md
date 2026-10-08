# SehatAI Reconciliation Inventory Matrix

This document provides a comprehensive inventory comparing the two divergent repositories:
- **Old Hardened Copy**: `D:\SehatAI FINAL\SehatAI FINAL` (Commit `3082e25`)
- **Current Complete Copy**: `C:\Users\Computer House\.zcode\workspace\default\SehatAI-` (Branch `backup/pre-reconcile-20261008-care-connect`, Commit `83636a4`)
- **Common Ancestor**: Commit `a4d12052f402f2767bda2a6694df5d37b1aadcc8`

| Feature / File | Old Hardened Copy (`3082e25`) | Current Complete Copy (`83636a4`) | Which Version is Newer | Which Version is Safer | Final Action |
|---|---|---|---|---|---|
| **Core Architecture & Telemedicine Marketplace** | Lacks commercial Care Connect subsystem | Full Care Connect subsystem (Marketplace, Consultations, Payments, Ledger, WebRTC, Legal) | Complete Copy | Complete Copy (newer clinical flows) | **KEEP CURRENT** |
| `prisma/schema.prisma` | Core hackathon models only | Full Core models + Care Connect models (Ledger, Payment, Dispute, Consent, etc.) | Complete Copy | Complete Copy (exhaustive schema) | **KEEP CURRENT** |
| `prisma/seed.ts` & `seed-care.ts` | Base seed data | Base seed + Care Connect doctor, service, and availability seed | Complete Copy | Complete Copy | **KEEP CURRENT** |
| `.env.example` | Updated Postgres URLs, VAPID, DashScope cascade, VLM | Added comprehensive Care Connect env vars (§2–§100) | Complete Copy (Care vars) | Hardened (Postgres + VAPID) | **MERGE LOGIC** |
| `src/app/api/auth/signup/route.ts` | Enforces explicit consent (`body.consent === true`), policy version | Adds distributed DB-backed signup rate limiting | Complete Copy (rate limiting) | Hardened (explicit consent) | **MERGE LOGIC** |
| `src/lib/auth.ts` | Live DB re-verification in `requireUser()` for account suspension & demotion | Adds credential rate limiting and TOTP 2FA verification | Complete Copy (TOTP/RL) | Hardened (DB re-verification) | **MERGE LOGIC** |
| `src/lib/i18n/{en,roman,ur}.ts` | Added transcript labels | Added all Care Connect i18n dictionaries | Complete Copy (Care) | Equal | **MERGE LOGIC** |
| `src/lib/types.ts` | Added `latencyMs` to `ChatMessage` | Base types | Hardened | Hardened | **PORT HARDENING** |
| `src/app/api/conversations/route.ts` | Authorized by `userId` for authenticated users; guest token for unowned | Base unauthenticated sessionToken matching | Hardened | Hardened (IDOR safe) | **PORT HARDENING** |
| `src/app/api/conversations/[id]/route.ts` | Scoped GET/DELETE to owner `userId`, unowned guest session, or doctor consent | Base sessionToken matching | Hardened | Hardened (IDOR safe) | **PORT HARDENING** |
| `src/app/api/summary/route.ts` | Validates caller owns target conversation before generating doctor summary | Unscoped generation | Hardened | Hardened (IDOR safe) | **PORT HARDENING** |
| `src/app/api/eval/run/route.ts` | Protected by admin authorization | Unprotected endpoint | Hardened | Hardened | **PORT HARDENING** |
| `src/app/api/eval/results/route.ts` | Protected by admin authorization | Unprotected endpoint | Hardened | Hardened | **PORT HARDENING** |
| `src/app/api/doctor/upload-doc/route.ts` | Private filesystem storage, magic byte validation, size limit | Public `/uploads` directory | Hardened | Hardened (prevents public PHI) | **PORT HARDENING** |
| `src/app/api/admin/doctor-doc/route.ts` | Admin-authorized private document stream with strict MIME headers | Static public serve | Hardened | Hardened (audited private access) | **PORT HARDENING** |
| `src/server/pipeline/run.ts` | Constellation veto enforcement (abstain -> safe fallback), conversation injection check, L0 history continuity | Standard pipeline run | Hardened | Hardened (veto enforced) | **PORT HARDENING** |
| `src/lib/engine/safety-engine.ts` | Anaphylaxis recheck, hypertension + headache, mild abdominal pain calibration, audience scoring | Base engine | Hardened | Hardened (clinically calibrated) | **PORT HARDENING** |
| `src/data/corpus.ts` & `lexicon.ts` | 241 trilingual items, expanded clinical tags, audience fields | Base corpus | Hardened | Hardened | **PORT HARDENING** |
| `src/data/emergency-templates.ts` | 27 trilingual emergency templates with verified actions | 23 base templates | Hardened | Hardened | **PORT HARDENING** |
| `src/components/chat/judge-inspector-modal.tsx` | Judge/technical inspector panel exposing telemetry without CoT | Not present | Hardened | Hardened (audit tool) | **PORT HARDENING** |
| `next.config.ts` | CSP, HSTS, X-Frame-Options, Permissions-Policy, strict mode, remove ignoreBuildErrors | Loose config | Hardened | Hardened (security headers) | **MERGE LOGIC** (allow mic/camera for WebRTC) |
| `tsconfig.json` | ES2022 target, bun-types, path aliases, clean excludes | ES2017 target | Hardened | Hardened | **PORT HARDENING** |
| `package.json` | Clean CI test scripts, removed `--accept-data-loss` | Base scripts | Hardened | Hardened | **PORT HARDENING** |
| `.github/workflows/ci.yml` | Full repository CI gate (Prisma, lint, test, build) | None | Hardened | Hardened | **PORT HARDENING** |
| `.github/workflows/care-connect-ci.yml` | Not present | Care Connect CI | Complete Copy | Complete Copy | **KEEP CURRENT** |
| `docs/CARE_CONNECT_*` & `docs/legal/*` | Not present | 13 audit, architectural, and legal draft documents | Complete Copy | Complete Copy | **KEEP CURRENT** |
| `docs/HACKATHON_*` | Hackathon audit, architecture, and safety documents | Not present | Hardened | Hardened (historical) | **PORT HARDENING** (archive as historical) |
| `LICENSE` | MIT License | Missing | Hardened | Hardened | **PORT HARDENING** |
| `README.md` | Hackathon-specific README | Base README | Hardened | Hardened | **MERGE LOGIC** (reflect unified product) |
| `src/server/care/*` | Not present | Complete Care Connect domain services (ledger, payments, consultations, etc.) | Complete Copy | Complete Copy | **KEEP CURRENT** |
| `src/app/api/care/*` | Not present | Care Connect API routes | Complete Copy | Complete Copy | **KEEP CURRENT** |
| `src/app/api/doctor/care/*` | Not present | Doctor earnings and payout routes | Complete Copy | Complete Copy | **KEEP CURRENT** |
| `src/components/care/*` | Not present | Marketplace, Consultation Workspace, Doctor Dashboard | Complete Copy | Complete Copy | **KEEP CURRENT** |
| `tests/care/*` | Not present | Integration, unit, and smoke tests for Care Connect | Complete Copy | Complete Copy | **KEEP CURRENT** |
| `tests/tests/*` | Typescript-fixed, passing safety suite and runner | Import path issues under root tsconfig | Hardened | Hardened | **PORT HARDENING** |
