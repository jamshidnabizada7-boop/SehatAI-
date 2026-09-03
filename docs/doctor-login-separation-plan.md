# SehatAI — Doctor / Patient Identity Separation
## Implementation Plan (DOCUMENT — NOT CODE)

**Owner:** Z.ai Code
**Status:** PROPOSED — awaiting approval before any code changes
**Scope:** Split the single `/auth/signin` flow into two role-distinct surfaces (Patient Portal vs Doctor Portal), enforce role-based navigation, expand doctor-only features, and harden the authorization boundary on every API.

---

## 1. Executive Summary & Recommendation

### The problem today
- One shared `/auth/signin` page handles **everyone** — patients, doctors, admins.
- The `User.role` field (`user | doctor | admin`) already exists in the schema, but it is **invisible to the user** at login time and is only set by an admin via `POST /api/admin/promote`.
- The **Doctor Copilot** view is shown in the nav to *every* user — including guests and ordinary patients. This is unsafe (it shows mock patient lists and SOAP drafts) and confusing UX.
- Patients see features designed for clinicians, and clinicians have no way to land directly in a doctor-first workspace.
- There is no PMDC (Pakistan Medical & Dental Council) verification step, no doctor-only signup, no doctor-specific onboarding.

### Recommendation
Build **two parallel identity surfaces** that share the same `User` table and NextAuth credentials provider, but diverge in three places:

1. **Distinct entry routes** — `/auth/signin` (patient) and `/auth/doctor/signin` (doctor), with parallel signup routes and a chooser/landing screen.
2. **Role-aware post-login redirect** — patients land on the Chat view; doctors land on the Doctor Copilot dashboard; admins land on the Eval/Observability dashboard.
3. **Role-gated navigation + API authorization** — `Doctor Copilot`, `Observability`, and doctor-only APIs become hidden + server-enforced for non-doctors. Patient-only trackers (`My Health`, `Reminders` personal-use) become hidden for doctors.

