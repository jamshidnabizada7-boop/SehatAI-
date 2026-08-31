'use client';

import { AlertTriangle, Clock, Leaf } from 'lucide-react';
import type { Lang, TriageLevel } from '@/lib/types';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const LEVEL_STYLES: Record<TriageLevel, string> = {
  EMERGENCY: 'bg-red-600 text-white shadow-sm shadow-red-600/30',
  URGENT: 'bg-orange-500 text-white shadow-sm shadow-orange-500/30',
  ROUTINE: 'bg-yellow-400 text-yellow-950 shadow-sm',
  SELF_CARE: 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30',
};

function LevelIcon({ level }: { level: TriageLevel }) {
  const cls = 'h-3 w-3 shrink-0';
  switch (level) {
    case 'EMERGENCY':
      return <AlertTriangle className={cls} aria-hidden />;
    case 'URGENT':
      return <Clock className={cls} aria-hidden />;
    case 'ROUTINE':
      return <Clock className={cls} aria-hidden />;
    case 'SELF_CARE':
      return <Leaf className={cls} aria-hidden />;
  }
}

interface TriageBadgeProps {
  level: TriageLevel;
  lang: Lang;
  reason?: string;
  className?: string;
}

/** Pill badge for the 4 triage levels + optional reason line below. */
export function TriageBadge({ level, lang, reason, className }: TriageBadgeProps) {
  return (
    <div className={cn('flex flex-col items-start gap-1', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase',
          LEVEL_STYLES[level],
        )}
        role="status"
        aria-label={`${t(lang, `triage.${level}`)}`}
      >
        <LevelIcon level={level} />
        {t(lang, `triage.${level}`)}
      </span>
      {reason ? (
        <span className="text-xs leading-relaxed text-muted-foreground">{reason}</span>
      ) : null}
    </div>
  );
}
