'use client';

import { useEffect, useRef, useState } from 'react';
import { Baby, Bell, Pill, Syringe } from 'lucide-react';
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
import { t } from '@/lib/i18n';
import type { Lang, Reminder } from '@/lib/types';
import { cn } from '@/lib/utils';

type ReminderType = Reminder['type'];

const TYPE_ICONS: Record<ReminderType, React.ComponentType<{ className?: string }>> = {
  med: Pill,
  vax: Syringe,
  anc: Baby,
  other: Bell,
};

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const EPI_TEMPLATES: { label: string; title: string }[] = [
  { label: 'BCG — birth', title: 'BCG vaccine (birth)' },
  { label: 'Polio — 2 months', title: 'Polio drops — 2 months' },
  { label: 'Pentavalent — 6 weeks', title: 'Pentavalent vaccine — 6 weeks' },
  { label: 'Measles — 9 months', title: 'Measles vaccine — 9 months' },
  { label: 'Measles-2 — 15 months', title: 'Measles vaccine dose 2 — 15 months' },
];

const ANC_TEMPLATES: { label: string; title: string }[] = [
  { label: 'ANC visit — every 4 weeks', title: 'ANC visit (every 4 weeks)' },
  { label: 'ANC ultrasound — 20 weeks', title: 'ANC ultrasound — 20 weeks' },
  { label: 'TT vaccine — as scheduled', title: 'TT vaccine (as scheduled)' },
];

export interface ReminderDraft {
  type: ReminderType;
  title: string;
  notes?: string;
  timeOfDay: string;
  days: number[];
}

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: Lang;
  onSave: (draft: ReminderDraft) => Promise<boolean>;
  /** Optional prefilled draft — used by the "Save as reminder" quick action
   *  on chat messages. When present and the dialog opens, an internal
   *  effect applies the draft to local state, then calls onDraftConsumed
   *  so the caller can clear the pending state. */
  initialDraft?: { title: string; notes?: string; type?: ReminderType } | null;
  onDraftConsumed?: () => void;
}

