'use client';

import type { Lang, PipelineStage } from '@/lib/types';
import { t } from '@/lib/i18n';

interface PipelineTickerProps {
  completedStages: PipelineStage[];
  currentStage: PipelineStage | null;
  lang: Lang;
}

/** Plain patient-facing progress while an answer is prepared. Pipeline
 *  internals (stages, validators) are deliberately not shown to patients. */
export function PipelineTicker({ lang }: PipelineTickerProps) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="stage-dot-pulse inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
      {t(lang, 'pipeline.thinking')}…
    </div>
  );
}
