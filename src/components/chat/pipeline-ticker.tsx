'use client';

import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Lang, PipelineStage } from '@/lib/types';
import { t, type TKey } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const TICKER_STAGES: { stage: PipelineStage; key: TKey }[] = [
  { stage: 'safety', key: 'pipeline.safety' },
  { stage: 'language', key: 'pipeline.language' },
  { stage: 'triage', key: 'pipeline.triage' },
  { stage: 'retrieval', key: 'pipeline.retrieval' },
  { stage: 'generation', key: 'pipeline.generation' },
  { stage: 'validation', key: 'pipeline.validation' },
];

interface PipelineTickerProps {
  completedStages: PipelineStage[];
  currentStage: PipelineStage | null;
  lang: Lang;
}

/** Live stage ticker shown while an answer streams in. */
export function PipelineTicker({ completedStages, currentStage, lang }: PipelineTickerProps) {
  const currentIndex = TICKER_STAGES.findIndex((s) => s.stage === currentStage);

  return (
    <div
      className="flex flex-wrap items-center gap-x-1.5 gap-y-1"
      role="status"
      aria-live="polite"
      aria-label={t(lang, 'pipeline.thinking')}
    >
      {TICKER_STAGES.map((s, i) => {
        const done = completedStages.includes(s.stage);
        const current = s.stage === currentStage && !done;
        return (
          <span key={s.stage} className="flex items-center gap-1.5">
            {i > 0 ? (
              <span className="text-muted-foreground/50" aria-hidden>
                →
              </span>
            ) : null}
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
                done && 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400',
                current &&
                  'bg-primary/15 text-primary font-semibold ring-1 ring-primary/30',
                !done && !current && 'text-muted-foreground',
              )}
            >
              {done ? (
                <Check className="h-3 w-3 text-emerald-600" aria-hidden />
              ) : current ? (
                <motion.span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-primary stage-dot-pulse"
                  aria-hidden
                />
              ) : (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/30" aria-hidden />
              )}
              {t(lang, s.key)}
            </span>
          </span>
        );
      })}
      {currentIndex === -1 && completedStages.length === 0 ? (
        <span className="text-xs text-muted-foreground">{t(lang, 'pipeline.thinking')}…</span>
      ) : null}
    </div>
  );
}
