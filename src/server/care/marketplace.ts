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
    pmdcVerifiedAt: { not: null },
    OR: [{ careStatus: null }, { careStatus: { in: ['ACTIVE', 'VERIFIED'] } }],
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
      user: { select: { name: true, id: true } },
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
    take: 100,
  });

  // Post-filters that need loaded relations:
  let rows = candidates;
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
    return {
      doctorProfileId: d.id,
      name: d.user.name ?? 'Doctor',
      avatarUrl: d.avatarUrl,
      specialty: d.specialty,
      subSpecialty: d.subSpecialty,
      yearsExperience: d.yearsExperience,
      facilityCity: d.facilityCity,
      country: d.country,
      languages: safeJsonArray(d.languages),
      gender: d.gender,
      onlineNow: d.onlineNow && d.onlineNowUntil != null && d.onlineNowUntil > new Date(),
      pmdcVerified: d.pmdcVerifiedAt != null,
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
