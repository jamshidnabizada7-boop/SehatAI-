'use client';

import { useEffect } from 'react';

/**
 * Registers the app-shell service worker (offline PWA support).
 * Silent no-op on browsers without support or non-secure origins.
 * The SW itself never caches /api/* — chat always hits the live
 * network; the in-app offline engine handles guidance when offline.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // registration failure is non-fatal — the app works online regardless
      });
    };
    if (document.readyState === 'complete') register();
    else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
