# SehatAI UI/UX audit (October 2026)

Branch `ui-ux-redesign` (worktree `.claude/worktrees/ui-ux-redesign`, based on `d7e3525`). Method: source review of every user-facing component, plus rendered inspection in Chromium (Playwright) at 360, 390, 768, 1024, 1440 and 1920px, as a guest, a patient, a doctor and an admin, against a throwaway local Postgres (PGlite) seeded with the repo's own synthetic seeds. Baseline screenshots are in `evidence/before/`.

Severity: **P0** safety, broken usability, major accessibility or severe mobile failure · **P1** crowding, navigation, hierarchy, forms · **P2** consistency and polish · **P3** cosmetic.

## 1. Screen inventory

The app is a single page with state-based views (`src/app/page.tsx`, Zustand `view`) plus a few real routes.

| Surface | Where | Roles | Notes |
|---|---|---|---|
| App shell: header, sidebar, mobile drawer, footer, guest banner, offline banner | `components/app/*`, `components/auth/auth-banner.tsx` | all | |
| Landing chooser | `components/auth/landing-chooser.tsx` | signed-out, not guest | |
| **Chat** (welcome, thread, composer, follow-ups, referral rails, context rail) | `components/chat/chat-view.tsx`, `message-bubble.tsx` | all | Core surface |
| Emergency overlay | `chat/emergency-overlay.tsx` | all | Full-screen takeover |
| SOS dialog | `chat/sos-button.tsx` | all | Was a chat-only floating button |
| Chat dialogs: doctor summary, image analysis, voice, first aid, symptom checker, examples, history drawer, export menu, Judge Inspector | `components/chat/*` | all | |
| Care Connect: find doctors, booking wizard, my consultations, doctor dashboard, consultation workspace | `components/care/*` | patient, doctor | |
| My Health (4 tabs: overview, records, maternal & child, privacy) | `components/my-health/*` (24 modules) | patient, guest | |
| Facilities | `components/facilities/facilities-view.tsx` | all | |
| Reminders | `components/reminders/*` | patient, guest | |
| About (incl. first aid, glossary, education library) | `components/about/*` | all | |
| Doctor Copilot (6 tabs) | `components/doctor-copilot/*` | active doctor, admin | |
| Evaluation dashboard | `components/dashboard/dashboard-view.tsx` | admin (patient/doctor via `dashboard`) | Judge-facing |
| Observability | `components/dashboard/observability-view.tsx` | admin | |
| Global search (Ctrl/⌘K) | `components/app/global-search.tsx` | all | |
| Routes: `/auth/signin`, `/auth/signup`, `/auth/doctor/signin`, `/auth/doctor/signup`, `/auth/error`, `/onboarding`, `/onboarding/doctor/pending`, `/onboarding/doctor/rejected`, `/care/checkout/result`, `/docs/legal/[slug]` | `src/app/*` | | |

## 2. Findings

### P0: safety, honesty, broken usability, accessibility

