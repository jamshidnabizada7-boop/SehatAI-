# Task UI-AUTH — Auth + Onboarding UI (Phase 0)

Agent: Implementation Agent (UI-AUTH)
Project: SehatAI at /home/z/my-project

## Scope delivered

Built the Phase 0 authentication + onboarding UI on top of the pre-existing
backend APIs (`/api/auth/signup`, NextAuth credentials, `/api/user/consent`,
`/api/user/delete`, `/api/profile`, `/api/outcomes`). No changes to the
existing chat/reminders/facilities/dashboard/about/my-health behaviour — all
additions are surgical.

## Files created

- `src/app/auth/signin/page.tsx` — trilingual sign-in (email+password, show/hide
  password, sonner error toasts, redirect to `/` or `/onboarding` based on
  consent state from `/api/user/me`, "Continue as guest").
- `src/app/auth/signup/page.tsx` — signup with name (optional), Urdu consent
  checkbox (exact Phase-0 statement) + EN/Roman translations, retention
  selector (30/90/365/1825 days / indefinite), then signup → signIn →
  POST /api/user/consent (retentionDays) → /onboarding.
- `src/app/auth/error/page.tsx` — trilingual NextAuth error page.
- `src/app/onboarding/page.tsx` — server wrapper (getServerSession guard,
  307 → /auth/signin when signed out) + client flow.
- `src/components/onboarding/onboarding-flow.tsx` — 4-step flow: (1) Urdu
  consent + retention (auto-skipped when consented — e.g. after signup),
  (2) profile setup (age band, sex, pregnant, CHRONIC_CONDITIONS chips,
  allergies/meds textareas, up-to-3 ICE contacts with phone validation) →
  PUT /api/profile + localStorage mirror, (3) "Try saying I have a headache"
  trilingual demo prompt (tapping one pre-fills the chat via
  chat-store.pendingChatDraft) + real tel:1122 button, (4) offline pack notice
  → finish → `/`.
- `src/components/auth/session-provider.tsx` — NextAuth SessionProvider wrapper.
- `src/components/auth/auth-shell.tsx` — shared auth layout (AppHeader +
  centered main + sticky AppFooter in min-h-dvh flex column).
- `src/components/auth/trilingual.tsx` — TriInline / TriStack trilingual text
  helpers (EN · اردو Nastaliq RTL · Roman).
- `src/components/auth/auth-banner.tsx` — guest banner in the app shell
  (useSession, dismissible, trilingual via t()).
- `src/components/outcomes/outcome-followup-card.tsx` — "How are you feeling?"
  card at the top of chat after URGENT/ROUTINE responses for signed-in users
  with pending outcomes; Better/Same/Worse/Saw-a-doctor → POST /api/outcomes;
  worse/saw_doctor → sonner toast with "Re-check" action that pre-fills the
  chat input.
- `src/components/my-health/account-section.tsx` — "Account & data" settings:
  retention selector (POST /api/user/consent), last-10 audit log viewer,
  sign-out, and delete-my-data with AlertDialog confirm → DELETE
  /api/user/delete → signOut → `/` (+ clears localStorage profile/journal).
- `src/app/api/user/me/route.ts` — GET session user info
  { email, name, consented, retentionDays } (unauthenticated → {user:null}).
- `src/app/api/audit/route.ts` — GET last-10 audit events for the session user.

## Files modified

- `src/app/layout.tsx` — wrapped app in AppSessionProvider; mounted sonner
  Toaster (top-center) next to the radix Toaster.
- `src/app/page.tsx` — added `<AuthBanner />` under OfflineBanner (guest mode).
- `src/components/chat/chat-view.tsx` — added OutcomeFollowupCard at the top of
  the messages log (active when last assistant triage is URGENT/ROUTINE,
  refreshKey = assistant turn count).
- `src/components/my-health/my-health-view.tsx` — appended AccountSection.
- `src/lib/i18n/{en,ur,roman}.ts` — added `auth.*` (banner), `settings.*`,
  `outcome.*` key sections in all three dictionaries.

## Verified end-to-end (curl + agent-browser)

- Signup → credentials sign-in → session cookie; audit log shows auth.signup /
  auth.login / consent.record / profile.read / profile.update / outcome.captured.
- Onboarding skips consent step when consent already recorded; profile PUT +
  localStorage mirror works; demo prompt pre-fills chat input after finish.
- Guest banner appears when signed out; disappears when signed in; Urdu mode
  renders RTL (dir=rtl, lang=ur) with translated banner.
- Outcome card appears after ROUTINE triage response when a pending outcome
  exists; "Saw a doctor" → escalated toast with Re-check CTA → pre-fills
  "Can you re-check my symptoms?".
- Delete-my-data: dialog → cascade delete (verified in DB: user + all related
  rows gone) → signOut → guest home + banner; localStorage mirrors cleared.
- All routes 200/307 as expected; `bun run lint` clean; dev.log shows no
  runtime errors (only benign Fast-Refresh reloads during editing).
- Test users removed from the DB via the real delete flow.

## Deferred / notes

- Reminders view remains device-local (localStorage) — server-side reminder
  sync is Phase 1+ and was out of scope.
- The onboarding profile step is a compact single-page variant that reuses all
  lib/profile helpers + CHRONIC_CONDITIONS rather than embedding the full
  collapsible ProfileCard (which owns its own save button and is tuned for the
  My Health view).
- Audit endpoint intentionally does not log its own reads (log spam).
- `/api/user/me` returns 200 {user:null} instead of 401 so client probes
  don't raise error toasts.
