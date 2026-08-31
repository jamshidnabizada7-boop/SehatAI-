'use client';

import { motion } from 'framer-motion';
import { CircleAlert, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Lang, ResponseConfidence } from '@/lib/types';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Band = ResponseConfidence['band'];

const BAND_STYLES: Record<Band, string> = {
  HIGH: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30',
  MEDIUM: 'bg-amber-500 text-white shadow-sm shadow-amber-500/30',
  LOW: 'bg-red-600 text-white shadow-sm shadow-red-600/30',
};

const BAND_LABELS: Record<Band, 'confidence.high' | 'confidence.medium' | 'confidence.low'> = {
  HIGH: 'confidence.high',
  MEDIUM: 'confidence.medium',
  LOW: 'confidence.low',
};

function BandIcon({ band }: { band: Band }) {
  const cls = 'h-3 w-3 shrink-0';
  switch (band) {
    case 'HIGH':
      return <ShieldCheck className={cls} aria-hidden />;
    case 'MEDIUM':
      return <CircleAlert className={cls} aria-hidden />;
    case 'LOW':
      return <TriangleAlert className={cls} aria-hidden />;
  }
}

interface ConfidenceBadgeProps {
  confidence: ResponseConfidence | null | undefined;
  lang: Lang;
  className?: string;
}

/** Small pill badge that shows the calibrated confidence band for an
 *  assistant message. Clicking opens a popover with the lowering factors
 *  (reasons[]) and a tooltip explains what confidence means. Renders
 *  nothing when `confidence` is null/undefined (older messages, offline). */
export function ConfidenceBadge({ confidence, lang, className }: ConfidenceBadgeProps) {
  if (!confidence) return null;
  const band = confidence.band;
  const label = t(lang, BAND_LABELS[band]);
  const scorePct = Math.round((confidence.score ?? 0) * 100);

  return (
    <Popover>
      <Tooltip>
        <div className={cn('inline-flex', className)}>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                whileTap={{ scale: 0.96 }}
                aria-label={`${label} — ${t(lang, 'confidence.tooltip')}`}
                className={cn(
                  'inline-flex min-h-[28px] items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase transition-shadow focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                  BAND_STYLES[band],
                )}
              >
                <BandIcon band={band} />
                <span>{label}</span>
                <span className="opacity-80">·</span>
                <span className="tabular-nums opacity-90">{scorePct}%</span>
              </motion.button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[260px] text-balance">
            {t(lang, 'confidence.tooltip')}
          </TooltipContent>
        </div>
      </Tooltip>
      <PopoverContent
        align="start"
        sideOffset={6}
        className={cn('w-72 p-3 text-xs', lang === 'ur' && 'font-urdu text-right')}
        dir={lang === 'ur' ? 'rtl' : 'ltr'}
      >
        <div className="mb-1 flex items-center gap-2">
          <BandIcon band={band} />
          <span className="text-sm font-bold text-foreground">{label}</span>
          <span className="ms-auto tabular-nums text-muted-foreground">
            {t(lang, 'confidence.scoreLabel')}: {scorePct}%
          </span>
        </div>
        <p className="mb-2 leading-relaxed text-muted-foreground">{t(lang, 'confidence.tooltip')}</p>
        <div className="border-t border-border pt-2">
          <p className="mb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            {t(lang, 'confidence.reasonsTitle')}
          </p>
          {confidence.reasons && confidence.reasons.length > 0 ? (
            <ul className="list-disc space-y-1 ps-4 leading-relaxed text-foreground/90">
              {confidence.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : (
            <p className="italic text-muted-foreground">{t(lang, 'confidence.noReasons')}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
