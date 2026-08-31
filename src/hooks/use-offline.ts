'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store/app-store';

/**
 * Offline = real navigator.onLine === false OR the user-enabled
 * "Simulate offline" toggle (honest demo of the offline pack).
 */
export function useOffline(): {
  isOffline: boolean;
  realOffline: boolean;
  simulated: boolean;
} {
  const simulated = useAppStore((s) => s.simulatedOffline);
  const [realOffline, setRealOffline] = useState(false);

  useEffect(() => {
    const update = () => setRealOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return {
    isOffline: realOffline || simulated,
    realOffline,
    simulated,
  };
}
