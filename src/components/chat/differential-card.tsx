'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CircleCheck,
  HelpCircle,
  TriangleAlert,
  ChevronDown,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';
import type { Differential, DifferentialEntry, Lang } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — 3-Tier Differential Card (Phase 2, Glass-style)
// Renders the L1 classifier's structured conditions in three
// visual tiers:
//   1. Established (emerald) — conditions the user HAS
//   2. Suspected (amber)     — conditions to evaluate (NOT a diagnosis)
//   3. Can't-Miss (red)      — red-flag emergencies to rule out
//
// Safety: every tier explicitly says SehatAI does NOT diagnose.
// The card is COLLAPSED by default to avoid overwhelming low-
// literacy users; a tap expands the full 3-tier breakdown.
// ============================================================

interface DifferentialCardProps {
  differential: Differential | null | undefined;
  lang: Lang;
  className?: string;
}

type TierKey = 'established' | 'suspected' | 'cantMiss';

interface TierConfig {
  icon: LucideIcon;
  label: { en: string; ur: string; roman: string };
  /** border + bg tint classes */
  wrapper: string;
  iconTile: string;
  heading: string;
  badge: string;
}

const TIER_CONFIG: Record<TierKey, TierConfig> = {
  established: {
    icon: CircleCheck,
    label: {
      en: 'Established conditions',
      ur: 'موجودہ بیماریاں',
      roman: 'Maujooda bimariyan',
    },
    wrapper: 'border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/15',
    iconTile: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    heading: 'text-emerald-700 dark:text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  },
  suspected: {
    icon: HelpCircle,
    label: {
      en: 'Could be considered',
      ur: 'ممکنہ وجوہات',
      roman: 'Mumkina wajohaat',
    },
    wrapper: 'border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/15',
    iconTile: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    heading: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  },
  cantMiss: {
    icon: TriangleAlert,
    label: {
      en: 'Cannot miss (rule out urgently)',
      ur: 'ہر قیمت پر مسترد کریں',
      roman: 'Har qeemat par musturd karein',
    },
    wrapper: 'border-red-500/40 bg-red-50/50 dark:bg-red-950/20',
    iconTile: 'bg-red-500/15 text-red-600 dark:text-red-400',
    heading: 'text-red-700 dark:text-red-400',
    badge: 'bg-red-500/15 text-red-700 dark:text-red-400',
  },
};

export function DifferentialCard({ differential, lang, className }: DifferentialCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Don't render if no differential or all buckets empty
  if (
    !differential ||
    (differential.established.length === 0 &&
      differential.suspected.length === 0 &&
      differential.cantMiss.length === 0)
  ) {
    return null;
  }

  const totalEntries =
    differential.established.length +
    differential.suspected.length +
    differential.cantMiss.length;

  // Summary line for collapsed state: pick the most-urgent non-empty tier
  const summaryTier: TierKey = differential.cantMiss.length > 0
    ? 'cantMiss'
    : differential.suspected.length > 0
      ? 'suspected'
      : 'established';

  const SummaryIcon = TIER_CONFIG[summaryTier].icon;
  const summaryConfig = TIER_CONFIG[summaryTier];

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'rounded-xl border bg-card shadow-sm overflow-hidden',
        summaryConfig.wrapper,
        className,
      )}
      aria-label={lang === 'ur' ? 'ممکنہ وجوہات' : lang === 'roman' ? 'Mumkina wajohaat' : 'Possible causes'}
    >
      {/* collapsed header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-start transition-colors hover:bg-foreground/[0.02] focus-visible:outline-2 focus-visible:outline-ring"
        aria-expanded={expanded}
      >
        <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', summaryConfig.iconTile)}>
          <SummaryIcon className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('flex items-center gap-2 text-xs font-bold', summaryConfig.heading)}>
            <Stethoscope className="h-3.5 w-3.5" aria-hidden />
            {lang === 'ur'
              ? 'ممکنہ وجوہات کا جائزہ'
              : lang === 'roman'
                ? 'Mumkina wajohaat ka jaiza'
                : 'Possible causes review'}
            <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', summaryConfig.badge)}>
              {totalEntries}
            </span>
          </span>
          <span className="mt-0.5 block text-[11px] leading-tight text-muted-foreground">
            {lang === 'ur'
              ? 'سی ایچ اے آئی تشخیص نہیں دیتا — ڈاکٹر تصدیق کرے گا۔'
              : lang === 'roman'
                ? 'SehatAI tashkhees nahi deta — doctor tasdeeq karega.'
                : 'SehatAI does not diagnose — a doctor must confirm.'}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {/* expanded 3-tier breakdown */}
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 px-3 pb-3 pt-1">
              <TierBlock tier="established" entries={differential.established} lang={lang} />
              <TierBlock tier="suspected" entries={differential.suspected} lang={lang} />
              <TierBlock tier="cantMiss" entries={differential.cantMiss} lang={lang} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}

function TierBlock({
  tier,
  entries,
  lang,
}: {
  tier: TierKey;
  entries: DifferentialEntry[];
  lang: Lang;
}) {
  if (entries.length === 0) return null;
  const cfg = TIER_CONFIG[tier];
  const Icon = cfg.icon;
  return (
    <div className={cn('rounded-lg border p-2.5', cfg.wrapper)}>
      <div className="mb-1.5 flex items-center gap-2">
        <span className={cn('flex h-5 w-5 items-center justify-center rounded', cfg.iconTile)}>
          <Icon className="h-3 w-3" aria-hidden />
        </span>
        <span className={cn('text-[11px] font-bold tracking-wide uppercase', cfg.heading)}>
          {cfg.label[lang]}
        </span>
        <span className={cn('ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold', cfg.badge)}>
          {entries.length}
        </span>
      </div>
      <ul className="space-y-1">
        {entries.map((entry, i) => (
          <li key={`${entry.name}-${i}`} className="flex items-start gap-2 text-xs leading-relaxed">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-40" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="font-semibold text-foreground">{entry.name}</span>
              {entry.reason ? (
                <span className="mt-0.5 block text-[11px] leading-tight text-muted-foreground">
                  {entry.reason}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
