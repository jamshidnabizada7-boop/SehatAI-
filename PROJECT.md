# Project: SehatAI Core Engine Refactoring & Hardening

## Architecture
The SehatAI core engine processes health inquiries in a multi-stage, safety-critical pipeline.
The architecture is hardened across 4 universal architectural pillars:

```
[Incoming HTTP/SSE Request] 
            │
            ▼
┌────────────────────────────────────────────────────────┐
│ 1. Structural Role Isolation (R1)                      │
│    createDialogueStreams()                             │
│    ├── PatientDialogueStream (role: 'user' ONLY)       │
│    │    └── Fed to L0 Triage, L1 Extraction & Context  │
│    └── DialogueHistoryStream (all turns with roles)    │
│         └── Fed strictly to Final Generator for fluency│
└───────────┬────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────┐
│ 2. Triage & Extraction Engine (R1 & R3)                │
│    ├── L0 Deterministic Safety Engine                  │
│    ├── L1 Structured Extraction                        │
│    └── Chief Complaint vs Danger Sign Decoupling       │
│         - symptoms: routine baseline (SELF_CARE/ROUT)  │
│         - redFlagConcerns: acute emergency triggers    │
│         - l1Escalates: ONLY on verified redFlagConcerns│
└───────────┬────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────┐
│ 3. Strict Token-Boundary RAG Scoring & Isolation (R2)  │
│    ├── hasTokenBoundaryMatch() (\b Latin & Urdu)       │
│    ├── Token-set matching & confidence scoring         │
│    ├── MIN_CORPUS_SCORE_THRESHOLD = 2.5                │
│    ├── Sanitized corpus tags                           │
│    └── Out-of-corpus: 0 hits -> ABSTENTION_SYSTEM ->   │
│        citations: [] (Zero cross-topic leakage)        │
└───────────┬────────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────────────────────────────────┐
│ 4. Multi-Provider Zero-Latency Failover Cascade (R4)   │
│    ├── In-Memory Circuit Breaker (CLOSED/OPEN/HALF_OPEN│
│    ├── Tier 1: Google Gemini (2.5-flash, flash-lite)   │
│    ├── Tier 2: Groq (qwen3.8-27b, gpt-oss-120b)       │
│    └── Tier 3: Deterministic Offline Safety Engine     │
│         (<500ms avg latency, 0 dropped SSE connections)│
└────────────────────────────────────────────────────────┘
```

---

