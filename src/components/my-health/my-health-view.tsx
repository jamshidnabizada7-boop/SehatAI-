'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Lock, Share2, Trash2 } from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProfileCard } from './profile-card';
import { SymptomJournal } from './symptom-journal';
import { HealthTimeline } from './health-timeline';
import { MaternalHealthTracker } from './maternal-health-tracker';
import { ChildVaccineTracker } from './child-vaccine-tracker';
import { MentalHealthScreening } from './mental-health-screening';
import { ChronicDiseaseModule } from './chronic-disease-module';
import { NutritionLifestyleTracker } from './nutrition-lifestyle-tracker';
import { FamilyHealthManager } from './family-health-manager';
import { AirQualityTracker } from './air-quality-tracker';
import { HydrationTracker } from './hydration-tracker';
import { MedicalCalculatorSuite } from './medical-calculators';
import { SleepTracker } from './sleep-tracker';
import { HealthSummaryCard } from './health-summary-card';
import { AccountSection } from './account-section';
import {
  clearJournal,
  clearProfile,
  formatProfileForSharing,
  isProfileSet,
  loadJournal,
  loadProfile,
  saveJournal,
  saveProfile,
  type HealthProfile,
  type JournalEntry,
} from '@/lib/profile';
import { cn } from '@/lib/utils';

