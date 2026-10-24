'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Baby,
  BadgeCheck,
  Building2,
  Clock,
  Crosshair,
  Home,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Search,
  ShieldCheck,
  Siren,
  Stethoscope,
  Store,
  Map as MapIcon,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import type { Facility } from '@/lib/types';
import { FACILITIES_SEED, haversineKm } from '@/data/facilities-seed';
import { cn } from '@/lib/utils';

const CITIES = [
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Multan',
  'Faisalabad',
  'Peshawar',
  'Quetta',
  'Hyderabad',
] as const;

type CategoryFilter = 'all' | '24_7' | 'hospital' | 'trauma' | 'maternity' | 'bhu';

type FacilityWithDistance = Facility & { distanceKm?: number };

interface FeaturedHospital {
  name: string;
  status: string;
  address: string;
  distance: string;
  details: string;
  image: string;
  phone: string;
  chips: string[];
}

const FEATURED_LAHORE_HOSPITALS: FeaturedHospital[] = [
  {
    name: 'Services Hospital Lahore',
    status: '24/7 ER',
    address: 'Jail Road, Shadman, Lahore',
    distance: '2.4 km',
    details: 'Trauma ICU, cardiac resuscitation, burn unit, blood bank.',
    image: '/assets/hospital_services.png',
    phone: '04299203402',
    chips: ['Emergency Room', 'Trauma', 'Pharmacy'],
  },
  {
    name: 'Punjab Institute of Cardiology (PIC)',
    status: '24/7 CARDIAC ER',
    address: 'Ghaus-ul-Azam Road, Lahore',
    distance: '3.1 km',
    details: 'Emergency angioplasty, CCU, chest pain center, cardiac catheterization.',
    image: '/assets/hospital_pic.png',
    phone: '04299203051',
    chips: ['Emergency Room', 'Trauma', 'Pharmacy'],
  },
  {
    name: 'Mayo Hospital Lahore',
    status: '24/7 ER',
    address: 'King Edward Medical University, Lahore',
    distance: '4.7 km',
    details: 'General surgery, medicine, pediatrics, trauma, burn unit.',
    image: '/assets/hospital_mayo.png',
    phone: '04299211100',
    chips: ['Emergency Room', 'Trauma', 'Pharmacy'],
  },
];

