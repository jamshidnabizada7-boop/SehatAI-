'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Globe2, Lock, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import type { Lang, LangPref } from '@/lib/i18n';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Language Settings (Phase 2)
// A dedicated language picker that surfaces ALL Pakistan languages.
// Fully supported (active): EN, Urdu-Nastaliq, Roman-Urdu.
// Coming-soon stubs (data program in progress): Pashto, Punjabi
// (Shahmukhi), Sindhi, Saraiki, Balochi, Dari.
//
// Per the master strategy: Pashto/Balochi are unsolved at every
// layer (ASR/LLM/TTS) — a 4-month data program (500h audio +
// 50M clinical text tokens) is required. This UI prepares the
// surface area so when the models land, the toggle just works.
// ============================================================

type LangStatus = 'active' | 'coming-soon';

interface LangOption {
  value: LangPref | 'ps' | 'pa' | 'sd' | 'srk' | 'bal' | 'fa';
  nativeName: string;
  englishName: string;
  romanName: string;
  speakerPct?: string; // % of Pakistan population
  status: LangStatus;
  notes?: string;
}

const LANGUAGES: LangOption[] = [
  {
    value: 'auto',
    nativeName: 'Auto',
    englishName: 'Auto-detect',
    romanName: 'Auto-detect',
    status: 'active',
    notes: 'Detects per-message (English / Urdu / Roman Urdu)',
  },
  {
    value: 'en',
    nativeName: 'English',
    englishName: 'English',
    romanName: 'English',
    status: 'active',
    speakerPct: '~10%',
  },
  {
    value: 'ur',
    nativeName: 'اردو',
    englishName: 'Urdu (Nastaliq)',
    romanName: 'Urdu',
    status: 'active',
    speakerPct: '~9% L1, ~75% L2',
  },
  {
    value: 'roman',
    nativeName: 'Roman Urdu',
    englishName: 'Roman Urdu',
    romanName: 'Roman Urdu',
    status: 'active',
    speakerPct: 'widely used online',
  },
  // ----- Coming-soon stubs (Pashto data program: 4 months) -----
  {
    value: 'ps',
    nativeName: 'پښتو',
    englishName: 'Pashto',
    romanName: 'Pashto',
    speakerPct: '~18%',
    status: 'coming-soon',
    notes: 'Data program in progress — 500h audio + 50M clinical text tokens. ETA ~4 months.',
  },
  {
    value: 'pa',
    nativeName: 'پنجابی (شاہ مکھی)',
    englishName: 'Punjabi (Shahmukhi)',
    romanName: 'Punjabi',
    speakerPct: '~37%',
    status: 'coming-soon',
    notes: 'Shahmukhi script support planned. Gurmukhi covered by Sarvam-1 (India).',
  },
  {
    value: 'sd',
    nativeName: 'سنڌي',
    englishName: 'Sindhi',
    romanName: 'Sindhi',
    speakerPct: '~14%',
    status: 'coming-soon',
    notes: 'AI4Bharat IndicTrans2 covers Devanagari; Shahmukhi adaptation pending.',
  },
  {
    value: 'srk',
    nativeName: 'سرائیکی',
    englishName: 'Saraiki',
    romanName: 'Saraiki',
    speakerPct: '~12%',
    status: 'coming-soon',
    notes: 'Corpus-building from scratch.',
  },
  {
    value: 'bal',
    nativeName: 'بلوچی',
    englishName: 'Balochi',
    romanName: 'Balochi',
    speakerPct: '~4%',
    status: 'coming-soon',
    notes: 'Zero training data in any frontier model — long-term corpus program.',
  },
  {
    value: 'fa',
    nativeName: 'دری',
    englishName: 'Dari (Persian)',
    romanName: 'Dari',
    status: 'coming-soon',
    notes: 'Workable via Persian route (Gemini 2.5 Pro). Not a Pakistan language but included for Afghan refugees.',
  },
];

interface LanguageSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LanguageSettings({ open, onOpenChange }: LanguageSettingsProps) {
  const langPref = useAppStore((s) => s.langPref);
  const setLangPref = useAppStore((s) => s.setLangPref);
  const uiLang = resolveUiLang(langPref);
  const [notice, setNotice] = useState<string | null>(null);

