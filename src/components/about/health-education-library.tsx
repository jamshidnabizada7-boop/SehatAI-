'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  Filter,
  Heart,
  Baby,
  Siren,
  Stethoscope,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Clock,
  Tag,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CORPUS } from '@/data/corpus';
import type { CorpusItem, Lang, TriText } from '@/lib/types';
import { cn } from '@/lib/utils';

// ============================================================
// SehatAI — Health Education Library (Phase 2)
// A searchable, categorized browse interface for the verified
// WHO/UNICEF/IFRC/Pakistan MoNHSRC corpus.
//
// Features:
//   - Search by title/tags (trilingual)
//   - Filter by audience (general/maternal/child/emergency)
//   - Category grouping
//   - Article reader modal with full content + sources
//   - Offline-accessible (corpus is bundled)
//
// Designed for low-literacy users: big cards, clear icons,
// color-coded audiences, trilingual throughout.
// ============================================================

type Audience = 'all' | 'general' | 'maternal' | 'child' | 'emergency';

interface AudienceFilter {
  value: Audience;
  icon: typeof Heart;
  label: { en: string; ur: string; roman: string };
  color: string;
}

const AUDIENCES: AudienceFilter[] = [
  { value: 'all', icon: BookOpen, label: { en: 'All', ur: 'تمام', roman: 'Tamam' }, color: 'bg-primary/10 text-primary' },
  { value: 'general', icon: Stethoscope, label: { en: 'General', ur: 'عام', roman: 'Aam' }, color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  { value: 'maternal', icon: Heart, label: { en: 'Maternal', ur: 'حمل', roman: 'Hamal' }, color: 'bg-pink-500/10 text-pink-700 dark:text-pink-400' },
  { value: 'child', icon: Baby, label: { en: 'Child', ur: 'بچہ', roman: 'Bacha' }, color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400' },
  { value: 'emergency', icon: Siren, label: { en: 'Emergency', ur: 'ایمرجنسی', roman: 'Emergency' }, color: 'bg-red-500/10 text-red-700 dark:text-red-400' },
];

interface HealthEducationLibraryProps {
  lang: Lang;
  className?: string;
}

export function HealthEducationLibrary({ lang, className }: HealthEducationLibraryProps) {
  const [search, setSearch] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [selected, setSelected] = useState<CorpusItem | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CORPUS.filter((item) => {
      if (audience !== 'all' && item.audience !== audience) return false;
      if (!q) return true;
      // search across all 3 languages + tags
      const haystack = [
        item.title.en,
        item.title.ur,
        item.title.roman,
        item.topic,
        ...(item.tags ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [search, audience]);

  // group by topic prefix (first letter) for visual grouping
  const grouped = useMemo(() => {
    const groups: Record<string, CorpusItem[]> = {};
    for (const item of filtered) {
      const letter = item.topic.charAt(0).toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(item);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4 shadow-sm', className)}>
      {/* header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BookOpen className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">
            {lang === 'ur' ? 'صحت تعلیم لائبریری' : lang === 'roman' ? 'Sehat taleem library' : 'Health education library'}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {CORPUS.length} {lang === 'ur' ? 'مضامین' : lang === 'roman' ? 'mazaameen' : 'articles'} · WHO/UNICEF/IFRC
          </p>
        </div>
      </div>

      {/* search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={lang === 'ur' ? 'تلاش کریں...' : lang === 'roman' ? 'Talaash karein...' : 'Search...'}
          className="h-10 rounded-lg pl-9"
          aria-label={lang === 'ur' ? 'تلاش' : lang === 'roman' ? 'Talaash' : 'Search'}
        />
      </div>

      {/* audience filters */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {AUDIENCES.map((a) => {
          const Icon = a.icon;
          const isActive = audience === a.value;
          return (
            <button
              key={a.value}
              type="button"
              onClick={() => setAudience(a.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                isActive
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-accent/40',
              )}
              aria-pressed={isActive}
            >
              <Icon className="h-3 w-3" aria-hidden />
              {a.label[lang]}
            </button>
          );
        })}
      </div>

      {/* results count */}
      <p className="mb-2 text-[11px] text-muted-foreground">
        {filtered.length} {lang === 'ur' ? 'نتائج' : lang === 'roman' ? 'nataij' : 'results'}
      </p>

      {/* articles grouped */}
      {filtered.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          {lang === 'ur' ? 'کوئی نتیجہ نہیں' : lang === 'roman' ? 'Koi nateeja nahin' : 'No results'}
        </p>
      ) : (
        <div className="max-h-96 space-y-3 overflow-y-auto pe-1">
          {grouped.map(([letter, items]) => (
            <div key={letter}>
              <p className="mb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{letter}</p>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="flex w-full items-center gap-2 rounded-lg border border-border bg-background/40 p-2 text-start transition-colors hover:border-primary/30 hover:bg-accent/30 focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn('block text-xs font-semibold text-foreground', lang === 'ur' && 'font-urdu')}
                          dir={lang === 'ur' ? 'rtl' : 'ltr'}
                        >
                          {item.title[lang]}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5">
                          {item.audience !== 'general' ? (
                            <Badge variant="secondary" className={cn('text-[9px] font-bold', AUDIENCES.find((a) => a.value === item.audience)?.color)}>
                              {AUDIENCES.find((a) => a.value === item.audience)?.label[lang]}
                            </Badge>
                          ) : null}
                          <span className="text-[10px] text-muted-foreground">{item.source.publisher}</span>
                        </span>
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* article reader modal */}
      <AnimatePresence>
        {selected ? (
          <ArticleReader item={selected} lang={lang} onClose={() => setSelected(null)} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ---------- Article reader ----------

function ArticleReader({ item, lang, onClose }: { item: CorpusItem; lang: Lang; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.title[lang]}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="custom-scrollbar max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-background p-4 shadow-xl sm:rounded-2xl"
      >
        {/* header */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              {item.audience !== 'general' ? (
                <Badge variant="secondary" className={cn('text-[9px] font-bold', AUDIENCES.find((a) => a.value === item.audience)?.color)}>
                  {AUDIENCES.find((a) => a.value === item.audience)?.label[lang]}
                </Badge>
              ) : null}
              <Badge variant="secondary" className="text-[9px] font-bold uppercase">
                {item.baseLevel}
              </Badge>
            </div>
            <h2
              className={cn('text-base font-bold text-foreground', lang === 'ur' && 'font-urdu')}
              dir={lang === 'ur' ? 'rtl' : 'ltr'}
            >
              {item.title[lang]}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        {/* content */}
        <div
          className={cn(
            'rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground/90',
            lang === 'ur' && 'font-urdu',
          )}
          dir={lang === 'ur' ? 'rtl' : 'ltr'}
        >
          <pre className="whitespace-pre-wrap font-sans">{item.content[lang]}</pre>
        </div>

        {/* tags */}
        {item.tags && item.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.slice(0, 8).map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                <Tag className="h-2.5 w-2.5" aria-hidden />
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {/* source */}
        <div className="mt-3 rounded-lg border border-border bg-card p-2.5">
          <p className="mb-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            {lang === 'ur' ? 'مآخذ' : lang === 'roman' ? 'Masadir' : 'Source'}
          </p>
          <div className="flex items-start gap-2">
            <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground">{item.source.title}</p>
              <p className="text-[10px] text-muted-foreground">{item.source.publisher} · {item.source.license}</p>
              {item.source.url ? (
                <a
                  href={item.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                >
                  <ExternalLink className="h-2.5 w-2.5" aria-hidden />
                  {lang === 'ur' ? 'مزید پڑھیں' : lang === 'roman' ? 'Mazid parhein' : 'Read more'}
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {/* back button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="mt-3 w-full gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {lang === 'ur' ? 'واپس' : lang === 'roman' ? 'Wapas' : 'Back to library'}
        </Button>
      </motion.div>
    </motion.div>
  );
}
