> [!WARNING] DRAFT — COUNSEL REVIEW REQUIRED
> This document is an engineering draft prepared for architectural validation and requires comprehensive review by licensed legal counsel before production regulatory reliance.

# SehatAI Care Connect — Privacy Policy

> **DRAFT — REQUIRES COUNSEL REVIEW BEFORE ANY COMMERCIAL LAUNCH**  
> **Jurisdiction: PK (draft) / AF (draft)**  
> **Version:** 2026.10-draft · **Effective Date:** October 2026

---

## 1. Overview and Core Commitments

SehatAI Care Connect ("we", "us", "Platform") is committed to safeguarding patient confidentiality and personal health data (PHI). We design all healthcare workflows around privacy-by-design principles:
- **Private Storage:** Medical attachments, prescriptions, and clinical notes are never stored in public web directories. All documents are stored in encrypted private buckets (`storage/care/`) and served only via ephemeral, authorization-validated signed URLs.
- **Lock-Screen Privacy:** Push and mobile notifications never contain clinical details, medical terms, doctor specialties, or medication names. Notification payloads display only generic notices (e.g., "Care Connect: You have an update in Care Connect").
- **Payment Privacy:** Payment gateway session descriptions strictly contain generic labels (e.g., "SehatAI Care Connect consultation") with zero medical diagnosis or condition disclosures.

---

## 2. Information We Collect

1. **Account Identification:** Name, email address, password hash (bcrypt), telephone number (where verified).
2. **Patient Declared Location:** Physical jurisdiction declared by the patient at booking time (required to enforce cross-border medical compliance). Never inferred from IP address without user confirmation.
3. **Clinical Information:** Patient health intake responses, symptom descriptions, consultation chat logs, uploaded diagnostic files, and doctor prescriptions.
4. **Audit and Transaction Logs:** Immutable audit log entries recording timestamps, authenticated actor IDs, action verbs, and transaction identifiers.

---

## 3. How We Use and Share Information

1. **Facilitating Consultations:** Sharing relevant patient intake and health summaries exclusively with the licensed doctor chosen and authorized by the patient for a given consultation.
2. **AI-Assisted Features:** AI-generated triage summaries and clinical note drafts are processed securely and presented to the doctor as explicitly labeled suggestions ("AI ASSISTED DRAFT"). AI models never make independent clinical determinations.
3. **Restricted Staff Access:** Platform administrators, customer support, and finance agents operate under strict Role-Based Access Control (RBAC). Finance personnel have zero access to clinical notes or consultation messages; support personnel have read-only access strictly when responding to reported incidents; audit logs record all staff access events.
4. **No Commercial Data Selling:** We do not sell, rent, or monetize patient health data or personal identifiers to third parties, advertisers, or insurers.

---

## 4. Data Security and Encryption

1. **In Transit:** All HTTP traffic is protected by Transport Layer Security (TLS 1.3) with mandatory HTTP Strict Transport Security (HSTS) headers.
2. **At Rest:** Health records, clinical files, and document attachments are encrypted at rest using AES-256-GCM authenticated encryption.
3. **Access Tokens:** Video and audio consultation room tokens are short-lived HMAC-signed tokens with 15-minute expirations.

---

## 5. Data Retention and Deletion Lifecycle (§82)

User health data is retained according to clinical compliance requirements:
- Users may request account deletion at any time via `/api/user/delete`.
- Deletion requests transition user records through our structured data lifecycle:
  `ACTIVE` → `DELETION_REQUESTED` → `RETENTION_HOLD` (if active dispute or statutory requirement exists) → `ANONYMIZED` / `DELETED`.
- In accordance with medical record regulations in Pakistan (PM&DC guidelines) and Afghanistan, completed consultation medical records are maintained for statutory retention durations (e.g., 5–7 years) in restricted access archive before permanent destruction.

---

## 6. Your Rights

Patients possess the right to:
1. Inspect and export their consultation summaries, chat histories, and prescriptions.
2. Revoke consent for optional features (e.g., AI translation or non-essential communications).
3. Request correction of clerical information or file formal grievances.

Contact: `privacy@sehatai.health`
