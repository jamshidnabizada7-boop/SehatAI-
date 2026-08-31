'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  Droplet,
  Bone,
  Zap,
  Activity,
  ChevronRight,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Lang, TriText } from '@/lib/types';
import { cn } from '@/lib/utils';
import { FirstAidGuideModal } from './first-aid-guide';

// ============================================================
// SehatAI — First-Aid Quick-Access Cards (Phase 2)
// Shown in the chat empty state, these tappable cards pre-fill
// the chat input with a first-aid query, taking the user straight
// into a WHO/IFRC-grounded first-aid answer. Designed for low-
// literacy users who may not know how to phrase a first-aid query.
// ============================================================

interface FirstAidCard {
  id: string;
  icon: LucideIcon;
  /** trilingual title (short, ≤ 4 words) */
  title: TriText;
  /** trilingual subtitle (1-line context) */
  subtitle: TriText;
  /** the query to pre-fill in the chat input */
  query: string;
  /** accent color class for the icon tile */
  accent: string;
  /** ring color class for hover */
  ring: string;
}

const FIRST_AID_CARDS: FirstAidCard[] = [
  {
    id: 'burns',
    icon: Flame,
    title: { en: 'Burns & scalds', ur: 'جلنے کا علاج', roman: 'Jalne ka ilaaj' },
    subtitle: {
      en: 'Cool the burn, when to call 1122',
      ur: 'جلن کو ٹھنڈا کریں، 1122 کب کال کریں',
      roman: 'Jalan ko thanda karein, 1122 kab call karein',
    },
    query: 'What is the first aid for burns and scalds?',
    accent: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
    ring: 'hover:border-orange-500/50',
  },
  {
    id: 'bleeding',
    icon: Droplet,
    title: { en: 'Severe bleeding', ur: 'شدید خون بہنا', roman: 'Shadeed khoon behna' },
    subtitle: {
      en: 'How to apply pressure + when to call 1122',
      ur: 'دباؤ کیسے دیں + 1122 کب کال کریں',
      roman: 'Dabao kaise dein + 1122 kab call karein',
    },
    query: 'What is the first aid for severe bleeding?',
    accent: 'bg-red-500/15 text-red-600 dark:text-red-400',
    ring: 'hover:border-red-500/50',
  },
  {
    id: 'fracture',
    icon: Bone,
    title: { en: 'Broken bone', ur: 'ہڈی ٹوٹنا', roman: 'Haddi tootna' },
    subtitle: {
      en: 'Immobilize, don’t move, when to call 1122',
      ur: 'ہلانا نہیں، 1122 کب کال کریں',
      roman: 'Hilana nahin, 1122 kab call karein',
    },
    query: 'What is the first aid for a suspected broken bone?',
    accent: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    ring: 'hover:border-amber-500/50',
  },
  {
    id: 'seizure',
    icon: Activity,
    title: { en: 'Seizure / fits', ur: 'دورہ / مرگی', roman: 'Dorra / mirgi' },
    subtitle: {
      en: 'Keep them safe, time it, when to call 1122',
      ur: 'محفوظ رکھیں، وقت نوٹ کریں، 1122 کب کال کریں',
      roman: 'Mehfooz rakhein, waqt note karein, 1122 kab call karein',
    },
    query: 'What is the first aid for a seizure and when should I call 1122?',
    accent: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    ring: 'hover:border-violet-500/50',
  },
  {
    id: 'electric-shock',
    icon: Zap,
    title: { en: 'Electric shock', ur: 'برقی جھٹکا', roman: 'Barqi jhatka' },
    subtitle: {
      en: 'Cut the power first, then help',
      ur: 'پہلے بجلی بند کریں، پھر مدد کریں',
      roman: 'Pehle bijli band karein, phir madad karein',
    },
    query: 'What is the first aid for an electric shock?',
    accent: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
    ring: 'hover:border-yellow-500/50',
  },
];

interface FirstAidCardsProps {
  lang: Lang;
  onSelect: (query: string) => void;
  className?: string;
}

export function FirstAidCards({ lang, onSelect, className }: FirstAidCardsProps) {
  const [guideOpen, setGuideOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className={cn('w-full max-w-lg', className)}
      aria-label={lang === 'ur' ? 'ابتدائی طبی امداد' : lang === 'roman' ? 'Ibtidai tibbi imdaad' : 'First-aid quick access'}
    >
      <div className="mb-2 flex items-center justify-between">
        <p
          className={cn(
            'px-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase',
            lang === 'ur' && 'font-urdu',
          )}
        >
          {lang === 'ur' ? 'ابتدائی طبی امداد' : lang === 'roman' ? 'Ibtidai tibbi imdaad' : 'First-aid quick access'}
        </p>
        {/* Phase 2 — visual guide button (pictographic step-by-step for low-literacy) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setGuideOpen(true)}
          className="h-7 gap-1 px-2 text-[11px] font-semibold text-primary hover:bg-primary/10"
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden />
          {lang === 'ur' ? 'بصری گائیڈ' : lang === 'roman' ? 'Basri guide' : 'Visual guide'}
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {FIRST_AID_CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.25 + i * 0.05 }}
              onClick={() => onSelect(card.query)}
              className={cn(
                'group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-3 text-start shadow-sm transition-all hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring',
                card.ring,
              )}
            >
              {/* icon tile */}
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110',
                  card.accent,
                )}
                aria-hidden
              >
                <Icon className="h-4.5 w-4.5" />
              </span>
              {/* text */}
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block text-sm font-bold leading-tight text-foreground',
                    lang === 'ur' && 'font-urdu',
                  )}
                  dir={lang === 'ur' ? 'rtl' : 'ltr'}
                >
                  {card.title[lang]}
                </span>
                <span
                  className={cn(
                    'mt-0.5 block text-[11px] leading-tight text-muted-foreground',
                    lang === 'ur' && 'font-urdu',
                  )}
                  dir={lang === 'ur' ? 'rtl' : 'ltr'}
                >
                  {card.subtitle[lang]}
                </span>
              </span>
              {/* chevron */}
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-foreground/70"
                aria-hidden
              />
            </motion.button>
          );
        })}
      </div>
      <FirstAidGuideModal open={guideOpen} onOpenChange={setGuideOpen} />
    </motion.div>
  );
}
