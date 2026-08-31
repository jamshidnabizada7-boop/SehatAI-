'use client';

import { SessionProvider } from 'next-auth/react';

/** Client-side NextAuth session provider (JWT strategy — no polling needed). */
export function AppSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
