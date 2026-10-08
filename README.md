# SehatAI (صحت AI) 🏥🇵🇰

> **Unified Clinical AI Health Guidance & Verified Doctor Telemedicine Platform**  
> Multilingual (English · اردو Nastaliq · Roman Urdu) | Deterministic Emergency Safety | Care Connect Telemedicine Marketplace | Double-Entry Financial Ledger | Offline-Capable PWA

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

---

## 🌟 Overview

**SehatAI** is an authoritative, end-to-end digital health platform designed for regional accessibility and patient safety across Pakistan and surrounding corridors.

It bridges acute triage and formal clinical care across two tightly integrated pillars:
1. **Core AI Health Assistant**: Deterministic zero-latency L0 emergency triage (<5ms), multilingual grounded RAG, constellation validator consensus with strict veto enforcement, offline emergency cards, and real-time inference telemetry via the Judge Inspector.
2. **Care Connect Marketplace**: PMDC-verified doctor discovery, real-time availability booking, multi-party escrow payments, immutable double-entry financial ledger, WebRTC audio/video consultations, secure clinical messaging, structured AI clinical intake & handoffs, and durable notification outbox delivery.

---

## 🛡️ Unified Platform Architecture

```
                                  [ PATIENT USER ]
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
       [ AI Health Assistant ]                       [ Care Connect Marketplace ]
       - Trilingual Input (EN / UR / Roman)          - Verified Doctor Discovery
       - L0 Red-Flag Bypass (<5ms)                   - Specialty & Jurisdiction Matching
       - Constellation Veto Safety Pipeline          - Telemedicine Consent Tracking
       - Offline PWA Emergency Guidance              - Slot Booking & Multi-channel Checkout
                   │                                           │
                   ▼                                           ▼
       ┌────────────────────────┐                   ┌────────────────────────┐
       │ Deterministic Safety   │                   │ Escrow & Ledger Core   │
       │ - 1122 / 1166 Fallback │                   │ - Immutable Journal    │
       │ - Dosage & Rx Redact   │                   │ - Minor Units & BPS Fee│
       │ - Strict Abstention    │                   │ - Refund & Payout Guard│
       └────────────────────────┘                   └────────────────────────┘
                   │                                           │
                   └─────────────────┬─────────────────────────┘
                                     ▼
                        [ Doctor Care Dashboard ]
                        - Clinical Handoff Review (AI Intake)
                        - WebRTC Audio / Video Consultations
                        - Private SOAP Notes & Prescriptions
                        - Wallet Balance & Payout History
```

---

## ✨ Key Capabilities

### 1. Deterministic Multi-Tier Safety Pipeline
- **Zero-Latency L0 Lexicon (<5ms)**: 16 red flag pattern categories detect life threats (cardiac, stroke, sepsis, maternal hemorrhage, neonatal distress, poison) and immediately bypass the LLM with pre-rendered action cards and one-tap emergency calling (`1122`, `1166`, `115`).
- **Constellation Consensus with Critical Veto**: Multi-validator pipeline (`red-flag-recheck`, `medication-safety`, `clinical-grounding`). Any critical veto triggers deterministic safe fallback rather than returning hallucinated outputs.
- **Judge Inspector Panel**: Real-time diagnostic panel exposing model cascade hierarchy, latency, validator votes, grounding citations, and confidence bands without leaking internal chain-of-thought tokens.

### 2. Commercial Care Connect Subsystem
- **PMDC Doctor Directory**: Verified credentials, sub-specialties, consulting fees, languages, and availability scheduling.
- **Telemedicine Jurisdiction Engine**: Validates declared patient physical location against doctor licensing boundaries and regional telemedicine regulations prior to booking.
- **Immutable Financial Ledger**: All doctor wallet balances derive strictly from double-entry ledger transactions (`HELD_IN_ESCROW`, `COMMISSION_EARNED`, `DOCTOR_PENDING`, `DOCTOR_AVAILABLE`, `REFUNDED`). Minor integer units (`priceMinor`) and basis point commissions prevent floating-point rounding errors.
- **WebRTC Video/Audio Provider Abstraction**: Supports local development signaling with fallback ladders (`VIDEO` → `AUDIO` → `TEXT CHAT`), architected for zero-loss handoff to managed production WebRTC (LiveKit).
- **Durable Notification Outbox**: Enqueues notifications to `NotificationOutbox` to guarantee delivery across serverless timeouts, network failures, and client disconnections.

### 3. Patient Privacy & Storage Security
- **No PHI in Public Paths**: PMDC credentials, medical certificates, and consultation attachments are stored in private storage (`storage/`) outside web root, protected by magic-byte verification, size limits, and authenticated streaming endpoints.
- **Immediate Role Revocation**: `requireUser()` performs live database verification to promptly revoke access for suspended doctors or demoted administrator sessions.
- **Strict Content Security**: Production security headers enforce HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `camera=(self), microphone=(self)` permissions policies.

---

## 🧰 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions, SSE Streaming)
- **Frontend**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Database & ORM**: [Prisma ORM](https://www.prisma.io/) (PostgreSQL in production; SQLite local dev)
- **Realtime & Calling**: WebRTC with low-bandwidth fallback ladder
- **Authentication**: NextAuth.js credentials provider with TOTP 2FA for privileged roles
- **Testing**: Bun Test Suite, TSX integration runners

---

## 🚀 Quickstart & Local Development

### 1. Prerequisites
- [Bun](https://bun.sh/) (v1.2+) or [Node.js](https://nodejs.org/) (v22+)
- Git

### 2. Setup
```bash
# Clone the repository
git clone https://github.com/jamshidnabizada7-boop/SehatAI-.git
cd SehatAI-

# Install dependencies
bun install

# Configure environment
cp .env.example .env
```

### 3. Initialize Database
```bash
# Generate Prisma Client
bun run prisma generate

# Push schema to local SQLite development database
bun run prisma db push

# Seed core health facilities, medical corpus, and Care Connect doctors
bun x tsx prisma/seed.ts
bun x tsx prisma/seed-care.ts
```

### 4. Run Development Server
```bash
bun dev
# Application will run at http://localhost:3000
```

---

## 🧪 Testing & Quality Verification

Run repository-wide verification suites:

```bash
# 1. Full repository TypeScript check (0 errors required)
bun run typecheck

# 2. ESLint code standard check
bun run lint

# 3. Medical Safety & Invariant Tests
bun run test:safety

# 4. Care Connect Unit & Integration Tests
bun run test:care

# 5. Care Connect Commercial Loop Smoke Test
bun x tsx tests/care/care-smoke.ts

# 6. Production Next.js Build
bun run build
```

---

## 📄 License & Legal Notice

- **Software License**: Licensed under the [MIT License](LICENSE).
- **Clinical & Legal Disclaimer**: SehatAI provides automated triage and health information for educational and preliminary support. It is not a substitute for professional medical judgment. Emergency cases must always seek in-person emergency care (`1122`). All documents under `docs/legal/` are drafts requiring licensed legal counsel review before commercial deployment.