PMDC verification becomes a **manual admin-approval workflow** in v1 (so we don't block on a third-party API contract), with an automated PMDC lookup as a Phase 2 upgrade.

---

## 2. Current State Assessment

| Area | Today | Gap |
|---|---|---|
| `User.role` | Exists (`user \| doctor \| admin`) | Set only by admin promote API; never chosen by the user |
| Login route | `/auth/signin` (one form) | No doctor-specific route, no role chooser |
| Signup route | `/auth/signup` (patient only) | No `/auth/doctor/signup`; no PMDC field |
| Nav | `app-nav.tsx` filters only `adminOnly` items | Doctor Copilot visible to **everyone**; no `doctorOnly` flag |
| Doctor Copilot | Renders mock patients + UI safety framing | Needs role gate, real patient consent wiring, expanded tooling |
| `requireUser()` | Returns `{ id, email, role }` | No `requireDoctor()` / `requireAdmin()` helpers |
| `/api/doctor/*` | Anyone authenticated can call | No role check on `patients` or `soap-note` |
| Onboarding | `/onboarding` collects Urdu consent + profile | No doctor onboarding (PMDC #, specialty, facility) |
| Audit log | Captures `auth.login` | Should capture role at login time + `doctor.signup`, `doctor.verified` |

---

## 3. Guiding Principles

1. **Same table, two surfaces.** No separate `Doctor` table; just `User.role` + a new `DoctorProfile` extension table. Keeps auth simple.
2. **Defense in depth.** Hide nav items **and** enforce role server-side on every API. UI hiding alone is not a security boundary.
3. **Doctor-first for doctors.** When a doctor logs in, the default view is the Doctor Copilot dashboard, not the patient chat. Patient trackers are hidden.
4. **PMDC trust, don't fake it.** A doctor account is **not active** until an admin verifies the PMDC number. Until then, the account is in `pending` state and only sees a "verification pending" screen.
5. **No role escalation from the client.** Role transitions (`user → doctor`, `doctor → admin`) only happen server-side, via admin action or PMDC verification — never via a client-side form field.
6. **Backwards-compatible.** Existing users keep working. Existing `doctor`-role accounts (if any) are migrated to the new flow without forcing a re-login.

---

## 4. Architecture: Three Surfaces

```
                       ┌──────────────────────────┐
                       │  / (landing — public)    │
                       │  "Are you a patient or   │
                       │   a doctor?" chooser    │
                       └─────────────┬────────────┘
                                     │
              ┌──────────────────────┴──────────────────────┐
              │                                             │
   ┌──────────▼──────────┐                     ┌────────────▼───────────┐
   │ PATIENT SURFACE     │                     │ DOCTOR SURFACE         │
   │ /auth/signin        │                     │ /auth/doctor/signin    │
   │ /auth/signup        │                     │ /auth/doctor/signup    │
   │ /onboarding (patient)│                    │ /onboarding/doctor     │
   │ Default view: chat  │                     │ Default view: copilot  │
   └──────────┬──────────┘                     └────────────┬───────────┘
              │                                             │
              └──────────────────┬──────────────────────────┘
                                 │
                       ┌─────────▼─────────┐
                       │  ADMIN SURFACE    │
                       │  (role = admin)   │
                       │  /admin/* routes   │
                       │  + promote + audit│
                       └───────────────────┘
```

All three surfaces use the **same** NextAuth credentials provider and the **same** `User` table. The divergence is in route, onboarding flow, default landing view, and feature visibility.

---

## 5. Data Model Changes (Prisma)

### 5.1 Extend `User.role` semantics
```prisma
role  String  @default("user")   // user | doctor | admin
accountStatus  String @default("active")
// accountStatus: active | pending_verification | suspended | deleted
```
- New doctor signups land as `role=doctor` + `accountStatus=pending_verification`.
- After admin PMDC check, admin sets `accountStatus=active` and writes an audit row.

### 5.2 New `DoctorProfile` model
```prisma
model DoctorProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  pmdcNumber      String   @unique              // Pakistan Medical & Dental Council #
  pmdcVerifiedAt  DateTime?                      // null = not yet verified
  pmdcVerifiedBy  String?                        // admin userId
  specialty       String                         // e.g. "Cardiology", "Family Medicine"
  subSpecialty    String?
  facilityName    String?
  facilityCity    String?
  yearsExperience Int?
  languages       String   @default("[]")       // JSON array: ["en","ur"]
  consultationFee Int?                           // PKR, optional
  bio             String?                         // short, for patient-facing directory
  avatarUrl       String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@index([pmdcNumber])
}
```

### 5.3 New `DoctorVerificationDoc` model (uploaded evidence)
```prisma
model DoctorVerificationDoc {
  id          String   @id @default(cuid())
  doctorProfileId String
  doctorProfile DoctorProfile @relation(fields: [doctorProfileId], references: [id], onDelete: Cascade)
  docType     String   // pmdc_card | cnic | degree | experience_letter
  fileUrl     String   // stored under /uploads (local disk in v1; S3 in prod)
  uploadedAt  DateTime @default(now())
  reviewedAt  DateTime?
  reviewedBy  String?  // admin userId
  status      String   @default("pending") // pending | approved | rejected
  notes       String?
}
```

### 5.4 New `PatientConsentForDoctor` model (consent boundary for patient data)
```prisma
model PatientConsentForDoctor {
  id           String   @id @default(cuid())
  patientId    String
  doctorId     String
  grantedAt    DateTime @default(now())
  revokedAt    DateTime?
  scope        String   @default("read_history") // read_history | soap_draft | follow_up
  @@unique([patientId, doctorId, scope])
  @@index([doctorId])
}
```
> This makes the existing `/api/doctor/patients` endpoint consent-aware — a doctor only sees patients who have explicitly granted them access (or who have an active consultation).

---

## 6. Identity & Registration Flow

### 6.1 Public landing page chooser (`/`)
The current `/` already routes authenticated users into the app. Add an **unauthenticated** chooser on the auth landing:

| Option | Goes to | Visual treatment |
|---|---|---|
| "I am a patient" | `/auth/signin` (existing) + signup link | Warm teal palette, family/patient imagery |
| "I am a doctor" | `/auth/doctor/signin` + signup link | Clinical palette (slate + emerald), stethoscope icon, "PMDC verification required" badge |
| "Continue as guest" | Existing guest flow (unchanged) | — |

### 6.2 Patient signup (`/auth/signup`) — minimal change
Keep existing. Add a hidden `intendedRole=user` field so the server never trusts a client-supplied role upgrade.

### 6.3 Doctor signup (`/auth/doctor/signup`) — NEW
Fields:
- Full name
- Email + password (8+)
- **PMDC registration number** (validated format: `^[A-Z]{2,4}-\d{4,6}$` e.g. `PMC-12345`)
- Specialty (select from PMDC list)
- Sub-specialty (optional)
- Primary facility name + city
- Years of experience
- Languages spoken (multi-select)
- Upload: PMDC card photo + CNIC photo + medical degree photo
- Consent checkbox: doctor-specific consent (data handling, SOAP note authorship responsibility, no SaMD liability)
- Retention preference

On submit:
1. Create `User` with `role=doctor`, `accountStatus=pending_verification`.
2. Create `DoctorProfile` (PMDC #, specialty, etc.).
3. Store uploaded docs as `DoctorVerificationDoc` rows.
4. Sign the user in **but** redirect them to `/onboarding/doctor/pending` (a screen that says "Verification in progress — typically 24–48 hours").
5. Fire audit event `doctor.signup`.
6. (Optional) Send admin a notification (in-app toast + push).

### 6.4 Doctor signin (`/auth/doctor/signin`) — NEW
- Same credentials form as patient, but visually branded for doctors.
- After successful `signIn('credentials', ...)`:
  - Fetch `/api/user/me` to read `role` + `accountStatus`.
  - If `role !== 'doctor'` → show error "This login is for verified doctors. Use the patient login."
  - If `role === 'doctor'` but `accountStatus === 'pending_verification'` → redirect to `/onboarding/doctor/pending`.
  - If `accountStatus === 'suspended'` → redirect to `/auth/error?reason=suspended`.
  - Otherwise → redirect to `/?view=doctor-copilot` (or a dedicated doctor home).

### 6.5 Patient signin (`/auth/signin`) — minor change
After login, if the user turns out to be `role=doctor` (they used the patient form), redirect them to the Doctor Portal with a toast: "Redirected to Doctor Portal."

---

## 7. PMDC Verification Workflow (Pakistan-specific)

```
Doctor signs up ──▶ accountStatus = pending_verification
                              │
                              ▼
                  Admin opens /admin/doctor-verifications
                  ├─ Reviews uploaded PMDC card + CNIC + degree
                  ├─ (Optional v1) Manual PMDC website lookup
                  └─ Approve / Reject
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
       accountStatus = active       accountStatus = suspended
       pmdcVerifiedAt = now          audit: doctor.rejected
       audit: doctor.verified        (doctor sees rejected screen)
```

### Phase 2 (future)
- Automated PMDC verification via the PMDC online register (https://pmdc.org.pk/) — requires scraping or an official API contract (none exists publicly today).
- For v1, manual verification is acceptable. The audit trail + uploaded docs provide the legal trail.

---

## 8. Role-Based Routing & Navigation Reorganization

### 8.1 Nav item flags (`app-nav.tsx`)
Extend `NavItem` with two new booleans:

```ts
interface NavItem {
  view: View;
  icon: ...;
  labelKey: LabelKey;
  adminOnly?: boolean;
  doctorOnly?: boolean;     // NEW
  patientOnly?: boolean;    // NEW
  requireActiveDoctor?: boolean; // NEW — requires role=doctor AND accountStatus=active
}
```

### 8.2 Updated nav matrix

| Nav item | Guest | Patient (`role=user`) | Doctor (`role=doctor`, active) | Admin |
|---|---|---|---|---|
| Chat | ✅ | ✅ | ✅ (read-only for patient context) | ✅ |
| Reminders | ✅ (local) | ✅ | ❌ hidden | ✅ |
| Facilities | ✅ | ✅ | ✅ | ✅ |
| My Health | ✅ (guest local) | ✅ | ❌ hidden (doctors don't track their own sleep) | ✅ |
| **Doctor Copilot** | ❌ hidden | ❌ hidden | ✅ (default view) | ✅ |
| Dashboard (eval) | ❌ | ❌ | ❌ | ✅ |
| Observability | ❌ | ❌ | ❌ | ✅ |
| About | ✅ | ✅ | ✅ | ✅ |
| **Doctor Verifications** (new) | ❌ | ❌ | ❌ | ✅ |
| **My Patients** (new) | ❌ | ❌ | ✅ | ✅ |

### 8.3 Server-side view guard
`/api/eval/access` already exists for the dashboard passcode. Add a parallel guard pattern:

- `GET /api/auth/session-role` → `{ role, accountStatus, pmdcVerified }` (used by client for nav filtering).
- Every `/api/doctor/*` route calls `requireDoctor()` (new helper).
- Every `/api/admin/*` route calls `requireAdmin()` (new helper).
- `/api/user/me`, `/api/profile` etc. continue to use `requireUser()`.

---

## 9. Doctor Portal Feature Set (NEW + EXPANDED)

The Doctor Copilot becomes the **Doctor Portal**, expanded from a stub into a real workspace. Add a left-sub-nav inside the Doctor Copilot view:

### 9.1 Patient Roster (`My Patients`)
- List of patients who have granted consent (via `PatientConsentForDoctor`).
- Search by name, condition, last-visit date.
- Per-patient row: latest triage, last conversation date, open follow-ups.

### 9.2 Patient Detail View
- Conversation history (consented only).
- Health summary card (read-only mirror of patient's profile).
- Outcome entries (T+24h/72h/7d) — doctor can mark "resolved" / "escalated".
- **AI-drafted SOAP note** (existing `/api/doctor/soap-note`) — every claim links to source message.

### 9.3 Drug-Interaction Checker (Pro)
- Bulk-enter a patient's medication list → cross-check against `drug-interactions.ts`.
- Severity-filtered output.

### 9.4 Differential Explorer
- 3-tier differentials (already prototyped in `differential-card.tsx`) — make it doctor-only and live.

### 9.5 Follow-up Scheduler
- Doctor sets follow-up cadence; writes `OutcomeEntry` rows; patient sees them in Reminders.

### 9.6 Audit Trail Viewer
- Doctor can see their own audit trail (PHI reads, SOAP drafts, overrides).

### 9.7 FHIR Export (existing `/api/fhir/[resource]`)
- Doctor-only button: "Export patient summary as FHIR Bundle" — downloads JSON.

### 9.8 WHO SMART DAK Decision Support (existing `src/data/who-smart-dak.ts`)
- Doctor-only surface: 14 decision tables surfaced as quick-reference cards.

---

## 10. Patient Portal Feature Set (what's HIDDEN for doctors)

Doctors do **not** see:
- My Health trackers (sleep, hydration, nutrition, mental-health screening, child vaccine, maternal, chronic disease, air quality, family health, medical calculators)
- Personal reminders (med/vax/anc) — these are patient-facing
- Symptom checker wizard (patient intake)
- First-aid cards (patient self-care)
- Onboarding (patient consent flow)

Doctors **do** see:
- Chat (read-only patient context)
- Facilities (referral directory — useful for them)
- Doctor Portal (default)
- About (health education library — useful as patient handouts)

---

## 11. API Authorization Matrix

| Endpoint | user | doctor | admin | guest |
|---|---|---|---|---|
| `POST /api/chat` | ✅ | ✅ (doctor context) | ✅ | ✅ (limited) |
| `GET/POST /api/profile` | ✅ own | ✅ own | ✅ | ❌ |
| `GET/POST /api/reminders` | ✅ own | ❌ (hidden) | ✅ | ✅ local |
| `GET /api/doctor/patients` | ❌ 403 | ✅ (consented) | ✅ | ❌ |
| `POST /api/doctor/soap-note` | ❌ 403 | ✅ | ✅ | ❌ |
| `POST /api/admin/promote` | ❌ 403 | ❌ 403 | ✅ | ❌ |
| `GET /api/admin/doctor-verifications` | ❌ | ❌ | ✅ | ❌ |
| `POST /api/admin/verify-doctor` | ❌ | ❌ | ✅ | ❌ |
| `GET /api/eval/results` | ❌ | ❌ | ✅ | ❌ |
| `GET /api/observability/metrics` | ❌ | ❌ | ✅ | ❌ |
| `GET /api/lhw/dashboard` | ❌ | ✅ (if LHW role) | ✅ | ❌ |

New helpers to add in `src/lib/auth.ts`:
```ts
export async function requireDoctor(): Promise<{ id, email, role, doctorProfile }>
export async function requireAdmin(): Promise<{ id, email, role }>
export async function requireActiveDoctor(): Promise<...> // role=doctor AND accountStatus=active
```

---

## 12. UI/UX Changes

### 12.1 Landing chooser (`/` unauthenticated state)
A two-card hero:
- Card A: "I'm a patient / मैं मरीज़ हूँ / میں مریض ہوں" → `/auth/signin`
- Card B: "I'm a doctor / میں ڈاکٹر ہوں" → `/auth/doctor/signin`
- Trilingual subtitles, accessible focus order, large touch targets.

### 12.2 Doctor-branded auth shell
Reuse `AuthShell` but with a `variant="doctor"` prop that swaps:
- Background accent (emerald tint instead of teal)
- Icon (Stethoscope)
- Title ("Doctor Portal")
- Footer note: "PMDC verification required for full access."

### 12.3 Role badge in app header
`app-header.tsx` already shows the user's name/email. Add a small badge:
- `PATIENT` (teal) for `role=user`
- `DOCTOR` (emerald) for `role=doctor` + verified
- `DOCTOR · PENDING` (amber) for `accountStatus=pending_verification`
- `ADMIN` (slate) for `role=admin`

### 12.4 Doctor Portal layout
Two-column on desktop: left sub-nav (Patients / SOAP / Drug checker / Follow-ups / Audit), right content area. Single-column stacked on mobile.

### 12.5 Pending verification screen (`/onboarding/doctor/pending`)
- "Thank you, Dr. {name}. We're verifying your PMDC registration (# {pmdcNumber})."
- Expected timeline: 24–48 hours.
- "We'll email you when approved." (push notification if subscribed)
- Logout button.

### 12.6 Rejected verification screen
- "Your registration could not be verified. Reason: {admin notes}."
- "Contact support@sehatai.pk with your PMDC number."
- Re-upload button (creates a new `DoctorVerificationDoc` row).

---

## 13. Security Considerations

1. **No client-trusted role.** `role` is read from the JWT (set by `authorize()`), never from a form field. Signup forms include `intendedRole` but the server validates it against the route (`/auth/doctor/signup` → `role=doctor`; anything else → `role=user`).
2. **Server-side enforcement on every API.** `requireDoctor()` / `requireAdmin()` throw 403 — UI hiding is convenience, not security.
3. **PMDC number uniqueness.** `@unique` constraint prevents duplicate doctor registrations.
4. **Uploaded docs are private.** Stored in `/uploads/doctor-docs/{userId}/...` with no public URL; served via a `/api/admin/doctor-doc/{id}` route that requires admin auth.
5. **Audit every role transition.** `doctor.signup`, `doctor.verified`, `doctor.rejected`, `admin.promote`, `role.elevated` all logged with actor + target + meta.
6. **Session invalidation on role change.** When admin promotes/demotes, delete that user's `Session` rows so the next request forces a re-login with the new role in the JWT.
7. **Rate-limit doctor signup.** `doctor/signup` is a likely abuse vector (fake doctors). Add per-IP rate limit (5/hour) + honeypot field.
8. **PHI access logging.** Every time a doctor opens a patient's record (`GET /api/doctor/patients/{id}`), write an `AuditLog` row with `action=doctor.phi.read`.

---

## 14. Migration Strategy

### 14.1 Existing users
- All current users remain `role=user, accountStatus=active`. **No action required.**
- If any user already has `role=doctor` (from the admin promote API), they are migrated to `accountStatus=active` and a `DoctorProfile` row is created with **PMDC = "LEGACY-{email}"** and a `pmdcVerifiedAt` timestamp. They keep working but are flagged in admin UI as "legacy — re-verify PMDC".

### 14.2 The Doctor Copilot nav item
- Today it's visible to everyone. After migration it becomes `doctorOnly/adminOnly`.
- Guests and patients lose access. They see a "Doctor features are available to verified doctors — sign up as a doctor" CTA in the About page.

### 14.3 Rollout order
1. Schema changes + `db:push`.
2. New helpers (`requireDoctor`, `requireAdmin`) — no behavior change yet.
3. Add `doctorOnly` / `patientOnly` flags to nav (still rendered to everyone for one release — behind a feature flag).
4. Add `/auth/doctor/signup` + `/auth/doctor/signin` routes.
5. Add admin verification UI.
6. Flip the feature flag → nav becomes role-aware.
7. Backfill `DoctorProfile` for any existing `role=doctor` accounts.

---

## 15. Implementation Phases (todo breakdown)

### Phase A — Schema & Auth Helpers (no UI change)
- [ ] Add `accountStatus`, `DoctorProfile`, `DoctorVerificationDoc`, `PatientConsentForDoctor` to `prisma/schema.prisma`.
- [ ] Run `bun run db:push`.
- [ ] Add `requireDoctor()`, `requireAdmin()`, `requireActiveDoctor()` to `src/lib/auth.ts`.
- [ ] Add `accountStatus` to JWT callback and `/api/user/me`.
- [ ] Add audit events `doctor.signup`, `doctor.verified`, `doctor.rejected`.

### Phase B — Doctor Signup & Signin Routes
- [ ] Create `/auth/doctor/signup/page.tsx` (PMDC #, specialty, doc uploads).
- [ ] Create `/auth/doctor/signin/page.tsx` (doctor-branded shell).
- [ ] Create `/onboarding/doctor/pending/page.tsx`.
- [ ] Create `/onboarding/doctor/rejected/page.tsx`.
- [ ] Extend `POST /api/auth/signup` to accept `intendedRole` + doctor fields.
- [ ] Add file-upload endpoint `/api/doctor/upload-doc` (admin-only read).

### Phase C — Landing Chooser & Nav Reorg
- [ ] Update `/` (unauthenticated state) with patient/doctor chooser.
- [ ] Add `doctorOnly`, `patientOnly`, `requireActiveDoctor` flags to `NAV_ITEMS`.
- [ ] Filter nav items by role + accountStatus in `app-nav.tsx`.
- [ ] Add role badge to `app-header.tsx`.
- [ ] Post-login redirect logic in both signin pages.

### Phase D — Doctor Portal Expansion
- [ ] Build patient roster (consented only) inside Doctor Copilot view.
- [ ] Wire `/api/doctor/patients` to `PatientConsentForDoctor`.
- [ ] Add follow-up scheduler UI.
- [ ] Add drug-interaction bulk checker UI.
- [ ] Add FHIR export button.
- [ ] Add WHO SMART DAK quick-reference cards.

### Phase E — Admin Verification UI
- [ ] Build `/admin/doctor-verifications` view (admin-only).
- [ ] `POST /api/admin/verify-doctor` (approve/reject).
- [ ] Doc viewer (`/api/admin/doctor-doc/{id}`).
- [ ] Notify doctor on approval (push + email stub).

### Phase F — Hardening & Migration
- [ ] Backfill `DoctorProfile` for legacy `role=doctor` accounts.
- [ ] Add server-side role checks to all `/api/doctor/*` + `/api/admin/*` routes.
- [ ] Session invalidation on role change.
- [ ] Rate-limit `/api/auth/doctor/signup`.
- [ ] Audit log review screen for admins.

### Phase G — Verification & QA
- [ ] Agent Browser: full signup → pending → admin approve → doctor login → portal flow.
- [ ] Verify role-gating: patient cannot reach `/api/doctor/patients` (403).
- [ ] Verify nav hiding for guest / patient / doctor / admin.
- [ ] Lint clean, dev.log clean.

---

## 16. Testing & Verification Plan

| Test | Method | Pass criteria |
|---|---|---|
| Patient signup → patient login → sees patient nav | Agent Browser | Nav shows Chat, Reminders, Facilities, My Health, About. No Doctor Copilot. |
| Doctor signup → pending screen | Agent Browser | Lands on `/onboarding/doctor/pending`. Cannot access Doctor Copilot. |
| Admin approves doctor | Manual API call | `accountStatus` flips to `active`. Doctor can re-login. |
| Doctor login → doctor portal | Agent Browser | Default view = Doctor Copilot. Nav hides My Health, Reminders. |
| Patient tries `/api/doctor/patients` | curl | 403 Forbidden. |
| Patient tries to access Doctor Copilot view | Agent Browser | Nav item hidden; direct `setView('doctor-copilot')` blocked by client guard + API 403. |
| Duplicate PMDC # | API test | Second doctor signup with same PMDC → 400. |
| Role escalation via client | curl | `POST /api/auth/signup` with `role=admin` → still creates `role=user`. |
| Session invalidation on role change | Manual | Admin promotes user → user's next request 401s. |
| Sticky footer + responsive | Agent Browser | Footer sticks on short pages; pushes on long; mobile/desktop OK. |

---

## 17. Risks & Open Questions

### Risks
1. **PMDC verification has no public API.** v1 is manual — admin must visually verify uploaded docs against the PMDC online register. Risk: slow turnaround, fake docs slip through. *Mitigation:* require CNIC + PMDC + degree (3 docs) and log everything.
2. **Doctor onboarding friction.** Uploading 3 docs + waiting 24–48h will reduce doctor signups. *Mitigation:* show clear timeline; allow admin to fast-track known doctors.
3. **Existing mock patient data in Doctor Copilot.** Today the view shows `MOCK_PATIENTS`. If we don't replace with consented real patients, doctors will see fake data on first login. *Mitigation:* Phase D must wire real consented patients before flipping the feature flag.
4. **Patient consent UX for sharing with a doctor.** `PatientConsentForDoctor` needs a patient-side flow ("Dr. X requests access to your history — approve?"). *Mitigation:* add to Phase D scope.
5. **Rate-limiting is not currently in the stack.** We'd need a lightweight in-memory limiter (no Redis). *Mitigation:* add a `rate-limit.ts` lib using `Map<ip, count>`.

### Open Questions
1. **Should doctors also be able to act as patients?** (i.e. a doctor tracking their own sleep?) *Recommendation:* No — keep roles pure. A doctor who wants patient features creates a second patient account with a different email. This is cleaner for audit.
2. **LHW (Lady Health Worker) role?** Today `/api/lhw/dashboard` exists but LHW isn't a `role` value. *Recommendation:* add `role=lhw` as a Phase 2 item, not in this plan.
3. **Insurer role?** `/api/insurer/triage` uses an API key, not a user role. *Recommendation:* keep that pattern (API key, not user account) for v1.
4. **Should the doctor signup be invite-only?** (admin pre-creates a doctor account, doctor just sets password). *Recommendation:* open signup + manual verification — less admin burden, PMDC # is the gate.
5. **What happens to a doctor's patient-attributed data (SOAP notes, audit logs) if their PMDC is later revoked?** *Recommendation:* retain data (legal/medical record requirement), but revoke access. Mark `accountStatus=suspended`. Data deleted only via explicit admin action with audit.

---

## 18. Files Touched (preview — NOT to be created in this planning phase)

| File | Change type |
|---|---|
| `prisma/schema.prisma` | Add 4 models + 1 field |
| `src/lib/auth.ts` | Add `requireDoctor`, `requireAdmin`, `requireActiveDoctor` |
| `src/app/auth/doctor/signup/page.tsx` | NEW |
| `src/app/auth/doctor/signin/page.tsx` | NEW |
| `src/app/onboarding/doctor/pending/page.tsx` | NEW |
| `src/app/onboarding/doctor/rejected/page.tsx` | NEW |
| `src/app/api/auth/signup/route.ts` | Extend with doctor fields |
| `src/app/api/doctor/upload-doc/route.ts` | NEW |
| `src/app/api/doctor/patients/route.ts` | Add `requireActiveDoctor()` + consent filter |
| `src/app/api/doctor/soap-note/route.ts` | Add `requireActiveDoctor()` |
| `src/app/api/admin/doctor-verifications/route.ts` | NEW (GET list) |
| `src/app/api/admin/verify-doctor/route.ts` | NEW (POST approve/reject) |
| `src/components/app/app-nav.tsx` | Add `doctorOnly`, `patientOnly`, `requireActiveDoctor` flags |
| `src/components/app/app-header.tsx` | Add role badge |
| `src/components/auth/auth-shell.tsx` | Add `variant="doctor"` prop |
| `src/components/doctor-copilot/doctor-copilot-view.tsx` | Replace mock patients with real roster |
| `src/components/admin/doctor-verifications-view.tsx` | NEW |

---

## 19. Approval

| Decision | Owner | Status |
|---|---|---|
| Adopt two-surface architecture (patient + doctor) | User | ⏳ PENDING |
| PMDC manual verification for v1 | User | ⏳ PENDING |
| Doctors cannot access patient trackers | User | ⏳ PENDING |
| Open doctor signup (not invite-only) | User | ⏳ PENDING |

**Next step:** Once approved, begin Phase A (schema + auth helpers) — no UI change yet, fully backwards-compatible.
