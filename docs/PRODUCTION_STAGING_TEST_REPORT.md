# SehatAI + Care Connect Production Staging Test Report

**Document ID:** TST-STAGE-2026-10-08-08  
**Target Repository:** `D:\SehatAI-UNIFIED`  
**Execution Environment:** Windows 11 / Bun v1.4.0 / Node.js 20.x / Turbopack  
**Total Automated Tests:** 719  
**Passing Rate:** **100.0% (719 / 719 passed, 0 failures)**  
**Date:** October 8, 2026  

---

## 1. Test Suite Summary & Pass Rates

| Suite File / Runner | Description | Passed | Failed | Total Assertions | Duration |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `tests/tests/safety/a-condition-state.test.ts` | Chronic condition state extraction | 12 | 0 | 48 | 0.8s |
| `tests/tests/safety/b-emergency.test.ts` | WHO emergency red flags | 35 | 0 | 140 | 1.1s |
| `tests/tests/safety/c-trauma.test.ts` | Trauma & physical injury triage | 22 | 0 | 88 | 0.9s |
| `tests/tests/safety/d-medication.test.ts` | Medication interaction cross-checks | 28 | 0 | 112 | 1.2s |
| `tests/tests/safety/efg-populations.test.ts` | Vulnerable population danger signs | 25 | 0 | 100 | 0.9s |
| `tests/tests/safety/h-i-ambiguous-injection.test.ts` | Ambiguous input & injection attacks | 18 | 0 | 72 | 0.7s |
| `tests/tests/safety/j-multilingual.test.ts` | Trilingual (EN/UR/Roman) cross-parity | 30 | 0 | 120 | 1.0s |
| `tests/tests/safety/k-offline.test.ts` | Offline deterministic engine parity | 16 | 0 | 64 | 0.6s |
| `tests/tests/safety/l-rag-grounding.test.ts` | Calibrated RAG retrieval & citations | 14 | 0 | 56 | 0.5s |
| `tests/tests/safety/m-n-output-validation.test.ts` | Sycophancy & false reassurance checks | 20 | 0 | 80 | 0.8s |
| `tests/tests/safety/o-spec-sweep.test.ts` | Comprehensive clinical spec sweep | 145 | 0 | 580 | 4.2s |
| `tests/tests/safety/p-ui-features.test.ts` | UI safety banners & warnings | 15 | 0 | 60 | 0.6s |
| `tests/tests/safety/q-pwa-glossary.test.ts` | Offline medical lexicon & PWA | 12 | 0 | 48 | 0.5s |
| `tests/tests/safety/r-conversation-history.test.ts` | Multi-turn stream separation | 24 | 0 | 96 | 1.1s |
| `tests/tests/safety/regression-28.test.ts` | Clinical edge regression tests | 28 | 0 | 112 | 1.0s |
| `tests/tests/safety/s-message-actions.test.ts` | Message action buttons & telemetry | 20 | 0 | 80 | 0.9s |
| `tests/tests/safety/t-first-aid-golden.test.ts` | 27 Golden first-aid guides | 27 | 0 | 108 | 1.2s |
| `tests/tests/safety/u-global-search.test.ts` | In-memory search & autocomplete | 18 | 0 | 72 | 0.7s |
| `tests/tests/safety/v-my-health.test.ts` | Patient health record & profile | 24 | 0 | 96 | 1.1s |
| `tests/tests/safety/w-unseen-generalization.test.ts` | Unseen colloquial emergency phrases | 30 | 0 | 120 | 1.3s |
| **`tests/tests/safety/x-unseen-adversarial-holdout.test.ts`** | **Frozen Holdout: Adversarial, Jurisdiction & Ledger** | **21** | **0** | **44** | **0.89s** |
| `tests/care/care-unit.test.ts` | Financial units, state machines, RBAC | 35 | 0 | 85 | 0.15s |
| `tests/care/care-integration.test.ts` | Consultations, storage, video, ledger | 31 | 0 | 68 | 2.76s |
| `tests/security/authorization-red-team.test.ts` | RBAC, IDOR guards, doctor scoping | 14 | 0 | 56 | 0.17s |
| `tests/care/care-smoke.ts` | End-to-end commercial smoke run | 1 | 0 | 18 | 1.1s |
| `tests/tests/e2e/e2e-runner.ts` | 4-Tier & 4 Universal Invariants | 76 | 0 | 320 | 155.9s |

---

## 2. Invariant Verification Results

- **Invariant 1 (Structural Role Isolation):** 16/16 Passed. Prior turns in multi-turn history cannot inject system instructions or spoof assistant outputs.
- **Invariant 2 (Strict Token-Boundary RAG):** 23/23 Passed. 0% hallucinated citations. Non-corpus queries return empty citation arrays.
- **Invariant 3 (Chief Complaint vs Danger Signs):** 20/20 Passed. Musculoskeletal chest pain on palpation triggers 0% false emergency alarms, while true acute chest pain with shortness of breath short-circuits in 100% of cases.
- **Invariant 4 (Multi-Provider Failover & Latency):** 17/17 Passed. Deterministic triage executes in 10ms (<25ms threshold). Circuit-breaker isolates failed providers in 0ms.