| # | Finding | Where | Evidence |
|---|---|---|---|
| P0-1 | **SOS floating button covered the Send button** on phones (`fixed bottom-24 right-4`). | `chat/sos-button.tsx` | `before/guest-chat--390.png` |
| P0-2 | **Every primary button failed WCAG AA.** White on `#059669` is 3.77:1, white on `#009b78` is 3.52:1. Brand-green links on white were 3.52:1. | `globals.css` tokens, 40+ components | contrast calc in report |
| P0-3 | **Triage badges were low contrast:** URGENT white on orange-500 is about 2.8:1, and amber chips about 2.1:1. | `chat/triage-badge.tsx`, `confidence-badge.tsx`, `drug-warning-card.tsx` | |
| P0-4 | **"Evidence-based guidance" chip on every answer**, including abstentions with `citations: []`. It claimed grounding that didn't exist. | `chat/message-bubble.tsx` | `before`/wip chat answer |
| P0-5 | **The SOS dialog said "Help is on the way"**, but SOS calls no one. It only offers tel: links and copies the location. | `chat/sos-button.tsx` | source |
| P0-6 | **Conflicting emergency numbers:** Facilities labelled `tel:1023` as "Edhi 1023". 1023 is Alkhidmat; Edhi is 115 (as the footer, SOS and overlay say). | `facilities/facilities-view.tsx` | `before/guest-facilities--1440.png` |
| P0-7 | **Doctor Copilot intake values were invisible**: `.intake-mini p { color: var(--muted) }` used a *background* token as text color. | `globals.css` | `before/doctor-doctor-copilot--1440.png` |
| P0-8 | **The Judge Inspector invented data** when fields were missing: "1240 ms" latency, an 85% confidence score, a "ROUTINE" triage level, and "Qwen 2.5 72B" / "DashScope" labels even for offline answers. | `chat/judge-inspector-modal.tsx` | source |
| P0-9 | **Broken links:** Doctor Copilot "Open Full PHR →" pushed `/my-health` and "Open consultation workspace" pushed `/care`. Neither route exists (404). | `doctor-copilot-view.tsx` | source + `ls src/app` |
| P0-10 | **Booking dialog showed the wrong doctor's data:** a fixed photo, hospital ("Punjab Institute of Cardiology") and languages for every doctor, and fixed fees (PKR 1,500/1,200/800) that contradicted the card (Dr. Tariq: card PKR 2,000, dialog PKR 1,500). | `care/care-connect-view.tsx` | source |
| P0-11 | **Synthetic clinicians were under-labelled.** Cards showed "✓ PMDC verification demo" (the check reads as *verified*). The required `DEMO / SYNTHETIC — NOT A REAL CLINICIAN` tag was missing from the cards and booking summary. | `care-connect-view.tsx` | `before/guest-care--1440.png` |
| P0-12 | **Whole views were wider than the viewport and silently clipped** (Care Connect at all widths, My Health and Dashboard on phones): `main` was a flex child without `min-w-0`. | `app/page.tsx` | clipped-element probe |
| P0-13 | **Every wide dialog was capped at 512px:** `DialogContent`'s `sm:max-w-lg` beat callers' `max-w-4xl`/`max-w-2xl`. That includes the booking wizard and the Judge Inspector. | `ui/dialog.tsx` | source |
| P0-14 | **Hand-rolled modals had no focus trap or Esc** and English-only "Close" labels: chat first aid, symptom checker, examples, SOS, mobile nav drawer, export menu. | chat, app-nav | source |
| P0-15 | **Role deep links were stripped:** `?view=observability` fell back to Chat because the guard ran while the session was `loading` (everyone looks like a guest then). | `app/page.tsx` | `before/admin-observability--1440.png` shows Chat |
| P0-16 | **SSR crash on every load:** `VoiceStatusIndicator` read `window` during render (Next's "1 Issue" badge). | `chat/voice-status-indicator.tsx` | dev log |
| P0-17 | **The "Clear profile/journal" confirm buttons used `text-destructive-foreground`**, which had no token, so they rendered dark text on red. | `my-health-view.tsx`, `globals.css` | source |

### P1: crowding, navigation, hierarchy, forms

| # | Finding | Where |
|---|---|---|
| P1-1 | The header clipped "Sign in" off-screen at 390px (seven controls). | `app-header.tsx` |
| P1-2 | The guest banner used about 140px of a phone viewport. | `auth-banner.tsx` |
| P1-3 | Emergency access was triplicated and English-only: sidebar card ("Acute medical distress?", "Rescue 1122"), drawer, footer. SOS existed only on Chat. | app-nav, footer |
| P1-4 | Chat welcome stacked three bordered cards plus a pulsing "Clinical Safety Engine Active" chip and an uppercase eyebrow. | `chat-view.tsx` |
| P1-5 | **The Symptom checker and "Try asking" examples were unreachable:** their modals existed but nothing opened them. | `chat-view.tsx` |
| P1-6 | The chat context rail was four separate cards, English-only, with a "✓" glyph used as an icon. | `chat-view.tsx` |
| P1-7 | Chat toolbar duplicates: "Copy transcript" next to an Export menu that already copies. | `chat-view.tsx` |
| P1-8 | The message action row had 8 unlabelled icons at 60% opacity (below 3:1), with the inspector placed between thumbs up and down. The timestamp showed twice. | `message-bubble.tsx` |
| P1-9 | The answer CTA strip ("Book a doctor →", "Nearby facilities") and the emergency precaution were English-only. A filled primary "Book a doctor" sat on every answer, including self-care. | `message-bubble.tsx` |
| P1-10 | URGENT referral rails were styled in emergency red. | `referral-rails.tsx` |
| P1-11 | Auth pages printed every label, button and paragraph three times (the Sign in button had three lines). | `auth/*`, `onboarding-flow.tsx` |
| P1-12 | Care Connect had two `h1`s, a marketing hero whose 3 points repeated in a 5-item "Why choose" rail, a doctor row that showed experience twice, and tabs that overflowed the header. | `care-connect-view.tsx` |
| P1-13 | Hero art was absolutely positioned over text: on Facilities "Distance Based" rendered twice and overlapped, and on Dashboard text clipped behind the shield. | facilities, dashboard, copilot |
| P1-14 | Dead controls: Facilities "Sort: Nearest First ⌄", "View on Map", "Show Map"; Dashboard "Search Categories" (toast only); My Health "See All →", "+ Add Medication", "+ Log New Symptom", "View All", "Manage", "Preventative Guidance →". | several |
| P1-15 | My Health showed a fake "85% Profile Completion" ring whose caption was a developer note ("Demo value — use actual computed completion only"). | `my-health-view.tsx` |
| P1-16 | Numbered section tabs ("1. Overview & Vitals" … "6. Audit Trail") wrapped onto two rows on Doctor Copilot. | my-health, copilot |
| P1-17 | Doctor Copilot claimed "Clinician-reviewed guidance" (no clinician review exists). | copilot |
| P1-18 | The landing chooser's doctor card said "PMDC verified" (it's a requirement), the Urdu lacked Nastaliq/RTL, and the guest path was a 12px link. | `landing-chooser.tsx` |

