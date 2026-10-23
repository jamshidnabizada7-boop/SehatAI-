'use client';

import { SessionProvider } from 'next-auth/react';
import { useNetworkOnline } from '@/hooks/use-network-online';

/** Client-side NextAuth session provider (JWT strategy — no polling needed). */
export function AppSessionProvider({ children }: { children: React.ReactNode }) {
  const online = useNetworkOnline();
  // NextAuth v4 update() does nothing after an offline reload leaves session=null.
  // Reinitialize on connectivity changes so reconnection performs a fresh session read
  // before tab-scoped medical history is bound to the current account.
  return <SessionProvider key={online ? 'online' : 'offline'} refetchWhenOffline={false}>{children}</SessionProvider>;
}
