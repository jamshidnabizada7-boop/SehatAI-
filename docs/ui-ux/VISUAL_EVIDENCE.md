# Visual evidence

Real screenshots from Chromium (Playwright), not mockups. All data is synthetic (repo seeds and demo fixtures).

- `evidence/before/`: baseline, captured on 2026-10-23 before any change, from the dev server at commit `d7e3525`.
- `evidence/after/`: after the redesign, captured from a **production build** (`next build --webpack` + `next start`).

File names are `<screen>--<width>.png`. Widths: 1920, 1440, 1024, 768, 390, 360 (chat) and 1440/768/390 (other views).

## How the "after" set was produced, and its limits

| Group | Source | Notes |
|---|---|---|
| Public pages (`landing`, `auth-*`, `legal-privacy`, `checkout-result`) and guest views (`guest-*`) | Final production build | Final code |
| `flow-*` (chat answer, Judge Inspector, emergency overlay) | Final production build | Answers come from the offline deterministic engine (no LLM keys in this environment). |
| `qa-*` (SOS dialog, mobile drawer, Urdu/RTL, dark mode, Facilities images) | Final production build | |
| `role-patient-*`, `role-doctor-*`, `role-admin-*`, `role-onboarding-*` | Dev server, signed in against a throwaway local Postgres (PGlite) | Taken **before** the last polish edits (legal-page measure, consent inset, landing icon row, `text-wrap: pretty`, Copilot name wrap, eval-table header alignment). The system stopped the throwaway database for low memory before a final signed-in re-capture, so these could not be retaken. |

Every "after" capture was checked for horizontal overflow and for elements clipped inside `main`. All of them report `overflowX=0 clipped=0`.

## Key before/after pairs

| Issue | Before | After |
|---|---|---|
| SOS button covering Send on phones; header clipping "Sign in"; 140px guest banner | `before/guest-chat--390.png` | `after/guest-chat--390.png`, `after/qa-sos-390.png` |
| Chat welcome crowding; English-only rail | `before/guest-chat--1440.png` | `after/guest-chat--1440.png` |
| Answer card: "Evidence-based guidance" chip, low-contrast badges, unlabelled actions | (wip only) | `after/flow-chat-answer--1440.png`, `--390.png` |
| Emergency overlay: only about 3.5 of 7 numbers visible on a phone | (overlay not in baseline set) | `after/flow-emergency-overlay--390.png` |
| Judge Inspector capped at 512px, with invented latencies | n/a | `after/flow-judge-inspector--1440.png` (672px, measured values or "Not reported") |
| Care Connect clipped header and rail; weak demo labelling | `before/guest-care--1440.png`, `--390.png` | `after/guest-care--1440.png`, `--390.png` |
| Facilities hero text collision; "Edhi 1023" | `before/guest-facilities--1440.png` | `after/guest-facilities--1440.png`, `after/qa-facilities-1440.png` |
| My Health fake 85% ring, numbered tabs | `before/guest-my-health--1440.png` | `after/guest-my-health--1440.png` |
| Doctor Copilot invisible intake values, 2-row numbered tabs | `before/doctor-doctor-copilot--1440.png` | `after/role-doctor-doctor-copilot--1440.png` |
| Dashboard hero text clipped behind art; mobile clipping | `before/admin-dashboard--1440.png`, `--390.png` | `after/role-admin-dashboard--1440.png`, `--390.png` |
| `?view=observability` fell back to Chat | `before/admin-observability--1440.png` | `after/role-admin-observability--1440.png` (lands on Observability, caught while metrics load) |
| Auth pages printing every label three times | `before/auth-signin--1440.png` | `after/auth-signin--1440.png`, `--390.png` |
| Landing chooser | `before/landing--1440.png` | `after/landing--1440.png`, `--390.png` |
| Onboarding overflow at 390 | `before/onboarding--390.png` (19px overflow) | `after/role-onboarding--390.png` |
| Urdu: Nastaliq blocked by the CSP in production | n/a (dev did not enforce the CSP) | `after/qa-urdu-chat-1440.png`, `-390.png`, `after/qa-urdu-signin-390.png` |
| Dark mode on the redesigned screens (white surfaces before) | n/a | `after/qa-dark-*.png` |
| Cancelled checkout shown with a success check | `before/checkout-result--1440.png` | `after/checkout-result--1440.png` |
| Legal pages at about 108 characters per line | `before/legal-privacy--1440.png` | `after/legal-privacy--1440.png` |