export function MyHealthView() {
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const { toast } = useToast();

  // Lazy initial state reads from localStorage once on the client.
  // (Server renders with null/[]; the lazy init only runs on first
  // client mount, so the hydration mismatch is the natural "loading
  // then populated" transition — but since we hydrate-empty then flip
  // to loaded=true via the ref-guarded effect below, the SSR HTML is
  // the empty-state skeleton, not the populated one.)
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [clearProfileOpen, setClearProfileOpen] = useState(false);
  const [clearJournalOpen, setClearJournalOpen] = useState(false);
  // ref-guarded so the effect runs only once per mount (SSR-safe).
  const loadedOnce = useRef(false);

  // Load once on mount (client-side only — loadProfile returns null on SSR).
  // The setState-in-effect pattern here is the documented React escape hatch
  // for reading from localStorage on the client only — see:
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  // The ref guard ensures it only fires once per mount even under StrictMode.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (loadedOnce.current) return;
    loadedOnce.current = true;
    setProfile(loadProfile());
    setEntries(loadJournal());
    setLoaded(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSaveProfile = useCallback(
    (next: HealthProfile) => {
      saveProfile(next);
      setProfile(next);
      toast({ description: t(uiLang, 'toast.profileSaved') });
    },
    [uiLang, toast],
  );

  const handleSaveEntries = useCallback((next: JournalEntry[]) => {
    saveJournal(next);
    setEntries(next);
  }, []);

  const handleLogEntry = useCallback(
    (entry: JournalEntry) => {
      const next = [entry, ...entries].slice(0, 200);
      handleSaveEntries(next);
      toast({ description: t(uiLang, 'toast.journalSaved') });
    },
    [entries, handleSaveEntries, uiLang, toast],
  );

  const handleDeleteEntry = useCallback(
    (id: string) => {
      const next = entries.filter((e) => e.id !== id);
      handleSaveEntries(next);
      toast({ description: t(uiLang, 'toast.journalDeleted') });
    },
    [entries, handleSaveEntries, uiLang, toast],
  );

  const handleClearProfile = useCallback(() => {
    clearProfile();
    setProfile(null);
    toast({ description: t(uiLang, 'toast.profileCleared') });
  }, [uiLang, toast]);

  const handleClearJournal = useCallback(() => {
    clearJournal();
    setEntries([]);
    toast({ description: t(uiLang, 'toast.journalCleared') });
  }, [uiLang, toast]);

  const handleShareProfile = useCallback(() => {
    if (!profile) return;
    const text = formatProfileForSharing(profile, uiLang);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    try {
      window.open(url, '_blank', 'noopener');
      toast({ description: t(uiLang, 'toast.profileShared') });
    } catch {
      // popups blocked — nothing more we can do here
    }
  }, [profile, uiLang, toast]);

  const profileActive = isProfileSet(profile);

  if (!loaded) {
    return (
      <div className="custom-scrollbar h-full overflow-y-auto px-4 py-4 sm:px-6">
        <section
          aria-label={t(uiLang, 'myHealth.title')}
          className="mx-auto w-full max-w-3xl flex-1 py-2"
        >
          <div className="h-32 animate-pulse rounded-2xl bg-muted" />
        </section>
      </div>
    );
  }

  return (
    <div className="custom-scrollbar h-full overflow-y-auto px-4 py-4 pb-12 sm:px-6">
      <section
        aria-label={t(uiLang, 'myHealth.title')}
        className={cn(
          'mx-auto w-full max-w-3xl flex-1 py-2',
          uiLang === 'ur' && 'font-urdu',
        )}
      >
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="flex flex-col gap-6"
      >
        {/* Header */}
        <header className="flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
              <ClipboardList className="h-5 w-5" aria-hidden />
            </span>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                {t(uiLang, 'myHealth.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t(uiLang, 'myHealth.subtitle')}
              </p>
            </div>
          </div>
          <p className="flex items-center gap-1.5 self-start rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            <Lock className="h-3 w-3" aria-hidden />
            {t(uiLang, 'myHealth.privacyNote')}
          </p>
        </header>

        {/* Profile section */}
        <section
          aria-labelledby="mh-profile-heading"
          className="flex flex-col gap-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="mh-profile-heading"
              className="text-lg font-bold tracking-tight text-foreground"
            >
              {t(uiLang, 'myHealth.profileSection')}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5">
              {profileActive ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                  {t(uiLang, 'myHealth.profileSet')}
                </span>
              ) : null}
              {profileActive ? (
                <>
                  <button
                    type="button"
                    onClick={handleShareProfile}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                    aria-label={t(uiLang, 'myHealth.shareProfile')}
                  >
                    <Share2 className="h-3.5 w-3.5" aria-hidden />
                    {t(uiLang, 'myHealth.shareProfile')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setClearProfileOpen(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/5 px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-500/15 dark:text-red-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                    aria-label={t(uiLang, 'myHealth.clearProfile')}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    {t(uiLang, 'myHealth.clearProfile')}
                  </button>
                </>
              ) : null}
            </div>
          </div>
          <ProfileCard
            lang={uiLang}
            profile={profile}
            onSave={handleSaveProfile}
          />
        </section>

        {/* Phase 2 — Health Dashboard Summary Card (aggregate of all trackers) */}
        <HealthSummaryCard
          lang={uiLang}
          summary={{
            conditionsCount: profile?.conditions?.length ?? 0,
            allergiesCount: profile?.allergies?.length ?? 0,
            medicationsCount: profile?.medications?.length ?? 0,
          }}
        />

        {/* Journal section */}
        <section
          aria-labelledby="mh-journal-heading"
          className="flex flex-col gap-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <h2
                id="mh-journal-heading"
                className="text-lg font-bold tracking-tight text-foreground"
              >
                {t(uiLang, 'myHealth.journalSection')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t(uiLang, 'myHealth.journalSubtitle')}
              </p>
            </div>
            {entries.length > 0 ? (
              <button
                type="button"
                onClick={() => setClearJournalOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/5 px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-500/15 dark:text-red-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                aria-label={t(uiLang, 'myHealth.clearJournal')}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                {t(uiLang, 'myHealth.clearJournal')}
              </button>
            ) : null}
          </div>
          <SymptomJournal
            lang={uiLang}
            entries={entries}
            onLog={handleLogEntry}
            onDelete={handleDeleteEntry}
          />
        </section>

        {/* Phase 2 — Health Timeline visualization (severity trend + triage distribution + recent entries) */}
        <HealthTimeline entries={entries} lang={uiLang} />

        {/* Phase 2 — Maternal Health Tracker (WHO 8-visit ANC schedule, shown when profile.pregnant) */}
        <MaternalHealthTracker lang={uiLang} isPregnant={profile?.pregnant ?? false} />

        {/* Phase 2 — Child Vaccine Schedule Tracker (Pakistan EPI schedule) */}
        <ChildVaccineTracker lang={uiLang} />

        {/* Phase 2 — Chronic Disease Management (diabetes + BP log, shown when profile has diabetes/hypertension) */}
        <ChronicDiseaseModule lang={uiLang} conditions={profile?.conditions ?? []} />

        {/* Phase 2 — Mental Health Screening (PHQ-9 + GAD-7 validated tools) */}
        <MentalHealthScreening lang={uiLang} />

        {/* Phase 2 — Nutrition + Lifestyle tracker (BMI + water + steps) */}
        <NutritionLifestyleTracker lang={uiLang} />

        {/* Phase 2 — Family Health Management (multi-profile for children/parents/spouse) */}
        <FamilyHealthManager lang={uiLang} />

        {/* Phase 2 — Air Quality + Environmental Health (AQI, pollen, asthma triggers) */}
        <AirQualityTracker lang={uiLang} />

        {/* Phase 2 — Hydration/Dehydration Tracker (ORS + water + urine color chart) */}
        <HydrationTracker lang={uiLang} />

        {/* Phase 2 — Medical Calculator Suite (EDD + GFR + insulin factor) */}
        <MedicalCalculatorSuite lang={uiLang} />

        {/* Phase 2 — Sleep Quality Tracker (hours, quality rating, 7-day trend) */}
        <SleepTracker lang={uiLang} />

        {/* Account & data section (auth, retention, audit log, delete-my-data) */}
        <AccountSection />
      </motion.div>

      {/* Clear profile confirm */}
      <AlertDialog open={clearProfileOpen} onOpenChange={setClearProfileOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(uiLang, 'myHealth.clearProfile')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(uiLang, 'myHealth.clearProfileConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <button className="h-10 rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
                {t(uiLang, 'chat.cancel')}
              </button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <button
                onClick={handleClearProfile}
                className="h-10 rounded-md bg-destructive px-4 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                {t(uiLang, 'myHealth.clearProfile')}
              </button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear journal confirm */}
      <AlertDialog open={clearJournalOpen} onOpenChange={setClearJournalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(uiLang, 'myHealth.clearJournal')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(uiLang, 'myHealth.clearJournalConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <button className="h-10 rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
                {t(uiLang, 'chat.cancel')}
              </button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <button
                onClick={handleClearJournal}
                className="h-10 rounded-md bg-destructive px-4 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                {t(uiLang, 'myHealth.clearJournal')}
              </button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  </div>
);
}
