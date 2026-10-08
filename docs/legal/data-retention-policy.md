> [!WARNING] DRAFT — REQUIRES LEGAL COUNSEL REVIEW
> This document is an engineering draft prepared for architectural validation and requires comprehensive review by licensed legal counsel before production regulatory reliance.

# SehatAI Care Connect — Data Retention & Deletion Policy

> **DRAFT — REQUIRES COUNSEL REVIEW BEFORE ANY COMMERCIAL LAUNCH**  
> **Jurisdiction: PK (draft) / AF (draft)**  
> **Version:** 2026.10-draft · **Effective Date:** October 2026

---

## 1. Statutory Retention Requirements & Principles

SehatAI Care Connect balances individual privacy rights ("right to be forgotten") with statutory medical record keeping requirements under Pakistan (PM&DC Code of Ethics) and Afghanistan healthcare frameworks.

Medical records generated during formal telemedicine consultations—including clinical notes, diagnostic attachments, and issued prescriptions—are legally required to be retained for minimum statutory retention windows (ordinarily 5 to 7 years from the date of creation, or until a minor patient reaches the age of majority plus statutory limitation).

---

## 2. Configurable Account Retention (`User.retentionDays`)

1. **Default Retention:** By default, user accounts retain active consultation histories indefinitely to support patient continuity of care.
2. **Custom Policy Configuration:** Enterprise, clinic, or privacy-conscious users may configure an explicit retention window (`User.retentionDays`).
3. **Automated Aging Pass:** Automated platform data hygiene routines evaluate records against the configured `retentionDays` policy:
   - Records past their active window that do not carry mandatory clinical or financial retention obligations are queued for automated archiving or anonymization.

---

## 3. Five-State Deletion Lifecycle (§82)

When a user initiates an account deletion via `/api/user/delete`, records transition through a structured five-state lifecycle:

```
[ ACTIVE ]
    │
    ▼
[ DELETION_REQUESTED ]
    │
    ├── (Statutory dispute / legal hold exists?) ──► [ RETENTION_HOLD ]
    │                                                        │ (Resolved)
    ▼                                                        ▼
[ ANONYMIZED ] ──────────────────────────────────────────────┘
    │ (Statutory clinical archive expires)
    ▼
[ DELETED ]
```

### Lifecycle State Definitions:

1. **`ACTIVE`:**
   - Standard operational state. User retains full access to accounts, messaging, consult histories, and active records.

2. **`DELETION_REQUESTED`:**
   - User has submitted a formal deletion request.
   - Immediate revocation of authentication credentials and active sessions.
   - In-app profile is deactivated and removed from public search and doctor matching.
   - Database evaluation pass checks for active legal holds or ongoing financial disputes.

3. **`RETENTION_HOLD`:**
   - Applied if the user has pending consultation charges, open refund disputes, unresolved chargebacks, or active regulatory audit holds.
   - PII is restricted to compliance-only administrative review; ordinary operations remain blocked until the hold condition is formally cleared.

4. **`ANONYMIZED`:**
   - All direct personal identifiers (name, email, phone number, physical address, IP logs) are cryptographically scrubbed or replaced with irreversible pseudonyms.
   - Financial ledger entries retain required audit balances (without PII) to maintain accounting balance integrity.
   - Clinical consultation notes and prescriptions are moved to encrypted offline cold-storage archives to satisfy medical malpractice limitation periods.

5. **`DELETED`:**
   - Final terminal state following expiration of statutory medical record keeping periods.
   - Cryptographic keys securing the archived patient records are permanently deleted, rendering all residual data permanently unrecoverable.

---

## 4. Financial & Audit Immutability

Ledger accounts (`LedgerEntry`), transaction logs, and security audit events (`AuditLog`) are **immutable by design**. Double-entry ledger records are never deleted; instead, transactions are balanced with reverse compensating entries, ensuring complete regulatory auditability.
