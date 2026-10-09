# SehatAI Care Connect — Managed PostgreSQL Provisioning Guide (§94)

## 1. Overview
SehatAI requires PostgreSQL 16 with:
- **SCRAM-SHA-256** password authentication.
- Enforced TLS encryption in transit (`sslmode=require` / `rds.force_ssl = 1`).
- Separate connection endpoints:
  - **Unpooled Primary (Port 5432):** Used exclusively for Prisma migrations (`npx prisma migrate deploy`).
  - **Connection Pooled (Port 6543 / PgBouncer):** Used for Next.js serverless/container runtime traffic.

---

## 2. Recommended Cloud Managed Providers

### Option A: AWS RDS PostgreSQL 16 (Recommended for Multi-Region)
- **Engine Version:** PostgreSQL 16.4 or later
- **Instance Class:** `db.t4g.medium` (Staging) | `db.r6g.large` Multi-AZ (Production)
- **Storage:** gp3, 50 GB (Staging) | 200 GB Auto-scaling to 1 TB (Production)
- **Multi-AZ Deployment:** Disabled (Staging) | Enabled (Production)
- **Parameter Group Adjustments:**
  - `rds.force_ssl = 1`
  - `password_encryption = scram-sha-256`
  - `log_min_duration_statement = 250` (log queries > 250ms)
- **Backup Retention:** 7 days (Staging) | 30 days continuous PITR (Production)

### Option B: Neon Serverless PostgreSQL
- **Compute:** 0.5 CU (Staging) | Autoscale 1–4 CU (Production)
- **Connection Strings Provided:**
  - Direct connection string (`DATABASE_URL_UNPOOLED`)
  - Pooled PgBouncer connection string (`DATABASE_URL_POOLED` with `-pooler` suffix)

### Option C: Supabase Enterprise / Self-Hosted
- **Engine:** PostgreSQL 16
- **Connection Pooling:** Built-in Supavisor / PgBouncer on port 6543 (transaction mode).

---

## 3. Database Roles & Least-Privilege Provisioning

Execute via superuser/admin connection:

```sql
-- 1. Create dedicated application role
CREATE ROLE sehatai_app WITH LOGIN PASSWORD 'REPLACE_WITH_HIGH_ENTROPY_PASSWORD';

-- 2. Create dedicated migration role
CREATE ROLE sehatai_migrator WITH LOGIN PASSWORD 'REPLACE_WITH_HIGH_ENTROPY_PASSWORD';

-- 3. Grant schema ownership/permissions
GRANT CONNECT ON DATABASE sehatai_production TO sehatai_app;
GRANT CONNECT ON DATABASE sehatai_production TO sehatai_migrator;

\c sehatai_production

GRANT USAGE ON SCHEMA public TO sehatai_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sehatai_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sehatai_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sehatai_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO sehatai_app;

-- Migrator needs full schema creation rights
GRANT ALL ON SCHEMA public TO sehatai_migrator;
```

---

## 4. Prisma Release Pipeline Commands

```bash
# Step 1: Deploy versioned database migrations (Zero-Loss, Non-Destructive)
# Uses DATABASE_URL_UNPOOLED to avoid PgBouncer transaction-mode locking
npx prisma migrate deploy

# Step 2: Idempotent baseline seed
npx tsx prisma/seed.ts
npx tsx prisma/seed-care.ts
```
