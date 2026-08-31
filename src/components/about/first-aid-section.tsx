'use client';

// ============================================================
// First-aid quick reference — a browsable gallery of ALL
// pre-written emergency templates: the same reviewed,
// deterministic content the emergency takeover shows.
// Never LLM text (Decision D3).
// Search matches titles in all 3 languages + the category id,
// so "choking", "دم" or "seene mein dard" all find their card.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Baby,
  Bandage,
  Brain,
  Candy,
  Droplets,
  Flame,
  Gauge,
  HandHeart,
  HardHat,
  HeartHandshake,
  HeartPulse,
  PersonStanding,
  Phone,
  Pill,
  Search,
  Siren,
  Sprout,
  Stethoscope,
  Thermometer,
  Waves,
  Wind,
  Worm,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import { EMERGENCY_TEMPLATES } from '@/data/emergency-templates';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

/** Icon per template category — one distinct glyph so the list scans fast. */
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cardiac: HeartPulse,
  stroke: Brain,
  bleeding: Droplets,
  unconscious: Activity,
  convulsions: Zap,
  'obstetric-bleeding': Sprout,
  'obstetric-preeclampsia': Gauge,
  pediatric: Baby,
  dehydration: Waves,
  poisoning: Pill,
  snakebite: Worm,
  burns: Flame,
  meningitis: Thermometer,
  'mental-health': HandHeart,
  anaphylaxis: ShieldAlert,
  'head-injury': HardHat,
  abdominal: Stethoscope,
  'spine-trauma': PersonStanding,
  'chest-trauma': Bandage,
  'diabetic-emergency': Candy,
  'general-emergency': Siren,
  choking: Wind,
  'obstetric-emergency': HeartHandshake,
};

/** Search a template: title (all 3 languages) or the category id. */
export function matchesFirstAidQuery(
  tpl: { patternCategory: string; title: { en: string; ur: string; roman: string } },
  rawQuery: string,
): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  return (
    tpl.title.en.toLowerCase().includes(q) ||
    tpl.title.ur.includes(rawQuery.trim()) ||
    tpl.title.roman.toLowerCase().includes(q) ||
    tpl.patternCategory.includes(q)
  );
}

export function FirstAidSection() {
  const langPref = useAppStore((s) => s.langPref);
  const uiLang = resolveUiLang(langPref);
  const isUr = uiLang === 'ur';
  const [query, setQuery] = useState('');
  const pendingAboutQuery = useAppStore((s) => s.pendingAboutQuery);
  const setPendingAboutQuery = useAppStore((s) => s.setPendingAboutQuery);

  // Consume a pending query set by the global search dialog (one-shot):
  // pre-filter this list, then clear the pending state. Same documented
  // escape hatch as ReminderDialog's initialDraft — setState-in-effect
  // guarded by a ref so each unique query is applied exactly once.
  const lastAppliedQuery = useRef<string | null>(null);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const incoming = pendingAboutQuery?.firstAid ?? null;
    if (incoming && incoming !== lastAppliedQuery.current) {
      lastAppliedQuery.current = incoming;
      setQuery(incoming);
      setPendingAboutQuery(null);
    }
  }, [pendingAboutQuery, setPendingAboutQuery]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filtered = useMemo(
    () => EMERGENCY_TEMPLATES.filter((tpl) => matchesFirstAidQuery(tpl, query)),
    [query],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
      aria-label={t(uiLang, 'about.firstAidTitle')}
    >
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/10">
          <Siren className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden />
        </span>
        {t(uiLang, 'about.firstAidTitle')}
      </h2>

      <p className="text-sm leading-relaxed text-foreground/90">
        {t(uiLang, 'about.firstAidBody')}
      </p>

      {/* search + live count */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(uiLang, 'about.firstAidSearch')}
            aria-label={t(uiLang, 'about.firstAidSearch')}
            className="h-11 rounded-xl border-border bg-background/60 ps-9 pe-9 text-sm"
            dir="auto"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t(uiLang, 'chat.cancel')}
              className="absolute end-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
        <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground">
          {filtered.length} {t(uiLang, 'about.firstAidTopics')}
        </span>
      </div>

      {/* template list */}
      <div className="mt-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-background/60 px-5 py-8 text-center">
            <Search className="h-6 w-6 text-muted-foreground/60" aria-hidden />
            <p className={cn('text-sm text-muted-foreground', isUr && 'font-urdu')}>
              {t(uiLang, 'about.firstAidEmpty')}
            </p>
          </div>
        ) : (
          <Accordion
            type="single"
            collapsible
            className="custom-scrollbar max-h-[26rem] overflow-y-auto rounded-xl border border-border bg-background/60 px-4"
          >
            {filtered.map((tpl) => {
              const Icon = CATEGORY_ICONS[tpl.patternCategory] ?? Siren;
              return (
                <AccordionItem key={tpl.patternCategory} value={tpl.patternCategory}>
                  <AccordionTrigger
                    className={cn('gap-3 py-3.5 text-sm font-bold hover:no-underline', isUr && 'font-urdu')}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-600/10">
                        <Icon className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden />
                      </span>
                      <span className="min-w-0 text-start">{tpl.title[uiLang]}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent
                    className={cn('space-y-3 pb-4 text-sm', isUr && 'font-urdu')}
                    dir={isUr ? 'rtl' : 'ltr'}
                  >
                    <p className="leading-relaxed text-foreground/85">{tpl.reasonIntro[uiLang]}</p>
                    <div>
                      <p className="mb-1.5 text-xs font-bold tracking-wider text-foreground uppercase">
                        {t(uiLang, 'emergency.immediateActions')}
                      </p>
                      <ol className="space-y-1.5">
                        {tpl.immediateActions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 leading-relaxed text-foreground/85">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-extrabold text-primary">
                              {i + 1}
                            </span>
                            <span className="min-w-0 flex-1">{action[uiLang]}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-bold tracking-wider text-foreground uppercase">
                        {t(uiLang, 'emergency.doNot')}
                      </p>
                      <ul className="space-y-1">
                        {tpl.doNot.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 leading-relaxed text-foreground/85">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                            <span className="min-w-0 flex-1">{item[uiLang]}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p
                      className="flex items-center gap-2 rounded-xl bg-red-600/8 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-400"
                      dir="ltr"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {t(uiLang, 'about.firstAidCall')}
                    </p>
                    <p className="text-[11px] text-muted-foreground" dir="ltr">
                      {tpl.sources.join(' · ')}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </motion.section>
  );
}
