> [!NOTE] ARCHIVED / HISTORICAL HACKATHON DOCUMENTATION
> This document records the original regional hackathon submission audit and architecture baseline.

# SehatAI — System Architecture & Engineering Blueprint

**Author**: SehatAI Engineering & Core Architecture Team  
**Date**: October 6, 2026  
**Version**: 2.5.0 Production-Ready  
**License**: MIT  

---

## 1. High-Level Architecture Diagram

```
[ User Browser / PWA ] ─────────── (Online / Offline Web Worker) ───────────┐
        │                                                                     │
        ▼ (HTTPS / WSS / SSE)                                                │
[ Next.js 16 App Router Server ]                                              │
        │                                                                     │
        ├─► [ Step 1: Input Normalization & Injection Firewall ]              │
        │                                                                     │
        ├─► [ Step 2: L0 Deterministic Safety Gate (< 1ms) ]                  │
        │         ├─► RED FLAG MATCHED? ──► [ Emergency Short-Circuit ]       │
        │         └─► Safe to continue                                        │
        │                                                                     │
        ├─► [ Step 3: Vectorless Multi-Token BM25 Corpus Retrieval ]          │
        │                                                                     │
        ├─► [ Step 4: Multi-Model AI Cascade (Alibaba DashScope / Qwen) ]     │
        │         ├─► L1 Structured Triage (`qwen-max` / `qwen-plus`)         │
        │         ├─► Grounded Generation (`qwen-2.5-72b-instruct`)           │
        │         └─► Failover: Google Gemini 1.5 ──► Groq ──► Local Offline │
        │                                                                     │
        ├─► [ Step 5: Parallel Veto Constellation ]                           │
        │         ├─► Validator 1: Red-Flag Recheck                           │
        │         ├─► Validator 2: Medication Safety & Allergy Guard          │
        │         ├─► Validator 3: Citation Grounding Check                   │
        │         ├─► Validator 4: Trilingual Consistency Check               │
        │         └─► 8-Boolean L2 LLM Judge Consensus                       │
        │                                                                     │
        ├─► [ Step 6: Confidence Band Calibration Formula ]                   │
        │                                                                     │
        ├─► [ Step 7: Zero-PHI Audit Logging & Telemetry ]                    │
        │                                                                     │
        └─► [ Step 8: Persistence ] ──► [ Supabase PostgreSQL / Prisma ]      │
```

---

## 2. Multi-Tier AI Cascade & Failover Hierarchy

SehatAI implements an enterprise four-tier inference cascade designed for high availability in volatile network environments:

```
┌─────────────────────────────────────────────────────────────┐
│ Tier 1: Alibaba Cloud DashScope (Primary AI Engine)        │
│ Models: Qwen 2.5 72B Instruct, Qwen-Plus, Qwen-Max          │
│ Purpose: Native trilingual Urdu/Roman/English comprehension │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Timeout > 4500ms or 429/500)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Tier 2: Google Gemini (Secondary Cloud Failover)            │
│ Models: Gemini 1.5 Flash / Pro                              │
│ Purpose: Clinical differential reasoning & medical backup   │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Timeout > 3000ms or Error)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Tier 3: Groq Cloud (Ultra-Fast Inference Backup)            │
│ Models: Llama 3.3 70B Versatile                             │
│ Purpose: < 400ms emergency failover token generation        │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Zero Network / Total Outage)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Tier 4: Client-Side Web Worker & Dexie IndexedDB            │
│ Models: Damerau-Levenshtein Fuzzy Matcher + 181 Topic Corpus│
│ Purpose: 100% Offline Medical Intelligence without Server   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema & Data Models (Prisma ORM)

SehatAI uses a clean relational schema hosted on Supabase PostgreSQL:

```prisma
model User {
  id            String          @id @default(cuid())
  email         String          @unique
  name          String?
  role          String          @default("user") // user | doctor | admin
  doctorProfile DoctorProfile?
  patientProfile PatientProfile?
  conversations Conversation[]
  consents      ConsentRecord[]
  auditLogs     AuditLog[]
}

model DoctorProfile {
  id               String          @id @default(cuid())
  userId           String          @unique
  user             User            @relation(fields: [userId], references: [id])
  pmdcNumber       String          @unique
  specialty        String
  verificationDoc  String?         // Private storage path
  status           String          @default("PENDING") // PENDING | APPROVED | REJECTED
}

model Conversation {
  id           String          @id @default(cuid())
  userId       String?
  sessionToken String?
  user         User?           @relation(fields: [userId], references: [id])
  messages     Message[]
  summary      DoctorSummary?
}

model Message {
  id             String        @id @default(cuid())
  conversationId String
  conversation   Conversation  @relation(fields: [conversationId], references: [id])
  role           String        // user | assistant
  content        String
  language       String        // en | ur | roman
  triageLevel    String?       // EMERGENCY | URGENT | ROUTINE | SELF_CARE
  emergency      Boolean       @default(false)
  meta           Json?         // Latency breakdown, engine, confidence math
}

model HealthFacility {
  id           String          @id @default(cuid())
  name         String
  city         String
  province     String
  latitude     Float
  longitude    Float
  emergency24h Boolean         @default(false)
  phone        String
  type         String          // hospital | clinic | maternity | pharmacy
}
```

---

## 4. Grounded Vectorless RAG Retrieval

Unlike traditional embedding models that fail on Roman Urdu (e.g. *"seene mein dard"* vs *"sinay ma dard"*), SehatAI utilizes a specialized **Multi-Token Phonetic & Lexical RAG Engine**:
- **Normalized Token Inverted Index**: Pre-indexes all 181 clinical topics with English, Urdu Nastaliq, and Roman Urdu keywords.
- **Cross-Clause Multi-Token Scoring**: Matches composite clinical complaints across conjunctive boundaries (`tagTokens.every(t => queryTokens.has(t))`).
- **Contextual Demographic Weighting**: Automatically boosts pediatric topics when child tokens are affirmed; deprioritizes adult topics.
- **Deterministic Calibration**: Every retrieved corpus item is published under Open Government License or Creative Commons (CC-BY-4.0) with explicit source attribution and verification timestamp.

---

## 5. Offline PWA & Data Synchronization

1. **Service Worker Precache**: Shell assets (`/`, `/chat`, `/first-aid`, `/facilities`, `/glossary`) are precached in CacheStorage on first load.
2. **IndexedDB Local Storage**: Dexie.js stores conversations, symptom journals, and offline reminders locally.
3. **Conflict-Free Reconnection**: When connectivity is restored, local sync queues upload unpersisted messages using idempotent UUID keys.
4. **Air-Gapped Doctor Transfer**: Encrypted QR code compression allows patients in rural areas to hand off their complete consultation history to a rural doctor without cellular data.
