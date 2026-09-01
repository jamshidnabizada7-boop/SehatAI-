'use client';

import { useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore, type View } from '@/lib/store/app-store';
import { resolveUiLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { AppHeader } from '@/components/app/app-header';
import { BottomNav, SidebarNav } from '@/components/app/app-nav';
import { AppFooter } from '@/components/app/app-footer';
import { OfflineBanner } from '@/components/app/offline-banner';
import { AuthBanner } from '@/components/auth/auth-banner';
import { LandingChooser } from '@/components/auth/landing-chooser';
import { ChatView } from '@/components/chat/chat-view';
import { RemindersView } from '@/components/reminders/reminders-view';
import { FacilitiesView } from '@/components/facilities/facilities-view';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { ObservabilityView } from '@/components/dashboard/observability-view';
import { DoctorCopilotView } from '@/components/doctor-copilot/doctor-copilot-view';
import { AboutView } from '@/components/about/about-view';
import { MyHealthView } from '@/components/my-health/my-health-view';
import { EmergencyOverlay } from '@/components/chat/emergency-overlay';
import { GlobalSearch } from '@/components/app/global-search';

const PATIENT_VIEWS: View[] = ['chat', 'reminders', 'facilities', 'about', 'my-health'];
const DOCTOR_VIEWS: View[] = ['chat', 'facilities', 'doctor-copilot', 'about'];
const ADMIN_VIEWS: View[] = ['chat', 'facilities', 'doctor-copilot', 'dashboard', 'observability', 'about'];

const DEFAULT_VIEW: Record<string, View> = {
  user: 'chat',
  doctor: 'doctor-copilot',
  admin: 'dashboard',
};

export default function Home() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const langPref = useAppStore((s) => s.langPref);
  const ensureSession = useAppStore((s) => s.ensureSession);
  const uiLang = resolveUiLang(langPref);
  const isRtl = uiLang === 'ur';
  const { status, data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Resolve role (default to 'guest' for unauthenticated)
  const role: string = status === 'authenticated' && session?.user
    ? ((session.user as { role?: string }).role ?? 'user')
    : 'guest';
  const accountStatus: string = status === 'authenticated' && session?.user
    ? ((session.user as { accountStatus?: string }).accountStatus ?? 'active')
    : 'active';

  // Allowed views for this role
  const allowedViews: View[] = role === 'admin' ? ADMIN_VIEWS : role === 'doctor' ? DOCTOR_VIEWS : PATIENT_VIEWS;
  // Safe view — fall back to role default if the current view isn't allowed
  const safeView: View = allowedViews.includes(view) ? view : (DEFAULT_VIEW[role] ?? 'chat');

  // persist a session id for reminders/chat/feedback APIs
  useEffect(() => {
    ensureSession();
  }, [ensureSession]);

  // Doctor/Patient identity separation — GUARD: when the URL has ?view=X
  // and X is not allowed for the current role, immediately clear the URL and
  // reset the store view. This prevents URL-based view injection attacks.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const queryView = url.searchParams.get('view') as View | null;
    if (!queryView) return;
    if (!allowedViews.includes(queryView)) {
      // Strip the query param — patient can't access doctor-copilot etc.
      url.searchParams.delete('view');
      window.history.replaceState({}, '', url.toString());
      // Reset view if it's currently set to something not allowed
      if (!allowedViews.includes(view)) {
        setView(DEFAULT_VIEW[role] ?? 'chat');
      }
    } else if (queryView !== view) {
      // Allowed query view — apply it once
      setView(queryView);
      url.searchParams.delete('view');
      window.history.replaceState({}, '', url.toString());
    }
  }, [role, view, allowedViews, setView]);

  // propagate language/dir to <html>
  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = uiLang;
  }, [isRtl, uiLang]);

  // Doctor/Patient identity separation:
  // When a doctor logs in, default their view to the Doctor Copilot portal.
  // When an admin logs in, default to the eval dashboard.
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return;
    // Pending doctors go to the pending screen
    if (role === 'doctor' && accountStatus === 'pending_verification') {
      router.replace('/onboarding/doctor/pending');
      return;
    }
    if (role === 'doctor' && (accountStatus === 'suspended' || accountStatus === 'deleted')) {
      router.replace('/onboarding/doctor/rejected');
      return;
    }
    // Honor ?view=... query (e.g. from doctor signin redirect) — but only if allowed for this role
    const queryView = searchParams.get('view') as View | null;
    if (queryView) {
      if (allowedViews.includes(queryView)) {
        // Query view is allowed for this role — set it
        setView(queryView);
        // Clear the URL so a reload doesn't re-trigger
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/');
        }
      } else {
        // Query view is NOT allowed for this role — strip the query and reset view
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/');
        }
        if (!allowedViews.includes(view)) {
          setView(DEFAULT_VIEW[role] ?? 'chat');
        }
      }
    } else if (!allowedViews.includes(view)) {
      // No query view, but current view isn't allowed for this role — reset
      setView(DEFAULT_VIEW[role] ?? 'chat');
    } else if (role === 'doctor' && view === 'chat') {
      // Doctors default to doctor-copilot on first login
      setView('doctor-copilot');
    }
  }, [status, session, router, searchParams, view, role, accountStatus, allowedViews, setView]);

  // Show the landing chooser for unauthenticated users
  const showLanding = status === 'unauthenticated';

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={cn(
        'flex h-dvh min-h-dvh flex-col overflow-hidden bg-background text-foreground',
        isRtl && 'font-urdu',
      )}
    >
      <AppHeader />
      {!showLanding ? <OfflineBanner /> : null}
      {!showLanding ? <AuthBanner /> : null}

      <div className="flex min-h-0 flex-1">
        {!showLanding ? <SidebarNav /> : null}
        <main id="main" className="flex min-h-0 flex-1 flex-col">
          <div key={safeView} className="h-full min-h-0 flex-1">
            {showLanding ? (
              <LandingChooser />
            ) : (
              <>
                {safeView === 'chat' ? <ChatView /> : null}
                {safeView === 'reminders' ? <RemindersView /> : null}
                {safeView === 'facilities' ? <FacilitiesView /> : null}
                {safeView === 'dashboard' ? <DashboardView /> : null}
                {safeView === 'observability' ? <ObservabilityView /> : null}
                {safeView === 'doctor-copilot' ? <DoctorCopilotView /> : null}
                {safeView === 'about' ? <AboutView /> : null}
                {safeView === 'my-health' ? <MyHealthView /> : null}
              </>
            )}
          </div>
        </main>
      </div>

      <AppFooter />
      {!showLanding ? <BottomNav /> : null}
      <EmergencyOverlay />
      <GlobalSearch />
    </div>
  );
}