## Feature Inventory
Every feature from ORIGINAL_REQUEST.md and the survey phase is enumerated here with its assigned milestone:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1.1 | Typed Dialogue Stream Separation | Split history into `PatientDialogueStream` and `DialogueHistoryStream` | M1 | ORIGINAL_REQUEST §R1 |
| F1.2 | L0/L1 Stream Isolation | Feed strictly `PatientDialogueStream` to L0, L1 extraction, and clinical context builder | M1 | ORIGINAL_REQUEST §R1 |
| F1.3 | Assistant Disclaimer Isolation | Ensure 1122 warnings and red flag lists in assistant messages never enter clinical extraction | M1 | ORIGINAL_REQUEST §R1 |
| F2.1 | Token-Boundary Matcher | Implement `hasTokenBoundaryMatch()` supporting Latin, Roman Urdu, and Perso-Arabic boundaries | M2 | ORIGINAL_REQUEST §R2 |
| F2.2 | Token-Bounded Synonym Expansion | Update `expandQuerySynonyms()` to prevent intra-word substring collisions | M2 | ORIGINAL_REQUEST §R2 |
| F2.3 | Calibrated RAG Confidence Scoring | Multi-word phrase weighting and `MIN_CORPUS_SCORE_THRESHOLD = 2.5` | M2 | ORIGINAL_REQUEST §R2 |
| F2.4 | Corpus Tag Sanitization | Remove generic single-word tags (`food`, `eyes`, `sprain`, `tablet`) in `corpus.ts` | M2 | ORIGINAL_REQUEST §R2 |
| F2.5 | Multi-Turn Citation Isolation | Remove multi-turn retrieval fallback in `run.ts` to prevent historical topic citation bleed | M2 | ORIGINAL_REQUEST §R2 |
| F2.6 | Abstention System Invariant | Guarantee 0 corpus hits -> `ABSTENTION_SYSTEM` with `citations: []` on non-corpus queries | M2 | ORIGINAL_REQUEST §R2 |
| F3.1 | Chief Complaint Decoupling | Decouple routine `symptoms: string[]` from acute `redFlagConcerns: string[]` | M3 | ORIGINAL_REQUEST §R3 |
| F3.2 | L1 Escalation Decoupling | Fix `l1ConcernsText` and `l1Escalates` to check `DANGER_CONCERN_TERMS` ONLY against verified `redFlagConcerns` | M3 | ORIGINAL_REQUEST §R3 |
| F3.3 | Baseline Triage Calibration | Routine complaints default to `SELF_CARE`/`ROUTINE` baseline and only escalate on verified danger signs | M3 | ORIGINAL_REQUEST §R3 |
| F3.4 | 100% Emergency Trigger Invariant | Verified acute red flags trigger immediate 1122 emergency action cards with 0% false emergency cards for routine | M3 | ORIGINAL_REQUEST §R3 |
| F4.1 | Google API Key Prefix Fix | Remove `startsWith('AIzaSy')` hard-rejection in `src/server/llm.ts` to support all valid keys | M4 | ORIGINAL_REQUEST §R4 |
| F4.2 | In-Memory Circuit Breaker | Implement Circuit Breaker State Machine (`CLOSED`/`OPEN`/`HALF_OPEN`) with cooldown for 429/failures | M4 | ORIGINAL_REQUEST §R4 |
| F4.3 | Three-Tier Provider Cascade | Implement Tier 1 (Gemini) -> Tier 2 (Groq) -> Tier 3 (Offline Deterministic) cascade | M4 | ORIGINAL_REQUEST §R4 |
| F4.4 | Sub-500ms Latency & Timeout Management | Bounded timeouts, AbortController propagation, and zero socket leaks | M4 | ORIGINAL_REQUEST §R4 |
| F4.5 | SSE Stream & Connection Resilience | Zero dropped connections, robust error containment, 0 unhandled HTTP 500s | M4 | ORIGINAL_REQUEST §R4 |
| FT.1 | E2E Test Runner & Infrastructure | Universal test runner executable via `npx tsx` and `npm test` | E2E Track | ORIGINAL_REQUEST §Acceptance |
| FT.2 | Structural Invariant Verification | Automated tests proving zero assistant text enters L0/L1 pipeline | E2E Track | ORIGINAL_REQUEST §Acceptance |
| FT.3 | Citation Invariant Verification | Automated tests proving non-corpus topics return `citations: []` | E2E Track | ORIGINAL_REQUEST §Acceptance |
| FT.4 | Triage Invariant Verification | Automated tests proving 100% emergency trigger & 0% false emergency on routine complaints | E2E Track | ORIGINAL_REQUEST §Acceptance |
| FT.5 | Performance & Failover Verification | Automated tests proving <500ms failover cascade, circuit breaker, and 0 dropped connections | E2E Track | ORIGINAL_REQUEST §Acceptance |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| Track-E2E | E2E Testing Track | Test harness, runners, and comprehensive test suites for Tiers 1-4 | none | PLANNED |
| M1 | Structural Role Isolation (R1) | `types.ts`, `pipeline/run.ts`, `conversation-history.ts` | none | PLANNED |
| M2 | Strict Token-Boundary RAG Scoring & Citation Isolation (R2) | `safety-engine.ts`, `data/corpus.ts`, `pipeline/run.ts` | none | PLANNED |
| M3 | Chief Complaint vs Danger Sign Separation (R3) | `pipeline/run.ts`, `safety-engine.ts`, `data/lexicon.ts` | M1 | PLANNED |
| M4 | Multi-Provider Failover Cascade (R4) | `src/server/llm.ts`, `pipeline/run.ts`, `package.json` | none | PLANNED |
| Final | 100% E2E Verification & Adversarial Hardening | Verification against all E2E test suites (Tiers 1-4) + Tier 5 Adversarial Coverage Hardening | Track-E2E, M1, M2, M3, M4 | PLANNED |

