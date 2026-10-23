'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList, Lock, Share2, Trash2, Download, Heart, Activity,
  Thermometer, Pill, Sparkles, Calendar, Wind, ShieldCheck, ArrowRight, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
        <div className="hero-banner hero-hub relative min-h-[160px] rounded-2xl p-6 sm:p-8 flex items-center justify-between overflow-hidden shadow-xs">
          <div className="max-w-[560px] z-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              My <span className="text-[#008d6d]">Health Record</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
              Your complete health information in one place. Track progress and share securely with your doctors.
            </p>
          </div>
          <img
            src="/assets/health_woman.png"
            alt="Health hub"
            className="hidden md:block absolute right-[260px] top-0 h-full w-auto max-w-[28%] object-cover pointer-events-none"
          />
          <div className="hidden sm:flex items-center gap-3.5 bg-background/90 backdrop-blur-sm p-4 rounded-2xl border border-border/80 shadow-xs z-10">
            <div className="h-16 w-16 rounded-full border-4 border-[#009b78] border-r-emerald-200 flex items-center justify-center font-extrabold text-base text-[#009b78]">
              85%
            </div>
            <div className="text-xs">
              <b className="text-foreground block">Profile Completion</b>
              <span className="text-[11px] text-muted-foreground">Demo value — use actual computed completion only.</span>
            </div>
          </div>
        </div>

        {/* Patient Profile Header Strip */}
        <div className="surface pad p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-full bg-emerald-500/15 text-[#007b61] font-extrabold flex items-center justify-center text-base">
              FA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  Fatima Ali
                </h3>
                <span className="chip green text-[10px]">Sample Profile</span>
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
              className="h-9 px-3.5 rounded-xl border-border text-xs font-semibold gap-1.5"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share with Doctor
            </Button>
            <Button
              size="sm"
              onClick={() => window.print()}
              className="h-9 px-3.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold gap-1.5 hover:bg-primary/90"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* 4 Prominent Switchable Tabs (§ references/04_My_Health_Record.png) */}
        <div className="tabrow" role="tablist">
          {[
            { id: 'overview', icon: Activity, num: 1, label: 'Overview & Vitals' },
            { id: 'records', icon: ClipboardList, num: 2, label: 'Clinical Records & Labs' },
            { id: 'programs', icon: Heart, num: 3, label: 'Maternal & Child (EPI)' },
            { id: 'privacy', icon: Lock, num: 4, label: 'Privacy & Consent' },
          ].map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={phrTab === t.id}
              onClick={() => setPhrTab(t.id as any)}
              className={cn('tab-custom', phrTab === t.id && 'active')}
            >
              <t.icon className="h-4 w-4" />
              <span>{t.num}. {t.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW & VITALS */}
        {phrTab === 'overview' ? (
          <div className="flex flex-col gap-5">
            {/* 4 Vital Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                { icon: Heart, color: 'text-pink-600 bg-pink-500/10', title: 'Blood Pressure', val: '120 / 80', unit: 'mmHg', desc: 'Normal · sample' },
                { icon: Activity, color: 'text-blue-600 bg-blue-500/10', title: 'Blood Glucose', val: '96', unit: 'mg/dL', desc: 'Optimal · sample' },
                { icon: Thermometer, color: 'text-purple-600 bg-purple-500/10', title: 'Body Temperature', val: '98.6', unit: '°F', desc: 'Normal · sample' },
                { icon: ClipboardList, color: 'text-emerald-600 bg-emerald-500/10', title: 'Weight & BMI', val: '62 kg', unit: 'BMI 23.1', desc: 'Sample profile' },
              ].map((v, idx) => (
                <div key={idx} className="metric-card surface p-4 flex items-center gap-3.5">
                  <div className={cn('h-11 w-11 rounded-2xl flex items-center justify-center shrink-0', v.color)}>
                    <v.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{v.title}</span>
                    <div className="text-xl font-extrabold text-foreground mt-0.5">
                      {v.val} <span className="text-[11px] font-normal text-muted-foreground">{v.unit}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#008664]">{v.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 2-Column: Current Medications & Recent Symptoms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Medications */}
              <div className="surface pad p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground">Current Medications & Reminders</h3>
                  <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-muted-foreground">See All →</Button>
                </div>
                <div className="space-y-2.5">
                  {[
                    { name: 'Metformin 500mg', desc: 'Twice daily with meals', status: 'Taken Today' },
                    { name: 'Lisinopril 10mg', desc: 'Once daily in morning', status: 'Taken Today' },
                    { name: 'Vitamin D3 1000 IU', desc: 'Once daily after breakfast', status: 'Due at 8 PM' },
                  ].map((med, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/60">
                      <div className="flex items-center gap-2.5">
                        <div className="iconbox h-8 w-8 rounded-lg bg-emerald-500/10 text-[#009b78]">
                          <Pill className="h-4 w-4" />
                        </div>
                        <div>
                          <b className="text-xs text-foreground block">{med.name}</b>
                          <span className="text-[11px] text-muted-foreground">{med.desc}</span>
                        </div>
                      </div>
                      <span className={cn('chip text-[10px]', med.status === 'Taken Today' ? 'green' : 'orange')}>{med.status}</span>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full h-9 rounded-xl border-dashed border-border text-xs font-semibold text-muted-foreground mt-1">
                    + Add Medication
                  </Button>
                </div>
              </div>

              {/* Recent Symptoms & Health Notes */}
              <div className="surface pad p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground">Recent Symptoms & Health Notes</h3>
                  <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-muted-foreground">See All →</Button>
                </div>
                <div className="space-y-2.5">
                  {[
                    { note: 'Dry cough & mild throat tickle', sub: 'Severity 2/5 · Today' },
                    { note: 'Mild tension headache', sub: 'Resolved after hydration and rest' },
                    { note: 'Mild stomach discomfort', sub: 'After food · Resolved' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border/60">
                      <div className="iconbox h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 mt-0.5">
                        <Heart className="h-4 w-4" />
                      </div>
                      <div>
                        <b className="text-xs text-foreground block">{item.note}</b>
                        <span className="text-[11px] text-muted-foreground">{item.sub}</span>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full h-9 rounded-xl border-dashed border-border text-xs font-semibold text-muted-foreground mt-1">
                    + Log New Symptom
                  </Button>
                </div>
              </div>
            </div>

            {/* Bottom 3 Insight Modules */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Health Insights */}
              <div className="surface pad p-5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">Health Insights</h3>
                  <span className="chip green text-[10px]">AI</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Illustrative health insight. Real guidance must use source-backed clinical logic.
                </p>
                <div className="inset inset-green p-3 rounded-xl border border-emerald-200/60 flex items-start gap-2 text-xs text-foreground/90">
                  <Sparkles className="h-4 w-4 text-[#009b78] shrink-0 mt-0.5" />
                  <span>Continue hydration and note symptom changes over the next 48 hours.</span>
                </div>
              </div>

              {/* Upcoming Reminders */}
              <div className="surface pad p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Upcoming Reminders</h3>
                  <Button variant="ghost" size="sm" className="h-6 text-[11px] text-muted-foreground">View All</Button>
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
                          <span className="text-[10px] text-muted-foreground">{rem.time}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-semibold text-primary">Manage</Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Air Quality */}
              <div className="surface pad p-5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">Air Quality in Lahore</h3>
                  <Wind className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-xl font-extrabold text-[#be630c] flex items-center gap-2">
                  AQI 168 <span className="chip orange text-[10px]">Example</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sample environmental guidance. Live AQI requires a verified provider and timestamp.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 rounded-xl border-border text-xs font-semibold hover:bg-accent mt-1"
                >
                  Preventative Guidance →
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
