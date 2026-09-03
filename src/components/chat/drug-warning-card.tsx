'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp, Info, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DrugCheckSummary, DrugSeverity, Lang } from '@/lib/types';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const SEVERITY_BORDER: Record<DrugSeverity, string> = {
  HIGH: 'border-l-red-600',
  MODERATE: 'border-l-amber-500',
  LOW: 'border-l-yellow-400',
  NONE: 'border-l-muted',
};

const SEVERITY_BG: Record<DrugSeverity, string> = {
  HIGH: 'bg-red-50 dark:bg-red-950/40',
  MODERATE: 'bg-amber-50 dark:bg-amber-950/40',
  LOW: 'bg-yellow-50 dark:bg-yellow-950/30',
  NONE: 'bg-card',
};

const SEVERITY_ICON_COLOR: Record<DrugSeverity, string> = {
  HIGH: 'text-red-600 dark:text-red-400',
  MODERATE: 'text-amber-600 dark:text-amber-400',
  LOW: 'text-yellow-700 dark:text-yellow-400',
  NONE: 'text-muted-foreground',
};

function TitleIcon({ severity }: { severity: DrugSeverity }) {
  const cls = cn('h-5 w-5 shrink-0', SEVERITY_ICON_COLOR[severity]);
  if (severity === 'HIGH' || severity === 'MODERATE') {
    return <AlertTriangle className={cls} aria-hidden />;
  }
  if (severity === 'LOW') {
    return <Pill className={cls} aria-hidden />;
  }
  return <Info className={cls} aria-hidden />;
}

function titleKey(severity: DrugSeverity): 'drugWarning.titleHigh' | 'drugWarning.titleModerate' | 'drugWarning.titleLow' | 'drugWarning.titleLow' {
  if (severity === 'HIGH') return 'drugWarning.titleHigh';
  if (severity === 'MODERATE') return 'drugWarning.titleModerate';
  return 'drugWarning.titleLow';
}

interface DrugWarningCardProps {
  drugCheck: DrugCheckSummary;
  lang: Lang;
  className?: string;
}

/** Prominent medication-safety alert card shown above the main assistant
 *  response text when the rules engine flags a HIGH / MODERATE / LOW
 *  interaction. Expandable to reveal the full recommendation, interaction
 *  hits, allergy cross-checks and special-population flags. */
export function DrugWarningCard({ drugCheck, lang, className }: DrugWarningCardProps) {
  const [open, setOpen] = useState(false);
  const severity = drugCheck.severity;
  if (severity === 'NONE') return null;

  const title = t(lang, titleKey(severity));
  const hasHits = drugCheck.hits.length > 0;
  const hasAllergies = drugCheck.allergies.length > 0;
  const hasFlags = drugCheck.flags.length > 0;
  const hasDetails = hasHits || hasAllergies || hasFlags;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      role="alert"
      className={cn(
        'rounded-xl border border-l-4 border-border bg-card shadow-sm',
        SEVERITY_BORDER[severity],
        SEVERITY_BG[severity],
        lang === 'ur' && 'font-urdu text-right',
        className,
      )}
      dir={lang === 'ur' ? 'rtl' : 'ltr'}
    >
      <div className="flex items-start gap-2.5 p-3">
        <TitleIcon severity={severity} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug text-foreground">{title}</p>
          {drugCheck.recommendation ? (
            <p className="mt-1 text-xs leading-relaxed text-foreground/85">
              {drugCheck.recommendation}
            </p>
          ) : null}
        </div>
        {hasDetails ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="h-8 shrink-0 gap-1 px-2 text-xs font-semibold"
          >
            {open ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            )}
            <span className="hidden sm:inline">
              {open ? t(lang, 'drugWarning.collapse') : t(lang, 'drugWarning.expand')}
            </span>
          </Button>
        ) : null}
      </div>

      {open && hasDetails ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.2 }}
          className="space-y-2.5 border-t border-border/70 px-3 py-2.5 text-xs"
        >
          {hasHits ? (
            <div>
              <p className="mb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                {t(lang, 'drugWarning.interactions')}
              </p>
              <ul className="space-y-1.5">
                {drugCheck.hits.map((hit, i) => (
                  <li
                    key={`${hit.drugA}-${hit.drugB}-${i}`}
                    className="rounded-md bg-background/60 px-2 py-1.5"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-foreground">
                        {hit.drugA} + {hit.drugB}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase',
                          hit.severity === 'HIGH'
                            ? 'bg-red-600 text-white'
                            : hit.severity === 'MODERATE'
                              ? 'bg-amber-500 text-white'
                              : 'bg-yellow-400 text-yellow-950',
                        )}
                      >
                        {hit.severity}
                      </span>
                    </div>
                    {hit.effect ? (
                      <p className="mt-0.5 leading-relaxed text-foreground/85">
                        <span className="font-semibold">{t(lang, 'drugWarning.effectLabel')}:</span>{' '}
                        {hit.effect}
                      </p>
                    ) : null}
                    {hit.action ? (
                      <p className="mt-0.5 leading-relaxed text-foreground/85">
                        <span className="font-semibold">{t(lang, 'drugWarning.actionLabel')}:</span>{' '}
                        {hit.action}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {hasAllergies ? (
            <div>
              <p className="mb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                {t(lang, 'drugWarning.allergies')}
              </p>
              <ul className="space-y-1">
                {drugCheck.allergies.map((hit, i) => (
                  <li
                    key={`${hit.allergy}-${hit.trigger}-${i}`}
                    className="rounded-md bg-background/60 px-2 py-1.5"
                  >
                    <span className="font-bold text-foreground">
                      {hit.allergy} → {hit.trigger}
                    </span>
                    {hit.action ? (
                      <p className="mt-0.5 leading-relaxed text-foreground/85">{hit.action}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {hasFlags ? (
            <div>
              <p className="mb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                {t(lang, 'drugWarning.flags')}
              </p>
              <ul className="space-y-1">
                {drugCheck.flags.map((flag, i) => (
                  <li
                    key={`${flag.type}-${flag.drug}-${i}`}
                    className="rounded-md bg-background/60 px-2 py-1.5"
                  >
                    <span className="font-bold uppercase text-foreground">{flag.type}</span>
                    <span className="text-muted-foreground"> · {flag.drug}</span>
                    {flag.message ? (
                      <p className="mt-0.5 leading-relaxed text-foreground/85">{flag.message}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </motion.div>
  );
}
