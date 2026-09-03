# SehatAI — Deployment & Post-Download Guide
## Alibaba Cloud AI Hackathon Pakistan 2026

This guide covers everything you need to do after downloading the project: deploying to Vercel, setting up Neon DB, enabling mobile/PWA installation, and ensuring offline + online functionality.

---

## Table of Contents
1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [Vercel Deployment](#2-vercel-deployment)
3. [Neon Database Setup](#3-neon-database-setup)
4. [Environment Variables](#4-environment-variables)
5. [Mobile PWA Installation](#5-mobile-pwa-installation)
6. [Offline Mode Setup](#6-offline-mode-setup)
7. [Online Mode (LLM Providers)](#7-online-mode-llm-providers)
8. [Post-Deployment Verification](#8-post-deployment-verification)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Pre-Deployment Checklist

Before deploying, verify you have:

- [x] **Repository**: `https://github.com/jamshidnabizada7-boop/SehatAI-` (public)
- [x] **No secrets committed**: `.env` and `*.db` files are in `.gitignore`
- [x] **`.env.example`**: Contains all required variables with placeholder values
- [x] **100% accuracy**: 139/139 golden test cases pass
- [x] **PWA files**: `manifest.json`, `sw.js`, `icon.svg` in `/public`
- [x] **Deliverables**: All files in `/DELIVERABLE` folder

---

## 2. Vercel Deployment

### Step 1: Import Repository
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"** → Import `SehatAI-` repository
3. Vercel auto-detects Next.js — keep defaults

### Step 2: Configure Build
```
Framework Preset: Next.js
Build Command: prisma generate && next build
Install Command: bun install
Output Directory: .next
```

### Step 3: Add Environment Variables
In Vercel → Settings → Environment Variables, add ALL variables from `.env.example`:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | Neon connection string (see §3) | ✅ |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | ✅ |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | ✅ |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Your Gemini API key | ✅ |
| `GROQ_API_KEY` | Your Groq API key | ✅ |
| `DASHSCOPE_API_KEY` | Your Alibaba DashScope key | ✅ |
| `OPENROUTER_API_KEY` | Your OpenRouter key | ⚠ Optional |
| `ZAI_API_KEY` | Your ZAI SDK key | ⚠ Optional |

### Step 4: Deploy
Click **"Deploy"**. Wait 2-3 minutes for build to complete.

### Step 5: Update NEXTAUTH_URL
After first deployment, update `NEXTAUTH_URL` to your Vercel domain:
```
NEXTAUTH_URL=https://sehatai-woad.vercel.app
```

---

## 3. Neon Database Setup

SehatAI uses Prisma ORM. For production, use **Neon** (serverless PostgreSQL) instead of SQLite.

### Step 1: Create Neon Account
1. Go to [neon.tech](https://neon.tech) and sign up (free tier)
2. Create a new project: **"SehatAI"**
3. Select region: **Singapore** (closest to Pakistan)

### Step 2: Get Connection String
```
postgresql://user:password@ep-xxx.region.aws.neon.tech/sehatai?sslmode=require
```

### Step 3: Update Prisma Schema
Edit `prisma/schema.prisma` — change the datasource provider:
```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

### Step 4: Set DATABASE_URL in Vercel
```
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/sehatai?sslmode=require
```

### Step 5: Push Schema to Neon
```bash
# Run locally with DATABASE_URL set to Neon
DATABASE_URL="your-neon-connection-string" bun run db:push
```

### Step 6: Seed Emergency Numbers
```bash
DATABASE_URL="your-neon-connection-string" bun run db:seed
```

---

## 4. Environment Variables

### Required for Core Functionality
```env
DATABASE_URL="postgresql://...neon.tech/sehatai?sslmode=require"
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="openssl-rand-base64-32-output"
```

### Required for LLM Responses (Online Mode)
```env
# At least ONE of these must be set for AI responses
GOOGLE_GENERATIVE_AI_API_KEY="AIza..."      # Google Gemini (free tier)
GROQ_API_KEY="gsk_..."                       # Groq (free tier, fast)
DASHSCOPE_API_KEY="sk-..."                   # Alibaba DashScope (Qwen)
```

### Optional (Enhanced Features)
```env
OPENROUTER_API_KEY="sk-or-..."               # Multi-model gateway
ZAI_API_KEY="..."                            # ZAI Web Dev SDK
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."           # Push notifications
VAPID_PRIVATE_KEY="..."                      # Push notifications
GOOGLE_CLIENT_ID="..."                       # Google OAuth
GOOGLE_CLIENT_SECRET="..."                   # Google OAuth
```

### Getting API Keys (Free Tiers)
| Provider | URL | Free Tier |
|----------|-----|-----------|
| Google Gemini | [aistudio.google.com](https://aistudio.google.com) | ✅ Free |
| Groq | [console.groq.com](https://console.groq.com) | ✅ Free |
| Alibaba DashScope | [dashscope.aliyun.com](https://dashscope.aliyun.com) | ✅ Free credits |
| OpenRouter | [openrouter.ai](https://openrouter.ai) | ⚠ Limited free |
| ZAI SDK | [z.ai](https://z.ai) | ✅ Included |

---

## 5. Mobile PWA Installation

SehatAI is a **Progressive Web App** — installable on Android, iOS, and Desktop.

### Android (Chrome)
1. Open `https://sehatai-woad.vercel.app` in Chrome
2. Tap the **menu** (⋮) → **"Add to Home screen"**
3. Tap **"Install"**
4. App appears in app drawer — works like a native app

### iOS (Safari)
1. Open the URL in Safari
2. Tap the **Share** button (□↑)
3. Tap **"Add to Home Screen"**
4. Tap **"Add"**

### Desktop (Chrome/Edge)
1. Open the URL
2. Click the **install icon** (⊕) in the address bar
3. Click **"Install"**

### PWA Features Enabled
- ✅ **Standalone display** (no browser chrome)
- ✅ **App icon** on home screen
- ✅ **Splash screen** with SehatAI branding
- ✅ **Offline shell** (cached UI works without internet)
- ✅ **Push notifications** (medication reminders)
- ✅ **Theme color** (emerald green)

---

## 6. Offline Mode Setup

SehatAI works **offline** — the safety engine and emergency cards are bundled in the app.

### What Works Offline
- ✅ **Emergency detection** (L0 lexicon, 28 patterns)
- ✅ **Emergency action cards** (trilingual WHO/IFRC templates)
- ✅ **Emergency numbers** (1122, 1166, 115 — one-tap dial)
- ✅ **First-aid cards** (23 pre-verified templates)
- ✅ **Corpus content** (160 articles cached)
- ✅ **Chat history** (stored locally)

### What Requires Internet
- ⚠ **LLM generation** (routine health guidance)
- ⚠ **Voice input** (ASR transcription)
- ⚠ **Facility finder** (GPS + live data)
- ⚠ **Push notifications** (reminders)

### How Offline Works
1. **Service Worker** (`/public/sw.js`) caches the app shell on first visit
2. **L0 Lexicon Engine** runs entirely client-side (deterministic, <100ms)
3. **Emergency templates** are bundled in the JavaScript
4. **IndexedDB** stores conversation history locally
5. **Fallback mode**: If LLM is unavailable, deterministic corpus-based responses are shown

### Testing Offline Mode
1. Open the app
2. Click **"Simulate offline"** in the header (toggle button)
3. Type an emergency query: `"mera seenay mein shadeed dard hai"`
4. Verify: Emergency card appears in <100ms (LLM not needed)

---

## 7. Online Mode (LLM Providers)

For non-emergency queries, SehatAI uses a **7-tier LLM provider cascade** with circuit-breaker failover:

### Provider Cascade (in order)
| Tier | Provider | Model | Use Case |
|------|----------|-------|----------|
| 1 | Alibaba DashScope | Qwen 2.5 | Primary (Alibaba Cloud) |
| 2 | Google Gemini | 2.5 Flash | Failover |
| 3 | Groq | Llama 3.3 70B | Low-latency |
| 4 | Cerebras | Llama 3.1 | Ultra-fast |
| 5 | OpenRouter | Multi-model | Gateway |
| 6 | ZAI Web Dev SDK | GLM-4 | Fallback |
| 7 | Offline Deterministic | Corpus RAG | Last resort (<500ms) |

### Circuit Breaker
- **CLOSED**: Normal operation, requests flow
- **OPEN**: After 3 failures, skip provider for 60 seconds
- **HALF_OPEN**: Test with 1 request after cooldown

### Adding Multiple LLMs
Set ALL provider keys in `.env` for maximum reliability:
```env
GOOGLE_GENERATIVE_AI_API_KEY=...    # Gemini
GROQ_API_KEY=...                    # Groq
DASHSCOPE_API_KEY=...               # Alibaba Qwen
OPENROUTER_API_KEY=...              # OpenRouter
ZAI_API_KEY=...                     # ZAI
```

The system automatically fails over if any provider is down.

---

## 8. Post-Deployment Verification

After deploying, run these checks:

### Health Check
```bash
curl https://your-app.vercel.app/api/health
# Expected: {"status":"ok","db":"connected","corpus":160,"lexicon":35}
```

### Emergency Detection
```bash
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"mera seenay mein shadeed dard hai aur saans phool rahi hai","sessionId":"test","lang":"roman"}'
# Expected: EMERGENCY triage, 67ms, LLM bypassed
```

### Evaluation
```bash
# Run full 139-case eval
curl -X POST https://your-app.vercel.app/api/eval/run
# Expected: 100% accuracy (139/139)
```

### PWA Installability
1. Open Chrome DevTools → Application → Manifest
2. Verify: `display: standalone`, icons present
3. Open Application → Service Workers
4. Verify: `sw.js` registered and active

### Mobile Test
1. Open on Android/iOS
2. Verify: "Add to Home Screen" prompt
3. Install and verify standalone display

---

## 9. Troubleshooting

### "NEXTAUTH_SECRET not set"
```bash
# Generate a secret
openssl rand -base64 32
# Add to Vercel env vars
NEXTAUTH_SECRET=generated-secret-here
```

### "Database connection failed"
- Verify `DATABASE_URL` is the Neon connection string
- Ensure `?sslmode=require` is appended
- Run `bun run db:push` to create tables

### "LLM responses not working"
- At least one API key must be set (Gemini, Groq, or DashScope)
- Check Vercel function logs for circuit breaker state
- The system falls back to offline deterministic mode if all LLMs fail

### "PWA not installable"
- Verify `manifest.json` is accessible at `/manifest.json`
- Verify `sw.js` is accessible at `/sw.js`
- Ensure HTTPS (Vercel provides this automatically)
- Check Chrome DevTools → Application → Manifest for errors

### "Offline mode not working"
- Service worker must be registered (check DevTools → Application → SW)
- First visit requires internet to cache the shell
- After caching, the app works offline
- Use the "Simulate offline" toggle in the header to test

---

## Quick Start Summary

```bash
# 1. Clone and install
git clone https://github.com/jamshidnabizada7-boop/SehatAI-.git
cd SehatAI-
bun install

# 2. Set up environment
cp .env.example .env
# Edit .env with your API keys

# 3. Set up database
bun run db:push

# 4. Run development
bun run dev

# 5. Deploy to Vercel
# - Import repo on vercel.com
# - Add all env vars
# - Deploy

# 6. Set up Neon DB (production)
# - Create account at neon.tech
# - Update DATABASE_URL
# - Run db:push with Neon URL

# 7. Test on mobile
# - Open Vercel URL on phone
# - Add to Home Screen
# - Test offline mode
```

---

## Submission Checklist

- [x] **Repository URL**: `https://github.com/jamshidnabizada7-boop/SehatAI-`
- [x] **Project Summary**: 1,487 characters (in `SUBMISSION_SUMMARY.md`)
- [x] **Presentation**: `SehatAI-Presentation.pptx` (15 MB, 12 slides)
- [x] **Supporting Doc**: `SehatAI-Architecture.pdf` (264 KB, 6 pages)
- [x] **Demo Link**: `https://sehatai-woad.vercel.app`
- [x] **100% Accuracy**: 139/139 golden test cases
- [x] **Trilingual**: English, Urdu Nastaliq, Roman Urdu
- [x] **Offline-capable PWA**: Service worker + manifest
- [x] **7-tier LLM cascade**: Multi-provider failover
- [x] **No secrets committed**: .env in .gitignore

---

*SehatAI · صحت AI · Alibaba Cloud AI Hackathon Pakistan 2026*
