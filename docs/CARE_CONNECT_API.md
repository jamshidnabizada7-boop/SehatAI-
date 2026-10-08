# SehatAI Care Connect — API Reference Manual (§100)

> **Document Type:** REST API Specification & Authorization Matrix  
> **Base Path:** `/api/care/` and `/api/doctor/care/`  
> **Security Model:** Session-authenticated (NextAuth JWT) + 4-factor Care Authorization (`authorizeConsultationAccess`).

---

## 1. Global Conventions & Headers

- **Content-Type:** `application/json` (except SSE streams and multipart uploads).
- **Idempotency-Key Header:** Accepted on all state-changing endpoints (`/payments`, `/consultations`, `/refunds`, `/payouts`). Protects against network replays.
- **Common Error Codes:**
  - `401 UNAUTHENTICATED`: Session missing or expired.
  - `403 FORBIDDEN` / `REQUIRES_PARTICIPANT`: User is neither the patient nor the doctor for the consultation.
  - `403 TELEMEDICINE_CONSENT_REQUIRED`: Patient must grant telemedicine consent before booking.
  - `404 NOT_FOUND`: Resource missing.
  - `409 CONFLICT` / `SLOT_ALREADY_BOOKED`: Concurrency conflict or illegal state machine transition.
  - `429 RATE_LIMITED`: Distributed sliding-window threshold exceeded.

---

## 2. Marketplace & Directory Endpoints

### `GET /api/care/doctors`
- **Auth:** Public.
- **Query Params:** `specialty`, `gender`, `type`, `sort` (relevance, rating, price_asc, price_desc), `onlineNow`, `take`, `skip`.
- **Response:** `{ doctors: DoctorCardData[] }`.

### `GET /api/care/doctors/[id]`
- **Auth:** Public.
- **Response:** Detailed profile including services, verified credentials, rating breakdown, and bio.

### `POST /api/care/match`
- **Auth:** Public / Authenticated.
- **Body:** `{ text: string, consultationType?: string }`.
- **Response:** `{ emergency: boolean, suggestedSpecialty: string, doctors: DoctorCardData[], disclaimer: string }`.
- **Safety Rule:** If symptoms trigger L0 emergency red flags, returns `emergency: true` with emergency hotlines; doctor results are suppressed.

### `GET /api/care/availability`
- **Auth:** Public.
- **Query Params:** `doctorId`, `type` (AUDIO | VIDEO), `days` (default 14).
- **Response:** `{ slots: Array<{ startUtc: string, endUtc: string }> }`.

### `GET /api/care/favorites` & `POST /api/care/favorites` & `DELETE /api/care/favorites`
- **Auth:** Authenticated User (`user`, `patient`).
- **Body / Params:** `{ doctorProfileId: string }`.
- **Response:** Saves or removes bookmarked doctors.

---

## 3. Consultation Management Endpoints

### `POST /api/care/consultations`
- **Auth:** Authenticated Patient.
- **Headers:** Optional `Idempotency-Key: <uuid>`.
- **Body:**
  ```json
  {
    "doctorProfileId": "string",
    "type": "TEXT" | "AUDIO" | "VIDEO",
    "serviceId": "optional string",
    "scheduledAt": "optional ISO string",
    "patientCountry": "PK" | "AF",
    "instant": false
  }
  ```
- **Guards:**
  1. Checks active `ConsentRecord` for `TELEMEDICINE` (rejects with 403 `TELEMEDICINE_CONSENT_REQUIRED`).
  2. Evaluates cross-border `JurisdictionPolicy`.
  3. Enforces double-booking slot reservation inside database transaction.
- **Response (201):** `{ consultation: ConsultationDetail }`.

### `GET /api/care/consultations`
- **Auth:** Authenticated User / Doctor / Staff.
- **Behavior:** Patients see their bookings; Doctors see assigned consultations; Staff with `viewAny` see all (audited).

### `GET /api/care/consultations/[id]`
- **Auth:** Participant (Patient or Doctor) or Authorized Staff.
- **Response:** `{ consultation: ConsultationDetail }`.

### `PATCH /api/care/consultations/[id]`
- **Auth:** Participant (role-governed transitions).
- **Body:**
  - Doctor: `{ action: "accept" }`, `{ action: "decline", reason: "string" }`, `{ action: "complete" }`.
  - Patient: `{ action: "cancel", reason: "patient_cancelled" }`.
- **Response:** `{ consultation: ConsultationDetail }`.

---

## 4. Realtime Messaging, Files & Calls

### `GET /api/care/consultations/[id]/messages`
- **Auth:** Participant.
- **Response:** `{ messages: ChatMsg[] }`.

