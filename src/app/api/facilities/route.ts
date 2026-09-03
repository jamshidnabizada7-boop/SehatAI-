import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { haversineKm } from '@/data/facilities-seed';
import type { Facility } from '@/lib/types';

export const runtime = 'nodejs';

interface FacilityRow {
  id: string;
  name: string;
  nameUr: string | null;
  type: string;
  lat: number;
  lng: number;
  city: string;
  district: string;
  phone: string | null;
  services: string;
  emergency24: boolean;
  source: string;
  verified: boolean;
}

type FacilityDto = Omit<Facility, 'emergency24h'> & { emergency24h: boolean; distanceKm?: number };

function mapFacility(f: FacilityRow, distanceKm?: number): FacilityDto {
  let services: string[] = [];
  try {
    const parsed = JSON.parse(f.services);
    if (Array.isArray(parsed)) services = parsed.filter((s): s is string => typeof s === 'string');
  } catch {
    services = [];
  }
  const dto: FacilityDto = {
    id: f.id,
    name: f.name,
    nameUr: f.nameUr ?? undefined,
    type: f.type as Facility['type'],
    lat: f.lat,
    lng: f.lng,
    city: f.city,
    district: f.district,
    phone: f.phone ?? undefined,
    services,
    emergency24h: f.emergency24,
    source: f.source,
    verified: f.verified,
  };
  if (typeof distanceKm === 'number') dto.distanceKm = Math.round(distanceKm * 10) / 10;
  return dto;
}

/**
 * GET /api/facilities?lat&lng&city&type&radiusKm
 * - with lat/lng: filters by radius (default 50km) and sorts by distance
 * - otherwise: city matches sorted first
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const lat = parseFloat(sp.get('lat') ?? '');
    const lng = parseFloat(sp.get('lng') ?? '');
    const city = (sp.get('city') ?? '').trim();
    const type = (sp.get('type') ?? 'all').trim();
    const radiusKmRaw = parseFloat(sp.get('radiusKm') ?? '');
    const radiusKm = isFinite(radiusKmRaw) && radiusKmRaw > 0 ? radiusKmRaw : 50;

    let rows = (await db.facility.findMany()) as unknown as FacilityRow[];
    if (type && type !== 'all') {
      rows = rows.filter((f) => f.type === type);
    }

    const hasCoords = isFinite(lat) && isFinite(lng) && !isNaN(lat) && !isNaN(lng);
    let facilities: FacilityDto[];

    if (hasCoords) {
      facilities = rows
        .map((f) => mapFacility(f, haversineKm(lat, lng, f.lat, f.lng)))
        .filter((f) => (f.distanceKm ?? Infinity) <= radiusKm)
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    } else {
      facilities = rows
        .map((f) => mapFacility(f))
        .sort((a, b) => {
          const cityRank = (a.city === city ? 0 : 1) - (b.city === city ? 0 : 1);
          if (cityRank !== 0) return cityRank;
          const em = Number(b.emergency24h) - Number(a.emergency24h);
          if (em !== 0) return em;
          return a.name.localeCompare(b.name);
        });
    }

    return NextResponse.json({ facilities, count: facilities.length });
  } catch {
    return NextResponse.json({ facilities: [], count: 0, error: 'failed to load facilities' }, { status: 200 });
  }
}
