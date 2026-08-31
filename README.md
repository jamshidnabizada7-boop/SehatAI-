# SehatAI (صحت AI) 🏥🇵🇰

> **Safety-First AI Health Guidance & Triage Platform for Pakistan**  
> Multilingual (English · اردو Nastaliq · Roman Urdu) | Offline-Capable | Evidence-Grounded RAG | Instant Emergency Triage

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

---

## 🌟 Overview

**SehatAI** is a safety-first, trilingual health guidance PWA designed to bridge critical healthcare gaps in Pakistan. Built with strict clinical safety guardrails, it provides immediate triage, evidence-grounded health information, facility discovery, and offline-accessible emergency assistance in **English**, **Urdu (اردو Nastaliq)**, and **Roman Urdu**.

---

## 🛡️ Multi-Layer Safety Architecture

```
User Query (Text / Voice)
       │
       ▼
┌────────────────────────────────────────────────────────┐
│  L0 Safety Lexicon Engine (<5ms short-circuit)        │
│  - 16 Red Flag Pattern Groups                          │
│  - Direct match across English, Urdu & Roman Urdu      │
└───────────────────────┬────────────────────────────────┘
                        │
       ┌────────────────┴────────────────┐
       ▼                                 ▼
[ RED FLAG DETECTED ]           [ NO RED FLAG DETECTED ]
       │                                 │
       ▼                                 ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│ Emergency Screen Takeover │   │ L1 Pre-LLM Triage Classifier  │
│ - Pre-written Cards       │   │ (Urgent / Routine / Self-Care)│
│ - Bypass LLM Generation   │   └──────────────┬────────────────┘
│ - 1-tap Call: 1122 / 1166 │                  │
└───────────────────────────┘                  ▼
                                ┌───────────────────────────────┐
                                │ RAG Grounded Retrieval        │
                                │ (WHO / UNICEF / MoNHSRC Docs) │
                                └──────────────┬────────────────┘
                                               │
                                               ▼
                                ┌───────────────────────────────┐
                                │ Grounded LLM Response Gen     │
                                └──────────────┬────────────────┘
                                               │
                                               ▼
                                ┌───────────────────────────────┐
                                │ L2 Safety & Medical Validator │
                                │ (Checks no dosages / Rx)      │
                                └──────────────┬────────────────┘
                                               │
                                               ▼
                                   Safe, Verified Response
```

### 1. Zero-Latency L0 Lexicon (<5ms)
- Automatically detects severe conditions (cardiac arrest, stroke symptoms, severe bleeding, convulsions, maternal hemorrhage, neonatal danger signs, poisoning, snakebites, anaphylaxis).
- **Life-threatening emergencies completely bypass the generative LLM** to eliminate hallucination risk.
- Displays pre-verified trilingual emergency action cards with one-tap dialing for:
  - **1122**: Emergency Rescue Service
  - **1166**: National Health & Polio Helpline
  - **115**: Edhi Ambulance Service

### 2. RAG & Grounded Citations
- Responses are grounded in official verified guidelines (WHO, UNICEF, IFRC, MoNHSRC Pakistan).
- Strictly prohibits medical diagnosis, prescription writing, and drug dosage recommendations.

### 3. Trilingual Localization & RTL Support
- Full bidirectional support (RTL for Urdu Nastaliq script, LTR for English and Roman Urdu).
- Language mirroring and script switching (Urdu ⇄ Roman Urdu).

### 4. Honest Offline Capability
- Bundled offline safety engine and emergency protocol pack to provide deterministic, verified first-aid guidance even without internet access.

---

## ✨ Key Features

- **💬 Intelligent Safe Chat**: Real-time Server-Sent Events (SSE) streaming with multi-stage progress (Safety Check → Triage → Retrieval → Generation → Validation).
- **🎙️ Voice Input (ASR)**: Speech-to-text input supporting multilingual voice queries.
- **📍 Nearby Healthcare Finder**: Comprehensive directory of Basic Health Units (BHUs), Rural Health Centers (RHCs), Tehsil/District Headquarters (THQ/DHQ), Tertiary Hospitals, and 24/7 Pharmacies with GPS distance calculations.
- **⏰ Medication & Vaccine Reminders**: Track maternal antenatal visits, EPI childhood immunization schedules, and daily prescriptions.
- **📋 Doctor Visit Summary**: One-click printable and shareable structured clinical summaries of symptoms and timelines for healthcare providers.
- **🧪 Evaluation Dashboard & Golden Set**: Live evaluation harness testing safety benchmark cases (false-positive prevention, refusal tests, red flag sensitivity).

---

## 🧰 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions, SSE Streaming)
- **Frontend**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Database & ORM**: [Prisma ORM](https://www.prisma.io/) with SQLite
- **Animation & Icons**: [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/)
- **Charts & Visuals**: [Recharts](https://recharts.org/)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.18+ or v20+) or [Bun](https://bun.sh/)
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/jamshidnabizada7-boop/SehatAI.git
   cd SehatAI
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up the Database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Seed the Knowledge Base & Facilities**:
   ```bash
   npx prisma db seed
   # or
   bun prisma/seed.ts
   ```

5. **Start the Development Server**:
   ```bash
   npm run dev
   # or
   bun dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```text
├── src/
│   ├── app/                 # Next.js App Router (pages & API endpoints)
│   │   ├── api/chat/        # Streaming SSE chat handler
│   │   ├── api/eval/        # Evaluation harness endpoints
│   │   ├── api/facilities/  # Health facility lookup API
│   │   ├── api/reminders/   # User reminders API
│   │   ├── api/summary/     # Doctor visit summary export
│   │   └── api/voice/       # Voice transcription endpoint
│   ├── components/          # Modular React UI components
│   │   ├── about/           # About view & safety architecture breakdown
│   │   ├── app/             # App shell, navigation, offline banner
│   │   ├── chat/            # Chat interface & emergency overlay
│   │   ├── dashboard/       # Golden set eval metrics & logs
│   │   ├── facilities/      # Healthcare locator & filters
│   │   ├── reminders/       # Vaccine & medication reminders
│   │   └── ui/              # shadcn/ui components
│   ├── data/                # Clinical knowledge & safety data
│   │   ├── corpus.ts        # Verified medical corpus (WHO/UNICEF/MoNHSRC)
│   │   ├── emergency-templates.ts # Pre-verified emergency guidance cards
│   │   ├── eval-golden.ts   # 58-case golden evaluation dataset
│   │   ├── facilities-seed.ts # Nationwide healthcare facility dataset
│   │   ├── glossary.ts      # 110+ trilingual medical terms
│   │   └── lexicon.ts       # 16 red-flag pattern groups
│   ├── hooks/               # Custom React hooks (voice, speech, media)
│   └── lib/                 # Core engine, types, and utilities
│       ├── engine/          # L0 safety engine & RAG retrieval
│       └── store/           # Zustand global state store
├── prisma/                  # Database schema & migrations
└── public/                  # Static assets & PWA icons
```

---

## ⚖️ Medical Disclaimer

> **SehatAI is an informational triage and guidance tool, not a medical practitioner.**  
> It does not provide medical diagnosis, prescribe drugs, or determine medication dosages. In any medical emergency, users should immediately contact **Rescue 1122**, **1166**, or visit the nearest emergency healthcare center.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