  const activeCount = LANGUAGES.filter((l) => l.status === 'active').length;
  const comingSoonCount = LANGUAGES.filter((l) => l.status === 'coming-soon').length;

  const handleSelect = (opt: LangOption) => {
    if (opt.status === 'coming-soon') {
      setNotice(opt.notes ?? 'Coming soon.');
      return;
    }
    setLangPref(opt.value as LangPref);
    setNotice(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="custom-scrollbar max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-primary" aria-hidden />
            {uiLang === 'ur' ? 'زبان منتخب کریں' : uiLang === 'roman' ? 'Zabaan muntakhib karein' : 'Choose language'}
          </DialogTitle>
          <DialogDescription>
            {uiLang === 'ur'
              ? `${activeCount} زبانیں مکمل فعال ہیں۔ ${comingSoonCount} آنے والی ہیں۔`
              : uiLang === 'roman'
                ? `${activeCount} zubanein mukammal faal hain. ${comingSoonCount} anay wali hain.`
                : `${activeCount} languages fully active. ${comingSoonCount} coming soon (data program in progress).`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          {LANGUAGES.map((opt) => {
            const isSelected = opt.value === langPref;
            const isComing = opt.status === 'coming-soon';
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt)}
                aria-pressed={isSelected}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl border p-3 text-start transition-all focus-visible:outline-2 focus-visible:outline-ring',
                  isSelected
                    ? 'border-primary/50 bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-primary/30 hover:bg-accent/40',
                  isComing && 'opacity-75',
                )}
              >
                {/* selection check */}
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30',
                  )}
                  aria-hidden
                >
                  {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                </span>

                {/* language names */}
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span
                      className={cn('text-sm font-bold text-foreground', opt.value === 'ur' || opt.value === 'ps' || opt.value === 'pa' || opt.value === 'sd' || opt.value === 'srk' || opt.value === 'bal' || opt.value === 'fa' ? 'font-urdu' : '')}
                      dir={opt.value === 'ur' || opt.value === 'ps' || opt.value === 'pa' || opt.value === 'sd' || opt.value === 'srk' || opt.value === 'bal' || opt.value === 'fa' ? 'rtl' : 'ltr'}
                    >
                      {opt.nativeName}
                    </span>
                    <span className="text-xs text-muted-foreground">{opt.englishName}</span>
                  </span>
                  {opt.speakerPct ? (
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {uiLang === 'ur' ? `اسپیکرز: ${opt.speakerPct}` : uiLang === 'roman' ? `Speakers: ${opt.speakerPct}` : `Speakers: ${opt.speakerPct}`}
                    </span>
                  ) : null}
                </span>

                {/* status badge */}
                {isComing ? (
                  <Badge variant="secondary" className="shrink-0 gap-1 bg-amber-500/15 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                    <Lock className="h-2.5 w-2.5" aria-hidden />
                    {uiLang === 'ur' ? 'جلد' : uiLang === 'roman' ? 'Jald' : 'Soon'}
                  </Badge>
                ) : isSelected ? (
                  <Badge variant="secondary" className="shrink-0 gap-1 bg-emerald-500/15 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    <Sparkles className="h-2.5 w-2.5" aria-hidden />
                    {uiLang === 'ur' ? 'فعال' : uiLang === 'roman' ? 'Faal' : 'Active'}
                  </Badge>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* coming-soon notice */}
        <AnimatePresence>
          {notice ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-amber-500/30 bg-amber-50/60 p-3 text-xs leading-relaxed text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                <p className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span>{notice}</span>
                </p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <p className="text-center text-[11px] text-muted-foreground">
          {uiLang === 'ur'
            ? 'پاکستان کی 6+ زبانوں کے لیے پہلا صحت اے آئی'
            : uiLang === 'roman'
              ? 'Pakistan ki 6+ zubanon ke liye pehla sehat AI'
              : 'The first healthcare AI for Pakistan’s 6+ languages'}
        </p>

        <Button
          onClick={() => onOpenChange(false)}
          className="min-h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {uiLang === 'ur' ? 'ہو گیا' : uiLang === 'roman' ? 'Ho gaya' : 'Done'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
