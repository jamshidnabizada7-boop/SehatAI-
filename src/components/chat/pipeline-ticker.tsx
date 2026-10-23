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
  return <div role="status" aria-live="polite" className="text-xs text-muted-foreground">{t(lang, 'pipeline.thinking')}…</div>;
}
