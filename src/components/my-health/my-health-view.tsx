'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList, Lock, Share2, Trash2, Download, Heart, Activity,
  Thermometer, Pill, Sparkles, Calendar, Wind, ShieldCheck, ArrowRight, Check, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store/app-store';
import { useChatStore } from '@/lib/store/chat-store';
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
import { GamificationCard } from './gamification-card';
import { WearableSync } from './wearable-sync';
import { LabTestBooking } from './lab-test-booking';
import { MedicineDelivery } from './medicine-delivery';
import { ChronicPrograms } from './chronic-programs';
import { DietPlanner } from './diet-planner';
import { InsuranceClaims } from './insurance-claims';
import { ConsentManager } from './consent-manager';
import { AppointmentManager } from './appointment-manager';
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
  const setView = useAppStore((s) => s.setView);
  const setPendingChatDraft = useChatStore((s) => s.setPendingChatDraft);
  const scrollToJournal = () =>
    document.getElementById('mh-journal-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  const [phrTab, setPhrTab] = useState<'overview' | 'records' | 'programs' | 'privacy'>('overview');
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
          'mx-auto w-full max-w-7xl flex-1 py-2 space-y-5',
          uiLang === 'ur' && 'font-urdu',
        )}
      >
        {/* High-Fidelity Personal Health Hero (§ references/04_My_Health_Record.png) */}
        <div className="hero-banner hero-hub relative flex items-center overflow-hidden">
          <div className="z-10 max-w-xl md:max-w-[60%]">
            <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-[1.7rem]">
              My <span className="text-primary">health record</span>
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Your complete health information in one place. Track progress and share securely with your doctors.
            </p>
          </div>
          <img
            src="/assets/health_woman.png"
            alt=""
            className="pointer-events-none absolute end-0 top-0 hidden h-full w-auto max-w-[32%] object-cover md:block"
          />
        </div>

        {/* Patient Profile Header Strip */}
        <div className="surface pad p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-base font-semibold text-accent-foreground">
              FA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">
                  Fatima Ali
                </h2>
                <span className="chip orange">Sample profile</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {profile?.sex === 'female' ? 'Female' : profile?.sex === 'male' ? 'Male' : 'Female'} · {profile?.ageBand ? profile.ageBand.replace('-', ' ') : '28 yrs'} · Lahore, Punjab · Blood Group: B+
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareProfile}
              className="h-9 gap-1.5 rounded-lg px-3.5 text-xs font-semibold"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share with Doctor
            </Button>
            <Button
              size="sm"
              onClick={() => window.print()}
              className="h-9 gap-1.5 rounded-lg px-3.5 text-xs font-semibold"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* 4 Prominent Switchable Tabs (§ references/04_My_Health_Record.png) */}
        <div className="tabrow" role="tablist" aria-label={t(uiLang, 'myHealth.title')}>
          {[
            { id: 'overview', icon: Activity, num: 1, label: 'Overview & Vitals' },
            { id: 'records', icon: ClipboardList, num: 2, label: 'Clinical Records & Labs' },
            { id: 'programs', icon: Heart, num: 3, label: 'Maternal & Child (EPI)' },
            { id: 'privacy', icon: Lock, num: 4, label: 'Privacy & Consent' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={phrTab === t.id}
              onClick={() => setPhrTab(t.id as any)}
              className={cn('tab-custom', phrTab === t.id && 'active')}
            >
              <t.icon className="h-4 w-4" aria-hidden />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & VITALS */}
        {phrTab === 'overview' ? (
          <div className="flex flex-col gap-5">
            {/* 4 Vital Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                { icon: Heart, color: 'iconbox-pink', title: 'Blood pressure', val: '120 / 80', unit: 'mmHg', desc: 'Normal · sample' },
                { icon: Activity, color: 'iconbox-blue', title: 'Blood glucose', val: '96', unit: 'mg/dL', desc: 'Optimal · sample' },
                { icon: Thermometer, color: 'iconbox-purple', title: 'Body temperature', val: '98.6', unit: '°F', desc: 'Normal · sample' },
                { icon: ClipboardList, color: '', title: 'Weight and BMI', val: '62 kg', unit: 'BMI 23.1', desc: 'Sample profile' },
              ].map((v, idx) => (
                <div key={idx} className="metric-card surface p-4 flex items-center gap-3.5">
                  <div className={cn('iconbox', v.color)}>
                    <v.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">{v.title}</span>
                    <div className="mt-0.5 text-xl font-semibold text-foreground tabular">
                      {v.val} <span className="text-xs font-normal text-muted-foreground">{v.unit}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{v.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 2-Column: Current Medications & Recent Symptoms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Medications */}
              <div className="surface pad p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">Medications and reminders</h3>
                  <Button variant="ghost" size="sm" onClick={() => setView('reminders')} className="h-9 text-xs font-semibold text-primary hover:text-primary">See all</Button>
                </div>
                <div className="space-y-2.5">
                  {[
                    { name: 'Metformin 500mg', desc: 'Twice daily with meals', status: 'Taken Today' },
                    { name: 'Lisinopril 10mg', desc: 'Once daily in morning', status: 'Taken Today' },
                    { name: 'Vitamin D3 1000 IU', desc: 'Once daily after breakfast', status: 'Due at 8 PM' },
                  ].map((med, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-2.5">
                        <div className="iconbox h-8 w-8 rounded-lg">
                          <Pill className="h-4 w-4" />
                        </div>
                        <div>
                          <b className="text-xs text-foreground block">{med.name}</b>
                          <span className="text-2xs text-muted-foreground">{med.desc}</span>
                        </div>
                      </div>
                      <span className={cn('chip text-2xs', med.status === 'Taken Today' ? 'green' : 'orange')}>{med.status}</span>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setView('reminders')} className="mt-1 h-10 w-full rounded-xl border-dashed text-xs font-semibold text-muted-foreground">
                    <Plus className="h-3.5 w-3.5" aria-hidden /> Add medication reminder
                  </Button>
                </div>
              </div>

              {/* Recent Symptoms & Health Notes */}
              <div className="surface pad p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">Recent symptoms and notes</h3>
                  <Button variant="ghost" size="sm" onClick={scrollToJournal} className="h-9 text-xs font-semibold text-primary hover:text-primary">See all</Button>
                </div>
                <div className="space-y-2.5">
                  {[
                    { note: 'Dry cough & mild throat tickle', sub: 'Severity 2/5 · Today' },
                    { note: 'Mild tension headache', sub: 'Resolved after hydration and rest' },
                    { note: 'Mild stomach discomfort', sub: 'After food · Resolved' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/50">
                      <div className="iconbox iconbox-purple mt-0.5 h-8 w-8 rounded-lg">
                        <Heart className="h-4 w-4" />
                      </div>
                      <div>
                        <b className="text-xs text-foreground block">{item.note}</b>
                        <span className="text-2xs text-muted-foreground">{item.sub}</span>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={scrollToJournal} className="mt-1 h-10 w-full rounded-xl border-dashed text-xs font-semibold text-muted-foreground">
                    <Plus className="h-3.5 w-3.5" aria-hidden /> Log a symptom
                  </Button>
                </div>
              </div>
            </div>

            {/* Bottom 3 Insight Modules */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Health Insights */}
              <div className="surface pad p-5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Health Insights</h3>
                  <span className="chip orange">Illustrative</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Illustrative health insight. Real guidance must use source-backed clinical logic.
                </p>
                <div className="inset inset-green flex items-start gap-2 rounded-xl p-3 text-xs text-foreground">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Continue hydration and note symptom changes over the next 48 hours.</span>
                </div>
              </div>

              {/* Upcoming Reminders */}
              <div className="surface pad p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Upcoming reminders</h3>
                  <Button variant="ghost" size="sm" onClick={() => setView('reminders')} className="h-8 text-xs font-semibold text-primary hover:text-primary">View all</Button>
                </div>
                <div className="space-y-2">
                  {[
                    { title: 'Metformin 500mg', time: 'Today, 8:00 PM' },
                    { title: 'Doctor follow-up', time: 'Tomorrow, 11:30 AM' },
                    { title: 'Lab Test (CBC)', time: '15 Nov 2026, 9:00 AM' },
                  ].map((rem, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-blue-600" />
                        <div>
                          <b className="text-foreground block">{rem.title}</b>
                          <span className="text-2xs text-muted-foreground">{rem.time}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setView('reminders')} className="h-8 px-2 text-xs font-semibold text-primary hover:text-primary">Manage</Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Air Quality */}
              <div className="surface pad p-5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Air Quality in Lahore</h3>
                  <Wind className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex items-center gap-2 text-xl font-semibold text-warning">
                  AQI 168 <span className="chip orange text-2xs">Example</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sample environmental guidance. Live AQI requires a verified provider and timestamp.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPendingChatDraft('How can I protect my health on days with poor air quality (high AQI)?');
                    setView('chat');
                  }}
                  className="mt-1 h-9 w-full rounded-lg text-xs font-semibold"
                >
                  Ask about protective steps
                </Button>
              </div>
            </div>

            {/* Profile section */}
            <section
              aria-labelledby="mh-profile-heading"
              className="flex flex-col gap-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2
                  id="mh-profile-heading"
                  className="text-lg font-semibold tracking-tight text-foreground"
                >
                  {t(uiLang, 'myHealth.profileSection')}
                </h2>
                <div className="flex flex-wrap items-center gap-1.5">
                  {profileActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-2xs font-bold text-emerald-700 dark:text-emerald-400">
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

            {/* Health Dashboard Summary Card */}
            <HealthSummaryCard
              lang={uiLang}
              conditionsCount={profile?.conditions?.length ?? 0}
              allergiesCount={profile?.allergies?.length ?? 0}
              medicationsCount={profile?.medications?.length ?? 0}
            />

            {/* Gamification */}
            <GamificationCard />

            {/* Wearable Sync */}
            <WearableSync />

            {/* Journal section */}
            <section
              aria-labelledby="mh-journal-heading"
              className="flex flex-col gap-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <h2
                    id="mh-journal-heading"
                    className="text-lg font-semibold tracking-tight text-foreground"
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

            {/* Appointment Manager */}
            <AppointmentManager />
          </div>
        ) : null}

        {/* TAB 2: CLINICAL RECORDS & LABS */}
        {phrTab === 'records' ? (
          <div className="flex flex-col gap-6">
            <HealthTimeline entries={entries} lang={uiLang} />
            <ChronicPrograms />
            <MedicalCalculatorSuite lang={uiLang} />
            <InsuranceClaims />
            <LabTestBooking />
            <MedicineDelivery />
          </div>
        ) : null}

        {/* TAB 3: MATERNAL & CHILD HEALTH (EPI) */}
        {phrTab === 'programs' ? (
          <div className="flex flex-col gap-6">
            <MaternalHealthTracker lang={uiLang} isPregnant={profile?.pregnant ?? false} />
            <ChildVaccineTracker lang={uiLang} />
            <ChronicDiseaseModule lang={uiLang} conditions={profile?.conditions ?? []} />
            <MentalHealthScreening lang={uiLang} />
            <NutritionLifestyleTracker lang={uiLang} />
            <DietPlanner />
            <FamilyHealthManager lang={uiLang} />
            <AirQualityTracker lang={uiLang} />
            <HydrationTracker lang={uiLang} />
            <SleepTracker lang={uiLang} />
          </div>
        ) : null}

        {/* TAB 4: PRIVACY & CONSENT */}
        {phrTab === 'privacy' ? (
          <div className="flex flex-col gap-6">
            <ConsentManager />
            <AccountSection />
          </div>
        ) : null}

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