### P2: consistency and polish

| # | Finding |
|---|---|
| P2-1 | Two token systems (stone/emerald and navy/teal) mixed on one screen, plus 191 hardcoded hex classes. |
| P2-2 | 342 uses of 9–10px text (209 of 11px). Unreadable in Nastaliq. |
| P2-3 | The "high-fidelity" classes hardcoded `background: white`, so dark mode broke on every redesigned screen. |
| P2-4 | Heading weights were inconsistent (`font-black` heroes next to `font-bold` cards); uppercase tracked eyebrows everywhere. |
| P2-5 | The Urdu brand was spelled three ways in the UI ("سیۃ اے آئی", "سی ایچ اے آئی", "صحت اے آئی"); the assistant itself says صحت اے آئی. |
| P2-6 | Referral rails: "ایڈی" (should be ایدھی), "سندھ ہسپتال" for Indus Hospital (should be انڈس), and the Aga Khan link pointed to a third-party "charity walk" site. |
| P2-7 | 105 physical-direction classes (`ml/mr/pl/pr/text-left/right`) that don't mirror in Urdu. |
| P2-8 | Emoji and Unicode glyphs used as icons (💊 📞 📅 ⚠️ 🚨 ✓ ★ →) across about 15 components. |
| P2-9 | The search placeholder read "…glossary and topics **topics**, first aid…" (an i18n string plus an appended English suffix), and the shortcut showed ⌘K on Windows. |
| P2-10 | The emergency overlay's call cards were about 120px each, so on a phone only about 3.5 of 7 numbers showed before "Immediate actions". |
| P2-11 | Doctor sign-in/up, admin verify, consent manager and the appointment "Join call" button used white on emerald-600 (fails AA). |

### P3: cosmetic

Arrow glyphs in button labels ("Navigate →", "Proceed →"), italic `<em>` in hero titles, decorative `shadow-lg` hovers, inconsistent radii (17px, 18px, 20px).

## 3. Observed but out of scope (not changed)

- **Retrieval mismatch.** With no LLM keys, "mild dry cough and slight fever for 2 days" returned "Normal reactions after vaccination" (citation: Vaccine safety). That's pipeline/retrieval behavior, not UI, so it's reported for the backend owners.
- The doctors API strips the "TEST FIXTURE ONLY - NOT A REAL CLINICIAN" suffix and sets `isTestProfile: false` (`src/app/api/care/doctors/[id]/route.ts`, `api/doctors/route.ts`). The UI now labels every card as demo regardless, but the API behavior is unchanged.
- My Health and Doctor Copilot show sample data ("Fatima Ali") even to signed-in users. It is now labelled "Sample profile" / "Synthetic patient", but wiring real data is product work.
- The doctor pending page says you can "upload additional verification documents", but the page has no upload control.
- The URGENT referral rail lists emergency phone lines under "See a doctor today". The content choice is unchanged; only the tone changed.

## 4. Screens changed and retained

| Screen | Status | Main reasons |
|---|---|---|
| App shell (header, sidebar, drawer, footer, banners) | Changed | P0-1, P1-1–3, P0-14, P2-9 |
| Chat welcome, thread, composer, rail | Changed | P0-4, P1-4–9, P2-8 |
| Emergency overlay | Changed (layout and contrast only; same content and order) | P2-10 |
| SOS | Rebuilt as a header trigger + accessible dialog | P0-1, P0-5, P0-14 |
| Judge Inspector | Changed (data honesty, width) | P0-8, P0-13 |
| Referral rails | Changed (tone, spellings, link) | P1-10, P2-6 |
| Care Connect find/booking/consultations | Changed | P0-10–12, P1-12 |
| Facilities | Changed | P0-6, P1-13, P1-14 |
| My Health | Changed (overview, hero, tabs, dead buttons) | P1-14–16, P0-17 |
| Doctor Copilot | Changed (hero, tabs, broken links, claim) | P0-7, P0-9, P1-16, P1-17 |
| Evaluation dashboard | Changed (hero, KPI typography, fake control) | P1-13, P1-14 |
| Auth (sign in/up, doctor sign in/up, error), onboarding, doctor pending/rejected | Changed | P1-11, P2-11 |
| Landing chooser | Changed | P1-18 |
| Observability, Reminders, About, legal pages, checkout result, global search | **Retained structure.** They get the token, type, contrast, RTL and glyph fixes only, because their layouts already worked. | — |
| My Health sub-modules (24 trackers) | Retained structure; token/type/RTL passes only | — |
| Consultation workspace, video call | Retained structure; token/type/glyph passes only | Only reachable with a live consultation |
