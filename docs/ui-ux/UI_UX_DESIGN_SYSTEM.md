# SehatAI UI design system

This describes the design system as it exists in code after the October 2026 UI/UX pass (branch `ui-ux-redesign`). The source of truth is `src/app/globals.css` (tokens and shared classes) plus the shadcn primitives in `src/components/ui/`. If this document and the code disagree, the code wins. Update this file when you change it.

## 1. Direction

SehatAI is product UI (Impeccable's "Operate" mode). People come to it to get something done: describe a symptom, find a doctor, check a dashboard. The look should stay calm and familiar, and leave the patient's attention for the content.

- **One system.** Before this pass there were two token sets: shadcn stone/emerald (`#059669`) and a separate "high-fidelity" navy/teal layer (`#009b78`, hardcoded white surfaces). They are now one set. The cool navy neutrals and clinical teal-green from the approved 8-screen redesign (commit `0931225`) are the base, and the shadcn tokens point at them.
- **Red means emergency.** Red is used for emergencies, destructive actions and emergency numbers, and nowhere else. URGENT triage uses the warning (amber/orange) tone, not red.
- **Show the mechanism, honestly.** Triage level, confidence band, sources and the Judge Inspector stay visible. Labels never claim more than the system did (see "Honesty rules" below).

## 2. Color tokens

All pairs below were checked for WCAG AA (4.5:1 for text). The values are in `:root` and `.dark` in `globals.css`.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#f6f8fb` | `#0b1220` | App canvas |
| `--foreground` | `#0f2340` | `#e6edf6` | Body text, headings |
| `--card` | `#ffffff` | `#121b2c` | Surfaces |
| `--muted` | `#eef2f7` | `#1a2538` | Quiet fills, insets, tab track |
| `--muted-foreground` | `#52667f` (5.5:1) | `#9aabc3` | Secondary text |
| `--primary` | `#007a5c` (5.33:1 on white) | `#3ccf9d` | Actions, links, selection |
| `--primary-foreground` | `#ffffff` | `#04261b` | Text on primary |
| `--accent` / `--accent-foreground` | `#e3f4ee` / `#00573f` | `#133329` / `#b6f0d9` | Active nav item, selected chips |
| `--border` / `--input` | `#e1e7ef` / `#d5deea` | 10% / 16% white | Hairlines, field borders |
| `--destructive` | `#c8202f` | `#f05561` | Destructive actions |
| `--ring` | = primary | = primary | Focus outline |

**Semantic tones.** Each one has a foreground and a soft background, and they are exposed as Tailwind colors:

| Tone | Classes | Light fg / bg |
|---|---|---|
| success | `text-success bg-success-soft` | `#05674d` / `#def5ec` |
| warning | `text-warning bg-warning-soft` | `#8a4b00` / `#fdf0d9` |
| danger | `text-danger bg-danger-soft` | `#b0182a` / `#fde8ea` |
| info | `text-info bg-info-soft` | `#1f57b8` / `#e6efff` |

**Tints** (`--tint-{green,blue,violet,amber,red,pink,neutral}` with `-fg`) drive `.iconbox-*`, `.chip-*` and `.inset-*`, so those classes switch to dark mode automatically.

**Legacy aliases.** `--navy`, `--text-navy`, `--sub-navy`, `--line`, `--green-primary` and the other old names now point at the tokens above, so older markup keeps working. Don't use them in new code.

**Do not** hardcode hex colors in components (`text-[#009b78]` and similar). A codemod replaced 191 of them. Use tokens or the semantic tone classes.

### Triage colors (clinical meaning, unchanged)

| Level | Badge | Contrast |
|---|---|---|
| EMERGENCY | `bg-red-700 text-white` | 6.5:1 |
| URGENT | `bg-orange-700 text-white` | 5.2:1 |
| ROUTINE | `bg-yellow-300 text-yellow-950` | >10:1 |
| SELF_CARE | `bg-emerald-700 text-white` | 5.5:1 |
| INFORMATIONAL | `bg-info-soft text-info` (badge hidden in chat) | 5.8:1 |

The triage badge is solid. The confidence badge (`HIGH/MEDIUM/LOW`) is a soft tint, so it reads as secondary to the triage level.

## 3. Typography

- **Family:** Geist (Latin) via `next/font`, and Noto Nastaliq Urdu for Urdu (`.font-urdu`, line-height 2.1). One family for all UI text: no display fonts in labels.
- **Scale (fixed rem, no fluid type):**

| Step | Class | Size | Use |
|---|---|---|---|
| 2xs | `text-2xs` | 11px | Smallest step: chips, meta, timestamps. **Nothing renders smaller.** |
| xs | `text-xs` | 12px | Secondary text, toolbar labels |
| sm | `text-sm` | 14px | Body in dense UI, buttons, nav |
| 15px | `text-[15px]` | 15px | Chat bubbles and composer on phones |
| base | `text-base` | 16px | Card titles |
| xl / 2xl / 1.7rem | `text-xl`, `text-2xl`, `sm:text-[1.7rem]` | 20 / 24 / 27px | Page and hero titles |

- **Urdu bump:** inside `.font-urdu`, `text-2xs` becomes 13px and `text-xs` becomes 14px, because Nastaliq is illegible at Latin sizes.
- **Weights:** 400 body, 500 labels, 600 headings and buttons. `font-extrabold`/`font-black` are reserved for the emergency overlay's numbers and headings.
- **No eyebrows.** Uppercase, tracked micro-labels above headings were removed from the redesigned screens. Uppercase stays acceptable in table headers and the triage badge.
- `h1–h3` use `text-wrap: balance`. Numbers in tables and metrics use `tabular` / `tabular-nums`.

## 4. Spacing, radius, elevation

- **Spacing:** Tailwind's 4px scale. Group with 8–12px, separate sections with 20–24px (`space-y-5/6`). Page gutters are `px-4 sm:px-6`.
- **Radius:** `--radius` is 12px. Cards and dialogs use 16px (`--card-radius`, `rounded-2xl`), controls 8–12px (`rounded-lg`/`rounded-xl`), and chips and pills are fully rounded.
- **Elevation:** two levels. `--soft-shadow` for resting surfaces and `--raised-shadow` for hover and overlays, both with an offset and a soft blur. No colored glows.

## 5. Shared component classes (`globals.css`)

| Class | What it is |
|---|---|
| `.surface` | Card surface (card bg, border, 16px radius, soft shadow) |
| `.hero-banner` + `.hero-{care,hub,facility,copilot,safety}` | Page intro band with a subtle gradient (dark variants included). Padding shrinks on phones. **Lay out its children with flex. Never absolutely position art over the text** (that was the cause of the text collisions on Facilities, Dashboard and Copilot). |
| `.chip` + `.green/.red/.blue/.orange/.purple/.stroke` | 11px status pills |
| `.iconbox` + `-blue/-purple/-gold/-red/-pink/-light` | 40px tinted icon tile |
| `.inset` + `-green/-amber/-red/-blue/-violet` | Flat tinted inset (no border) |
| `.tabrow` + `.tab-custom` | **Segmented control.** A muted track with a raised active segment, that scrolls horizontally on narrow screens. The active state is `.active`, `[data-active=true]` or `[aria-selected=true]`. Use it for view-level tabs (My Health, Doctor Copilot, Care Connect, auth language switch). |
| `.doctor-row`, `.hospital-row` | List rows that stack vertically under 640px |
| `.modality-card` | Selectable option card (`.selected` = 2px primary border + accent bg) |
| `.alert-red`, `.intake-mini`, `.eval-table`, `.metric-card`, `.map`, `.callrail` | Screen-specific helpers, now token-driven |

## 6. Primitives (`src/components/ui`)

- **Button** (shadcn cva): `default` (primary), `outline`, `ghost`, `secondary`, `destructive`, `link`. Sizes are `sm` 32px, `default` 36px and `icon` 36px. In touch areas the app uses `h-9`–`h-11`/`min-h-11` (44px).
- **Dialog:** now `bg-card`, `rounded-2xl`, bounded to the viewport height with internal scroll, and a 36px close button placed with `end-3` (correct in RTL). It takes a **`closeLabel`** prop for the localized accessible name. The width default is an unprefixed `max-w-lg`, so a caller's `max-w-*` actually takes effect. Previously `sm:max-w-lg` overrode every caller and capped the booking dialog and the Judge Inspector at 512px. `DialogHeader` is start-aligned.
- **Sheet:** same `closeLabel`/`showCloseButton` props. It is used for the mobile nav drawer, which opens from the reading-start edge (left in LTR, right in Urdu).
- **DropdownMenu:** use it for any small menu (language, account, chat export). Don't hand-roll popovers: the old export menu had no outside-click, Esc or arrow-key support.
- Modals use `Dialog`/`AlertDialog`/`Sheet`. Hand-rolled `fixed inset-0` modals in chat (first aid, symptom checker, examples, SOS) were replaced so they get a focus trap, Esc and focus return.

## 7. Layout and responsive conventions

- **App shell:** sticky 56px header, a 224px sidebar from `md` up (a Sheet drawer below), `main` with **`min-w-0`** (without it, wide children pushed whole views past the viewport and the overflow was silently clipped), and a slim footer.
- **Chat:** the thread and composer sit in a centered `max-w-3xl` column (about 70 characters). The context rail appears from `xl` up.
- **Breakpoints checked:** 360, 390, 768, 1024, 1440, 1920.
- **Header at phone width:** menu, logo, search icon, language icon, **SOS**, account. Theme moves into the drawer.
- **Logical properties:** use `ms-/me-/ps-/pe-/start-/end-/text-start/text-end`. 105 physical classes were converted so Urdu mirrors. `left-1/2`-style centering is left alone on purpose.

## 8. Accessibility conventions

- Text contrast is at least 4.5:1, and UI icons that carry meaning are at least 3:1 (action icons no longer use `/60` opacity).
- The focus ring is a global `:focus-visible` 2px `--ring` outline with a 2px offset. Components may refine it but must not remove it.
- Touch targets are 36px minimum for desktop-dense controls and 44px (`min-h-11`) for primary touch actions, the composer buttons, emergency calls and form submits.
- Icon-only buttons have localized `aria-label`s. Decorative icons have `aria-hidden`.
- `prefers-reduced-motion` turns off looping animations (pulses, rings, equalizer) and shortens transitions.
- `::selection`, the caret color and scrollbars are themed from tokens.
- The chat log is `role="log" aria-live="polite"`, the emergency overlay is `role="alertdialog"`, and stream errors are `role="alert"`.

## 9. Localization conventions

- Every new string goes in `en.ts`, `ur.ts` and `roman.ts`. Strings added in this pass are in the **`ui`** namespace.
- The brand name in Urdu is **صحت اے آئی**, matching what the assistant itself says. The misspellings "سیۃ اے آئی" and "سی ایچ اے آئی" were removed.
- **Pre-auth pages** (`src/components/auth/trilingual.tsx`): `Tri`, `TriInline`, `TriStack`, `useTri()` and `AuthLanguageSwitch`. Copy follows the language preference. On "Auto", only page titles show all three languages (the other two as one quiet line), and the signup consent statement always stays trilingual.

## 10. Honesty rules for UI copy (clinical and demo)

- Never label an answer "evidence-based" or "verified" unless that answer actually has sources. The always-on "Evidence-based guidance" chip was removed for this reason: it also showed on abstentions with `citations: []`.
- Demo doctors carry **"Demo / synthetic — not a real clinician"** on the card and in the booking summary, with a `DEMO / SYNTHETIC — NOT A REAL CLINICIAN` notice above the list.
- A label must match the number it dials (`1023` is Alkhidmat, `115` is Edhi).
- The SOS dialog states that it does not place a call by itself.
- Don't ship controls with no handler. Remove them or wire them to the real destination.