### `POST /api/care/consultations/[id]/messages`
- **Auth:** Participant. Must be within active messaging window.
- **Body:** `{ body: string, attachments?: string[] }`.
- **Behavior:** Contact info scan flags soft leakage without blocking clinical chat.

### `GET /api/care/consultations/[id]/messages/stream`
- **Auth:** Participant.
- **Transport:** Server-Sent Events (SSE). Streams message updates in real time.

### `POST /api/care/consultations/[id]/translate` & `PATCH /api/care/consultations/[id]/translate`
- **Auth:** Participant.
- **Body (POST):** `{ messageId: string, targetLanguage: "en" | "ur" }`.
- **Body (PATCH):** `{ translationId: string }` (confirms high-risk dosage/medical translation).

### `POST /api/care/consultations/[id]/join`
- **Auth:** Participant. Eligible state and valid window mandatory.
- **Response:** Ephemeral HMAC room token, `roomId`, `signalingUrl`, `iceServers`.

### `PATCH /api/care/consultations/[id]/calls`
- **Auth:** Participant.
- **Body:** `{ callId: string, state: "ACTIVE" | "ENDED" | "FELL_BACK", fallbackTo?: "AUDIO" | "TEXT", reason?: string }`.

### `GET /api/care/attachments/download?attachmentId=`
- **Auth:** Participant only.
- **Response:** Generates short-lived HMAC signed URL pointing to decrypted file from private storage.

---

## 5. Clinical Records & Prescriptions

### `POST /api/care/consultations/[id]/notes`
- **Auth:** Attending Doctor.
- **Body:** `{ content: string, type: "SOAP" | "PROGRESS", visibility: "PRIVATE_NOTE" | "PATIENT_SUMMARY" }`.

### `POST /api/care/consultations/[id]/prescriptions`
- **Auth:** Attending Doctor.
- **Actions:** Draft prescription or digital signing (`action: "sign"`).
- **Guards:** Controlled substance block; drug-drug interaction validation. AI cannot invoke the sign action.

### `POST /api/care/consultations/[id]/handoff`
- **Auth:** Attending Doctor.
- **Body:** `{ action: "ACCEPT" | "EDIT" | "REJECT", editedContent?: object }`.

### `POST /api/care/consultations/[id]/review`
- **Auth:** Patient. Allowed only after `COMPLETED` consultation.
- **Body:** `{ overall: 1..5, comment?: string }`.

---

## 6. Financial, Payment & Payout Endpoints

### `POST /api/care/payments`
- **Auth:** Patient.
- **Headers:** `Idempotency-Key: <uuid>`.
- **Body:** `{ consultationId: string }`.
- **Response (201):** `{ payment: Payment, checkoutUrl: string, breakdown: object }`.

### `POST /api/care/payments/mock/confirm`
- **Auth:** Patient (Development/Test only).
- **Body:** `{ paymentId: string, outcome: "succeeded" | "failed" }`.
- **Behavior:** Feeds signed webhook payload through real trust boundary. Blocked in production.

### `POST /api/care/payments/webhooks/[provider]`
- **Auth:** Cryptographic HMAC signature over raw payload.
- **Behavior:** Verifies provider signature, checks event timestamp, deduplicates in `PaymentWebhook`, posts balanced ledger entries.

### `POST /api/care/refunds`
- **Auth:** Patient, Doctor, or Support.
- **Body:** `{ consultationId: string, reason: string }`.
- **Behavior:** Evaluates deterministic refund ladder, creates row, dispatches gateway refund.

### `GET /api/doctor/care/earnings`
- **Auth:** Verified Doctor.
- **Response:** Derived wallet balance (`pendingMinor`, `availableMinor`), lifetime statistics, and transaction history.

### `POST /api/doctor/care/payouts`
- **Auth:** Verified Doctor.
- **Body:** `{ amountMinor: number, currency: "PKR", destination: object }`.
- **Behavior:** Atomically claims available earnings, posts ledger debit, creates payout attempt.

---

## 7. Governance, Consent & Administration

### `POST /api/care/consent` & `GET /api/care/consent`
- **Auth:** Authenticated User.
- **Body (POST):** `{ type: "TELEMEDICINE" | "TERMS", policyVersion: "2026.10-draft" }`.
- **Response:** Records IP, timestamp, and policy version.

### `POST /api/care/totp` & `GET /api/care/totp`
- **Auth:** Authenticated Doctor/Staff.
- **Behavior:** Generates RFC 6238 secret and validates 6-digit TOTP codes for privileged actions.

### `GET /api/care/admin` & `POST /api/care/admin`
- **Auth:** Admin / Clinical Admin / Finance.
- **Actions:** System overview, fraud signal queue, dispute resolution, doctor suspension, commission rule management.
