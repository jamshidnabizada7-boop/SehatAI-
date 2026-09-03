'use client';

import { motion } from 'framer-motion';
import {
  BookOpenCheck,
  CloudOff,
  Cpu,
  Earth,
  Globe2,
  HandHeart,
  HeartPulse,
  Languages,
  Layers,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  Users,
  XCircle,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import { GlossarySection } from './glossary-section';
import { FirstAidSection } from './first-aid-section';
import { HealthEducationLibrary } from './health-education-library';
import { HealthTipsBrowser } from './health-tips-browser';
import { PwaInstallButton } from '@/components/app/pwa-install-button';
import { cn } from '@/lib/utils';

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

// Credibility sources — paired with an icon and a short kind label, so the
// "Where does the guidance come from?" question has a real answer on screen.
const CREDIBILITY_SOURCES: { label: string; kind: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: 'WHO', kind: 'Global health authority', icon: Globe2 },
  { label: 'WHO EMRO', kind: 'Eastern Mediterranean office', icon: Earth },
  { label: 'UNICEF', kind: 'Maternal & child health', icon: HandHeart },
  { label: 'Pakistan MoNHSRC', kind: 'EPI vaccine schedule', icon: Stethoscope },
  { label: 'IFRC', kind: 'First aid protocols', icon: ShieldCheck },
];

function Section({
  title,
  icon: Icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      {...fadeUp}
      transition={{ duration: 0.3, delay }}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
      aria-label={title}
    >
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" aria-hidden />
        </span>
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

export function AboutView() {
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const isUr = uiLang === 'ur';

  const languageExamples = [
    { tag: 'English', text: 'I have had fever for two days', dir: 'ltr' },
    { tag: 'اردو', text: 'مجھے دو دن سے بخار ہے', dir: 'rtl', urdu: true },
    { tag: 'Roman Urdu', text: 'mujhe do din se bukhar hai', dir: 'ltr' },
  ];

  const personas = [
    { title: t(uiLang, 'about.persona1Title'), body: t(uiLang, 'about.persona1Body') },
    { title: t(uiLang, 'about.persona2Title'), body: t(uiLang, 'about.persona2Body') },
    { title: t(uiLang, 'about.persona3Title'), body: t(uiLang, 'about.persona3Body') },
  ];

  return (
    <div className="custom-scrollbar h-full overflow-y-auto px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-4">
        {/* hero */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm"
        >
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
              <HeartPulse className="h-8 w-8 text-primary" aria-hidden />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">
                {t(uiLang, 'about.title')}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(uiLang, 'about.subtitle')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* what it is / is not */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Section title={t(uiLang, 'about.whatTitle')} icon={ShieldCheck} delay={0.05}>
            <p className="text-sm leading-relaxed text-foreground/90">
              {t(uiLang, 'about.whatBody')}
            </p>
          </Section>
          <Section title={t(uiLang, 'about.whatNotTitle')} icon={XCircle} delay={0.1}>
            <p className="text-sm leading-relaxed text-foreground/90">
              {t(uiLang, 'about.whatNotBody')}
            </p>
            <p className="mt-3 rounded-xl bg-red-600/8 px-3 py-2 text-xs font-bold text-red-700 dark:text-red-400">
              {t(uiLang, 'about.identity')}
            </p>
          </Section>
        </div>

        {/* safety architecture */}
        <Section title={t(uiLang, 'about.safetyTitle')} icon={Layers} delay={0.15}>
          <div className="grid gap-3 sm:grid-cols-3" dir="ltr">
            {[
              {
                layer: t(uiLang, 'about.safetyL0'),
                body: t(uiLang, 'about.safetyL0Body'),
                icon: ScanSearch,
                time: '< 5ms',
              },
              {
                layer: t(uiLang, 'about.safetyL1'),
                body: t(uiLang, 'about.safetyL1Body'),
                icon: Cpu,
                time: 'pre-LLM',
              },
              {
                layer: t(uiLang, 'about.safetyL2'),
                body: t(uiLang, 'about.safetyL2Body'),
                icon: ShieldCheck,
                time: 'post-gen',
              },
            ].map((s, i) => (
              <div
                key={s.layer}
                className="relative rounded-xl border border-border bg-background/60 p-4"
              >
                <span className="absolute end-3 top-3 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  {s.time}
                </span>
                <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className="h-4 w-4 text-primary" aria-hidden />
                </span>
                <p className="text-sm font-bold text-foreground">{s.layer}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
                {i < 2 ? (
                  <span className="absolute -end-[13px] top-1/2 z-10 hidden -translate-y-1/2 text-muted-foreground sm:block" aria-hidden>
                    →
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-red-600/8 p-3.5">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-400">
                {t(uiLang, 'about.bypassTitle')}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-foreground/85">
                {t(uiLang, 'about.bypassBody')}
              </p>
            </div>
          </div>
        </Section>

        {/* languages + offline */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Section title={t(uiLang, 'about.languagesTitle')} icon={Languages} delay={0.2}>
            <p className="text-sm leading-relaxed text-foreground/90">
              {t(uiLang, 'about.languagesBody')}
            </p>
            <div className="mt-3 space-y-1.5">
              {languageExamples.map((ex) => (
                <div
                  key={ex.tag}
                  dir={ex.dir}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-sm',
                    ex.urdu && 'font-urdu',
                  )}
                >
                  <span className="text-foreground/90">{ex.text}</span>
                  <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {ex.tag}
                  </span>
                </div>
              ))}
            </div>
          </Section>
          <Section title={t(uiLang, 'about.offlineTitle')} icon={CloudOff} delay={0.25}>
            <p className="text-sm leading-relaxed text-foreground/90">
              {t(uiLang, 'about.offlineBody')}
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500/12 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <CloudOff className="h-3.5 w-3.5" aria-hidden />
              {t(uiLang, 'offlineBanner.title')}
            </p>
          </Section>
        </div>

        {/* first aid quick reference — all 23 reviewed emergency templates */}
        <FirstAidSection />

        {/* Phase 2 — Health Education Library (searchable WHO/UNICEF/IFRC corpus) */}
        <HealthEducationLibrary lang={uiLang} />

        {/* Phase 2 — Health Tips Browser (browse + bookmark 15 daily tips) */}
        <HealthTipsBrowser lang={uiLang} />

        {/* glossary */}
        <GlossarySection />

        {/* sources */}
        <Section title={t(uiLang, 'about.sourcesTitle')} icon={BookOpenCheck} delay={0.3}>
          <p className="text-sm leading-relaxed text-foreground/90">
            {t(uiLang, 'about.sourcesBody')}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {CREDIBILITY_SOURCES.map((s) => (
              <li
                key={s.label}
                className="flex items-center gap-2.5 rounded-xl border border-border bg-background/60 px-3 py-2.5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className="h-4 w-4 text-primary" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground">{s.kind}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        {/* judge notes */}
        <Section title={t(uiLang, 'about.judgeTitle')} icon={Users} delay={0.35}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <Smartphone className="h-3.5 w-3.5" aria-hidden />
              {t(uiLang, 'about.judgePwa')}
            </p>
            <PwaInstallButton />
          </div>
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            {t(uiLang, 'about.installDesc')}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {personas.map((p) => (
              <div key={p.title} className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-sm font-bold text-foreground">{p.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <p
          className={cn(
            'pb-4 text-center text-xs text-muted-foreground',
            isUr && 'font-urdu',
          )}
        >
          {t(uiLang, 'footer.disclaimer')}
        </p>
      </div>
    </div>
  );
}
