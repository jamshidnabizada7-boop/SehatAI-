'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Share2,
  Shuffle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/lib/store/app-store';
import { resolveUiLang, t } from '@/lib/i18n';
import { HEALTH_TIPS, getDailyTip, type HealthTip } from '@/data/health-tips';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Health Tips Browser (Phase 2)
// Browse + bookmark daily health tips beyond the single "tip of
// the day" shown in the chat empty state. Features:
//   - Swipeable card UI with prev/next navigation
//   - Bookmark tips (localStorage)
//   - Share via WhatsApp/copy
//   - Random shuffle
//   - Publisher badge
// ============================================================

const BOOKMARK_KEY = 'sehatai.tipBookmarks.v1';

function loadBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(BOOKMARK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function saveBookmarks(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

interface HealthTipsBrowserProps {
  lang: Lang;
  className?: string;
}

export function HealthTipsBrowser({ lang, className }: HealthTipsBrowserProps) {
  const { toast } = useToast();
  const [index, setIndex] = useState(0);
  const [bookmarks, setBookmarks] = useState<string[]>(() => loadBookmarks());
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  const tips = useMemo(() => {
    if (showBookmarksOnly) {
      return HEALTH_TIPS.filter((tip) => bookmarks.includes(tip.id));
    }
    return HEALTH_TIPS;
  }, [showBookmarksOnly, bookmarks]);

  const currentTip = tips[index] ?? tips[0] ?? getDailyTip();
  const isBookmarked = bookmarks.includes(currentTip.id);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % tips.length);
  }, [tips.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + tips.length) % tips.length);
  }, [tips.length]);

  const shuffle = useCallback(() => {
    setIndex(Math.floor(Math.random() * tips.length));
  }, [tips.length]);

  const toggleBookmark = useCallback(() => {
    setBookmarks((prev) => {
      const next = prev.includes(currentTip.id)
        ? prev.filter((id) => id !== currentTip.id)
        : [...prev, currentTip.id];
      saveBookmarks(next);
      return next;
    });
    toast({
      description: isBookmarked
        ? (lang === 'ur' ? 'بک مارک ہٹایا' : lang === 'roman' ? 'Bookmark hataya' : 'Bookmark removed')
        : (lang === 'ur' ? 'بک مارک شامل کیا' : lang === 'roman' ? 'Bookmark shamil kiya' : 'Bookmarked'),
    });
  }, [currentTip.id, isBookmarked, lang, toast]);

  const share = useCallback(() => {
    const text = `SehatAI Tip: ${currentTip.title[lang]}\n\n${currentTip.text[lang]}\n\n— ${currentTip.publisher}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: 'SehatAI Health Tip', text }).catch(() => {
        // user cancelled — ignore
      });
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast({ description: lang === 'ur' ? 'کاپی ہو گیا' : lang === 'roman' ? 'Copy ho gaya' : 'Copied to clipboard' });
    }
  }, [currentTip, lang, toast]);

  if (tips.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('rounded-2xl border border-amber-500/30 bg-amber-50/30 p-4 shadow-sm dark:bg-amber-950/10', className)}
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
          <h3 className="text-sm font-bold text-foreground">
            {lang === 'ur' ? 'صحت کے مشورے' : lang === 'roman' ? 'Sehat ke mashware' : 'Health tips'}
          </h3>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {lang === 'ur' ? 'ابھی کوئی بک مارک نہیں۔' : lang === 'roman' ? 'Abhi koi bookmark nahin.' : 'No bookmarks yet.'}
        </p>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('rounded-2xl border border-amber-500/30 bg-amber-50/30 p-4 shadow-sm dark:bg-amber-950/10', className)}
      aria-label={lang === 'ur' ? 'صحت کے مشورے' : lang === 'roman' ? 'Sehat ke mashware' : 'Health tips browser'}
    >
      {/* header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <Lightbulb className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">
            {lang === 'ur' ? 'صحت کے مشورے' : lang === 'roman' ? 'Sehat ke mashware' : 'Health tips'}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {index + 1} / {tips.length} {lang === 'ur' ? 'مضامین' : lang === 'roman' ? 'mazaameen' : 'tips'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setShowBookmarksOnly((v) => !v); setIndex(0); }}
          className={cn('h-7 gap-1 px-2 text-[11px] font-semibold', showBookmarksOnly ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground')}
        >
          {showBookmarksOnly ? <BookmarkCheck className="h-3 w-3" aria-hidden /> : <Bookmark className="h-3 w-3" aria-hidden />}
          {bookmarks.length}
        </Button>
      </div>

      {/* tip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTip.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-amber-500/20 bg-card p-4 shadow-sm"
        >
          {/* publisher badge */}
          <div className="mb-2 flex items-center justify-between">
            <Badge variant="secondary" className="bg-amber-500/10 text-[9px] font-bold text-amber-700 dark:text-amber-400">
              {currentTip.publisher}
            </Badge>
            <button
              type="button"
              onClick={toggleBookmark}
              className="text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400"
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this tip'}
            >
              {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden /> : <Bookmark className="h-4 w-4" aria-hidden />}
            </button>
          </div>

          {/* title */}
          <h4
            className={cn('text-sm font-bold text-foreground', lang === 'ur' && 'font-urdu')}
            dir={lang === 'ur' ? 'rtl' : 'ltr'}
          >
            {currentTip.title[lang]}
          </h4>

          {/* text */}
          <p
            className={cn('mt-1.5 text-xs leading-relaxed text-foreground/80', lang === 'ur' && 'font-urdu')}
            dir={lang === 'ur' ? 'rtl' : 'ltr'}
          >
            {currentTip.text[lang]}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* nav buttons */}
      <div className="mt-3 flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={goPrev} className="h-8 gap-1" disabled={tips.length <= 1}>
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
        </Button>
        <Button variant="ghost" size="sm" onClick={shuffle} className="h-8 flex-1 gap-1 text-[11px] font-semibold text-muted-foreground" disabled={tips.length <= 1}>
          <Shuffle className="h-3 w-3" aria-hidden />
          {lang === 'ur' ? 'رینڈم' : lang === 'roman' ? 'Random' : 'Shuffle'}
        </Button>
        <Button variant="ghost" size="sm" onClick={share} className="h-8 flex-1 gap-1 text-[11px] font-semibold text-muted-foreground">
          <Share2 className="h-3 w-3" aria-hidden />
          {lang === 'ur' ? 'شیئر' : lang === 'roman' ? 'Share' : 'Share'}
        </Button>
        <Button variant="outline" size="sm" onClick={goNext} className="h-8 gap-1" disabled={tips.length <= 1}>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </div>
    </motion.section>
  );
}