---

## Interface Contracts

### 1. Stream Types Contract (`src/lib/types.ts`)
```typescript
export interface PatientDialogueMessage {
  readonly role: 'user';
  readonly content: string;
  readonly language?: Lang;
  readonly timestamp?: Date | string;
}
export type PatientDialogueStream = readonly PatientDialogueMessage[];

export interface AssistantDialogueMessage {
  readonly role: 'assistant';
  readonly content: string;
  readonly triageLevel?: TriageLevel;
  readonly citations?: Citation[];
  readonly emergency?: boolean;
  readonly timestamp?: Date | string;
}
export type DialogueHistoryMessage = PatientDialogueMessage | AssistantDialogueMessage;
export type DialogueHistoryStream = readonly DialogueHistoryMessage[];

export function createDialogueStreams(
  rawMessages: Array<{ role: string; content: string; [key: string]: unknown }>,
  currentMessage: string,
  currentLanguage?: Lang
): {
  patientStream: PatientDialogueStream;
  historyStream: DialogueHistoryStream;
};
```

### 2. RAG Retrieval Contract (`src/lib/engine/safety-engine.ts`)
```typescript
export const MIN_CORPUS_SCORE_THRESHOLD = 2.5;

export function hasTokenBoundaryMatch(text: string, phrase: string): boolean;
export function tokenizeText(text: string): string[];
export function retrieveCorpus(query: string, topK?: number, minScore?: number): RetrievalHit[];
```

### 3. Triage & Escalation Contract (`src/server/pipeline/run.ts`)
```typescript
export interface L1Extraction {
  symptoms: string[];
  riskGroup: 'child' | 'pregnant' | 'elderly' | 'chronic' | 'none';
  redFlagConcerns: string[];
  durationDays: number | null;
  triageSuggestion: TriageLevel;
  triageReason: string;
  // ...
}

export function l1Escalates(l1: L1Extraction | null): { escalate: boolean; concernsText: string };
```

### 4. LLM Multi-Provider Cascade Contract (`src/server/llm.ts`)
```typescript
export type ProviderTier = 'tier1_gemini' | 'tier2_groq' | 'tier3_offline';

export interface CascadeOptions {
  timeoutMs?: number;
  abortSignal?: AbortSignal;
  temperature?: number;
  jsonMode?: boolean;
  onDelta?: (delta: string) => void;
}

export function llmChatStream(
  systemPrompt: string,
  messages: LlmMessage[],
  onDelta: (delta: string) => void,
  opts?: CascadeOptions
): Promise<LlmResult>;

export function llmJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  opts?: CascadeOptions
): Promise<T | null>;
```

---

## Code Layout
- `src/lib/types.ts` — Type contracts, stream definitions, triage order
- `src/lib/engine/safety-engine.ts` — Deterministic L0 matcher, token boundary search, corpus retrieval, offline engine
- `src/data/corpus.ts` — Verified clinical knowledge base corpus and tags
- `src/data/lexicon.ts` — Red flag definitions, severity modifiers, emergency numbers
- `src/server/pipeline/run.ts` — Core end-to-end pipeline execution and stream orchestration
- `src/server/llm.ts` — Multi-provider cascade, circuit breaker, and timeout management
- `src/server/conversation-history.ts` — Conversation DTO transformations
- `tests/safety/` — Comprehensive safety & invariant test suites
- `tests/e2e/` — End-to-end invariant and performance verification harnesses