export function ReminderDialog({ open, onOpenChange, lang, onSave, initialDraft, onDraftConsumed }: ReminderDialogProps) {
  const [type, setType] = useState<ReminderType>('med');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('08:00');
  const [days, setDays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  // Track the last draft we applied so we only apply each one once.
  const lastApplied = useRef<typeof initialDraft>(null);

  // Apply the prefilled draft when the dialog opens with one. Radix Dialog
  // does NOT call onOpenChange when the parent programmatically opens it,
  // so handleOpenChange can't be used. The setState-in-effect pattern here
  // is the documented escape hatch for syncing an external prop to local
  // state when it changes — see React docs:
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  // The `lastApplied` ref guard ensures each unique draft is applied once.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open && initialDraft && initialDraft !== lastApplied.current) {
      lastApplied.current = initialDraft;
      setType(initialDraft.type ?? 'other');
      setTitle(initialDraft.title);
      setNotes(initialDraft.notes ?? '');
      setTimeOfDay('08:00');
      setDays([]);
      setSaving(false);
      onDraftConsumed?.();
    }
  }, [open, initialDraft, onDraftConsumed]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleOpenChange = (open: boolean) => {
    if (open && !initialDraft) {
      // Manual open with no draft — reset to defaults.
      setType('med');
      setTitle('');
      setNotes('');
      setTimeOfDay('08:00');
      setDays([]);
      setSaving(false);
    }
    onOpenChange(open);
  };

  const toggleDay = (d: number) => {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b),
    );
  };

  const applyTemplate = (tpl: { label: string; title: string }, tplType: ReminderType) => {
    setType(tplType);
    setTitle(tpl.title);
    void tpl.label;
  };

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    const ok = await onSave({
      type,
      title: title.trim(),
      notes: notes.trim() || undefined,
      timeOfDay,
      days,
    });
    setSaving(false);
    if (ok) handleOpenChange(false);
  };

  const typeOptions: { value: ReminderType; label: string }[] = [
    { value: 'med', label: t(lang, 'reminders.typeMed') },
    { value: 'vax', label: t(lang, 'reminders.typeVax') },
    { value: 'anc', label: t(lang, 'reminders.typeAnc') },
    { value: 'other', label: t(lang, 'reminders.typeOther') },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="custom-scrollbar max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(lang, 'reminders.add')}</DialogTitle>
          <DialogDescription>{t(lang, 'reminders.subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* quick templates */}
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {t(lang, 'reminders.templates')}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] font-medium text-muted-foreground">
                {t(lang, 'reminders.epiTemplates')}:
              </span>
              {EPI_TEMPLATES.slice(0, 3).map((tpl) => (
                <button
                  key={tpl.title}
                  type="button"
                  onClick={() => applyTemplate(tpl, 'vax')}
                  className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] font-medium text-muted-foreground">
                {t(lang, 'reminders.ancTemplates')}:
              </span>
              {ANC_TEMPLATES.slice(0, 2).map((tpl) => (
                <button
                  key={tpl.title}
                  type="button"
                  onClick={() => applyTemplate(tpl, 'anc')}
                  className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* type selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              {t(lang, 'reminders.type')}
            </Label>
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label={t(lang, 'reminders.type')}>
              {typeOptions.map((opt) => {
                const Icon = TYPE_ICONS[opt.value];
                const active = type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setType(opt.value)}
                    className={cn(
                      'flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-medium transition-colors',
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* title */}
          <div className="space-y-1.5">
            <Label htmlFor="reminder-title" className="text-xs font-semibold text-muted-foreground">
              {t(lang, 'reminders.titleField')}
            </Label>
            <Input
              id="reminder-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t(lang, 'reminders.titlePlaceholder')}
              dir="auto"
              className="min-h-11"
            />
          </div>

          {/* notes */}
          <div className="space-y-1.5">
            <Label htmlFor="reminder-notes" className="text-xs font-semibold text-muted-foreground">
              {t(lang, 'reminders.notes')}
            </Label>
            <Input
              id="reminder-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t(lang, 'reminders.notesPlaceholder')}
              dir="auto"
              className="min-h-11"
            />
          </div>

          {/* time */}
          <div className="space-y-1.5">
            <Label htmlFor="reminder-time" className="text-xs font-semibold text-muted-foreground">
              {t(lang, 'reminders.time')}
            </Label>
            <Input
              id="reminder-time"
              type="time"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value || '08:00')}
              className="min-h-11 w-40"
            />
          </div>

          {/* days */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              {t(lang, 'reminders.days')}
              <span className="ms-1.5 font-normal">
                ({days.length === 0 ? t(lang, 'reminders.everyday') : `${days.length}`})
              </span>
            </Label>
            {/* quick repeat presets — one tap instead of picking days */}
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { key: 'everyday', label: t(lang, 'reminders.repeatEveryday'), value: [0, 1, 2, 3, 4, 5, 6] },
                  { key: 'weekdays', label: t(lang, 'reminders.repeatWeekdays'), value: [1, 2, 3, 4, 5] },
                  { key: 'weekends', label: t(lang, 'reminders.repeatWeekends'), value: [0, 6] },
                ] as const
              ).map((preset) => {
                const active =
                  preset.value.length === days.length &&
                  preset.value.every((d) => days.includes(d));
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => setDays(active ? [] : [...preset.value])}
                    aria-pressed={active}
                    className={cn(
                      'min-h-9 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                      active
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1.5">
              {DAY_LETTERS.map((letter, i) => {
                const active = days.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    aria-pressed={active}
                    aria-label={`Day ${i}`}
                    className={cn(
                      'h-11 w-11 rounded-xl border text-sm font-bold transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => handleOpenChange(false)} className="min-h-11">
            {t(lang, 'reminders.cancel')}
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={!title.trim() || saving}
            className="min-h-11 bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {saving ? t(lang, 'reminders.saving') : t(lang, 'reminders.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
