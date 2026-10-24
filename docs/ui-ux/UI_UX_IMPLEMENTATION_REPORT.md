# UI/UX implementation report

- **Branch:** `ui-ux-redesign`, in worktree `D:\SehatAI-UNIFIED\.claude\worktrees\ui-ux-redesign`, created from `d7e3525` (HEAD of `production-activation`).
- **Scope of the diff:** 113 tracked files changed (+2,888 / −2,893 lines) plus the new `docs/ui-ux/` folder. **Nothing is committed**, per CLAUDE.md's "commit only when asked".
- **Main checkout:** untouched. Its uncommitted script, CI and docs changes from another session were left exactly as found. Nothing was pushed or deployed.

Companion documents: [UI_UX_AUDIT.md](UI_UX_AUDIT.md) (findings and severities), [UI_UX_DESIGN_SYSTEM.md](UI_UX_DESIGN_SYSTEM.md) (tokens and conventions), [VISUAL_EVIDENCE.md](VISUAL_EVIDENCE.md) (screenshots).

## 1. What changed

### Design system (foundation)

- **`src/app/globals.css`**
  - One token set replaces the two parallel systems.
  - Every text pair is AA-checked. Primary `#007a5c` gives white text 5.33:1; the old `#059669`/`#009b78` gave 3.77/3.52:1.
  - Added semantic `success/warning/danger/info` tones, a tint scale, and dark values for everything.
  - All "high-fidelity" classes (`.surface`, `.chip-*`, `.iconbox-*`, `.inset-*`, `.hero-*`, `.tabrow`, `.doctor-row`, …) now use tokens, so dark mode works on the redesigned screens.
  - `.tabrow` is now a segmented control that scrolls on phones.
  - Rows stack under 640px.
  - Fixed the `.intake-mini p { color: var(--muted) }` bug (it set a background token as the text color).
  - Added the `text-2xs` 11px type floor with an Urdu size bump; a `prefers-reduced-motion` block; themed selection, caret, scrollbar and focus ring; and `destructive-foreground`.
- **Codemods** (scripts kept out of the repo):
  - 551 sub-11px sizes became `text-2xs`.
  - 191 hardcoded hex classes became tokens.
  - 105 physical direction classes became logical ones (`ms/me/ps/pe/text-start/end`).
  - 10 white-on-emerald buttons moved to the primary token.
- **Primitives:**
  - `ui/dialog.tsx`: `closeLabel` prop, a 36px close target placed with `end-3`, viewport-bounded height, start-aligned header. The width default is now unprefixed, which fixes every wide dialog being capped at 512px.
  - `ui/sheet.tsx`: `closeLabel`/`showCloseButton`, RTL-safe close.
- **Fonts:** Noto Nastaliq Urdu is now self-hosted via `next/font` (`app/layout.tsx`). The CSS `@import` from Google Fonts was being **blocked by the production CSP**, so Urdu never rendered in Nastaliq in production. `theme-color` now follows light/dark.
- **i18n:** a new `ui` namespace (49 keys) in `en.ts`, `ur.ts` and `roman.ts`. The Urdu brand name is unified to "صحت اے آئی". The UI had used two misspellings; the assistant's own replies already used this form.

### App shell

- **Header** (`app-header.tsx`):
  - SOS lives here on every view and width.
  - Fits at 360px, with the theme toggle moved to the drawer.
  - The search placeholder bug ("topics topics") is fixed.
  - Ctrl K vs ⌘K by platform.
  - Sign in is secondary (the banner owns the primary CTA) and is hidden on `/auth/*`.
  - Role badge is quieter.
