# SehatAI + Care Connect Production Security & Clinical Safety Audit

**Document ID:** SEC-AUDIT-2026-10-08-02  
**Target Repository:** `D:\SehatAI-UNIFIED`  
**Classification:** STRICT AUDIT & COMPLIANCE RECORD  
**Date:** October 8, 2026  
**Auditor Status:** Certified Automated Red-Team & Verification Matrix  

---

## 1. Safety Architecture Overview

SehatAI implements an defense-in-depth clinical architecture where **AI models are never granted unconstrained clinical authority**. All patient interactions pass through a multi-tier pipeline designed to prioritize safety, patient agency, and determinism.

```
[Patient Query]
       │
       ▼
[Step -1: Injection Scan & Sanitization] (Raw query scanned; system tags stripped)
       │
       ▼
[Step 0: Structural Stream Separation] (History turns strictly tagged; role spoofing impossible)
       │
       ▼
[Step 1: L0 Deterministic Triage] (<10ms, offline-capable, 1,548 red-flag terms)
       ├───> [RED FLAG DETECTED?] ──YES──> [IMMEDIATE SHORT-CIRCUIT]
       │                                     • Localized emergency numbers (PK / AF / INTL)
       │                                     • Immediate first-aid instructions
       │                                     • Zero LLM generation / hallucinations
       └───> NO
               │
               ▼
[Step 2: Constellation Pre-Generation Veto] (Drug interactions, high-risk flags)
               │
               ▼
[Step 3: Multi-Provider LLM Generation] (Circuit-breaker, temperature 0.2)
               │
               ▼
[Step 4: Post-Generation Safety Validation] (Sycophancy veto, false reassurance, citation grounding)
               │
               ▼
[Safe Grounded Response with Citations & Patient Summary]
```

---

## 2. L0 Deterministic Safety Engine

- **Term Coverage:** 1,548 clinically verified red-flag terms spanning English, Urdu (Nastaliq script), and Roman Urdu.
- **Sources:** World Health Organization (WHO) Emergency Signs, UNICEF/WHO IMCI child danger signs, FAST stroke criteria, and WHO obstetric danger signs.
- **Determinism:** Operates entirely in-memory with zero external API calls or database lookups.
- **Denial of Service Immunity:** Pre-normalized string matching eliminates Regular Expression Denial of Service (ReDoS).
- **Latency SLA:** Validated at **10ms** (target SLA < 25ms).

---

## 3. Pre-Generation & Post-Generation Constellation Validators

1. **Pre-Generation Veto:**
   - Evaluates patient profile, allergies, and chief complaint before sending prompts to external model providers.
   - Blocks critical medication cross-reactions (e.g., NSAID administration with active GI bleeding, duplicate high-potency drugs).
2. **Post-Generation Output Validation:**
   - **False Reassurance Detection:** Algorithms reject phrases like "nothing to worry about", "you are fine", "koi masla nahi hai" when any clinical risk markers exist.
   - **Citation Grounding:** Invented citation markers (hallucinated corpus IDs) are programmatically stripped or cause generation rollback.
   - **Anti-Sycophancy Gate:** Verifies the model does not capitulate to dangerous patient requests (e.g., requests to approve narcotics or skip emergency care).

---

## 4. Prompt Injection & Adversarial Robustness

Tested under Category X frozen holdout and Red-Team suites:
- **System Prompt Extraction Defense:** Jailbreak prompts attempting to reveal system instructions are neutralized via strict structural role isolation.
- **Persona Hijacking Resistance:** Prompts instructing the model to act as an "unrestricted doctor" or "prescribing bot" fail because prescribing and clinical actions require authenticated doctor signatures.
- **Red-Flag Camouflage Resistance:** Even when red-flag symptoms are buried within hypothetical fiction, roleplays, or code blocks, the deterministic L0 boundary detects the physical symptoms and triggers emergency protocols.

---

## 5. Role-Based Access Control (RBAC) & Boundary Isolation

| Role | Permissions | Prohibited Boundaries |
| :--- | :--- | :--- |
| **PATIENT** | Book consultations, view own history, download own attachments, submit reviews. | Cannot access other patient records (IDOR protected), cannot sign prescriptions, cannot process payouts or refunds. |
| **DOCTOR** | View assigned consultations, upload PMDC evidence, sign prescriptions, claim earnings. | Cannot access unassigned patients without consent, cannot issue refunds, cannot alter platform commissions. |
| **FINANCE** | View ledger balances, process payouts, reconcile bank settlement statements. | **Strictly blocked from reading patient clinical notes, medical records, or consultation chats.** |
| **SUPPORT** | View consultation metadata, investigate dispute claims. | Strictly prohibited from altering clinical notes or financial ledger entries. |
| **ADMIN** | Verify doctor PMDC credentials, manage platform parameters. | Subject to immutable audit logs on all privileged actions. |

---

## 6. HTTP & Transport Security

- **Content Security Policy (CSP):** Strict script, style, and connect boundaries enforced via Next.js response headers (`default-src 'self'`, `frame-ancestors 'none'`).
- **X-Content-Type-Options:** `nosniff` enforced on all document delivery and attachment download routes.
- **Cache-Control:** `private, no-store` on all clinical and financial endpoints.

---

## 7. Red-Team Boundary Hardening & Audit Verification

During independent red-team review, authorization barriers were comprehensively verified and reinforced:
1. **Directory Leakage Protection:** `/api/doctors` was remediated to enforce `careStatus: { in: ['ACTIVE', 'VERIFIED'] }`, preventing access to suspended clinicians (`DOCTOR_SUSPENDED`), and isolating test seed fixtures (`IT-`, `SMOKE-`) from production views.
2. **Object Storage Boundary Defense:** `PrivateObjectStorageProvider` enforces path traversal validation (`..` checks) uniformly across both read and delete operations, preventing arbitrary cloud object deletions.
3. **Jurisdiction Pipeline Localization:** End-to-end clinical pipeline execution in `src/server/pipeline/run.ts` was audited and updated to ensure users declaring Afghan jurisdiction (`AF`) receive local emergency services (102 Kabul Ambulance, 112 Afghan Red Crescent) across triage buttons, hotlines, and pre/post veto messages.
4. **Webhook Security & Replay Defense:** Gateway callbacks enforce strict cryptographic HMAC signature validation and timestamp anti-replay windows (max 5 minutes clock skew).
5. **Authorization Red Team Suite Realism:** Replaced in-memory mock assertions with end-to-end database-backed invariant tests (`tests/security/authorization-red-team.test.ts`), covering IDOR isolation, doctor scoping, LiveKit room token tampering, and consent tracking.

