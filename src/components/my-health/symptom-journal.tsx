'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';
import {
  formatRelativeTime,
  newJournalId,
  SEVERITY_META,
  severityLabel,
  type JournalEntry,
  type Severity,
} from '@/lib/profile';

interface SymptomJournalProps {
  lang: Lang;
  entries: JournalEntry[];
  onLog: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}

const SEVERITIES: Severity[] = [1, 2, 3, 4, 5];

export function SymptomJournal({ lang, entries, onLog, onDelete }: SymptomJournalProps) {
  const [open, setOpen] = useState(false);
  const [symptom, setSymptom] = useState('');
  const [severity, setSeverity] = useState<Severity>(3);
  const [notes, setNotes] = useState('');

  const reset = () => {
    setSymptom('');
    setSeverity(3);
    setNotes('');
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      // Delay reset slightly so the close animation doesn't show empty fields
      setTimeout(reset, 200);
    }
  };

  const handleSave = () => {
    const trimmed = symptom.trim();
    if (!trimmed) return;
    const entry: JournalEntry = {
      id: newJournalId(),
      at: new Date().toISOString(),
      symptom: trimmed,
      severity,
      notes: notes.trim() ? notes.trim() : undefined,
    };
    onLog(entry);
    setOpen(false);
    setTimeout(reset, 200);
  };

  const canSave = symptom.trim().length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Empty state */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
            <ClipboardList className="h-6 w-6" aria-hidden />
          </span>
          <p className="text-sm font-semibold text-foreground">
            {t(lang, 'myHealth.journalEmpty')}
          </p>
          <p className="max-w-xs text-xs text-muted-foreground">
            {t(lang, 'myHealth.journalEmptyDesc')}
          </p>
        </div>
      ) : (
        <ol className="relative flex flex-col gap-3 ps-3">
          {/* Vertical timeline line */}
          <span
            className="absolute inset-y-1 start-0 w-px bg-border"
            aria-hidden
          />
          <AnimatePresence initial={false}>
            {entries.map((e) => {
              const sev = SEVERITY_META[e.severity];
              const atMs = new Date(e.at).getTime();
              return (
                <motion.li
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.16 }}
                  className="relative flex gap-3 ps-2"
                >
                  {/* Severity dot on the timeline */}
                  <span
                    className={cn(
                      'absolute -start-[calc(0.375rem)] top-3 h-2.5 w-2.5 rounded-full ring-4 ring-background',
                      sev.dot,
                      sev.ring,
                    )}
                    aria-hidden
                  />
                  <div className="flex flex-1 flex-col gap-1 rounded-xl border border-border bg-card/60 p-3 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {e.symptom}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 text-[11px] font-bold',
                          sev.color,
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', sev.dot)} aria-hidden />
                        {severityLabel(e.severity, lang)}
                      </span>
                    </div>
                    {e.notes ? (
                      <p className="text-xs text-muted-foreground">{e.notes}</p>
                    ) : null}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <time
                        dateTime={e.at}
                        className="text-[11px] text-muted-foreground"
                      >
                        {formatRelativeTime(atMs, lang)}
                      </time>
                      <button
                        type="button"
                        onClick={() => onDelete(e.id)}
                        className="inline-flex h-7 items-center gap-1 rounded-full border border-red-500/25 bg-red-500/5 px-2 text-[11px] font-semibold text-red-700 hover:bg-red-500/15 dark:text-red-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                        aria-label={t(lang, 'myHealth.deleteEntry')}
                      >
                        <Trash2 className="h-3 w-3" aria-hidden />
                        {t(lang, 'myHealth.deleteEntry')}
                      </button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      )}

      {/* Add entry button */}
      <div className="flex justify-center pt-1">
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="h-10 gap-1.5 rounded-full px-4 text-sm font-bold"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t(lang, 'myHealth.addEntry')}
        </Button>
      </div>

      {/* Add entry dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t(lang, 'myHealth.addEntry')}</DialogTitle>
            <DialogDescription>
              {t(lang, 'myHealth.journalSubtitle')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="journal-symptom" className="text-xs font-semibold text-muted-foreground">
                {t(lang, 'myHealth.symptom')}
              </Label>
              <Input
                id="journal-symptom"
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                placeholder={t(lang, 'myHealth.symptomPlaceholder')}
                maxLength={280}
                className="h-10 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSave) {
                    e.preventDefault();
                    handleSave();
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="journal-severity" className="text-xs font-semibold text-muted-foreground">
                  {t(lang, 'myHealth.severity')}
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {t(lang, 'myHealth.severityHint')}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SEVERITIES.map((s) => {
                  const meta = SEVERITY_META[s];
                  const active = severity === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      aria-pressed={active}
                      aria-label={`${t(lang, 'myHealth.severity')} ${s}`}
                      className={cn(
                        'inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-full border px-2.5 text-xs font-bold transition-all focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                        active
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} aria-hidden />
                      {s}
                    </button>
                  );
                })}
              </div>
              <p className={cn('text-[11px] font-medium', SEVERITY_META[severity].color)}>
                {severityLabel(severity, lang)}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="journal-notes" className="text-xs font-semibold text-muted-foreground">
                {t(lang, 'myHealth.notes')}
              </Label>
              <Textarea
                id="journal-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t(lang, 'myHealth.notesPlaceholder')}
                rows={3}
                maxLength={280}
                className="resize-y text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              className="h-10 rounded-md"
            >
              {t(lang, 'myHealth.cancelEntry')}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="h-10 gap-1.5 rounded-md"
            >
              {t(lang, 'myHealth.saveEntry')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
