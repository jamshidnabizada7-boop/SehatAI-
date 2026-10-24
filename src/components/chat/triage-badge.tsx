'use client';

import { AlertTriangle, Clock, Leaf } from 'lucide-react';
import type { Lang, TriageLevel } from '@/lib/types';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// Solid fills keep the 4-level colour meaning; each pair is ≥4.5:1.
const LEVEL_STYLES: Record<TriageLevel, string> = {
  EMERGENCY: 'bg-red-700 text-white',
  URGENT: 'bg-orange-700 text-white',
  ROUTINE: 'bg-yellow-300 text-yellow-950',
  SELF_CARE: 'bg-emerald-700 text-white',
  INFORMATIONAL: 'bg-info-soft text-info border border-info/20',
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
    case 'INFORMATIONAL':
      return null;
  }
}

interface TriageBadgeProps {
  level: TriageLevel;
  lang: Lang;
  reason?: string;
  className?: string;
}

/** Pill badge for triage levels. Suppressed on pure INFORMATIONAL messages to prevent conversational clutter. */
export function TriageBadge({ level, lang, reason, className }: TriageBadgeProps) {
  if (level === 'INFORMATIONAL') return null;

  return (
    <div className={cn('flex flex-col items-start gap-1', className)}>
      <span
        className={cn(
          'inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-2xs font-bold tracking-wide uppercase',
          LEVEL_STYLES[level],
        )}
        role="status"
        aria-label={`${t(lang, `triage.${level}`)}`}
      >
        <LevelIcon level={level} />
        {t(lang, `triage.${level}`)}
      </span>
      {reason && (level === 'EMERGENCY' || level === 'URGENT') ? (
        <span className="text-xs leading-relaxed text-muted-foreground">{reason}</span>
      ) : null}
    </div>
  );
}
