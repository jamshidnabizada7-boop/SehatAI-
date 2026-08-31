'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { AppHeader } from '@/components/app/app-header';
import { BottomNav, SidebarNav } from '@/components/app/app-nav';
import { AppFooter } from '@/components/app/app-footer';
import { OfflineBanner } from '@/components/app/offline-banner';
import { AuthBanner } from '@/components/auth/auth-banner';
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

export default function Home() {
  const view = useAppStore((s) => s.view);
  const langPref = useAppStore((s) => s.langPref);
  const ensureSession = useAppStore((s) => s.ensureSession);
  const uiLang = resolveUiLang(langPref);
  const isRtl = uiLang === 'ur';

  // persist a session id for reminders/chat/feedback APIs
  useEffect(() => {
    ensureSession();
  }, [ensureSession]);

  // propagate language/dir to <html> so portaled dialogs (Radix) also go RTL,
  // and screen readers announce the right language for the whole document.
  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = uiLang;
  }, [isRtl, uiLang]);

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={cn(
        'flex h-dvh min-h-dvh flex-col overflow-hidden bg-background text-foreground',
        isRtl && 'font-urdu',
      )}
    >
      <AppHeader />
      <OfflineBanner />
      <AuthBanner />

      <div className="flex min-h-0 flex-1">
        <SidebarNav />
        <main id="main" className="flex min-h-0 flex-1 flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="h-full min-h-0 flex-1"
            >
              {view === 'chat' ? <ChatView /> : null}
              {view === 'reminders' ? <RemindersView /> : null}
              {view === 'facilities' ? <FacilitiesView /> : null}
              {view === 'dashboard' ? <DashboardView /> : null}
              {view === 'observability' ? <ObservabilityView /> : null}
              {view === 'doctor-copilot' ? <DoctorCopilotView /> : null}
              {view === 'about' ? <AboutView /> : null}
              {view === 'my-health' ? <MyHealthView /> : null}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AppFooter />
      <BottomNav />
      <EmergencyOverlay />
      <GlobalSearch />
    </div>
  );
}