- **Nav** (`app-nav.tsx`):
  - Sidebar active state uses `accent`.
  - Doctor Copilot gets its own icon (it shared Care Connect's).
  - A compact, translated "Call Rescue 1122" link.
  - The **mobile drawer is rebuilt on Sheet**: focus trap, Esc, focus return, and it opens from the start edge in RTL. Includes theme, call and account.
- **Footer:** one line on desktop, two compact lines on phones, translated labels.
- **Guest banner:** one row on phones, dismissal remembered for the session (via `useSyncExternalStore`).
- **`app/page.tsx`:**
  - `main` gets `min-w-0`, which fixes whole views being wider than the viewport and silently clipped.
  - The view guard waits for the session before judging role-only deep links. Rendering stays gated by `safeView`, so no access is loosened.

### Chat and safety surfaces

- **`chat-view.tsx`:**
  - Thread and composer sit in a 3xl measure.
  - The welcome screen loses the eyebrow chip and card-in-card.
  - **The Symptom checker and "Try asking" examples are now reachable** (their dialogs existed with no trigger).
  - The three hand-rolled modals are now `Dialog`s.
  - The right rail is one translated panel.
  - The duplicate "Copy transcript" button is gone (Export already does it).
  - The composer placeholder is shortened on touch devices and the empty textarea no longer shows scroll arrows.
- **`message-bubble.tsx`:**
  - **Removed the always-on "Evidence-based guidance" chip** (it also appeared on abstentions with no sources).
  - Translated emergency precaution and CTAs. A filled "Talk to a doctor" appears only on URGENT answers.
  - Icons replace the emoji in offline chips.
  - Single timestamp.
  - Grouped action row at full contrast with 36px targets.
  - Labelled "How this answer was checked" inspector button.
  - Avatar hidden on phones.
- **`triage-badge.tsx` / `confidence-badge.tsx`:** AA-passing fills with the 4-level color meaning unchanged. Confidence is a soft secondary pill.
- **`emergency-overlay.tsx`:** the 1122 card stays the large primary; the other numbers are compact, so all 7 and the first steps fit on a 390px phone. Same content and order, `red-700` base, and the arrow glyph removed.
- **`sos-button.tsx`:**
  - Header trigger instead of the floating button that covered Send.
  - Radix `Dialog` with `DialogTrigger`, so focus returns.
  - Translated.
  - **Removed "Help is on the way"**; it now says plainly that SOS does not call anyone.
- **`judge-inspector-modal.tsx`:** shows only reported values. Before, it invented "1240 ms", an 85% confidence, a "ROUTINE" triage level, and Qwen/DashScope labels even for offline answers.
- **`referral-rails.tsx`:**
  - URGENT uses the warning tone (red stays for emergencies).
  - Urdu spellings fixed (ایدھی, انڈس).
  - The Aga Khan link now goes to `hospitals.aku.edu` instead of a third-party "charity walk" page.
- **`chat-export-menu.tsx`:** rebuilt on `DropdownMenu`, with brand spelling fixed.
- **`voice-status-indicator.tsx`:** fixed an SSR crash (`window` read during render).
- **`drug-warning-card.tsx`:** full tinted border instead of a 4px side stripe, and Urdu alignment fixed.

### Feature views

- **Care Connect:**
  - Single `h1`, a segmented tab control, and a compact intro band.
  - The duplicated trust rail is cut to the non-duplicate items.
  - **Every demo doctor is tagged "Demo / synthetic — not a real clinician"**, with a `DEMO / SYNTHETIC — NOT A REAL CLINICIAN` notice above the list. "✓ PMDC verification demo" became "PMDC · demo".
  - The doctor row shows experience once, uses icons instead of glyphs, and stacks on phones.
  - **The booking dialog now shows the selected doctor's own photo, hospital, languages and fees.** It used fixed values for every doctor, which contradicted the card. It also renders at its intended width, uses a radio-group modality picker and an `<ol>` stepper, and no longer has a fake "Back to profile" link.
  - Better empty state for My consultations.
- **Facilities:** hero laid out with flex (no art over text); **"Edhi 1023" corrected to "Alkhidmat 1023"** in both places; removed three dead controls (Sort, View on Map, Show Map); token surfaces; `aria-pressed` category pills.
- **My Health:** removed the fake "85% Profile Completion" ring and its leaked developer note; un-numbered tabs; calmer vitals; **six dead buttons wired** (to Reminders, the symptom journal, or a pre-filled chat question).
- **Doctor Copilot:** hero laid out with flex; "Clinician-reviewed guidance" changed to "Guidance for clinician review"; "Synthetic patient" tag; **two links that went to non-existent routes fixed** (`/my-health` button removed, `/care` changed to the Care view); un-numbered, shorter tab labels; side stripe removed.
- **Evaluation dashboard:** hero laid out with flex; the "100%" box demoted from a black-weight hero metric (sample labels kept); consistent KPI tiles; removed the toast-only "Search Categories" button; table headers start-aligned.
- **About:** pipeline arrow drawn as an icon; flat insets instead of card-in-card.
- **Auth and onboarding** (`trilingual.tsx`, `auth-shell.tsx`, sign in/up, doctor sign in/up, error, onboarding):
  - Copy now follows the chosen language, with an English / اردو / Roman switch on every auth page. "Auto" keeps the trilingual title, and the consent statement stays trilingual. Before, every label and button was printed three times.
  - Validation errors are localized.
  - Token colors; consent as a flat inset; Urdu "Female" corrected to عورت.
- **Landing chooser:** Nastaliq and RTL on the Urdu lines; "PMDC verified" changed to "PMDC verification required"; the guest path is a real 44px button; arrows mirror in RTL; icon beside the heading.
- **Checkout result:** a cancelled checkout shows a neutral warning icon instead of a green check; "Return to Care Connect" goes to Care (it went to Chat).
- **Legal pages:** about 70-character reading measure, 15px body, article in the page flow instead of a card.

## 2. What was deliberately not changed

- No clinical logic, triage thresholds, classifiers, prompts, pipeline code, API routes, Prisma schema or services. The only non-UI edits are presentational: i18n strings, `layout.tsx` fonts and theme color, and the `page.tsx` guard timing and `min-w-0`.
- Emergency overlay content and order, triage level meanings and colors, emergency numbers, and the consent text.
- Sample data in My Health and Doctor Copilot. It is now labelled rather than replaced.
- Screens whose structure already worked keep it (Observability, Reminders, About sub-sections, My Health trackers, consultation workspace, video call). They get only the system-level fixes.

## 3. Functional compatibility notes

- `trilingual.tsx` keeps its exports (`TriInline`, `TriStack`, `TriStrings`) and adds `Tri`, `useTri` and `AuthLanguageSwitch`. `TriStack`'s `size` prop is accepted but no longer used.
- `ContinueAsGuestLink.label` now accepts a `ReactNode`.
- `SosButton` takes an optional `className` and is rendered by `AppHeader`, no longer by `ChatView`.
- `DialogContent`/`SheetContent` accept a new optional `closeLabel` (default "Close"). A `DialogContent` given `sm:max-w-*` behaves as before. A plain `max-w-*` now actually applies; the booking dialog, Judge Inspector and symptom journal relied on that.
- Tests import only `formatCitationMarkers` and `matchesFirstAidQuery` from components, and both are unchanged.

## 4. Verification performed (actual results)

| Check | Result |
|---|---|
| `bunx tsc --noEmit` | Pass, 0 errors |
| `bunx eslint src` | Pass, 0 problems. Three `set-state-in-effect` errors I introduced along the way were fixed with `useSyncExternalStore`. |
| `bun test tests/tests/safety/` with the throwaway DB running | **613 pass, 0 fail** |
| Same suite after the DB was stopped (final code) | 607 pass, 6 fail. The 6 are the DB-backed tests listed in CLAUDE.md (O mirror, X4, X5, X6): `Can't reach database` |
| `bun test tests/care/care-unit.test.ts` | 37 pass, 0 fail |
| `bunx next build --webpack` | Pass ("Compiled successfully", 119/119 static pages) |
| Impeccable detector, source (`detect src`, 342 files) | 0 findings after fixes (2 side-stripes and 1 bounce found and fixed) |
| Impeccable detector, rendered pages (6 URLs, production build) | First run: 13 findings (legal line length, 2 nested cards, 1 tiny text, 2 icon-tile stacks). Re-run after the fixes: **1 finding**, a two-line 12px "DRAFT — counsel review required" callout on the legal page at about 110 characters. Left as is: it's a short warning box, not body prose. Legal body text is capped at 62ch. |
| Overflow and clipping probe (every capture, all roles and widths) | `overflowX=0 clipped=0` everywhere. The baseline had 19px page overflow on 3 screens plus whole-view clipping on Care Connect, My Health and Dashboard. |
| Interaction QA (production build) | SOS: opens, Esc closes, focus returns to the SOS button. Mobile drawer: opens, Esc closes. Urdu: `dir=rtl`, Nastaliq renders. Facility images: all load. Sidebar navigation: all six patient views switch, one `h1` each. Chat answer: `/api/chat` 200, SELF-CARE triage. Emergency message: `alertdialog` overlay shown. Judge Inspector: 672px wide. Page errors: none. |
| Console | The CSP font error is gone. Remaining: guest-mode 401s from `/api/care/favorites`, `/api/gamification`, `/api/health-sync` and `/api/appointments` (pre-existing: components fetch signed-in APIs as guests), and one 500 from `/api/care/doctors` after the DB stopped (the UI falls back to labelled demo doctors). |

Not verified: screen-reader announcement order with a real AT; Safari or Firefox rendering; real Android keyboard behavior; the consultation workspace and video call (no live consultation in this setup); and the doctor-dashboard tab inside Care Connect.

## 5. Environment notes for whoever continues

- **Dev server in the worktree:** Next 16's Turbopack picks `D:\SehatAI-UNIFIED\bun.lock` as the workspace root, so from inside `.claude/worktrees/…` it compiles the **main checkout's** source. Use `next dev --webpack` or `next build --webpack` in the worktree (or set `turbopack.root`). The main checkout is unaffected.
- **The PWA service worker caches dev chunks** (`/_next/static/chunks/app/page.js` isn't content-hashed in dev). After a mid-write HMR it kept serving a broken chunk ("Invalid or unexpected token"). Unregister it when testing in dev. Production chunk names are hashed.
- **The webpack dev watcher scans all of `D:\`** (errors on `D:\pagefile.sys`), which slowed dev compiles and static assets to 30s+. Production builds don't have this problem.
- The local verification database was a PGlite instance in the session scratchpad (port 5544), seeded with the repo's seeds plus one synthetic local admin (`admin.local@sehatai.local`). The system stopped it for low memory. Nothing was written to any shared database. The worktree's `.env` is gitignored and points only at that throwaway DB.

## 6. Remaining limitations and recommendations

1. **Retrieval mismatch** (backend): "mild dry cough and fever" retrieves "Normal reactions after vaccination" in offline mode. Flag for the pipeline owners.
2. Guest-mode 401 calls: My Health and Care components call signed-in APIs for guests. Guard the calls by session.
3. The doctors API strips the "NOT A REAL CLINICIAN" suffix and sets `isTestProfile: false`. The UI now labels all cards, but the API should keep the flag.
4. The doctor pending page promises document upload without an upload control.
5. Many inner My Health tracker modules and Doctor Copilot sub-tabs still contain English-only strings. The shared shell, chat, auth and safety surfaces are now trilingual, but full trilingual coverage of the tracker modules is a separate content task.
6. About 16 MB of PNG evidence sits under `docs/ui-ux/evidence/`. Consider excluding it from the repo, or compressing it, before committing.
