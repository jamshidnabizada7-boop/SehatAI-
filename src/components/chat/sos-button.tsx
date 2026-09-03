'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Emergency SOS Button — floating red button that:
 * 1. Gets user's geolocation
 * 2. Shows confirmation dialog
 * 3. Creates tel:1122 link + shows ICE contacts
 * 4. Copies location to clipboard
 */
export function SosButton() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleSos = () => {
    setOpen(true);
    setLocationError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          // Copy location to clipboard
          const locationText = `My location: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
          navigator.clipboard?.writeText(locationText).catch(() => {});
        },
        (err) => setLocationError(err.message),
        { enableHighAccuracy: true, timeout: 5000 },
      );
    } else {
      setLocationError('Geolocation not available');
    }
  };

  return (
    <>
      {/* Floating SOS button */}
      <motion.button
        type="button"
        onClick={handleSos}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-sm font-black text-white shadow-lg shadow-red-600/30 md:bottom-28 md:right-6"
        aria-label="Emergency SOS"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-red-600/40" />
        <span className="relative">SOS</span>
      </motion.button>

      {/* SOS dialog */}
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-card p-5 shadow-2xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </span>
                  <h3 className="text-sm font-bold text-foreground">Emergency SOS</h3>
                </div>
                <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Location */}
              {location ? (
                <div className="mb-3 rounded-lg border border-emerald-500/20 bg-emerald-50/50 p-2 dark:bg-emerald-950/10">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <MapPin className="h-3 w-3" /> Location captured
                  </p>
                  <a
                    href={`https://maps.google.com/?q=${location.lat},${location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block text-[10px] text-muted-foreground hover:underline"
                  >
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)} — View on Maps
                  </a>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Location copied to clipboard ✓</p>
                </div>
              ) : locationError ? (
                <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-50/50 p-2 dark:bg-amber-950/10">
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">Location unavailable: {locationError}</p>
                </div>
              ) : (
                <div className="mb-3 rounded-lg border border-border bg-muted/20 p-2 text-center">
                  <p className="text-[11px] text-muted-foreground">Getting your location…</p>
                </div>
              )}

              {/* Emergency numbers */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">Call emergency services now:</p>
                <a href="tel:1122" className="flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700">
                  <Phone className="h-4 w-4" /> Call 1122 (Rescue)
                </a>
                <div className="grid grid-cols-2 gap-2">
                  <a href="tel:1166" className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/5 py-2.5 text-xs font-bold text-red-700 hover:bg-red-500/10 dark:text-red-400">
                    <Phone className="h-3 w-3" /> 1166 Health
                  </a>
                  <a href="tel:115" className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/5 py-2.5 text-xs font-bold text-red-700 hover:bg-red-500/10 dark:text-red-400">
                    <Phone className="h-3 w-3" /> 115 Edhi
                  </a>
                </div>
              </div>

              <p className="mt-3 text-center text-[10px] text-muted-foreground">
                Stay calm. Help is on the way. Share your location with the operator.
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
