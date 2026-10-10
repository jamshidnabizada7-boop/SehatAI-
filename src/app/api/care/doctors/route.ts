// Care Connect §18 — Marketplace doctor listing (patient-facing).
// Filters: q, specialty, language, gender, country, type, maxPrice, currency,
// onlineNow, sort. Ranking is transparent (§20); sponsored slots are
// labeled and sort last (none exist today).
import { NextRequest, NextResponse } from 'next/server';
import { getCareSession } from '@/lib/care/care-auth';
import { listMarketplaceDoctors } from '@/server/care/marketplace';
import { rateLimit, clientIpFrom, RATE_LIMITS } from '@/lib/care/rate-limit';
import { careFlag } from '@/lib/care/flags';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const enabled = await careFlag('CARE_ENABLED');
  if (!enabled) return NextResponse.json({ error: 'CARE_DISABLED' }, { status: 404 });

  const rl = await rateLimit(`care-doctors:${clientIpFrom(req)}`, RATE_LIMITS.doctorSearch.limit, RATE_LIMITS.doctorSearch.windowSeconds);
  if (!rl.allowed) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });

  const session = await getCareSession();
  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const validTypes = ['TEXT', 'AUDIO', 'VIDEO'];

  const doctors = await listMarketplaceDoctors({
    q: url.searchParams.get('q')?.trim() || undefined,
    specialty: url.searchParams.get('specialty')?.trim() || undefined,
    language: url.searchParams.get('language')?.trim() || undefined,
    gender: (url.searchParams.get('gender') as 'male' | 'female') || undefined,
    country: url.searchParams.get('country')?.trim() || undefined,
    consultationType: type && validTypes.includes(type) ? (type as 'TEXT' | 'AUDIO' | 'VIDEO') : undefined,
    maxPriceMinor: url.searchParams.get('maxPrice') ? Number(url.searchParams.get('maxPrice')) : undefined,
    currency: url.searchParams.get('currency')?.trim() || undefined,
    onlineNow: url.searchParams.get('onlineNow') === 'true',
    patientId: session?.id ?? null,
    sort: (url.searchParams.get('sort') as 'relevance' | 'price_asc' | 'price_desc' | 'rating') || 'relevance',
    includeTest: url.searchParams.get('includeTest') === 'true' || process.env.APP_ENV === 'staging' || process.env.SEHATAI_STAGING === '1' || process.env.STAGING_MODE === 'true',
  });

  return NextResponse.json({
    doctors: doctors.map((d) => ({
      ...d,
      // Explicit label contract for any future paid placement (§20)
      sponsoredLabel: d.sponsored ? 'Sponsored' : null,
    })),
    count: doctors.length,
  });
}
