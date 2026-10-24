'use client';

import { useState } from 'react';
import { Phone, MapPin, TriangleAlert, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * Emergency SOS — a compact trigger that lives in the app header (every
 * view, every breakpoint) and opens a dialog that:
 * 1. Gets the user's geolocation and copies a maps link to the clipboard
 * 2. Offers one-tap calls to 1122 / 1166 / 115
 * It never places a call by itself, and the copy says so.
 */
export function SosButton({ className }: { className?: string }) {
  const langPref = useAppStore((s) => s.langPref);
  const lang = resolveUiLang(langPref);
  const isUr = lang === 'ur';
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);

  const handleSos = () => {
    setOpen(true);
    setLocationError(false);
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          const locationText = `My location: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
          navigator.clipboard?.writeText(locationText).catch(() => {});
        },
        () => setLocationError(true),
        { enableHighAccuracy: true, timeout: 5000 },
      );
    } else {
      setLocationError(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? handleSos() : setOpen(false))}>
      {/* A real DialogTrigger, so focus returns to SOS when the dialog closes. */}
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-red-700 px-3 text-xs font-bold tracking-wide text-white transition-colors hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700',
            className,
          )}
          aria-label={t(lang, 'ui.sosLabel')}
        >
          <Phone className="h-3.5 w-3.5" aria-hidden />
          {t(lang, 'ui.sos')}
        </button>
      </DialogTrigger>

        <DialogContent
          closeLabel={t(lang, 'ui.close')}
          className={cn('max-w-sm gap-4 border-red-700/25', isUr && 'font-urdu')}
          dir={isUr ? 'rtl' : 'ltr'}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger-soft text-danger">
                <TriangleAlert className="h-4.5 w-4.5" aria-hidden />
              </span>
              {t(lang, 'ui.sosLabel')}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              {t(lang, 'ui.sosHint')}
            </DialogDescription>
          </DialogHeader>

          {/* Emergency numbers first — the reason this dialog exists */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">{t(lang, 'ui.sosCallNow')}</p>
            <a
              href="tel:1122"
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-bold text-white transition-colors hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
            >
              <Phone className="h-4 w-4" aria-hidden />
              <span dir="ltr">1122</span> · {t(lang, 'ui.rescue')}
            </a>
            <div className="grid grid-cols-2 gap-2">
              {[
                { n: '1166', label: t(lang, 'ui.healthHelpline') },
                { n: '115', label: t(lang, 'ui.edhi') },
              ].map((e) => (
                <a
                  key={e.n}
                  href={`tel:${e.n}`}
                  className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-danger/25 bg-danger-soft px-2 text-xs font-bold text-danger transition-colors hover:border-danger/50"
                >
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                  <span dir="ltr">{e.n}</span> {e.label}
                </a>
              ))}
            </div>
          </div>

          {/* Location status */}
          <div
            className="rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-xs"
            role="status"
            aria-live="polite"
          >
            {location ? (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
                <div className="min-w-0">
                  <p className="font-semibold text-success">{t(lang, 'ui.sosLocated')}</p>
                  <a
                    href={`https://maps.google.com/?q=${location.lat},${location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    dir="ltr"
                  >
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)} · {t(lang, 'ui.sosViewMap')}
                  </a>
                </div>
              </div>
            ) : locationError ? (
              <p className="flex items-start gap-2 text-warning">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                {t(lang, 'ui.sosLocationUnavailable')}
              </p>
            ) : (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                {t(lang, 'ui.sosLocating')}
              </p>
            )}
          </div>
        </DialogContent>
    </Dialog>
  );
}
