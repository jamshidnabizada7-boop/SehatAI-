'use client';

import { useSyncExternalStore } from 'react';

const subscribe = (notify: () => void) => {
  window.addEventListener('online', notify);
  window.addEventListener('offline', notify);
  return () => {
    window.removeEventListener('online', notify);
    window.removeEventListener('offline', notify);
  };
};

export function useNetworkOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}