export function FacilitiesView() {
  const { toast } = useToast();
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);

  const [city, setCity] = useState<string>('Lahore');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [facilities, setFacilities] = useState<FacilityWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [locating, setLocating] = useState(false);

  const fetchFacilities = useCallback(
    async (targetCity: string, targetCoords: { lat: number; lng: number } | null) => {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams();
        if (targetCoords) {
          params.set('lat', String(targetCoords.lat));
          params.set('lng', String(targetCoords.lng));
        } else {
          params.set('city', targetCity);
        }
        const res = await fetch(`/api/facilities?${params.toString()}`);
        if (!res.ok) throw new Error(`facilities ${res.status}`);
        const data = (await res.json()) as { facilities?: FacilityWithDistance[] };
        let list = data.facilities ?? [];
        if (targetCoords) {
          list = [...list].sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
        }
        setFacilities(list);
      } catch {
        // Offline / Network failure fallback: filter local in-memory FACILITIES_SEED
        let list: FacilityWithDistance[] = [...FACILITIES_SEED];
        if (targetCoords) {
          list = list
            .map((f) => ({
              ...f,
              distanceKm: haversineKm(targetCoords.lat, targetCoords.lng, f.lat, f.lng),
            }))
            .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
        } else {
          list = list.filter((f) => f.city.toLowerCase() === targetCity.toLowerCase());
        }
        setFacilities(list);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchFacilities(city, coords);
  }, [city, coords, fetchFacilities]);

  const useMyLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast({ description: t(uiLang, 'facilities.locationDenied'), variant: 'destructive' });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        toast({ description: t(uiLang, 'facilities.locationDenied'), variant: 'destructive' });
      },
      { timeout: 8000, maximumAge: 30_000 },
    );
  }, [toast, uiLang]);

  // Filter facilities based on category and search query
  const filtered = useMemo(() => {
    return facilities.filter((f) => {
      // Category filter
      if (categoryFilter === '24_7' && !f.emergency24h) return false;
      if (categoryFilter === 'hospital' && f.type !== 'hospital') return false;
      if (categoryFilter === 'maternity' && f.type !== 'maternity') return false;
      if (categoryFilter === 'bhu' && f.type !== 'bhuc') return false;
      if (categoryFilter === 'trauma' && !f.services.some((s) => s.toLowerCase().includes('trauma') || s.toLowerCase().includes('emergency'))) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = f.name.toLowerCase().includes(q) || (f.nameUr && f.nameUr.includes(q));
        const matchesDistrict = f.district.toLowerCase().includes(q);
        const matchesServices = f.services.some((s) => s.toLowerCase().includes(q));
        if (!matchesName && !matchesDistrict && !matchesServices) return false;
      }

      return true;
    });
  }, [facilities, categoryFilter, searchQuery]);

  // Featured Lahore list matching search
  const featuredMatches = useMemo(() => {
    if (city.toLowerCase() !== 'lahore') return [];
    if (!searchQuery.trim()) return FEATURED_LAHORE_HOSPITALS;
    const q = searchQuery.toLowerCase();
    return FEATURED_LAHORE_HOSPITALS.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q) ||
        h.details.toLowerCase().includes(q) ||
        h.chips.some((c) => c.toLowerCase().includes(q)),
    );
  }, [city, searchQuery]);

  return (
    <div className="custom-scrollbar h-full overflow-y-auto px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Hero Banner - Matches references/05_Facilities_Emergency.png */}
        <section className="hero-banner hero-facility flex flex-col gap-5 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[1.7rem]">
              Emergency and healthcare <span className="text-primary">facilities</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Find hospitals, emergency rooms, BHUs and trauma centers across Pakistan.
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-foreground">
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" aria-hidden />Verified facilities</li>
              <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" aria-hidden />24/7 emergency</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" aria-hidden />Distance based</li>
            </ul>
          </div>

          <img
            src="/assets/hospital_hero.png"
            alt=""
            className="pointer-events-none hidden h-36 w-72 shrink-0 rounded-xl object-cover 2xl:block"
          />

          {/* Emergency call rail */}
          <div className="grid shrink-0 gap-2 sm:grid-cols-2 lg:w-60 lg:grid-cols-1">
            <a
              href="tel:1122"
              className="flex min-h-14 items-center gap-3 rounded-xl bg-red-700 p-3 text-white transition-colors hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
            >
              <Phone className="h-5 w-5 shrink-0" aria-hidden />
              <span>
                <b className="block text-sm font-bold">Rescue 1122</b>
                <span className="block text-xs text-white/85">For serious emergencies</span>
              </span>
            </a>
            <a
              href="tel:1023"
              className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card p-3 text-foreground transition-colors hover:border-input focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Phone className="h-5 w-5 shrink-0 text-danger" aria-hidden />
              <span>
                <b className="block text-sm font-bold">Alkhidmat 1023</b>
                <span className="block text-xs text-muted-foreground">Ambulance service</span>
              </span>
            </a>
          </div>
        </section>

        {/* Filter bar with City Dropdown & Horizontal Category Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {coords ? null : (
            <Select
              value={city}
              onValueChange={(v) => {
                setCity(v);
                setCoords(null);
              }}
            >
              <SelectTrigger className="h-9 min-w-36 rounded-xl border-border bg-card text-xs font-bold text-foreground shadow-sm">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs font-medium">
                    {c}, Punjab (demo)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Facilities' },
              { id: '24_7', label: '24/7 Emergency Rooms' },
              { id: 'hospital', label: 'Hospitals' },
              { id: 'trauma', label: 'Trauma Centers' },
              { id: 'maternity', label: 'Maternity' },
              { id: 'bhu', label: 'Primary Health (BHUs)' },
            ].map((cat) => {
              const active = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id as CategoryFilter)}
                  aria-pressed={active}
                  className={cn(
                    'min-h-9 rounded-full px-3.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-card text-muted-foreground hover:text-foreground',
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar & Location Controls */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, service or area"
              aria-label="Search facilities"
              className="h-10 w-full rounded-xl border border-input bg-card ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/15"
            />
          </div>

          <Button
            variant={coords ? 'default' : 'outline'}
            size="sm"
            onClick={useMyLocation}
            disabled={locating}
            className="h-10 gap-1.5 rounded-xl border-border bg-card px-4 text-xs font-bold text-foreground shadow-sm hover:bg-muted/60"
          >
            {locating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Crosshair className="h-3.5 w-3.5 text-primary" />
            )}
            {locating ? 'Locating...' : 'Use My Exact Location'}
          </Button>

        </div>

        {/* 2-Column Main Stage: Left Hospital Rows + Right Map Rail */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Column */}
          <div className="space-y-4 lg:col-span-7 xl:col-span-8">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                Healthcare Facilities in {city}
              </h3>

            </div>

            {/* Featured approved hospital items (from Screen 5 high-fidelity mock) */}
            {featuredMatches.map((h) => (
              <div key={h.name} className="hospital-row">
                <img src={h.image} alt={h.name} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-foreground sm:text-base">{h.name}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="chip chip-red text-2xs font-bold">{h.status}</span>
                    <span className="chip chip-blue text-2xs font-bold">
                      Facility info unverified
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {h.address} · {h.distance} <b className="text-foreground">(sample)</b>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{h.details}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {h.chips.map((c) => (
                      <span
                        key={c}
                        className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-2xs font-semibold text-muted-foreground"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end justify-between self-stretch">
                  <span className="text-2xs font-bold text-primary">Hours not verified</span>
                  <div className="flex flex-col gap-1.5">
                    <a
                      href={`tel:${h.phone}`}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/50"
                    >
                      <Phone className="h-3 w-3 text-primary" aria-hidden />
                      Call ER Desk
                    </a>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + ' ' + h.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Navigation className="h-3 w-3" />
                      Navigate
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {/* Dynamic / Seeded facilities matching city and filters */}
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-destructive/30 bg-red-50 p-6 text-center text-sm text-red-700">
                Failed to load additional facilities.
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void fetchFacilities(city, coords)}
                  className="mt-3 block mx-auto text-xs font-bold"
                >
                  Retry
                </Button>
              </div>
            ) : (
              filtered.map((f, idx) => (
                <div key={f.id} className="hospital-row">
                  <div className="flex h-[90px] w-[110px] shrink-0 items-center justify-center rounded-xl bg-info-soft text-info">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-foreground sm:text-base">{f.name}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {f.emergency24h ? (
                        <span className="chip chip-red text-2xs font-bold">24/7 ER</span>
                      ) : (
                        <span className="chip text-2xs font-bold">Primary Care</span>
                      )}
                      {f.verified ? (
                        <span className="chip chip-green text-2xs font-bold">Verified</span>
                      ) : (
                        <span className="chip chip-blue text-2xs font-bold">Unverified</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {f.district}
                      {typeof f.distanceKm === 'number'
                        ? ` · ${f.distanceKm.toFixed(1)} km away`
                        : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {f.services.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-2xs font-semibold text-muted-foreground"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end justify-between self-stretch">
                    <span className="text-2xs font-bold text-muted-foreground">SehatAI Directory</span>
                    <div className="flex flex-col gap-1.5">
                      {f.phone ? (
                        <a
                          href={`tel:${f.phone}`}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/50"
                        >
                          <Phone className="h-3 w-3 text-primary" aria-hidden />
                          Call Desk
                        </a>
                      ) : null}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${f.lat},${f.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        <Navigation className="h-3 w-3" />
                        Navigate
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Rail: Illustrative Map Artwork & Tags */}
          <aside className="space-y-4 lg:col-span-5 xl:col-span-4">
            <div className="surface p-5">
              <div className="flex items-center justify-between">
                <div>
                  <b className="text-sm font-bold text-foreground">Facilities Near You</b>
                  <p className="text-2xs text-muted-foreground">Illustrative map — not verified GPS</p>
                </div>

              </div>

              <div className="map mt-3">
                <img
                  src="/assets/lahore_map_illustration.jpg"
                  alt="Approved map illustration of Lahore facilities"
                />
                <span className="maplabel">Map artwork from approved screenshot · non-live</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {['Hospital', 'Emergency', 'Trauma', 'Maternity', 'BHU'].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Emergency Hotline Guidelines Box */}
            <div className="surface p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Emergency Hotline Notice
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Rescue 1122 and Alkhidmat 1023 connect directly via your cellular network. They do not
                depend on mobile data, GPS availability, or SehatAI servers. For acute
                life-threatening emergencies, call immediately.
              </p>
              <div className="mt-3 flex gap-2">
                <a
                  href="tel:1122"
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-700 text-xs font-bold text-white hover:bg-red-800"
                >
                  <Phone className="h-3.5 w-3.5" /> Call 1122
                </a>
                <a
                  href="tel:1023"
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-xs font-bold text-foreground hover:bg-muted"
                >
                  <Phone className="h-3.5 w-3.5" /> Call 1023
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
