'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Navigation,
  OctagonX,
  Phone,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/lib/store/chat-store';
import { t } from '@/lib/i18n';
import type { Facility, Lang } from '@/lib/types';
import { cn } from '@/lib/utils';

type FacilityWithDistance = Facility & { distanceKm?: number };

/** Full-screen red takeover for emergencies. Content = pre-written template. */
export function EmergencyOverlay() {
  const emergency = useChatStore((s) => s.emergency);
  const emergencyLang = useChatStore((s) => s.emergencyLang);
  const setEmergency = useChatStore((s) => s.setEmergency);
  const [confirmClose, setConfirmClose] = useState(false);
  const [facilities, setFacilities] = useState<FacilityWithDistance[] | null>(null);
  const [facilitiesLoading, setFacilitiesLoading] = useState(false);

  const lang: Lang = emergencyLang ?? 'en';

  const loadFacilities = useCallback(async () => {
    setFacilitiesLoading(true);
    try {
      // geolocation if permitted (short timeout), else Multan default
      const coords = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { timeout: 4000, maximumAge: 60_000 },
        );
      });

      const params = coords
        ? `lat=${coords.lat}&lng=${coords.lng}`
        : 'city=Multan';
      const res = await fetch(`/api/facilities?${params}`);
      if (!res.ok) throw new Error(`facilities ${res.status}`);
      const data = (await res.json()) as { facilities?: FacilityWithDistance[] };
      const list = (data.facilities ?? [])
        .filter((f) => f.emergency24h || f.type === 'hospital' || f.type === 'maternity')
        .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
        .slice(0, 3);
      setFacilities(list);
    } catch {
      setFacilities([]);
    } finally {
      setFacilitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (emergency) {
      setConfirmClose(false);
      setFacilities(null);
      void loadFacilities();
      // haptic attention pattern on supporting devices (Android) — a strong
      // physical cue that complements the visual takeover. No-op elsewhere.
      try {
        navigator.vibrate?.([400, 150, 400, 150, 400]);
      } catch {
        // vibration not supported / blocked — ignore silently
      }
    }
  }, [emergency, loadFacilities]);

  if (!emergency) return null;

  const numbers =
    emergency.numbers?.length > 0
      ? emergency.numbers
      : [
          { label: 'Rescue 1122 (Ambulance)', number: '1122' },
          { label: 'Alkhidmat Ambulance', number: '1023' },
          { label: 'Pakistan Health Helpline', number: '1166' },
          { label: 'Edhi Ambulance', number: '115' },
        ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-red-600 text-white"
      role="alertdialog"
      aria-modal="true"
      aria-label={emergency.title}
      dir={lang === 'ur' ? 'rtl' : 'ltr'}
    >
      <div className={cn('mx-auto flex min-h-full w-full max-w-2xl flex-col px-4 py-4', lang === 'ur' && 'font-urdu')}>
        {/* dismiss */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide uppercase">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
            {t(lang, 'emergency.heading')}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setConfirmClose(true)}
            className="h-11 w-11 rounded-xl text-white hover:bg-white/20 hover:text-white"
            aria-label={t(lang, 'emergency.dismiss')}
          >
            <X className="h-5 w-5" aria-hidden />
          </Button>
        </div>

        {confirmClose ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/15 px-4 py-3">
            <p className="text-sm font-medium">{t(lang, 'emergency.dismissConfirm')}</p>
            <span className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-white hover:bg-white/25 hover:text-white"
                onClick={() => setConfirmClose(false)}
              >
                {t(lang, 'chat.cancel')}
              </Button>
              <Button
                size="sm"
                className="h-9 bg-white font-bold text-red-600 hover:bg-red-50"
                onClick={() => setEmergency(null, lang)}
              >
                {t(lang, 'emergency.dismiss')}
              </Button>
            </span>
          </div>
        ) : null}

        {/* pulsing alert */}
        <div className="mt-4 flex flex-col items-center gap-2.5 text-center">
          <span className="emergency-ring flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
            <ShieldAlert className="h-8 w-8" aria-hidden />
          </span>
          <h1 className="text-xl font-extrabold leading-snug sm:text-2xl">
            {emergency.title}
          </h1>
          {emergency.reason ? (
            <p className="max-w-xl text-sm text-white/90">{emergency.reason}</p>
          ) : null}
        </div>

        {/* call buttons — immediately visible, before any scrolling */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {numbers.map((n, i) => (
            <a
              key={n.number}
              href={`tel:${n.number}`}
              className={cn(
                'group relative flex flex-col items-center gap-1 overflow-hidden rounded-2xl bg-white px-4 py-4 text-center text-red-600 shadow-lg transition-transform hover:scale-[1.03] active:scale-95 focus-visible:outline-3 focus-visible:-outline-offset-2 focus-visible:outline-white',
                i === 0 && 'emergency-call-ring',
              )}
              aria-label={`${t(lang, 'emergency.callNow')} ${n.number}`}
            >
              <Phone className="h-7 w-7 animate-pulse" aria-hidden />
              <span className="text-3xl font-extrabold tracking-tight">{n.number}</span>
              <span className="text-xs font-semibold leading-tight text-red-600/80">
                {n.label}
              </span>
            </a>
          ))}
        </div>

        {/* prompt to dial */}
        <p className="mt-2.5 text-center text-sm font-semibold text-white/95">
          {t(lang, 'emergency.callNow')} →
        </p>

        {/* immediate actions */}
        {emergency.actions?.length ? (
          <section className="mt-5 rounded-2xl bg-white/12 p-4" aria-label={t(lang, 'emergency.immediateActions')}>
            <h2 className="mb-2 text-sm font-extrabold tracking-wider uppercase">
              {t(lang, 'emergency.immediateActions')}
            </h2>
            <ol className="space-y-2">
              {emergency.actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-extrabold text-red-600">
                    {i + 1}
                  </span>
                  {action}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {/* do not */}
        {emergency.doNot?.length ? (
          <section className="mt-3 rounded-2xl bg-red-800/50 p-4" aria-label={t(lang, 'emergency.doNot')}>
            <h2 className="mb-2 text-sm font-extrabold tracking-wider uppercase">
              {t(lang, 'emergency.doNot')}
            </h2>
            <ul className="space-y-1.5">
              {emergency.doNot.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                  <OctagonX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* nearest facilities */}
        <section className="mt-5" aria-label={t(lang, 'emergency.nearestFacilities')}>
          <h2 className="mb-2 text-sm font-extrabold tracking-wider uppercase text-white/90">
            {t(lang, 'emergency.nearestFacilities')}
          </h2>
          {facilitiesLoading ? (
            <p className="rounded-2xl bg-white/12 px-4 py-3 text-sm text-white/85">
              {t(lang, 'emergency.findingFacilities')}
            </p>
          ) : facilities && facilities.length > 0 ? (
            <ul className="space-y-2">
              {facilities.map((f) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-white/12 px-4 py-3"
                >
                  <span className="text-sm font-bold">{f.name}</span>
                  {f.nameUr ? <span className="text-xs text-white/75">{f.nameUr}</span> : null}
                  {typeof f.distanceKm === 'number' ? (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
                      {f.distanceKm.toFixed(1)} {t(lang, 'facilities.away')}
                    </span>
                  ) : null}
                  <span className="ms-auto flex items-center gap-2">
                    {f.phone ? (
                      <a
                        href={`tel:${f.phone}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                        aria-label={`${t(lang, 'facilities.call')} ${f.name}`}
                      >
                        <Phone className="h-3.5 w-3.5" aria-hidden />
                        {t(lang, 'facilities.call')}
                      </a>
                    ) : null}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${f.lat},${f.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/30"
                      aria-label={`${t(lang, 'facilities.navigate')} ${f.name}`}
                    >
                      <Navigation className="h-3.5 w-3.5" aria-hidden />
                      {t(lang, 'facilities.navigate')}
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl bg-white/12 px-4 py-3 text-sm text-white/85">
              1122 · {t(lang, 'emergency.callNow')}
            </p>
          )}
        </section>

        {/* sources note */}
        <p className="mt-4 pb-6 text-center text-xs text-white/70">
          {emergency.sources?.length ? `${emergency.sources.join(' · ')} — ` : ''}
          {t(lang, 'emergency.sourcesNote')}
        </p>
      </div>
    </motion.div>
  );
}
