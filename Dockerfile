# ============================================================
# SehatAI Care Connect — Production Dockerfile
# Multi-stage standalone build using Node 22 Alpine
# ============================================================

# 1. Base image with necessary Alpine runtime libraries
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# 2. Dependencies installation
FROM base AS deps
WORKDIR /app

# Install Bun for fast package installation
RUN npm install -g bun

COPY package.json bun.lock* ./
COPY prisma ./prisma/

RUN bun install --frozen-lockfile || npm install
RUN npx prisma generate

# 3. Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV DOCKER_BUILD=1
ENV NEXT_TELEMETRY_DISABLED=1

# Generate prisma client inside builder stage
RUN npx prisma generate
RUN npm run build

# 4. Production Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Create private storage directory for encrypted health documents (§37)
RUN mkdir -p /app/storage/care && chown -R nextjs:nodejs /app/storage

# Copy standalone build assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

# Release instructions documented in docs/CARE_CONNECT_DEPLOYMENT.md:
# Before starting container, run migrations: npx prisma migrate deploy
# Optional seed: npx tsx prisma/seed-care.ts
CMD ["node", "server.js"]
