-- Additive schema repair. Existing policies retain the fail-closed approval defaults.
ALTER TABLE "JurisdictionPolicy"
  ADD COLUMN "approvalExpiresAt" TIMESTAMP(3),
  ADD COLUMN "humanApprovedAt" TIMESTAMP(3),
  ADD COLUMN "humanApprovedById" TEXT,
  ADD COLUMN "legalApprovalSource" TEXT,
  ADD COLUMN "scope" TEXT DEFAULT 'DOMESTIC';
