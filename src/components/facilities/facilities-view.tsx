'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Baby,
  BadgeCheck,
  Building2,
  Crosshair,
  Home,
  Loader2,
  Navigation,
  Phone,
  Stethoscope,
  Store,
  Siren,
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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

type TypeFilter = 'all' | Facility['type'];

const TYPE_ICONS: Record<Facility['type'], React.ComponentType<{ className?: string }>> = {
  hospital: Building2,
  clinic: Stethoscope,
  bhuc: Home,
  maternity: Baby,
  pharmacy: Store,
};

const TYPE_STYLES: Record<Facility['type'], string> = {
  hospital: 'bg-red-600/10 text-red-700 dark:text-red-400',
  clinic: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400',
  bhuc: 'bg-stone-500/10 text-stone-600 dark:text-stone-400',
  maternity: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  pharmacy: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
};

type FacilityWithDistance = Facility & { distanceKm?: number };

export function FacilitiesView() {
  const { toast } = useToast();
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);

  const [city, setCity] = useState<string>('Lahore');
  const [type, setType] = useState<TypeFilter>('all');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [facilities, setFacilities] = useState<FacilityWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [locating, setLocating] = useState(false);

  const fetchFacilities = useCallback(
    async (targetCity: string, targetType: TypeFilter, targetCoords: { lat: number; lng: number } | null) => {
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
        if (targetType !== 'all') params.set('type', targetType);
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
        if (targetType !== 'all') {
          list = list.filter((f) => f.type === targetType);
        }
        setFacilities(list);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchFacilities(city, type, coords);
  }, [city, type, coords, fetchFacilities]);

  // Apply the 24h emergency filter client-side so we don't need a new API param.
  const filtered = useMemo(
    () => (emergencyOnly ? facilities.filter((f) => f.emergency24h) : facilities),
    [emergencyOnly, facilities],
  );

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

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: t(uiLang, 'facilities.allTypes') },
    { value: 'hospital', label: t(uiLang, 'facilities.typeHospital') },
    { value: 'clinic', label: t(uiLang, 'facilities.typeClinic') },
    { value: 'bhuc', label: t(uiLang, 'facilities.typeBhuc') },
    { value: 'maternity', label: t(uiLang, 'facilities.typeMaternity') },
    { value: 'pharmacy', label: t(uiLang, 'facilities.typePharmacy') },
  ];

  return (
    <div className="custom-scrollbar h-full overflow-y-auto px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* header */}
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">
            {t(uiLang, 'facilities.title')}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t(uiLang, 'facilities.subtitle')}
          </p>
        </div>

        {/* controls */}
        <div className="flex flex-wrap items-center gap-2">
          {coords ? null : (
            <Select
              value={city}
              onValueChange={(v) => {
                setCity(v);
                setCoords(null);
              }}
            >
              <SelectTrigger className="h-11 min-w-36 rounded-xl" aria-label={t(uiLang, 'facilities.city')}>
                <SelectValue placeholder={t(uiLang, 'facilities.city')} />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={type} onValueChange={(v) => setType(v as TypeFilter)}>
            <SelectTrigger className="h-11 min-w-32 rounded-xl" aria-label={t(uiLang, 'facilities.type')}>
              <SelectValue placeholder={t(uiLang, 'facilities.type')} />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={coords ? 'default' : 'outline'}
            onClick={useMyLocation}
            disabled={locating}
            className="h-11 gap-1.5 rounded-xl font-medium"
            aria-label={t(uiLang, 'facilities.useLocation')}
          >
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Crosshair className="h-4 w-4" aria-hidden />
            )}
            {locating ? t(uiLang, 'facilities.locating') : t(uiLang, 'facilities.useLocation')}
          </Button>
        </div>

        {/* 24h emergency toggle */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
          <Label
            htmlFor="emergency-only"
            className="flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <Siren className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden />
            {t(uiLang, 'facilities.emergencyOnly')}
          </Label>
          <Switch
            id="emergency-only"
            checked={emergencyOnly}
            onCheckedChange={setEmergencyOnly}
            aria-label={t(uiLang, 'facilities.emergencyOnly')}
          />
        </div>

        {/* results */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-red-50 px-6 py-10 text-center dark:bg-red-950/40">
            <p className="text-sm text-red-700 dark:text-red-300">
              {t(uiLang, 'facilities.error')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchFacilities(city, type, coords)}
              className="h-10 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300"
            >
              {t(uiLang, 'facilities.retry')}
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center text-sm text-muted-foreground">
            {t(uiLang, 'facilities.noResults')}
          </p>
        ) : (
          <>
            <p className="text-xs font-medium text-muted-foreground">
              {filtered.length} {t(uiLang, 'facilities.results')}
              {emergencyOnly ? ` · ${t(uiLang, 'facilities.emergency24h')}` : ''}
            </p>
            <ul className="space-y-3" aria-label={t(uiLang, 'facilities.title')}>
              {filtered.map((f, idx) => {
                const Icon = TYPE_ICONS[f.type];
                return (
                  <motion.li
                    key={f.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.04, 0.3) }}
                  >
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/30">
                      <div className="flex items-stretch gap-3">
                        <span
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                            TYPE_STYLES[f.type],
                          )}
                          aria-hidden
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="text-sm font-bold text-foreground">{f.name}</p>
                            {f.nameUr ? (
                              <span className="font-urdu text-xs text-muted-foreground">
                                {f.nameUr}
                              </span>
                            ) : null}
                            {f.verified ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                <BadgeCheck className="h-3 w-3" aria-hidden />
                                {t(uiLang, 'facilities.verified')}
                              </span>
                            ) : (
                              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                                {t(uiLang, 'facilities.unverified')}
                              </span>
                            )}
                            {f.emergency24h ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-600/10 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-400">
                                <Siren className="h-3 w-3" aria-hidden />
                                {t(uiLang, 'facilities.emergency24h')}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {f.district}
                            {typeof f.distanceKm === 'number'
                              ? ` · ${f.distanceKm.toFixed(1)} ${t(uiLang, 'facilities.away')}`
                              : ''}
                          </p>
                          {f.services.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {f.services.slice(0, 4).map((s) => (
                                <span
                                  key={s}
                                  className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        {/* action rail — aligned to the bottom of the card content */}
                        <div className="flex shrink-0 flex-col justify-end gap-1.5">
                          {f.phone ? (
                            <a
                              href={`tel:${f.phone}`}
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                              aria-label={`${t(uiLang, 'facilities.call')} ${f.name}`}
                            >
                              <Phone className="h-4 w-4" aria-hidden />
                            </a>
                          ) : null}
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${f.lat},${f.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground transition-transform hover:scale-105"
                            aria-label={`${t(uiLang, 'facilities.navigate')} ${f.name}`}
                          >
                            <Navigation className="h-3.5 w-3.5" aria-hidden />
                            {t(uiLang, 'facilities.navigate')}
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
